/* Ceno Quant 0.2.0 Web — Target: 3ds Max 2027 / Corona.
   Run Script opens the panel. Classification explicitly writes user properties.
   Extraction is read-only: snapshot meshes are temporary values, not scene nodes.
*/
global CenoQuantUI
try (destroyDialog CenoQuantUI) catch ()
callbacks.removeScripts id:#CenoQuantInvalidate

struct CQSurface (label, area=0.0)
struct CQPiece (node, objectName, code, category, dims, surfaces, note="")
struct CQReport (application, sceneLabel, scope, stamp, loss=0.0, pieces, warnings)
struct CQGroup (piece, quantity=0, area=0.0)

fn cqTextProp obj key =
(
    local value = getUserPropVal obj key
    if value == undefined then "" else trimLeft (trimRight (value as string))
)

fn cqArea piece =
(
    local total = 0.0
    for surface in piece.surfaces do total += surface.area
    total
)

fn cqSurfaceAdd surfaces label area =
(
    local found = 0
    for i = 1 to surfaces.count where surfaces[i].label == label do found = i
    if found == 0 then append surfaces (CQSurface label:label area:area)
    else surfaces[found].area += area
)

fn cqMaterialName obj materialID =
(
    local material = obj.material
    if material == undefined then return "Sem material"
    if classOf material == MultiMaterial then
    (
        local index = findItem material.materialIDList materialID
        if index > 0 and index <= material.materialList.count and material.materialList[index] != undefined then
            material.materialList[index].name
        else "Sem material"
    )
    else material.name
)

fn cqSurfaceCompare a b = (if a.label < b.label then -1 else if a.label > b.label then 1 else 0)

fn cqExtract nodes scopeLabel includeHidden loss =
(
    local report = CQReport application:("3ds Max " + ((maxVersion())[1] as string) + " / " + ((classOf renderers.current) as string)) sceneLabel:(if maxFileName == "" then "Não salvo" else maxFilePath+maxFileName) scope:(scopeLabel + "; tempo " + (sliderTime as string) + "; ocultos " + (includeHidden as string)) stamp:(((dotNetClass "System.DateTimeOffset").Now).ToString "o") loss:loss pieces:#() warnings:#()
    append report.warnings #("GERAL", "1 objeto = 1 unidade/conjunto. Objetos unidos e arrays não são decompostos em peças de fabricação. Dimensões nos eixos do mundo; rotação influencia a caixa. Área soma todas as faces, incluindo internas, verso e espessura. Não é plano de corte.")
    append report.warnings #("COBERTURA", "Geometria da viewport no tempo atual. Corona Proxy/CProxy e geradores conhecidos são excluídos. Displacement, instâncias de plugins e geometria exclusiva do render não são estimados. Materiais são rótulos de superfície; misturas/camadas não são convertidas em insumos físicos.")
    local meter = units.decodeValue "1m"
    for obj in nodes do
    (
        local reason = ""
        local cls = classOf obj as string
        if (getUserPropVal obj "cq_exclude") == true then reason = "Excluído manualmente"
        else if superClassOf obj != GeometryClass and superClassOf obj != Shape then reason = "Tipo não geométrico: " + cls
        else if (matchPattern cls pattern:"*CoronaProxy*" ignoreCase:true) or cls == "CProxy" or (matchPattern cls pattern:"*Forest*" ignoreCase:true) or (matchPattern cls pattern:"*RailClone*" ignoreCase:true) then reason = "Proxy/gerador não quantificado: converta cópia em geometria real"
        else if not includeHidden and (obj.isHiddenInVpt or not obj.renderable) then reason = "Oculto na viewport ou objeto não renderizável"
        if reason != "" then append report.warnings #(obj.name, reason)
        else
        (
            local meshValue = undefined
            try
            (
                meshValue = snapshotAsMesh obj
                if meshValue.numverts == 0 or meshValue.numfaces == 0 do throw "Objeto sem faces avaliáveis"
                local vertices = #()
                -- snapshotAsMesh captures world-state geometry including node transforms
                -- and space warps. Do NOT apply objectTransform a second time.
                in coordsys world
                (
                    for i = 1 to meshValue.numverts do append vertices ((getVert meshValue i) / meter)
                )
                local minP = copy vertices[1]
                local maxP = copy vertices[1]
                for v in vertices do
                (
                    minP.x = amin #(minP.x,v.x); minP.y = amin #(minP.y,v.y); minP.z = amin #(minP.z,v.z)
                    maxP.x = amax #(maxP.x,v.x); maxP.y = amax #(maxP.y,v.y); maxP.z = amax #(maxP.z,v.z)
                )
                -- Cross-check the world envelope to catch incompatible plugin snapshots.
                local nativeBounds = nodeGetBoundingBox obj (matrix3 1)
                local tolerance = amax #(0.0001, (length (nativeBounds[2]-nativeBounds[1])) / meter * 0.001)
                if (length (minP-nativeBounds[1]/meter)) > tolerance or (length (maxP-nativeBounds[2]/meter)) > tolerance do
                    throw "Envelope da malha difere da caixa nativa: revisar conversão/plugin antes de medir"
                local surfaces = #()
                for i = 1 to meshValue.numfaces do
                (
                    local face = getFace meshValue i
                    local a = vertices[face.x as integer]
                    local b = vertices[face.y as integer]
                    local c = vertices[face.z as integer]
                    local area = (length (cross (b-a) (c-a))) / 2.0
                    local materialName = cqMaterialName obj (getFaceMatID meshValue i)
                    cqSurfaceAdd surfaces materialName area
                )
                delete meshValue
                meshValue = undefined
                qsort surfaces cqSurfaceCompare
                local category = cqTextProp obj "cq_category"
                if category == "" do category = "Sem categoria"
                local piece = CQPiece node:obj objectName:obj.name code:(cqTextProp obj "cq_code") category:category dims:(maxP-minP) surfaces:surfaces note:(cqTextProp obj "cq_note")
                append report.pieces piece
                if category == "Sem categoria" do append report.warnings #(obj.name, "Incluído, mas sem categoria")
                if (for s in surfaces where s.label == "Sem material" collect s).count > 0 do append report.warnings #(obj.name, "Incluído com faces sem material válido")
            )
            catch (append report.warnings #(obj.name, "EXCLUÍDO: falha de medição: " + getCurrentException()))
            if meshValue != undefined do try (delete meshValue) catch ()
        )
    )
    report
)

fn cqSameGroup a b =
(
    local aCode = if a.code == "" then a.objectName else a.code
    local bCode = if b.code == "" then b.objectName else b.code
    if a.category != b.category or aCode != bCode or a.surfaces.count != b.surfaces.count then return false
    for i = 1 to 3 where (floor (a.dims[i]*1000000+0.5)) != (floor (b.dims[i]*1000000+0.5)) do return false
    for i = 1 to a.surfaces.count where a.surfaces[i].label != b.surfaces[i].label do return false
    true
)

fn cqGroups report =
(
    local groups = #()
    for piece in report.pieces do
    (
        local found = 0
        for i = 1 to groups.count where cqSameGroup groups[i].piece piece do found = i
        if found == 0 then append groups (CQGroup piece:piece quantity:1 area:(cqArea piece))
        else (groups[found].quantity += 1; groups[found].area += cqArea piece)
    )
    groups
)

fn cqMaterials report =
(
    local rows = #() -- #(category, material, area)
    for piece in report.pieces do for surface in piece.surfaces do
    (
        local found = 0
        for i = 1 to rows.count where rows[i][1] == piece.category and rows[i][2] == surface.label do found = i
        if found == 0 then append rows #(piece.category,surface.label,surface.area)
        else rows[found][3] += surface.area
    )
    rows
)

fn cqNumber value = substituteString (formattedPrint value format:".6f") "." ","

fn cqCsvCell value =
(
    local s = value as string
    local trimmed = trimLeft s
    if trimmed.count > 0 and findString "=+-@" (substring trimmed 1 1) != undefined do s = "'" + s
    "\"" + (substituteString s "\"" "\"\"") + "\""
)

fn cqCsvRow values =
(
    local result = ""
    for i = 1 to values.count do result += (if i > 1 then ";" else "") + (cqCsvCell values[i])
    result + "\r\n"
)

fn cqMaterialLabels piece =
(
    local labels = ""
    for i = 1 to piece.surfaces.count do labels += (if i > 1 then " | " else "") + piece.surfaces[i].label
    labels
)

fn cqCsv report kind =
(
    local header = #()
    local rows = #()
    case kind of
    (
        "PIECES":
        (
            header = #("objeto","codigo","categoria","quantidade_objetos","x_m_mundo","y_m_mundo","z_m_mundo","area_superficie_m2","materiais","observacao")
            for p in report.pieces do append rows #(p.objectName,p.code,p.category,1,cqNumber p.dims.x,cqNumber p.dims.y,cqNumber p.dims.z,cqNumber (cqArea p),cqMaterialLabels p,p.note)
        )
        "GROUPS":
        (
            header = #("categoria","codigo_ou_nome","x_m_mundo","y_m_mundo","z_m_mundo","materiais","quantidade_objetos","area_superficie_total_m2")
            for g in cqGroups report do
            (
                local p = g.piece
                append rows #(p.category,(if p.code == "" then p.objectName else p.code),cqNumber p.dims.x,cqNumber p.dims.y,cqNumber p.dims.z,cqMaterialLabels p,g.quantity,cqNumber g.area)
            )
        )
        "MATERIALS":
        (
            header = #("categoria","material","area_superficie_m2","acrescimo_percentual","area_com_acrescimo_m2","observacao")
            for r in cqMaterials report do append rows #(r[1],r[2],cqNumber r[3],cqNumber report.loss,cqNumber (r[3]*(1+report.loss/100)),"Soma de todas as faces; não é plano de corte nem área comercial de compra.")
        )
        "WARNINGS": (header = #("objeto","aviso"); rows = report.warnings)
        default: throw "Formato de relatório desconhecido"
    )
    local metadata = #("aplicativo","cena","extraido_em","escopo","versao")
    local text = cqCsvRow (join metadata header)
    for row in rows do
    (
        local prefix = #(report.application,report.sceneLabel,report.stamp,report.scope,"0.2.0")
        text += cqCsvRow (join prefix row)
    )
    text
)


fn cqJsonString value =
(
    local s = value as string
    s = substituteString s "\\" "\\\\"
    s = substituteString s "\"" "\\\""
    s = substituteString s "\r" "\\r"
    s = substituteString s "\n" "\\n"
    s = substituteString s "\t" "\\t"
    for i = 1 to 31 do s = substituteString s (bit.intAsChar i) ""
    "\"" + s + "\""
)

fn cqJsonNumber value = substituteString (cqNumber value) "," "."

fn cqJson report =
(
    local text = "{\"schema\":\"ceno-quant/1\",\"project\":{\"name\":" + (cqJsonString (if maxFileName == "" then "Projeto Max" else maxFileName)) + ",\"source\":\"3dsmax\",\"application\":" + (cqJsonString report.application) + ",\"scene\":" + (cqJsonString report.sceneLabel) + ",\"scope\":" + (cqJsonString report.scope) + ",\"extractedAt\":" + (cqJsonString report.stamp) + "},\"lossPercent\":" + (cqJsonNumber report.loss) + ",\"pieces\":["
    for i = 1 to report.pieces.count do
    (
        local p = report.pieces[i]
        if i > 1 do text += ","
        text += "{\"id\":" + (cqJsonString ("max-"+(i as string))) + ",\"name\":" + (cqJsonString p.objectName) + ",\"code\":" + (cqJsonString p.code) + ",\"category\":" + (cqJsonString p.category) + ",\"dimensionsM\":[" + (cqJsonNumber p.dims.x) + "," + (cqJsonNumber p.dims.y) + "," + (cqJsonNumber p.dims.z) + "],\"surfaces\":["
        for j = 1 to p.surfaces.count do
        (
            local surface = p.surfaces[j]
            if j > 1 do text += ","
            text += "{\"material\":" + (cqJsonString surface.label) + ",\"areaM2\":" + (cqJsonNumber surface.area) + "}"
        )
        text += "],\"note\":" + (cqJsonString p.note) + ",\"included\":true}"
    )
    text += "],\"warnings\":["
    for i = 1 to report.warnings.count do
    (
        if i > 1 do text += ","
        text += "{\"object\":" + (cqJsonString report.warnings[i][1]) + ",\"message\":" + (cqJsonString report.warnings[i][2]) + "}"
    )
    text + "]}"
)

rollout CenoQuantUI "Ceno Quant · 0.2.0 Web" width:700 height:890
(
    local report = undefined
    local visiblePieces = #()
    label intro "Quantitativo preliminar · 1 objeto = 1 unidade/conjunto" pos:[16,12] width:670
    edittext category "Categoria:" pos:[16,42] width:660
    edittext code "Código da peça:" pos:[16,70] width:660
    edittext note "Observação:" pos:[16,98] width:660
    checkbox excluded "Excluir selecionados do quantitativo" pos:[16,126]
    button readTag "Carregar do objeto ativo" pos:[16,153] width:320
    button applyTag "Aplicar aos selecionados" pos:[354,153] width:322
    label replaceNote "Aplicar substitui todos os campos acima, inclusive vazios, nos objetos selecionados." pos:[16,184] width:660
    checkbox selectedOnly "Somente selecionados" pos:[16,218] checked:true
    checkbox includeHidden "Incluir ocultos" pos:[260,218] checked:false
    spinner loss "Acréscimo de área (%):" pos:[430,218] width:246 range:[0,100,0] type:#float
    button extract "Extrair quantitativo" pos:[16,253] width:660 height:34
    label status "Selecione os objetos e extraia." pos:[16,298] width:660 height:40
    edittext query "Buscar objeto/código/categoria:" pos:[16,345] width:660
    listbox results "Peças (clique para detalhes):" pos:[16,380] width:660 height:10
    edittext detail "Detalhes:" pos:[16,567] width:660 height:115 readOnly:true multiLine:true
    button choose "Selecionar objeto" pos:[16,692] width:320 enabled:false
    button warnings "Ver avisos/exclusões" pos:[354,692] width:322 enabled:false
    button piecesCsv "CSV peças" pos:[16,730] width:155 enabled:false
    button groupsCsv "CSV resumo" pos:[184,730] width:155 enabled:false
    button materialsCsv "CSV materiais" pos:[352,730] width:155 enabled:false
    button warningsCsv "CSV avisos" pos:[520,730] width:156 enabled:false
    button jsonExport "Exportar JSON para o site" pos:[16,774] width:660 height:30 enabled:false
    label finalNote "Exportação completa, independente da busca. Após mudanças, extraia novamente.\nÁrea de faces não equivale automaticamente a consumo de material." pos:[16,825] width:660 height:50

    fn clearReport =
    (
        report = undefined; visiblePieces = #(); results.items = #(); detail.text = ""
        status.text = "Extraia novamente para atualizar o quantitativo."
        choose.enabled = false; warnings.enabled = false
        jsonExport.enabled = false; piecesCsv.enabled = false; groupsCsv.enabled = false; materialsCsv.enabled = false; warningsCsv.enabled = false
    )
    fn refresh =
    (
        visiblePieces = #()
        local labels = #()
        if report != undefined do for i = 1 to report.pieces.count do
        (
            local p = report.pieces[i]
            if query.text == "" or findString (toLower (p.objectName + p.code + p.category)) (toLower query.text) != undefined do
            (
                append visiblePieces i
                append labels (p.objectName + " | " + p.category + " | 1 un. | " + (cqNumber (cqArea p)) + " m²")
            )
        )
        results.items = labels; results.selection = 0; choose.enabled = false
    )
    fn exportCsv kind =
    (
        if report == undefined then return false
        local destination = getSaveFileName caption:"Exportar quantitativo completo" filename:("CenoQuant_" + (toLower kind) + ".csv") types:"CSV (*.csv)|*.csv|"
        if destination != undefined do
        (
            if getFilenameType destination == "" do destination += ".csv"
            if toLower (getFilenameType destination) != ".csv" then messageBox "Use a extensão .csv." title:"Ceno Quant"
            else try
            (
                (dotNetClass "System.IO.File").WriteAllText destination (cqCsv report kind) (dotNetObject "System.Text.UTF8Encoding" true)
                messageBox ("CSV exportado:\n" + destination) title:"Ceno Quant"
            )
            catch (messageBox (getCurrentException()) title:"Ceno Quant")
        )
    )
    on readTag pressed do
    (
        if selection.count != 1 then messageBox "Selecione um único objeto para carregar a classificação." title:"Ceno Quant"
        else
        (
            local obj = selection[1]
            category.text = cqTextProp obj "cq_category"; code.text = cqTextProp obj "cq_code"; note.text = cqTextProp obj "cq_note"
            excluded.checked = (getUserPropVal obj "cq_exclude") == true
        )
    )
    on applyTag pressed do
    (
        local count = 0
        undo "Ceno Quant: classificar" on
        (
            for obj in selection do
            (
                setUserPropVal obj "cq_category" category.text
                setUserPropVal obj "cq_code" code.text
                setUserPropVal obj "cq_note" note.text
                setUserPropVal obj "cq_exclude" excluded.checked
                count += 1
            )
        )
        clearReport()
        status.text = (count as string) + " objetos classificados. Extraia novamente."
    )
    on extract pressed do
    (
        clearReport(); extract.enabled = false; status.text = "Extraindo malhas; cenas complexas podem demorar..."
        try
        (
            local nodes = if selectedOnly.checked then selection as array else objects as array
            report = cqExtract nodes (if selectedOnly.checked then "Selecionados" else "Cena inteira") includeHidden.checked loss.value
            local area = 0.0
            for p in report.pieces do area += cqArea p
            status.text = (report.pieces.count as string) + " unidades · " + (cqNumber area) + " m² de superfície · " + (report.warnings.count as string) + " avisos.\nApós alterações, extraia novamente."
            refresh()
            warnings.enabled = true; jsonExport.enabled = true; piecesCsv.enabled = true; groupsCsv.enabled = true; materialsCsv.enabled = true; warningsCsv.enabled = true
        )
        catch (clearReport(); messageBox (getCurrentException()) title:"Ceno Quant")
        extract.enabled = true
    )
    on query changed value do refresh()
    on results selected i do
    (
        if report != undefined and i > 0 and i <= visiblePieces.count do
        (
            local p = report.pieces[visiblePieces[i]]
            detail.text = p.objectName + " | " + p.code + " | " + p.category + "\r\nCaixa mundo X/Y/Z (m): " + (p.dims as string) + "\r\n1 unidade · " + (cqNumber (cqArea p)) + " m²\r\nMateriais: " + (cqMaterialLabels p) + "\r\n" + p.note
            choose.enabled = isValidNode p.node
        )
    )
    on choose pressed do
    (
        local i = results.selection
        if report != undefined and i > 0 and i <= visiblePieces.count do
        (
            local obj = report.pieces[visiblePieces[i]].node
            if not isValidNode obj then messageBox "Objeto removido; extraia novamente." title:"Ceno Quant"
            else if obj.isHiddenInVpt or obj.isFrozen then messageBox "Habilite visibilidade/seleção no Scene Explorer." title:"Ceno Quant"
            else select obj
        )
    )
    on warnings pressed do
    (
        if report != undefined do
        (
            local text = ""
            for w in report.warnings do text += w[1] + ": " + w[2] + "\r\n\r\n"
            detail.text = text
        )
    )
    on piecesCsv pressed do exportCsv "PIECES"
    on groupsCsv pressed do exportCsv "GROUPS"
    on materialsCsv pressed do exportCsv "MATERIALS"
    on warningsCsv pressed do exportCsv "WARNINGS"

    on jsonExport pressed do
    (
        if report != undefined do
        (
            local destination = getSaveFileName caption:"Exportar JSON para o site" filename:"CenoQuant_projeto.json" types:"JSON (*.json)|*.json|"
            if destination != undefined do
            (
                if getFilenameType destination == "" do destination += ".json"
                if toLower (getFilenameType destination) != ".json" then messageBox "Use a extensão .json." title:"Ceno Quant"
                else try
                (
                    (dotNetClass "System.IO.File").WriteAllText destination (cqJson report) (dotNetObject "System.Text.UTF8Encoding" false)
                    messageBox "JSON exportado. Importe no Ceno Quant Web." title:"Ceno Quant"
                )
                catch (messageBox (getCurrentException()) title:"Ceno Quant")
            )
        )
    )
    on CenoQuantUI close do callbacks.removeScripts id:#CenoQuantInvalidate
)

createDialog CenoQuantUI
callbacks.addScript #filePostOpen "try(CenoQuantUI.clearReport())catch()" id:#CenoQuantInvalidate
callbacks.addScript #systemPostReset "try(CenoQuantUI.clearReport())catch()" id:#CenoQuantInvalidate
callbacks.addScript #systemPostNew "try(CenoQuantUI.clearReport())catch()" id:#CenoQuantInvalidate
