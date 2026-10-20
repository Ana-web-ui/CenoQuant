import math
import bpy
from .core import Piece, Takeoff, UNCLASSIFIED, measure


def extract(context, settings):
    scene = context.scene
    if scene.unit_settings.system == 'NONE':
        raise ValueError("Defina as unidades da cena (Metric ou Imperial) antes da extração.")
    scale = scene.unit_settings.scale_length
    if not math.isfinite(scale) or scale <= 0:
        raise ValueError("Escala de unidades inválida.")
    objects = list(context.selected_objects if settings.selected_only else scene.objects)
    report = Takeoff("Blender " + bpy.app.version_string, (bpy.data.filepath or "Não salvo") + " / " + scene.name,
                     f"{'Selecionados' if settings.selected_only else 'Cena inteira'}; frame {scene.frame_current}; ocultos {'incluídos' if settings.include_hidden else 'excluídos'}; metros/unidade {scale:g}", settings.loss)
    report.warnings.append(("GERAL", "1 objeto geométrico = 1 unidade de conjunto. Arrays/objetos unidos não são decompostos em peças de fabricação. Caixa X/Y/Z nos eixos do mundo; rotação altera dimensões. Todas as faces contam na área, inclusive internas, verso e espessura. Não é plano de corte."))
    report.warnings.append(("COBERTURA", "Viewport no frame atual. Instâncias de coleção/partículas e Geometry Nodes não são expandidas; objetos com Geometry Nodes são excluídos. Displacement/subdivisão exclusivos de render não são considerados. Interseções e sobreposições não são descontadas."))
    graph = context.evaluated_depsgraph_get()
    def skip(obj, reason):
        report.warnings.append((obj.name, reason))
    for obj in objects:
        if obj.get("cq_exclude", False):
            skip(obj, "Excluído manualmente do quantitativo")
            continue
        if obj.type not in {'MESH', 'CURVE', 'FONT', 'SURFACE'}:
            skip(obj, "Tipo não geométrico ou instanciador não expandido: " + obj.type)
            continue
        if not settings.include_hidden and (obj.name not in context.view_layer.objects or not obj.visible_get(view_layer=context.view_layer) or obj.hide_render):
            skip(obj, "Oculto na viewport/View Layer ou desativado no render (objeto)")
            continue
        if any(m.type == 'NODES' for m in obj.modifiers):
            skip(obj, "Geometry Nodes: realize instâncias e converta uma cópia para malha antes de quantificar")
            continue
        if obj.is_instancer:
            skip(obj, "Instanciador: converta uma cópia das instâncias em objetos reais")
            continue
        evaluated = None
        try:
            evaluated = obj.evaluated_get(graph)
            mesh = evaluated.to_mesh()
            if mesh is None:
                raise ValueError("Não foi possível obter malha")
            # Apply full world matrix to each vertex BEFORE measuring areas.
            vertices = [tuple(v * scale for v in (evaluated.matrix_world @ vertex.co)) for vertex in mesh.vertices]
            mesh.calc_loop_triangles()
            triangles = [(t.vertices[0], t.vertices[1], t.vertices[2], t.material_index) for t in mesh.loop_triangles]
            names = [slot.material.name if slot.material else "" for slot in evaluated.material_slots]
            dims, surfaces = measure(vertices, triangles, names)
            category = str(obj.get("cq_category", "")).strip() or UNCLASSIFIED
            code = str(obj.get("cq_code", "")).strip()
            note = str(obj.get("cq_note", "")).strip()
            report.pieces.append(Piece(obj.name, code, category, dims, surfaces, note, obj))
            if category == UNCLASSIFIED:
                skip(obj, "Incluído, mas sem categoria")
            if "Sem material" in surfaces:
                skip(obj, "Incluído com faces sem material válido")
            if any(m.type == 'ARRAY' for m in obj.modifiers):
                skip(obj, "Array incluído como 1 conjunto; a área inclui a geometria avaliada do array")
        except Exception as exc:
            skip(obj, "EXCLUÍDO: falha de medição: " + str(exc))
        finally:
            if evaluated is not None:
                evaluated.to_mesh_clear()
    report.pieces.sort(key=lambda p: (p.category.casefold(), p.code.casefold(), p.name.casefold()))
    return report
