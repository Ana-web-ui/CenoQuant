"""Host-independent geometry math and quantity CSV writers."""
from dataclasses import dataclass, field
from collections import defaultdict
from datetime import datetime
from pathlib import Path
import csv
import io
import math

VERSION = "0.2.0"
UNCLASSIFIED = "Sem categoria"
NO_MATERIAL = "Sem material"


def triangle_area(a, b, c):
    u = [b[i] - a[i] for i in range(3)]
    v = [c[i] - a[i] for i in range(3)]
    cross = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
    return math.sqrt(sum(x*x for x in cross)) / 2


def bounds(vertices):
    if not vertices:
        raise ValueError("Objeto sem vértices avaliáveis")
    result = tuple(max(v[i] for v in vertices) - min(v[i] for v in vertices) for i in range(3))
    if not all(math.isfinite(x) for x in result):
        raise ValueError("Dimensões não finitas")
    return result


def measure(vertices, triangles, material_names):
    """Vertices already in WORLD METERS; triangles = (i,j,k,material_index)."""
    dimensions = bounds(vertices)
    surfaces = defaultdict(float)
    for i, j, k, material in triangles:
        area = triangle_area(vertices[i], vertices[j], vertices[k])
        if not math.isfinite(area):
            raise ValueError("Área não finita")
        label = material_names[material] if 0 <= material < len(material_names) and material_names[material] else NO_MATERIAL
        surfaces[label] += area
    if not triangles:
        raise ValueError("Objeto sem faces: não incluído como peça")
    return dimensions, dict(surfaces)


@dataclass
class Piece:
    name: str
    code: str
    category: str
    dimensions: tuple
    surfaces: dict
    note: str = ""
    target: object = field(default=None, repr=False, compare=False)

    @property
    def area(self):
        return sum(self.surfaces.values())


@dataclass
class Takeoff:
    application: str
    scene: str
    scope: str
    loss: float = 0
    pieces: list = field(default_factory=list)
    warnings: list = field(default_factory=list)  # (object, reason)
    timestamp: str = field(default_factory=lambda: datetime.now().astimezone().isoformat(timespec="seconds"))


def groups(report):
    result = {}
    for piece in report.pieces:
        # Explicit code declares identity; never merge by dimensions alone.
        key = (piece.category, piece.code or piece.name, tuple(round(x, 6) for x in piece.dimensions), tuple(sorted(piece.surfaces)))
        if key not in result:
            result[key] = [0, 0.0]
        result[key][0] += 1
        result[key][1] += piece.area
    return result


def material_totals(report):
    result = defaultdict(float)
    for piece in report.pieces:
        for material, area in piece.surfaces.items():
            result[(piece.category, material)] += area
    return dict(result)


def safe_cell(value):
    if not isinstance(value, str):
        return value
    if value.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def number(value):
    # Portuguese decimal convention with semicolon-delimited CSV.
    return format(value, ".6f").replace(".", ",")


def csv_text(report, kind):
    meta = ["aplicativo", "cena", "extraido_em", "escopo", "versao"]
    prefix = [report.application, report.scene, report.timestamp, report.scope, VERSION]
    if kind == "PIECES":
        header = ["objeto", "codigo", "categoria", "quantidade_objetos", "x_m_mundo", "y_m_mundo", "z_m_mundo", "area_superficie_m2", "materiais", "observacao"]
        rows = [[p.name, p.code, p.category, 1, *(number(x) for x in p.dimensions), number(p.area), " | ".join(sorted(p.surfaces)), p.note] for p in report.pieces]
    elif kind == "GROUPS":
        header = ["categoria", "codigo_ou_nome", "x_m_mundo", "y_m_mundo", "z_m_mundo", "materiais", "quantidade_objetos", "area_superficie_total_m2"]
        rows = [[cat, code, *(number(x) for x in dims), " | ".join(mats), qty, number(area)] for (cat, code, dims, mats), (qty, area) in sorted(groups(report).items())]
    elif kind == "MATERIALS":
        header = ["categoria", "material", "area_superficie_m2", "acrescimo_percentual", "area_com_acrescimo_m2", "observacao"]
        rows = [[cat, mat, number(area), number(report.loss), number(area * (1 + report.loss / 100)), "Soma de todas as faces atribuídas; não é plano de corte ou área comercial de compra."] for (cat, mat), area in sorted(material_totals(report).items())]
    elif kind == "WARNINGS":
        header = ["objeto", "aviso"]
        rows = list(report.warnings)
    else:
        raise ValueError("Formato de relatório desconhecido")
    out = io.StringIO(newline="")
    writer = csv.writer(out, delimiter=";")
    writer.writerow(meta + header)
    for row in rows:
        writer.writerow([safe_cell(v) for v in prefix + list(row)])
    return out.getvalue()


def write_csv(report, path, kind):
    Path(path).write_text(csv_text(report, kind), encoding="utf-8-sig", newline="")


def json_payload(report):
    return {
        "schema": "ceno-quant/1",
        "project": {"name": report.scene.rsplit(" / ", 1)[-1], "application": report.application,
                    "source": "blender", "scene": report.scene, "scope": report.scope,
                    "extractedAt": report.timestamp},
        "lossPercent": report.loss,
        "pieces": [{"id": "blender-" + str(i+1), "name": p.name, "code": p.code,
                    "category": p.category, "dimensionsM": list(p.dimensions),
                    "surfaces": [{"material": m, "areaM2": a} for m,a in p.surfaces.items()],
                    "note": p.note, "included": True} for i,p in enumerate(report.pieces)],
        "warnings": [{"object": obj, "message": msg} for obj,msg in report.warnings]
    }
