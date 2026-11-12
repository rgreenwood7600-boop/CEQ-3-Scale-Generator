(function () {
"use strict";

/*
 * Builds a Word document (.docx) in the browser from the sheet on the page.
 * A .docx file is a zip of XML. This does that with no library and no build
 * step, so the page still works from a folder or from GitHub Pages.
 */

var CRC_TABLE = null;

function xmlEscape(value) {
    return String(value == null ? "" : value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function crc32(bytes) {
    if (!CRC_TABLE) {
        CRC_TABLE = new Uint32Array(256);
        for (var n = 0; n < 256; n += 1) {
            var c = n;
            for (var k = 0; k < 8; k += 1) {
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            }
            CRC_TABLE[n] = c >>> 0;
        }
    }

    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
        crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i += 1) {
        total += parts[i].length;
    }
    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < parts.length; j += 1) {
        out.set(parts[j], offset);
        offset += parts[j].length;
    }
    return out;
}

function zipStore(files) {
    var encoder = new TextEncoder();
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var parts = [];
    var centrals = [];
    var offset = 0;

    files.forEach(function (file) {
        var name = encoder.encode(file.name);
        var data = encoder.encode(file.text);
        var crc = crc32(data);

        var local = new Uint8Array(30 + name.length);
        var localView = new DataView(local.buffer);
        localView.setUint32(0, 0x04034b50, true);
        localView.setUint16(4, 20, true);
        localView.setUint16(6, 0, true);
        localView.setUint16(8, 0, true);
        localView.setUint16(10, dosTime, true);
        localView.setUint16(12, dosDate, true);
        localView.setUint32(14, crc, true);
        localView.setUint32(18, data.length, true);
        localView.setUint32(22, data.length, true);
        localView.setUint16(26, name.length, true);
        localView.setUint16(28, 0, true);
        local.set(name, 30);

        var central = new Uint8Array(46 + name.length);
        var centralView = new DataView(central.buffer);
        centralView.setUint32(0, 0x02014b50, true);
        centralView.setUint16(4, 20, true);
        centralView.setUint16(6, 20, true);
        centralView.setUint16(8, 0, true);
        centralView.setUint16(10, 0, true);
        centralView.setUint16(12, dosTime, true);
        centralView.setUint16(14, dosDate, true);
        centralView.setUint32(16, crc, true);
        centralView.setUint32(20, data.length, true);
        centralView.setUint32(24, data.length, true);
        centralView.setUint16(28, name.length, true);
        centralView.setUint16(30, 0, true);
        centralView.setUint16(32, 0, true);
        centralView.setUint16(34, 0, true);
        centralView.setUint16(36, 0, true);
        centralView.setUint32(38, 0, true);
        centralView.setUint32(42, offset, true);
        central.set(name, 46);

        parts.push(local, data);
        centrals.push(central);
        offset += local.length + data.length;
    });

    var centralBytes = concatBytes(centrals);
    var eocd = new Uint8Array(22);
    var eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, files.length, true);
    eocdView.setUint16(10, files.length, true);
    eocdView.setUint32(12, centralBytes.length, true);
    eocdView.setUint32(16, offset, true);
    eocdView.setUint16(20, 0, true);
    parts.push(centralBytes, eocd);
    return concatBytes(parts);
}

function run(text, options) {
    var opts = options || {};
    var props = ['<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'];
    if (opts.bold) {
        props.push("<w:b/>");
    }
    if (opts.color) {
        props.push('<w:color w:val="' + opts.color + '"/>');
    }
    if (opts.size) {
        props.push('<w:sz w:val="' + opts.size + '"/><w:szCs w:val="' + opts.size + '"/>');
    }
    return "<w:r><w:rPr>" + props.join("") + "</w:rPr><w:t xml:space=\"preserve\">" + xmlEscape(text) + "</w:t></w:r>";
}

function paragraph(runs, options) {
    var opts = options || {};
    var props = [];
    if (opts.align) {
        props.push('<w:jc w:val="' + opts.align + '"/>');
    }
    var spacing = [];
    if (opts.before) {
        spacing.push('w:before="' + opts.before + '"');
    }
    if (opts.after != null) {
        spacing.push('w:after="' + opts.after + '"');
    }
    if (spacing.length) {
        props.push("<w:spacing " + spacing.join(" ") + "/>");
    }
    if (opts.borderBottom) {
        props.push('<w:pBdr><w:bottom w:val="single" w:sz="' + opts.borderBottom + '" w:space="1" w:color="' + (opts.borderColor || "002147") + '"/></w:pBdr>');
    }
    var body = Array.isArray(runs) ? runs.join("") : runs;
    return "<w:p>" + (props.length ? "<w:pPr>" + props.join("") + "</w:pPr>" : "") + body + "</w:p>";
}

function cell(paragraphs, options) {
    var opts = options || {};
    var props = [];
    if (opts.width) {
        props.push('<w:tcW w:w="' + opts.width + '" w:type="dxa"/>');
    }
    if (opts.span && opts.span > 1) {
        props.push('<w:gridSpan w:val="' + opts.span + '"/>');
    }
    if (opts.fill) {
        props.push('<w:shd w:val="clear" w:color="auto" w:fill="' + opts.fill + '"/>');
    }
    var edge = opts.edgeColor || "1C2430";
    var topSize = opts.topSize || 4;
    var topColor = opts.topColor || edge;
    props.push(
        "<w:tcBorders>" +
        '<w:top w:val="single" w:sz="' + topSize + '" w:space="0" w:color="' + topColor + '"/>' +
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="' + edge + '"/>' +
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="' + edge + '"/>' +
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="' + edge + '"/>' +
        "</w:tcBorders>"
    );
    props.push('<w:vAlign w:val="center"/>');
    var body = Array.isArray(paragraphs) ? paragraphs.join("") : paragraphs;
    return "<w:tc><w:tcPr>" + props.join("") + "</w:tcPr>" + body + "</w:tc>";
}

function tableRow(cells, header) {
    var flags = header ? "<w:tblHeader/><w:cantSplit/>" : "<w:cantSplit/>";
    return "<w:tr><w:trPr>" + flags + "</w:trPr>" + cells + "</w:tr>";
}

function table(widths, rows) {
    var total = widths.reduce(function (sum, width) {
        return sum + width;
    }, 0);
    var grid = widths.map(function (width) {
        return '<w:gridCol w:w="' + width + '"/>';
    }).join("");
    return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblLayout w:type="fixed"/>' +
        '<w:tblCellMar><w:top w:w="28" w:type="dxa"/><w:left w:w="80" w:type="dxa"/>' +
        '<w:bottom w:w="28" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        "<w:tblGrid>" + grid + "</w:tblGrid>" + rows.join("") + "</w:tbl>";
}

function heading(text) {
    return paragraph([run(text, { bold: true, color: "002147", size: 28 })], { before: 140, after: 60 });
}

var PAGE_WIDTH = 10204;
var DETAIL_COL = 2551;
var SCALE_COLS = [2500, 1700, 2000, 1800, 2204];

function detailCell(item) {
    var span = item.span || 1;
    return cell([
        paragraph([run(item.label, { bold: true, color: "002147", size: 20 })], { after: 20 }),
        paragraph([run(item.value || " ", { size: 22, color: "1C2430" })], { after: 0 })
    ], { width: DETAIL_COL * span, span: span });
}

function buildDocumentXml(sheet) {
    var blocks = [];

    blocks.push(paragraph(
        [run(sheet.school, { bold: true, color: "002147", size: 28 })],
        { align: "center", after: 40 }
    ));
    blocks.push(paragraph(
        [run(sheet.title, { bold: true, color: "002147", size: 40 })],
        { align: "center", after: 40 }
    ));
    blocks.push(paragraph(
        [run(sheet.subtitle, { color: "3E4C5A", size: 22 })],
        { align: "center", after: 100, borderBottom: 12, borderColor: "002147" }
    ));

    blocks.push(table([PAGE_WIDTH], [
        tableRow(cell([
            paragraph([run("Assessment ID: " + sheet.assessmentId, { bold: true, color: "FFFFFF", size: 22 })], { after: 0 })
        ], { width: PAGE_WIDTH, fill: "002147", edgeColor: "002147" }), false)
    ]));

    blocks.push(heading(sheet.headings.details));
    var detailRows = sheet.details.map(function (row) {
        return tableRow(row.map(detailCell).join(""), false);
    });
    blocks.push(table([DETAIL_COL, DETAIL_COL, DETAIL_COL, DETAIL_COL], detailRows));

    blocks.push(heading(sheet.headings.instructions));
    sheet.instructions.forEach(function (item) {
        if (item.lead) {
            blocks.push(paragraph([
                run(item.lead + " ", { bold: true, size: 22, color: "1C2430" }),
                run(item.rest, { size: 22, color: "1C2430" })
            ], { after: 40 }));
        } else {
            blocks.push(paragraph([
                run(item.text, { size: 22, color: "1C2430" })
            ], { after: 40 }));
        }
    });

    blocks.push(heading(sheet.headings.scales));

    var header = tableRow(sheet.columns.map(function (label, index) {
        return cell([
            paragraph([run(label, { bold: true, color: "002147", size: 20 })], { after: 0 })
        ], { width: SCALE_COLS[index], fill: "DCE6F1" });
    }).join(""), true);

    var body = sheet.rows.map(function (row) {
        if (row.cells.length === 1) {
            return tableRow(cell([
                paragraph([run(row.cells[0].text, { color: "3E4C5A", size: 22 })], { align: "center", after: 0 })
            ], { width: PAGE_WIDTH, span: sheet.columns.length }), false);
        }

        return tableRow(row.cells.map(function (item, index) {
            return cell([
                paragraph([run(item.text, { size: 20, color: "1C2430" })], { after: 0 })
            ], {
                width: SCALE_COLS[index],
                fill: row.shaded ? "F4F8FB" : "FFFFFF",
                topSize: row.groupStart ? 12 : 4,
                topColor: row.groupStart ? "002147" : "1C2430"
            });
        }).join(""), false);
    });

    blocks.push(table(SCALE_COLS, [header].concat(body)));

    sheet.footer.forEach(function (line, index) {
        blocks.push(paragraph(
            [run(line, { color: "3E4C5A", size: 16 })],
            { align: "center", before: index === 0 ? 140 : 0, after: 0 }
        ));
    });

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        "<w:body>" + blocks.join("") +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
        '<w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="851" w:header="454" w:footer="454" w:gutter="0"/>' +
        "</w:sectPr></w:body></w:document>";
}

function buildDocxBytes(sheet) {
    var files = [
        {
            name: "[Content_Types].xml",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                '<Default Extension="xml" ContentType="application/xml"/>' +
                '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
                '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
                '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
                '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
                "</Types>"
        },
        {
            name: "_rels/.rels",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
                '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
                '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
                "</Relationships>"
        },
        {
            name: "docProps/core.xml",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
                "<dc:title>" + xmlEscape(sheet.title) + "</dc:title>" +
                "<dc:subject>" + xmlEscape(sheet.assessmentId) + "</dc:subject>" +
                "<dc:creator>RMSM ARB Assessment Generator</dc:creator>" +
                "</cp:coreProperties>"
        },
        {
            name: "docProps/app.xml",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">' +
                "<Application>RMSM ARB Assessment Generator</Application>" +
                "</Properties>"
        },
        {
            name: "word/styles.xml",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
                "<w:docDefaults><w:rPrDefault><w:rPr>" +
                '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' +
                '<w:sz w:val="22"/><w:szCs w:val="22"/>' +
                "</w:rPr></w:rPrDefault></w:docDefaults>" +
                '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
                "</w:styles>"
        },
        {
            name: "word/_rels/document.xml.rels",
            text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
                "</Relationships>"
        },
        {
            name: "word/document.xml",
            text: buildDocumentXml(sheet)
        }
    ];

    return zipStore(files);
}

function fieldValue(id) {
    var field = document.getElementById(id);
    return field ? field.value.trim() : "";
}

function dateText(input) {
    if (!input || !input.value) {
        return "";
    }
    var parts = input.value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !part; })) {
        return input.value;
    }
    var parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    if (Number.isNaN(parsed.getTime())) {
        return input.value;
    }
    return parsed.toLocaleDateString();
}

function displayedText(element) {
    var text = element.textContent.replace(/\s+/g, " ").trim();
    if (window.getComputedStyle(element).textTransform === "uppercase") {
        return text.toLocaleUpperCase();
    }
    return text;
}

function readSheetFromPage() {
    var dateInput = document.getElementById("candidateDate");
    var instructions = Array.prototype.map.call(document.querySelectorAll(".instructions p"), function (paragraphNode) {
        var strong = paragraphNode.querySelector("strong");
        if (!strong) {
            return { text: paragraphNode.textContent.replace(/\s+/g, " ").trim() };
        }
        var lead = strong.textContent.replace(/\s+/g, " ").trim();
        var rest = paragraphNode.textContent.replace(strong.textContent, " ").replace(/\s+/g, " ").trim();
        return { lead: lead, rest: rest };
    });

    return {
        school: displayedText(document.querySelector(".eyebrow")),
        title: displayedText(document.querySelector(".sheet-header h1")),
        subtitle: displayedText(document.querySelector(".subtitle")),
        assessmentId: document.getElementById("assessmentId").textContent.trim(),
        instrumentName: document.getElementById("selectedInstrument").textContent.trim(),
        headings: {
            details: document.getElementById("detailsHeading").textContent.trim(),
            instructions: document.getElementById("instructionsHeading").textContent.trim(),
            scales: document.getElementById("scalesHeading").textContent.trim()
        },
        details: [
            [
                { label: "Number", value: fieldValue("candidateNumber") },
                { label: "Rank", value: fieldValue("candidateRank") },
                { label: "Name", value: fieldValue("candidateName") },
                { label: "Date", value: dateText(dateInput) }
            ],
            [
                { label: "Instrument", value: document.getElementById("selectedInstrument").textContent.trim(), span: 2 },
                { label: "Band", value: fieldValue("candidateBand"), span: 2 }
            ]
        ],
        instructions: instructions,
        columns: Array.prototype.map.call(document.querySelectorAll(".assessment-table thead th"), function (header) {
            return header.textContent.replace(/\s+/g, " ").trim();
        }),
        rows: Array.prototype.map.call(document.querySelectorAll("#assessmentBody tr"), function (row) {
            return {
                shaded: row.classList.contains("group-alt"),
                groupStart: row.classList.contains("group-start"),
                cells: Array.prototype.map.call(row.children, function (child) {
                    return {
                        text: child.textContent.replace(/\s+/g, " ").trim(),
                        span: Number(child.getAttribute("colspan") || 1)
                    };
                })
            };
        }),
        footer: document.querySelector(".sheet-footer").innerText.split(/\n+/).map(function (line) {
            return line.trim();
        }).filter(Boolean)
    };
}

function downloadName(sheet) {
    var instrument = (sheet.instrumentName || "")
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (/^ARB3-\d{8}-\d{4}$/.test(sheet.assessmentId)) {
        return instrument && instrument !== "Not-selected"
            ? sheet.assessmentId + "-" + instrument + ".docx"
            : sheet.assessmentId + ".docx";
    }
    return "ARB-Class-3-Scales.docx";
}

function downloadScaleSheet() {
    var sheet = readSheetFromPage();
    var bytes = buildDocxBytes(sheet);
    var blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = downloadName(sheet);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
    return downloadName(sheet);
}

var root = typeof window !== "undefined" ? window : globalThis;
root.downloadScaleSheet = downloadScaleSheet;
root.buildDocxBytes = buildDocxBytes;
root.readSheetFromPage = readSheetFromPage;
})();
