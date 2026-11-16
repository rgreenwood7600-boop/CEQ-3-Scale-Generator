"use strict";

/*
 * Builds an A4 PDF of the generated scales in the browser.
 * The file is plain PDF, written here with no library and no build step,
 * so the page still works from a folder or from GitHub Pages with no
 * internet connection.
 *
 * The PDF is only the scale list: each exercise with its note, range,
 * articulation and tempo. There are no form fields and no boxes.
 */

(function () {
    var PAGE_W = 595.28;
    var PAGE_H = 841.89;
    var LEFT = 48;
    var RIGHT = PAGE_W - 48;
    var CONTENT_BOTTOM = 54;
    var BODY = 11;
    var ROW = 18;
    var HEADING = 16;
    var GROUP_GAP = 7;

    var NAVY = "0 0.129 0.278";
    var INK = "0.110 0.141 0.188";
    var MUTED = "0.243 0.298 0.353";
    var GOLD = "0.725 0.592 0.357";

    var COLS = [
        { label: "Note", x: LEFT },
        { label: "Octaves", x: LEFT + 112 },
        { label: "Tempo", x: LEFT + 236 },
        { label: "Articulation", x: LEFT + 372 }
    ];

    var LEGEND = [
        "Scales, chromatic scales, whole-tone scales and 7ths are in crotchet beats. Arpeggios are in dotted crotchet beats.",
        "Dominant 7ths resolve to the tonic, with the leading note rising to the tonic."
    ];

    /* Widths are in thousandths of an em, from the standard Helvetica metrics. */
    var REGULAR = {
        " ": 278, "!": 278, "\"": 355, "#": 556, "$": 556, "%": 889, "&": 667, "'": 191,
        "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333, ".": 278, "/": 278,
        "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556,
        "8": 556, "9": 556, ":": 278, ";": 278, "<": 584, "=": 584, ">": 584, "?": 556,
        "@": 1015,
        "A": 667, "B": 667, "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722,
        "I": 278, "J": 500, "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667,
        "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722, "V": 667, "W": 944, "X": 667,
        "Y": 667, "Z": 611,
        "a": 556, "b": 556, "c": 500, "d": 556, "e": 556, "f": 278, "g": 556, "h": 556,
        "i": 222, "j": 222, "k": 500, "l": 222, "m": 833, "n": 556, "o": 556, "p": 556,
        "q": 556, "r": 333, "s": 500, "t": 278, "u": 556, "v": 500, "w": 722, "x": 500,
        "y": 500, "z": 500,
        "\u00B7": 278
    };

    var BOLD = {
        " ": 278, "#": 556, ",": 278, "-": 333, ".": 278, "/": 278,
        "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556,
        "8": 556, "9": 556,
        "A": 722, "B": 722, "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722,
        "I": 278, "J": 556, "K": 722, "L": 611, "M": 833, "N": 722, "O": 778, "P": 667,
        "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722, "V": 667, "W": 944, "X": 667,
        "Y": 667, "Z": 611,
        "a": 556, "b": 611, "c": 556, "d": 611, "e": 556, "f": 333, "g": 611, "h": 611,
        "i": 278, "j": 278, "k": 556, "l": 278, "m": 889, "n": 611, "o": 611, "p": 611,
        "q": 611, "r": 389, "s": 556, "t": 333, "u": 611, "v": 556, "w": 778, "x": 556,
        "y": 556, "z": 500,
        "\u00B7": 278
    };

    function num(value) {
        var rounded = Math.round(value * 100) / 100;
        if (Object.is(rounded, -0)) {
            rounded = 0;
        }
        return String(rounded);
    }

    function pdfEscape(value) {
        var text = String(value == null ? "" : value);
        var out = "";
        for (var i = 0; i < text.length; i += 1) {
            var ch = text.charAt(i);
            var code = text.charCodeAt(i);
            if (ch === "\\") {
                out += "\\\\";
            } else if (ch === "(") {
                out += "\\(";
            } else if (ch === ")") {
                out += "\\)";
            } else if (code === 0x00B7) {
                out += "\\267";
            } else if (code >= 32 && code <= 126) {
                out += ch;
            } else {
                out += "?";
            }
        }
        return out;
    }

    function utf16beHex(value) {
        var text = String(value == null ? "" : value);
        var hex = "FEFF";
        for (var i = 0; i < text.length; i += 1) {
            hex += text.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0");
        }
        return hex;
    }

    function textWidth(text, size, bold) {
        var table = bold ? BOLD : REGULAR;
        var units = 0;
        var value = String(text == null ? "" : text);
        for (var i = 0; i < value.length; i += 1) {
            var ch = value.charAt(i);
            units += table[ch] || REGULAR[ch] || 500;
        }
        return units / 1000 * size;
    }

    function tempoParts(tempo) {
        var text = String(tempo || "");
        if (text.indexOf("\u2669. = ") === 0) {
            return { kind: "dotted", rest: text.slice(2) };
        }
        if (text.indexOf("\u2669 = ") === 0) {
            return { kind: "quarter", rest: text.slice(1) };
        }
        return { kind: "plain", rest: text };
    }

    function show(commands, text, x, y, font, size, color) {
        commands.push(
            "BT",
            color + " rg",
            "/" + font + " " + num(size) + " Tf",
            "1 0 0 1 " + num(x) + " " + num(y) + " Tm",
            "(" + pdfEscape(text) + ") Tj",
            "ET"
        );
    }

    function showCenter(commands, text, y, font, size, color) {
        var width = textWidth(text, size, font === "F2");
        show(commands, text, (PAGE_W - width) / 2, y, font, size, color);
    }

    function hLine(commands, x1, x2, y, width, color) {
        commands.push(
            color + " RG",
            num(width) + " w",
            num(x1) + " " + num(y) + " m",
            num(x2) + " " + num(y) + " l",
            "S"
        );
    }

    /*
     * A crotchet, drawn as vectors so the metronome mark does not depend on
     * a music font. The dot is added for a dotted crotchet. Returns the x
     * where the "= 84" text should start.
     */
    function drawNote(commands, x, baseline, dotted) {
        var rx = 3.15;
        var ry = 2.2;
        var cx = x + rx + 0.15;
        var cy = baseline + 2.05;
        var angle = 20 * Math.PI / 180;
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var k = 0.5522847498;

        commands.push("q");
        commands.push("1 0 0 1 " + num(cx) + " " + num(cy) + " cm");
        commands.push(num(cos) + " " + num(sin) + " " + num(-sin) + " " + num(cos) + " 0 0 cm");
        commands.push(num(-rx) + " 0 m");
        commands.push(num(-rx) + " " + num(ry * k) + " " + num(-rx * k) + " " + num(ry) + " 0 " + num(ry) + " c");
        commands.push(num(rx * k) + " " + num(ry) + " " + num(rx) + " " + num(ry * k) + " " + num(rx) + " 0 c");
        commands.push(num(rx) + " " + num(-ry * k) + " " + num(rx * k) + " " + num(-ry) + " 0 " + num(-ry) + " c");
        commands.push(num(-rx * k) + " " + num(-ry) + " " + num(-rx) + " " + num(-ry * k) + " " + num(-rx) + " 0 c");
        commands.push("f");
        commands.push("Q");

        var stemX = cx + rx * 0.62;
        var stemBottom = cy + 0.35;
        var stemTop = baseline + 10.2;
        var stemW = 0.7;
        commands.push(
            num(stemX) + " " + num(stemBottom) + " m",
            num(stemX) + " " + num(stemTop) + " l",
            num(stemX + stemW) + " " + num(stemTop) + " l",
            num(stemX + stemW) + " " + num(stemBottom) + " l",
            "f"
        );

        var end = stemX + stemW;
        if (dotted) {
            var dr = 0.75;
            var dx = cx + rx + 2.7;
            var dy = cy - 0.2;
            commands.push(num(dx - dr) + " " + num(dy) + " m");
            commands.push(num(dx - dr) + " " + num(dy + dr * k) + " " + num(dx - dr * k) + " " + num(dy + dr) + " " + num(dx) + " " + num(dy + dr) + " c");
            commands.push(num(dx + dr * k) + " " + num(dy + dr) + " " + num(dx + dr) + " " + num(dy + dr * k) + " " + num(dx + dr) + " " + num(dy) + " c");
            commands.push(num(dx + dr) + " " + num(dy - dr * k) + " " + num(dx + dr * k) + " " + num(dy - dr) + " " + num(dx) + " " + num(dy - dr) + " c");
            commands.push(num(dx - dr * k) + " " + num(dy - dr) + " " + num(dx - dr) + " " + num(dy - dr * k) + " " + num(dx - dr) + " " + num(dy) + " c");
            commands.push("f");
            end = dx + dr;
        }
        return end + 2.6;
    }

    function drawTempo(commands, tempo, x, baseline) {
        var parts = tempoParts(tempo);
        commands.push("/Span << /ActualText <" + utf16beHex(tempo) + "> >> BDC");
        commands.push(INK + " rg");
        var textX = x;
        if (parts.kind === "quarter" || parts.kind === "dotted") {
            textX = drawNote(commands, x, baseline, parts.kind === "dotted");
        }
        show(commands, parts.rest, textX, baseline, "F1", BODY, INK);
        commands.push("EMC");
    }

    function drawColumnHeader(commands, y) {
        COLS.forEach(function (col) {
            show(commands, col.label, col.x, y, "F2", 9, NAVY);
        });
        hLine(commands, LEFT, RIGHT, y - 5, 0.9, NAVY);
        return y - 18;
    }

    function footerCommands(index, count) {
        var commands = [];
        var label = (index + 1) + " of " + count;
        hLine(commands, LEFT, RIGHT, 36, 0.7, NAVY);
        show(commands, "The Royal Military School of Music", LEFT, 22, "F1", 8.5, MUTED);
        show(commands, label, RIGHT - textWidth(label, 8.5, false), 22, "F1", 8.5, MUTED);
        return commands;
    }

    function renderPages(sheet) {
        var pages = [];
        var commands = [];
        var y = 0;
        var lastDiscipline = null;

        function startFirstPage() {
            commands = [];
            y = PAGE_H - 50;
            showCenter(commands, "The Royal Military School of Music", y, "F2", 11, NAVY);
            y -= 22;
            showCenter(commands, "ARB Class 3 Scales", y, "F2", 18, NAVY);
            y -= 10;
            hLine(commands, LEFT, RIGHT, y, 1.5, NAVY);
            hLine(commands, LEFT, RIGHT, y - 3.2, 0.8, GOLD);
            y -= 20;
            showCenter(commands, "Brass \u00B7 Woodwind \u00B7 Percussion", y, "F1", 11, MUTED);
            y -= 22;
            if (sheet.instrument) {
                showCenter(commands, sheet.instrument, y, "F2", 14, NAVY);
                y -= 20;
            }
            LEGEND.forEach(function (line) {
                show(commands, line, LEFT, y, "F1", 9, MUTED);
                y -= 12;
            });
            y -= 8;
            y = drawColumnHeader(commands, y);
        }

        function startNextPage() {
            pages.push(commands);
            commands = [];
            y = PAGE_H - 46;
            show(commands, "ARB Class 3 Scales", LEFT, y, "F2", 12, NAVY);
            if (sheet.instrument) {
                var size = 12;
                show(commands, sheet.instrument, RIGHT - textWidth(sheet.instrument, size, true), y, "F2", size, NAVY);
            }
            y -= 8;
            hLine(commands, LEFT, RIGHT, y, 0.9, NAVY);
            y -= 20;
            y = drawColumnHeader(commands, y);
        }

        function ensure(height, repeatHeading) {
            if (y - height >= CONTENT_BOTTOM) {
                return;
            }
            startNextPage();
            if (repeatHeading) {
                show(commands, repeatHeading, LEFT, y, "F2", 12, NAVY);
                y -= HEADING;
            }
        }

        startFirstPage();

        (sheet.rows || []).forEach(function (row) {
            var discipline = row.discipline || "";
            var firstOfGroup = discipline !== lastDiscipline;
            if (firstOfGroup) {
                var gap = lastDiscipline === null ? 0 : GROUP_GAP;
                ensure(gap + HEADING + ROW);
                if (gap) {
                    y -= gap;
                }
                show(commands, discipline, LEFT, y, "F2", 12, NAVY);
                y -= HEADING;
                lastDiscipline = discipline;
            } else {
                ensure(ROW, discipline);
            }

            if (row.missing) {
                show(commands, row.message || "", LEFT, y, "F1", BODY, MUTED);
            } else {
                show(commands, row.note || "", COLS[0].x, y, "F1", BODY, INK);
                show(commands, row.range || "", COLS[1].x, y, "F1", BODY, INK);
                drawTempo(commands, row.tempo || "", COLS[2].x, y);
                show(commands, row.articulation || "", COLS[3].x, y, "F1", BODY, INK);
            }
            y -= ROW;
        });

        pages.push(commands);
        var count = pages.length;
        return pages.map(function (page, index) {
            return page.concat(footerCommands(index, count)).join("\n");
        });
    }

    function assemblePdf(streams, title) {
        var encoder = new TextEncoder();
        var parts = [];

        function push(text) {
            parts.push(encoder.encode(text));
        }

        function lengthSoFar() {
            var total = 0;
            for (var i = 0; i < parts.length; i += 1) {
                total += parts[i].length;
            }
            return total;
        }

        push("%PDF-1.6\n%\xFF\xFF\xFF\xFF\n");

        var offsets = [0];
        function addObject(body) {
            offsets.push(lengthSoFar());
            push(body);
        }

        var pageCount = streams.length;
        var firstPageId = 5;
        var infoId = firstPageId + pageCount * 2;
        var kids = [];
        for (var p = 0; p < pageCount; p += 1) {
            kids.push((firstPageId + p * 2) + " 0 R");
        }

        addObject("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        addObject("2 0 obj\n<< /Type /Pages /Count " + pageCount + " /Kids [" + kids.join(" ") + "] >>\nendobj\n");
        addObject("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        addObject("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

        streams.forEach(function (stream, index) {
            var pageId = firstPageId + index * 2;
            var contentId = pageId + 1;
            var data = stream.endsWith("\n") ? stream : stream + "\n";
            var bytes = encoder.encode(data);
            addObject(
                pageId + " 0 obj\n<< /Type /Page /Parent 2 0 R " +
                "/MediaBox [0 0 595.28 841.89] " +
                "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> " +
                "/Contents " + contentId + " 0 R >>\nendobj\n"
            );
            offsets.push(lengthSoFar());
            push(contentId + " 0 obj\n<< /Length " + bytes.length + " >>\nstream\n");
            parts.push(bytes);
            push("\nendstream\nendobj\n");
        });

        addObject(
            infoId + " 0 obj\n<< /Title (" + pdfEscape(title) + ") " +
            "/Creator (RMSM ARB Class 3 Scales Generator) " +
            "/Producer (RMSM ARB Class 3 Scales Generator) >>\nendobj\n"
        );

        var xrefAt = lengthSoFar();
        var xref = "xref\n0 " + offsets.length + "\n0000000000 65535 f \n";
        for (var i = 1; i < offsets.length; i += 1) {
            xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
        }
        xref += "trailer\n<< /Size " + offsets.length + " /Root 1 0 R /Info " + infoId + " 0 R >>\n";
        xref += "startxref\n" + xrefAt + "\n%%EOF\n";
        push(xref);

        var total = lengthSoFar();
        var out = new Uint8Array(total);
        var offset = 0;
        for (var j = 0; j < parts.length; j += 1) {
            out.set(parts[j], offset);
            offset += parts[j].length;
        }
        return out;
    }

    function buildPdfBytes(sheet) {
        var safe = sheet || { instrument: "", rows: [] };
        var title = safe.instrument
            ? "ARB Class 3 Scales - " + safe.instrument
            : "ARB Class 3 Scales";
        return assemblePdf(renderPages(safe), title);
    }

    function readSheetFromPage() {
        var instrumentNode = document.getElementById("resultInstrument");
        var instrument = instrumentNode
            ? instrumentNode.textContent.replace(/\s+/g, " ").trim()
            : "";
        var rows = [];
        document.querySelectorAll("#assessmentBody tr").forEach(function (row) {
            if (row.getAttribute("data-missing")) {
                rows.push({
                    discipline: row.getAttribute("data-discipline") || "",
                    missing: true,
                    message: row.textContent.replace(/\s+/g, " ").trim()
                });
                return;
            }
            if (!row.hasAttribute("data-note")) {
                return;
            }
            rows.push({
                discipline: row.getAttribute("data-discipline") || "",
                note: row.getAttribute("data-note") || "",
                range: row.getAttribute("data-range") || "",
                tempo: row.getAttribute("data-tempo") || "",
                articulation: row.getAttribute("data-articulation") || ""
            });
        });
        return { instrument: instrument, rows: rows };
    }

    function downloadName(sheet) {
        var instrument = String(sheet.instrument || "")
            .replace(/[^A-Za-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        return instrument ? "ARB-Class-3-Scales-" + instrument + ".pdf" : "ARB-Class-3-Scales.pdf";
    }

    function downloadScaleSheet() {
        var sheet = readSheetFromPage();
        if (!sheet.rows.length) {
            var error = new Error("Generate a scale list before downloading the PDF.");
            error.name = "ScaleSheetError";
            throw error;
        }
        var bytes = buildPdfBytes(sheet);
        var name = downloadName(sheet);
        var blob = new Blob([bytes], { type: "application/pdf" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(function () {
            URL.revokeObjectURL(url);
        }, 1500);
        return name;
    }

    var root = typeof window !== "undefined" ? window : globalThis;
    root.downloadScaleSheet = downloadScaleSheet;
    root.buildPdfBytes = buildPdfBytes;
    root.readSheetFromPage = readSheetFromPage;
})();
