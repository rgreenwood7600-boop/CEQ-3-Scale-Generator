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
    if (opts.vMerge === "restart") {
        props.push('<w:vMerge w:val="restart"/>');
    } else if (opts.vMerge === "continue") {
        props.push("<w:vMerge/>");
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
    props.push('<w:vAlign w:val="' + (opts.vAlign || "center") + '"/>');
    var body = Array.isArray(paragraphs) ? paragraphs.join("") : paragraphs;
    return "<w:tc><w:tcPr>" + props.join("") + "</w:tcPr>" + body + "</w:tc>";
}

function tableRow(cells, options) {
    var opts = options || {};
    var flags = "";
    if (opts.header) {
        flags += "<w:tblHeader/>";
    }
    if (!opts.allowSplit) {
        flags += "<w:cantSplit/>";
    }
    if (opts.height) {
        flags += '<w:trHeight w:val="' + opts.height + '" w:hRule="' + (opts.heightRule || "atLeast") + '"/>';
    }
    return "<w:tr><w:trPr>" + flags + "</w:trPr>" + cells + "</w:tr>";
}

function table(widths, rows, options) {
    var opts = options || {};
    var total = widths.reduce(function (sum, width) {
        return sum + width;
    }, 0);
    var pad = opts.pad == null ? 40 : opts.pad;
    var side = opts.side == null ? 60 : opts.side;
    var grid = widths.map(function (width) {
        return '<w:gridCol w:w="' + width + '"/>';
    }).join("");
    var align = opts.align ? '<w:jc w:val="' + opts.align + '"/>' : "";
    return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/>' + align +
        '<w:tblLayout w:type="fixed"/>' +
        '<w:tblCellMar><w:top w:w="' + pad + '" w:type="dxa"/><w:left w:w="' + side + '" w:type="dxa"/>' +
        '<w:bottom w:w="' + pad + '" w:type="dxa"/><w:right w:w="' + side + '" w:type="dxa"/></w:tblCellMar></w:tblPr>' +
        "<w:tblGrid>" + grid + "</w:tblGrid>" + rows.join("") + "</w:tbl>";
}

var PAGE_WIDTH = 10204;
var DETAIL = [3668, 1754, 2391, 2391];
var SCALE = [1525, 896, 1177, 1764, 3459, 1383];
var GROUP_A = "Generated by the exam administrator from Group A";
var GROUP_B = "Generated by the exam administrator from Group B";

/* Same rows, in the same order, as the ARB Class 3 marksheet. */
var MARKSHEET_SCALES = [
    { label: "Major Scales", comments: [GROUP_A, GROUP_A, GROUP_A, GROUP_B, GROUP_B] },
    { label: "Harmonic Minor Scales", comments: [GROUP_A, GROUP_B] },
    { label: "Melodic Minor Scales", comments: [GROUP_A, GROUP_B] },
    { label: "Chromatic Scale", comments: ["Starting note selected by the candidate"] },
    { label: "Major Arpeggios", comments: [GROUP_A, GROUP_B] },
    { label: "Minor Arpeggios", comments: [GROUP_A, GROUP_B] },
    { label: "Dominant 7ths (in the key of)", comments: [GROUP_A, GROUP_B] },
    { label: "Diminished 7ths", comments: [GROUP_A, GROUP_B] },
    { label: "Whole Tone Scale", comments: [GROUP_A, GROUP_B] }
];

function plain(text, options) {
    var opts = options || {};
    return paragraph([run(text || " ", {
        bold: opts.bold,
        size: opts.size || 20,
        color: opts.color || "1C2430"
    })], { align: opts.align, after: 0 });
}

function lines(parts, options) {
    var opts = options || {};
    return parts.map(function (text, index) {
        return paragraph([run(text, {
            bold: opts.bold,
            size: opts.size || 16,
            color: "1C2430"
        })], { align: opts.align, after: index === parts.length - 1 ? 0 : 0 });
    });
}

function gap() {
    return paragraph([run("", { size: 12 })], { after: 80 });
}

function pageBreak() {
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function labelledCell(label, value, width, span) {
    return cell([
        paragraph([
            run(label, { bold: true, size: 20, color: "1C2430" }),
            run(value ? " " + value : " ", { size: 20, color: "1C2430" })
        ], { after: 0 })
    ], { width: width, span: span || 1 });
}

function banner(text) {
    return table([PAGE_WIDTH], [
        tableRow(cell([
            plain(text, { bold: true, size: 20 })
        ], { width: PAGE_WIDTH, fill: "D9D9D9" }), { height: 320 })
    ], { pad: 40, side: 80 });
}

function writingBox(spaceBefore, inner) {
    var body = [
        paragraph([run(" ")], { before: spaceBefore, after: 0 })
    ];
    if (inner) {
        body.push(inner);
    }
    return table([PAGE_WIDTH], [
        tableRow(cell(body, { width: PAGE_WIDTH, vAlign: "top" }), {})
    ], { pad: 80, side: 80 });
}

function markPair(label, maximum, labelWidth, markWidth, header) {
    return tableRow(
        cell([plain(label, { bold: true, size: header ? 20 : 20 })], { width: labelWidth, fill: header ? "D9D9D9" : null }) +
        cell([plain(maximum, { bold: true, size: 20, align: "right" })], { width: markWidth, fill: header ? "D9D9D9" : null }),
        { height: header ? 340 : 380 }
    );
}

function criteriaTable() {
    var rows = [
        ["Notational Accuracy", "and Fluency", "/30"],
        ["Technical", "Facility", "/30"],
        ["Communication", "and Interpretation", "/30"],
        ["Sub Total", "", "/90"]
    ];
    return table([2200, 780], rows.map(function (row) {
        var label = row[1]
            ? lines([row[0], row[1]], { size: 16, bold: row[0] === "Sub Total" })
            : [plain(row[0], { bold: true, size: 16 })];
        return tableRow(
            cell(label, { width: 2200, vAlign: "center" }) +
            cell([plain(row[2], { bold: true, size: 16, align: "center" })], { width: 780 }),
            { height: 360 }
        );
    }), { align: "right", pad: 30, side: 50 });
}

function scoreBox(maximum) {
    return table([900], [
        tableRow(cell([
            plain(maximum, { bold: true, size: 20, align: "center" })
        ], { width: 900 }), { height: 320 })
    ], { align: "right", pad: 40, side: 60 });
}

function tempoGuidance(sheet) {
    function find(name) {
        var match = (sheet.rows || []).filter(function (row) {
            return row.cells && row.cells[0] && row.cells[0].text === name && row.cells.length >= 4;
        })[0];
        return match && match.cells[3] ? match.cells[3].text : "";
    }
    var scales = find("Major Scale");
    var arpeggios = find("Major Arpeggio");
    var sevenths = find("Dominant 7th");
    var parts = [];
    if (scales) {
        parts.push("Scales, chromatic and whole tone " + scales);
    }
    if (arpeggios) {
        parts.push("Arpeggios " + arpeggios);
    }
    if (sevenths) {
        parts.push("Dominant and diminished 7ths " + sevenths);
    }
    return parts.length ? parts.join(". ") + "." : "";
}

function generatedScale(sheet, index) {
    var row = sheet.rows[index];
    if (!row || row.cells.length < 5) {
        return { note: "", octaves: "", articulation: "" };
    }
    return {
        note: row.cells[1].text,
        octaves: row.cells[2].text,
        articulation: row.cells[4].text
    };
}

function buildDocumentXml(sheet) {
    var blocks = [];
    var number = "";
    var rank = "";
    var name = "";
    var date = "";
    var instrument = sheet.instrumentName === "Not selected" ? "" : (sheet.instrumentName || "");
    var band = "";

    if (sheet.details && sheet.details[0]) {
        number = sheet.details[0][0].value;
        rank = sheet.details[0][1].value;
        name = sheet.details[0][2].value;
        date = sheet.details[0][3].value;
    }
    if (sheet.details && sheet.details[1]) {
        band = sheet.details[1][1].value;
    }

    blocks.push(paragraph(
        [run("The Royal Military School of Music", { bold: true, color: "002147", size: 32 })],
        { align: "center", after: 40 }
    ));
    blocks.push(paragraph(
        [run("ARB Class 3", { bold: true, color: "002147", size: 36 })],
        { align: "center", after: 20 }
    ));
    blocks.push(paragraph(
        [run("Brass/Woodwind/Percussion", { bold: true, color: "002147", size: 24 })],
        { align: "center", after: 40 }
    ));
    blocks.push(paragraph(
        [run("Assessment ID: " + sheet.assessmentId, { size: 18, color: "3E4C5A" })],
        { align: "center", after: 120 }
    ));

    blocks.push(table(DETAIL, [
        tableRow(
            labelledCell("Number:", number, DETAIL[0]) +
            labelledCell("Rank:", rank, DETAIL[1]) +
            labelledCell("Name:", name, DETAIL[2]) +
            labelledCell("Date:", date, DETAIL[3]),
            { height: 360 }
        ),
        tableRow(
            labelledCell("Instrument:", instrument, DETAIL[0]) +
            labelledCell("Band:", band, DETAIL[1] + DETAIL[2] + DETAIL[3], 3),
            { height: 360 }
        )
    ], { pad: 50, side: 70 }));

    blocks.push(gap());

    var scaleHeader = ["Discipline", "Note", "Octaves", "Articulation", "Comments", "Score"].map(function (label, index) {
        return cell([plain(label, { bold: true, size: 16, color: "002147" })], {
            width: SCALE[index],
            fill: "D9E2F3"
        });
    }).join("");

    var scaleRows = [tableRow(scaleHeader, { header: true, height: 320 })];
    var generatedIndex = 0;

    MARKSHEET_SCALES.forEach(function (section) {
        section.comments.forEach(function (_comment, index) {
            var generated = generatedScale(sheet, generatedIndex);
            generatedIndex += 1;
            var discipline = cell(
                index === 0 ? [plain(section.label, { bold: true, size: 16 })] : [plain(" ")],
                {
                    width: SCALE[0],
                    vMerge: index === 0 ? "restart" : "continue"
                }
            );
            scaleRows.push(tableRow(
                discipline +
                cell([plain(generated.note, { size: 16 })], { width: SCALE[1] }) +
                cell([plain(generated.octaves, { size: 16 })], { width: SCALE[2] }) +
                cell([plain(generated.articulation, { size: 16 })], { width: SCALE[3] }) +
                cell([plain(" ")], { width: SCALE[4] }) +
                cell([plain(" ")], { width: SCALE[5] }),
                { height: 340 }
            ));
        });
    });

    blocks.push(table(SCALE, scaleRows, { pad: 30, side: 40 }));
    var tempoLine = tempoGuidance(sheet);
    if (tempoLine) {
        blocks.push(paragraph([
            run(tempoLine, { size: 18, color: "1C2430" })
        ], { before: 120, after: 40 }));
    }
    blocks.push(paragraph([
        run("Dominant 7ths: ", { bold: true, size: 18, color: "1C2430" }),
        run("Resolve to the tonic, with the leading note rising to the tonic.", { size: 18, color: "1C2430" })
    ], { after: 80 }));
    blocks.push(table([1600, 900], [
        tableRow(
            cell([plain("Mark", { bold: true, size: 20 })], { width: 1600 }) +
            cell([plain("/20", { bold: true, size: 20, align: "center" })], { width: 900 }),
            { height: 340 }
        )
    ], { pad: 40, side: 60 }));

    blocks.push(pageBreak());
    blocks.push(banner("Pieces or Songs:"));
    blocks.push(writingBox(9000));

    blocks.push(pageBreak());
    blocks.push(banner("Pieces or Songs Continued:"));
    blocks.push(writingBox(1400, criteriaTable()));

    blocks.push(gap());
    blocks.push(banner("Sight Reading:"));
    blocks.push(writingBox(700, scoreBox("/20")));

    blocks.push(gap());
    blocks.push(banner("Transposition/Rudiments and Beat Patterns:"));
    blocks.push(writingBox(700, scoreBox("/20")));

    blocks.push(gap());
    var markRows = [
        tableRow(cell([
            plain("Marks:", { bold: true, size: 20 })
        ], { width: PAGE_WIDTH, span: 2, fill: "D9D9D9" }), { height: 340 })
    ];
    [
        ["Scales", "/20"],
        ["Pieces", "/90"],
        ["Sight Reading", "/20"],
        ["Transposition", "/20"],
        ["Total", "/150"],
        ["Pass: 70% | Merit: 80% | Distinction: 90%", "/100%"]
    ].forEach(function (item) {
        markRows.push(markPair(item[0], item[1], 6200, 4004, false));
    });
    blocks.push(table([6200, 4004], markRows, { pad: 50, side: 80 }));

    blocks.push(gap());
    blocks.push(table([5102, 5102], [
        tableRow(
            cell([plain("Examiner", { bold: true, size: 20 })], { width: 5102, fill: "D9D9D9" }) +
            cell([plain("Signature", { bold: true, size: 20 })], { width: 5102, fill: "D9D9D9" }),
            { height: 340 }
        ),
        tableRow(
            cell([plain(" ")], { width: 5102 }) +
            cell([plain(" ")], { width: 5102 }),
            { height: 420 }
        ),
        tableRow(
            cell([plain(" ")], { width: 5102 }) +
            cell([plain(" ")], { width: 5102 }),
            { height: 420 }
        )
    ], { pad: 50, side: 80 }));

    blocks.push(paragraph(
        [run("Generated by RMSM ARB Assessment Generator", { size: 16, color: "3E4C5A" })],
        { align: "center", before: 200, after: 0 }
    ));

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        "<w:body>" + blocks.join("") +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
        '<w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="851" w:header="400" w:footer="400" w:gutter="0"/>' +
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
