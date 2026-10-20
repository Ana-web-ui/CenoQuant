bl_info = {"name": "Ceno Quant", "author": "TV1 / Ceno Quant", "version": (0, 2, 0), "blender": (4, 2, 0), "location": "View3D > Sidebar > Ceno Quant", "description": "Quantitativo preliminar de objetos e superfícies", "category": "3D View"}

import bpy
from bpy.props import BoolProperty, FloatProperty, IntProperty, StringProperty, EnumProperty, PointerProperty
from bpy.app.handlers import persistent
from bpy_extras.io_utils import ExportHelper
from .analysis import extract
from .core import write_csv, material_totals

_reports = {}


def report_for(context):
    entry = _reports.get(context.scene.as_pointer())
    return entry[1] if entry and entry[0] == bpy.data.filepath else None


class CQ_Settings(bpy.types.PropertyGroup):
    selected_only: BoolProperty(name="Somente selecionados", default=True)
    include_hidden: BoolProperty(name="Incluir ocultos", default=False)
    loss: FloatProperty(name="Acréscimo de área (%)", default=0, min=0, max=100)
    category: StringProperty(name="Categoria", description="Ex.: Painéis, Balcões, Palcos, Mobiliário")
    code: StringProperty(name="Código da peça", description="Mesmo código declara itens equivalentes para agrupamento")
    note: StringProperty(name="Observação")
    excluded: BoolProperty(name="Excluir do quantitativo", default=False)
    query: StringProperty(name="Buscar objeto / código / categoria")
    view: EnumProperty(name="Exibir", items=[('PIECES', 'Peças', ''), ('MATERIALS', 'Materiais', ''), ('WARNINGS', 'Avisos', '')])
    page: IntProperty(name="Página", default=1, min=1)


class CQ_OT_Read(bpy.types.Operator):
    bl_idname = "ceno_quant.read"
    bl_label = "Carregar classificação do ativo"

    def execute(self, context):
        obj = context.active_object
        if not obj:
            self.report({'WARNING'}, "Selecione um objeto ativo.")
            return {'CANCELLED'}
        s = context.scene.cq_settings
        s.category, s.code, s.note = (str(obj.get(k, "")) for k in ("cq_category", "cq_code", "cq_note"))
        s.excluded = bool(obj.get("cq_exclude", False))
        return {'FINISHED'}


class CQ_OT_Tag(bpy.types.Operator):
    bl_idname = "ceno_quant.tag"
    bl_label = "Aplicar classificação aos selecionados"
    bl_description = "Grava metadados nos objetos; campos vazios também substituem valores anteriores"
    bl_options = {'REGISTER', 'UNDO'}

    def execute(self, context):
        s = context.scene.cq_settings
        success = 0
        for obj in context.selected_objects:
            try:
                obj["cq_category"] = s.category.strip()
                obj["cq_code"] = s.code.strip()
                obj["cq_note"] = s.note.strip()
                obj["cq_exclude"] = s.excluded
                success += 1
            except (TypeError, RuntimeError):
                self.report({'WARNING'}, "Sem permissão para classificar: " + obj.name)
        _reports.pop(context.scene.as_pointer(), None)
        self.report({'INFO'}, f"{success} objetos classificados. Extraia novamente.")
        return {'FINISHED'} if success else {'CANCELLED'}


class CQ_OT_Extract(bpy.types.Operator):
    bl_idname = "ceno_quant.extract"
    bl_label = "Extrair quantitativo"

    def execute(self, context):
        _reports.pop(context.scene.as_pointer(), None)
        if context.mode != 'OBJECT':
            self.report({'ERROR'}, "Use Object Mode para extrair a geometria atualizada.")
            return {'CANCELLED'}
        context.window_manager.progress_begin(0, 1)
        try:
            report = extract(context, context.scene.cq_settings)
            _reports[context.scene.as_pointer()] = (bpy.data.filepath, report)
            context.scene.cq_settings.page = 1
            self.report({'INFO'}, f"{len(report.pieces)} objetos medidos. Revise os avisos antes de exportar.")
            return {'FINISHED'}
        except Exception as exc:
            self.report({'ERROR'}, str(exc))
            return {'CANCELLED'}
        finally:
            context.window_manager.progress_end()


class CQ_OT_Select(bpy.types.Operator):
    bl_idname = "ceno_quant.select"
    bl_label = "Selecionar"
    index: IntProperty()

    def execute(self, context):
        report = report_for(context)
        if not report or not 0 <= self.index < len(report.pieces):
            return {'CANCELLED'}
        try:
            obj = report.pieces[self.index].target
            if context.mode != 'OBJECT' or obj.name not in context.view_layer.objects or not obj.visible_get(view_layer=context.view_layer) or obj.hide_select:
                self.report({'WARNING'}, "Use Object Mode e habilite visibilidade/seleção no Outliner.")
                return {'CANCELLED'}
            for selected in list(context.selected_objects):
                selected.select_set(False)
            obj.select_set(True)
            context.view_layer.objects.active = obj
            return {'FINISHED'}
        except (ReferenceError, RuntimeError):
            self.report({'WARNING'}, "Objeto removido ou indisponível. Extraia novamente.")
            return {'CANCELLED'}


class CQ_OT_Export(bpy.types.Operator, ExportHelper):
    bl_idname = "ceno_quant.export"
    bl_label = "Exportar CSV"
    filename_ext = ".csv"
    filter_glob: StringProperty(default="*.csv", options={'HIDDEN'})
    kind: EnumProperty(name="Relatório", items=[('PIECES', 'Peças detalhadas', ''), ('GROUPS', 'Resumo agrupado', ''), ('MATERIALS', 'Superfícies por material', ''), ('WARNINGS', 'Avisos / exclusões', '')])

    @classmethod
    def poll(cls, context):
        return report_for(context) is not None

    def invoke(self, context, event):
        self.filepath = "CenoQuant_" + self.kind.lower() + ".csv"
        return ExportHelper.invoke(self, context, event)

    def execute(self, context):
        report = report_for(context)
        if not report:
            return {'CANCELLED'}
        try:
            if not self.filepath.lower().endswith(".csv"):
                raise ValueError("Use a extensão .csv.")
            write_csv(report, self.filepath, self.kind)
            self.report({'INFO'}, "CSV completo exportado. Filtros da tela não limitam a exportação.")
            return {'FINISHED'}
        except (OSError, ValueError) as exc:
            self.report({'ERROR'}, str(exc))
            return {'CANCELLED'}



class CQ_OT_ExportJSON(bpy.types.Operator, ExportHelper):
    bl_idname = "ceno_quant.export_json"
    bl_label = "Exportar JSON para o site"
    filename_ext = ".json"
    filter_glob: StringProperty(default="*.json", options={'HIDDEN'})

    @classmethod
    def poll(cls, context):
        return report_for(context) is not None

    def invoke(self, context, event):
        self.filepath = "CenoQuant_projeto.json"
        return ExportHelper.invoke(self, context, event)

    def execute(self, context):
        import json
        from pathlib import Path
        from .core import json_payload
        report = report_for(context)
        if not report:
            return {'CANCELLED'}
        try:
            if not self.filepath.lower().endswith(".json"):
                raise ValueError("Use a extensão .json.")
            Path(self.filepath).write_text(json.dumps(json_payload(report), ensure_ascii=False, allow_nan=False, indent=2), encoding="utf-8")
            self.report({'INFO'}, "JSON exportado. Importe no Ceno Quant Web.")
            return {'FINISHED'}
        except (OSError, ValueError) as exc:
            self.report({'ERROR'}, str(exc))
            return {'CANCELLED'}


def wrapped(layout, text):
    import textwrap
    for line in textwrap.wrap(str(text), 48):
        layout.label(text=line)


class CQ_PT_Main(bpy.types.Panel):
    bl_label = "Ceno Quant · 0.2 Web"
    bl_idname = "CQ_PT_main"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "Ceno Quant"

    def draw(self, context):
        layout = self.layout
        s = context.scene.cq_settings
        wrapped(layout, "Quantitativo preliminar. 1 objeto = 1 unidade/conjunto.")
        box = layout.box()
        box.label(text="Classificar selecionados")
        for prop in ("category", "code", "note", "excluded"):
            box.prop(s, prop)
        box.operator("ceno_quant.read")
        box.operator("ceno_quant.tag")
        wrapped(box, "Aplicar substitui todos os campos nos selecionados, inclusive campos vazios.")
        layout.prop(s, "selected_only")
        layout.prop(s, "include_hidden")
        layout.prop(s, "loss")
        layout.operator("ceno_quant.extract", icon='FILE_REFRESH')
        report = report_for(context)
        if not report:
            return
        layout.label(text=f"{len(report.pieces)} unidades · {len(report.warnings)} avisos")
        layout.label(text=f"Superfície total: {sum(p.area for p in report.pieces):.4f} m²")
        wrapped(layout, "Extraído: " + report.timestamp)
        wrapped(layout, "Após alterar cena, seleção ou opções, extraia novamente.")
        layout.prop(s, "view")
        layout.prop(s, "query")
        if s.view == 'PIECES':
            data = [(i, p) for i,p in enumerate(report.pieces) if s.query.casefold() in (p.name + p.code + p.category).casefold()]
        elif s.view == 'MATERIALS':
            data = [((cat, mat), area) for (cat, mat), area in sorted(material_totals(report).items()) if s.query.casefold() in (cat + mat).casefold()]
        else:
            data = [(name, message) for name, message in report.warnings if s.query.casefold() in (name + message).casefold()]
        pages = max(1, (len(data) + 14) // 15)
        page = min(s.page, pages)
        row = layout.row()
        row.prop(s, "page")
        row.label(text=f"/ {pages}")
        for key, value in data[(page-1)*15:page*15]:
            box = layout.box()
            if s.view == 'PIECES':
                p = value
                box.label(text=p.name)
                wrapped(box, (p.code or "Sem código") + " · " + p.category)
                wrapped(box, "Caixa mundo (m): " + " × ".join(f"{x:.4f}" for x in p.dimensions))
                box.label(text=f"1 un. · superfície {p.area:.4f} m²")
                wrapped(box, "Materiais: " + " | ".join(sorted(p.surfaces)))
                box.operator("ceno_quant.select").index = key
            elif s.view == 'MATERIALS':
                wrapped(box, " / ".join(key))
                box.label(text=f"{value:.4f} m² de superfície")
                box.label(text=f"Com +{report.loss:g}%: {value*(1+report.loss/100):.4f} m²")
            else:
                wrapped(box, key)
                wrapped(box, value)
        layout.operator("ceno_quant.export_json", icon='EXPORT')
        layout.label(text="Exportar CSV completo:")
        for kind, label in [('PIECES','Peças'), ('GROUPS','Resumo agrupado'), ('MATERIALS','Superfícies por material'), ('WARNINGS','Avisos e exclusões')]:
            layout.operator("ceno_quant.export", text=label).kind = kind


@persistent
def _on_load(_):
    _reports.clear()


CLASSES = (CQ_Settings, CQ_OT_Read, CQ_OT_Tag, CQ_OT_Extract, CQ_OT_Select, CQ_OT_Export, CQ_OT_ExportJSON, CQ_PT_Main)


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.cq_settings = PointerProperty(type=CQ_Settings)
    bpy.app.handlers.load_post.append(_on_load)


def unregister():
    if _on_load in bpy.app.handlers.load_post:
        bpy.app.handlers.load_post.remove(_on_load)
    _reports.clear()
    del bpy.types.Scene.cq_settings
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == '__main__':
    register()
