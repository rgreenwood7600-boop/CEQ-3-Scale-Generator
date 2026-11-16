"use strict";

/*
 * Builds an A4 PDF of the generated scales in the browser.
 * The file is plain PDF, written here with no library and no build step,
 * so the page still works from a folder or from GitHub Pages with no
 * internet connection.
 *
 * The PDF is the scale list, with the candidate's number, rank, name,
 * date and band in a header above the scales. Each exercise has its
 * note, range, articulation and tempo, then three mark boxes: 1, ½
 * and 0. Those boxes are one radio group per scale, so the examiner
 * can tick a mark in a PDF viewer, and they still print as empty
 * boxes. A total out of 20 sits under the list. Viewers that run form
 * calculations fill that total in. Others leave a box to type in.
 * Performance requirements stay on the page and are not written into
 * the file.
 */

(function () {
    var PAGE_W = 595.28;
    var PAGE_H = 841.89;
    var LEFT = 48;
    var RIGHT = PAGE_W - 48;
    var CONTENT_BOTTOM = 54;
    var BODY = 11;
    var ROW = 16;
    var HEADING = 15;
    var GROUP_GAP = 4;
    var BOX = 11;
    var MARK_LABEL = 9;
    var MARK_LABEL_GAP = 2.2;
    var MARK_GROUP_GAP = 7;
    var BOX_DROP = 1.5;
    var TOTAL_W = 42;
    var TOTAL_H = 16;
    var TOTAL_OUT_OF = 20;

    var NAVY = "0 0.129 0.278";
    var INK = "0.110 0.141 0.188";
    var MUTED = "0.243 0.298 0.353";
    var GOLD = "0.725 0.592 0.357";

    var COLS = [
        { label: "Note", x: LEFT },
        { label: "Octaves", x: LEFT + 112 },
        { label: "Tempo", x: LEFT + 236 },
        { label: "Articulation", x: LEFT + 308 }
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
        "\u00B7": 278, "\u00BD": 834
    };

    var BOLD = {
        " ": 278, "#": 556, ",": 278, "-": 333, ".": 278, "/": 278, ":": 333,
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
        "\u00B7": 278, "\u00BD": 834
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
            } else if (code === 0x00BD) {
                out += "\\275";
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

    /* Shrink a value so it stays inside its column, then clip it with an ellipsis. */
    function fitText(text, maxWidth, size, bold) {
        var value = String(text == null ? "" : text);
        var current = size;
        var minSize = 8;
        while (current > minSize && textWidth(value, current, bold) > maxWidth) {
            current -= 0.5;
        }
        if (textWidth(value, current, bold) <= maxWidth) {
            return { text: value, size: current };
        }
        var clipped = value;
        while (clipped.length > 1 && textWidth(clipped + "...", minSize, bold) > maxWidth) {
            clipped = clipped.slice(0, -1);
        }
        return { text: clipped + "...", size: minSize };
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

    /*
     * Three mark choices, right-aligned: 1, ½ and 0, each with a small box.
     * The boxes are also form widgets. Drawing them here means a print, or a
     * viewer that skips annotations, still shows an empty box to tick.
     */
    function markLayout() {
        var choices = [
            { text: "1", exportName: "1" },
            { text: "\u00BD", exportName: "H" },
            { text: "0", exportName: "0" }
        ];
        var groups = choices.map(function (choice) {
            return {
                text: choice.text,
                exportName: choice.exportName,
                labelWidth: textWidth(choice.text, MARK_LABEL, true),
                width: textWidth(choice.text, MARK_LABEL, true) + MARK_LABEL_GAP + BOX
            };
        });
        var width = groups[0].width + groups[1].width + groups[2].width + MARK_GROUP_GAP * 2;
        var x = RIGHT - width;
        var positions = groups.map(function (group, index) {
            if (index) {
                x += MARK_GROUP_GAP;
            }
            var placed = {
                text: group.text,
                exportName: group.exportName,
                labelX: x,
                boxX: x + group.labelWidth + MARK_LABEL_GAP
            };
            x += group.width;
            return placed;
        });
        return { left: RIGHT - width, width: width, positions: positions };
    }

    function drawFrame(commands, x, y, w, h) {
        commands.push("q");
        commands.push("1 1 1 rg");
        commands.push(num(x) + " " + num(y) + " " + num(w) + " " + num(h) + " re");
        commands.push("f");
        commands.push(NAVY + " RG");
        commands.push("1.15 w");
        commands.push(num(x + 0.9) + " " + num(y + 0.9) + " " + num(w - 1.8) + " " + num(h - 1.8) + " re");
        commands.push("S");
        commands.push("Q");
    }

    function boxRect(boxX, baseline) {
        var bottom = baseline - BOX_DROP;
        return [boxX, bottom, boxX + BOX, bottom + BOX];
    }

    function drawMarkChoices(commands, baseline) {
        var layout = markLayout();
        var options = [];
        layout.positions.forEach(function (pos) {
            var rect = boxRect(pos.boxX, baseline);
            show(commands, pos.text, pos.labelX, baseline, "F2", MARK_LABEL, NAVY);
            drawFrame(commands, rect[0], rect[1], BOX, BOX);
            options.push({ exportName: pos.exportName, rect: rect });
        });
        return options;
    }

    function drawColumnHeader(commands, y) {
        var layout = markLayout();
        var markLabel = "Mark";
        var markWidth = textWidth(markLabel, 9, true);
        COLS.forEach(function (col) {
            show(commands, col.label, col.x, y, "F2", 9, NAVY);
        });
        show(commands, markLabel, layout.left + (layout.width - markWidth) / 2, y, "F2", 9, NAVY);
        hLine(commands, LEFT, RIGHT, y - 5, 0.9, NAVY);
        return y - 18;
    }

    /*
     * Candidate header above the scales. The first line is Number, Rank and
     * Date. The second is Name and Band, which are usually the longer values.
     * Returns the y where the scale list can continue.
     */
    function drawCandidate(commands, candidate, top) {
        var details = candidate || {};
        var labelSize = 8;
        var valueSize = 11;
        var label1 = top - 14;
        var value1 = label1 - 14;
        var label2 = value1 - 16;
        var value2 = label2 - 14;
        var bottom = value2 - 10;
        var width = RIGHT - LEFT;
        var panel = "0.953 0.965 0.976";

        commands.push(panel + " rg");
        commands.push(num(LEFT) + " " + num(bottom) + " " + num(width) + " " + num(heightOf(top, bottom)) + " re");
        commands.push("f");
        commands.push(NAVY + " rg");
        commands.push(num(LEFT) + " " + num(bottom) + " 3.2 " + num(heightOf(top, bottom)) + " re");
        commands.push("f");
        hLine(commands, LEFT, RIGHT, bottom, 1.15, GOLD);

        var innerLeft = LEFT + 14;
        var innerRight = RIGHT - 12;
        var innerWidth = innerRight - innerLeft;

        function valueAt(text, x, baseline, slot) {
            var raw = String(text || "");
            if (!raw || slot < 8) {
                return;
            }
            var fitted = fitText(raw, slot, valueSize, true);
            show(commands, fitted.text, x, baseline, "F2", fitted.size, INK);
        }

        var numberWidth = innerWidth * 0.28;
        var rankWidth = innerWidth * 0.40;
        var dateX = innerLeft + numberWidth + rankWidth;
        show(commands, "Number", innerLeft, label1, "F2", labelSize, NAVY);
        show(commands, "Rank", innerLeft + numberWidth, label1, "F2", labelSize, NAVY);
        show(commands, "Date", dateX, label1, "F2", labelSize, NAVY);
        valueAt(details.number, innerLeft, value1, numberWidth - 12);
        valueAt(details.rank, innerLeft + numberWidth, value1, rankWidth - 12);
        valueAt(details.date, dateX, value1, innerRight - dateX);

        var nameWidth = innerWidth * 0.48;
        show(commands, "Name", innerLeft, label2, "F2", labelSize, NAVY);
        show(commands, "Band", innerLeft + nameWidth, label2, "F2", labelSize, NAVY);
        valueAt(details.name, innerLeft, value2, nameWidth - 12);
        valueAt(details.band, innerLeft + nameWidth, value2, innerWidth - nameWidth);

        return bottom - 12;
    }

    function heightOf(top, bottom) {
        return top - bottom;
    }

    function footerCommands(index, count) {
        var commands = [];
        var label = (index + 1) + " of " + count;
        hLine(commands, LEFT, RIGHT, 36, 0.7, NAVY);
        show(commands, "The Royal Military School of Music", LEFT, 22, "F1", 8.5, MUTED);
        show(commands, label, RIGHT - textWidth(label, 8.5, false), 22, "F1", 8.5, MUTED);
        return commands;
    }

    function markTooltip(row) {
        var parts = [];
        if (row.note) {
            parts.push(row.note);
        }
        if (row.discipline) {
            parts.push(row.discipline);
        }
        var what = parts.length ? parts.join(" ") : "this scale";
        return "Mark for " + what + ". Choose 1, half or 0.";
    }

    function drawTotal(commands, baseline) {
        var label = "Total:";
        var denom = "/ " + TOTAL_OUT_OF;
        var size = 12;
        var gap = 8;
        var denomX = RIGHT - textWidth(denom, size, true);
        var boxX = denomX - gap - TOTAL_W;
        var labelX = boxX - gap - textWidth(label, size, true);
        var boxBottom = baseline - 4;
        show(commands, label, labelX, baseline, "F2", size, NAVY);
        drawFrame(commands, boxX, boxBottom, TOTAL_W, TOTAL_H);
        show(commands, denom, denomX, baseline, "F2", size, NAVY);
        return [boxX, boxBottom, boxX + TOTAL_W, boxBottom + TOTAL_H];
    }

    function renderPages(sheet) {
        var pages = [];
        var commands = [];
        var y = 0;
        var pageIndex = 0;
        var lastDiscipline = null;
        var marks = [];
        var totalField = null;

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
                y -= 16;
            } else {
                y -= 4;
            }
            y = drawCandidate(commands, sheet.candidate, y);
            LEGEND.forEach(function (line) {
                show(commands, line, LEFT, y, "F1", 9, MUTED);
                y -= 12;
            });
            y -= 8;
            y = drawColumnHeader(commands, y);
        }

        function startNextPage() {
            pages.push(commands);
            pageIndex = pages.length;
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
                var articulationRoom = markLayout().left - COLS[3].x - 14;
                var articulation = fitText(row.articulation || "", articulationRoom, BODY, false);
                show(commands, articulation.text, COLS[3].x, y, "F1", articulation.size, INK);
                marks.push({
                    name: "Mark" + (marks.length + 1),
                    page: pageIndex,
                    tooltip: markTooltip(row),
                    options: drawMarkChoices(commands, y)
                });
            }
            y -= ROW;
        });

        if ((sheet.rows || []).length) {
            /* The box hangs 4pt below the total's baseline. Keep that above the footer rule. */
            if (y - 28 < 50) {
                startNextPage();
            }
            y -= 6;
            hLine(commands, LEFT, RIGHT, y, 0.9, NAVY);
            y -= 18;
            totalField = {
                page: pageIndex,
                rect: drawTotal(commands, y)
            };
        }

        pages.push(commands);
        var count = pages.length;
        return {
            streams: pages.map(function (page, index) {
                return page.concat(footerCommands(index, count)).join("\n");
            }),
            marks: marks,
            total: totalField
        };
    }

    function totalScript(count) {
        return "var total=0;for(var i=1;i<=" + count + ";i++){var field=this.getField(\"Mark\"+i);if(field==null)continue;var value=field.value;if(value==\"1\")total+=1;else if(value==\"H\")total+=0.5;}total=Math.round(total*2)/2;event.value=(total%1==0)?String(total):total.toFixed(1);";
    }

    function frameAppearance(width, height, ticked) {
        var lines = [
            "q",
            "1 1 1 rg",
            "0 0 " + num(width) + " " + num(height) + " re",
            "f",
            NAVY + " RG",
            "1.15 w",
            "0.9 0.9 " + num(width - 1.8) + " " + num(height - 1.8) + " re",
            "S"
        ];
        if (ticked) {
            var scale = width / BOX;
            lines.push(INK + " RG");
            lines.push("1.75 w");
            lines.push("1 J");
            lines.push("1 j");
            lines.push(num(2.2 * scale) + " " + num(5.35 * scale) + " m");
            lines.push(num(4.35 * scale) + " " + num(2.95 * scale) + " l");
            lines.push(num(8.85 * scale) + " " + num(8.55 * scale) + " l");
            lines.push("S");
        }
        lines.push("Q");
        return lines.join("\n") + "\n";
    }

    /*
     * Pages, then one radio group per scale (a parent field and three
     * widgets), then the total text field. Appearance streams are shared:
     * an empty box, and the same box with a tick. The total's calculation
     * reads the radio values. 1 scores 1 and the half mark scores 0.5.
     */
    function assemblePdf(rendered, title) {
        var streams = rendered.streams;
        var marks = rendered.marks || [];
        var total = rendered.total;
        var encoder = new TextEncoder();
        var parts = [];

        function push(text) {
            parts.push(encoder.encode(text));
        }

        function lengthSoFar() {
            var totalLength = 0;
            for (var i = 0; i < parts.length; i += 1) {
                totalLength += parts[i].length;
            }
            return totalLength;
        }

        push("%PDF-1.6\n%\xFF\xFF\xFF\xFF\n");

        var offsets = [0];
        function addObject(body) {
            offsets.push(lengthSoFar());
            push(body);
        }

        function addStreamObject(id, dict, stream) {
            var bytes = encoder.encode(stream);
            offsets.push(lengthSoFar());
            push(id + " 0 obj\n<< " + dict + " /Length " + bytes.length + " >>\nstream\n");
            parts.push(bytes);
            push("\nendstream\nendobj\n");
        }

        var offAppearanceId = 5;
        var onAppearanceId = 6;
        var totalAppearanceId = 7;
        var acroId = 8;
        var unicodeId = 9;
        var nextId = 10;
        var pageCount = streams.length;
        var pageIds = [];
        var contentIds = [];
        var p;
        for (p = 0; p < pageCount; p += 1) {
            pageIds.push(nextId);
            nextId += 1;
            contentIds.push(nextId);
            nextId += 1;
        }

        var groups = marks.map(function (mark) {
            var parentId = nextId;
            nextId += 1;
            var kidIds = mark.options.map(function () {
                var kidId = nextId;
                nextId += 1;
                return kidId;
            });
            return { parentId: parentId, kidIds: kidIds, mark: mark };
        });
        var totalId = total ? nextId : 0;
        if (total) {
            nextId += 1;
        }
        var infoId = nextId;

        var annots = pageIds.map(function () {
            return [];
        });
        groups.forEach(function (group) {
            group.kidIds.forEach(function (kidId) {
                annots[group.mark.page].push(kidId);
            });
        });
        if (total) {
            annots[total.page].push(totalId);
        }

        var fieldRefs = groups.map(function (group) {
            return group.parentId + " 0 R";
        });
        if (totalId) {
            fieldRefs.push(totalId + " 0 R");
        }
        var pageRefs = pageIds.map(function (id) {
            return id + " 0 R";
        });

        addObject("1 0 obj\n<< /Type /Catalog /Pages 2 0 R /AcroForm " + acroId + " 0 R >>\nendobj\n");
        addObject("2 0 obj\n<< /Type /Pages /Count " + pageCount + " /Kids [" + pageRefs.join(" ") + "] >>\nendobj\n");
        addObject(
            "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica " +
            "/Encoding /WinAnsiEncoding /ToUnicode " + unicodeId + " 0 R >>\nendobj\n"
        );
        addObject(
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold " +
            "/Encoding /WinAnsiEncoding /ToUnicode " + unicodeId + " 0 R >>\nendobj\n"
        );
        addStreamObject(
            offAppearanceId,
            "/Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 " + num(BOX) + " " + num(BOX) + "] /Resources << >>",
            frameAppearance(BOX, BOX, false)
        );
        addStreamObject(
            onAppearanceId,
            "/Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 " + num(BOX) + " " + num(BOX) + "] /Resources << >>",
            frameAppearance(BOX, BOX, true)
        );
        addStreamObject(
            totalAppearanceId,
            "/Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 " + num(TOTAL_W) + " " + num(TOTAL_H) + "] /Resources << >>",
            frameAppearance(TOTAL_W, TOTAL_H, false)
        );
        addObject(
            acroId + " 0 obj\n<< /Fields [" + fieldRefs.join(" ") + "] " +
            (totalId ? "/CO [" + totalId + " 0 R] " : "") +
            "/DR << /Font << /F1 3 0 R /F2 4 0 R >> >> " +
            "/DA (/F1 12 Tf 0.110 0.141 0.188 rg) >>\nendobj\n"
        );
        addStreamObject(
            unicodeId,
            "/Type /CMap /CMapName /Adobe-Identity-UCS /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >>",
            [
                "/CIDInit /ProcSet findresource begin",
                "12 dict begin",
                "begincmap",
                "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
                "/CMapName /Adobe-Identity-UCS def",
                "/CMapType 2 def",
                "1 begincodespacerange",
                "<00> <FF>",
                "endcodespacerange",
                "1 beginbfrange",
                "<20> <7E> <0020>",
                "endbfrange",
                "2 beginbfchar",
                "<B7> <00B7>",
                "<BD> <00BD>",
                "endbfchar",
                "endcmap",
                "CMapName currentdict /CMap defineresource pop",
                "end",
                "end",
                ""
            ].join("\n")
        );

        streams.forEach(function (stream, index) {
            var data = stream.endsWith("\n") ? stream : stream + "\n";
            var bytes = encoder.encode(data);
            var annotList = annots[index];
            var annotPart = annotList.length
                ? "/Annots [" + annotList.map(function (id) { return id + " 0 R"; }).join(" ") + "] /Tabs /A "
                : "";
            addObject(
                pageIds[index] + " 0 obj\n<< /Type /Page /Parent 2 0 R " +
                "/MediaBox [0 0 595.28 841.89] " +
                "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> " +
                "/Contents " + contentIds[index] + " 0 R " +
                annotPart +
                ">>\nendobj\n"
            );
            offsets.push(lengthSoFar());
            push(contentIds[index] + " 0 obj\n<< /Length " + bytes.length + " >>\nstream\n");
            parts.push(bytes);
            push("\nendstream\nendobj\n");
        });

        groups.forEach(function (group) {
            var mark = group.mark;
            addObject(
                group.parentId + " 0 obj\n<< /FT /Btn /Ff 32768 " +
                "/T (" + pdfEscape(mark.name) + ") " +
                "/TU (" + pdfEscape(mark.tooltip) + ") " +
                "/V /Off " +
                "/Kids [" + group.kidIds.map(function (id) { return id + " 0 R"; }).join(" ") + "] >>\nendobj\n"
            );
            group.kidIds.forEach(function (kidId, index) {
                var option = mark.options[index];
                addObject(
                    kidId + " 0 obj\n<< /Type /Annot /Subtype /Widget " +
                    "/Parent " + group.parentId + " 0 R " +
                    "/P " + pageIds[mark.page] + " 0 R " +
                    "/Rect [" + option.rect.map(num).join(" ") + "] " +
                    "/F 4 /AS /Off " +
                    "/AP << /N << /Off " + offAppearanceId + " 0 R /" + option.exportName + " " + onAppearanceId + " 0 R >> >> " +
                    "/MK << /BG [1 1 1] /BC [0 0.129 0.278] >> " +
                    "/BS << /W 1 /S /S >> >>\nendobj\n"
                );
            });
        });

        if (total) {
            addObject(
                totalId + " 0 obj\n<< /Type /Annot /Subtype /Widget /FT /Tx /Ff 4194304 " +
                "/T (TotalMark) /TU (Total mark out of " + TOTAL_OUT_OF + ") " +
                "/P " + pageIds[total.page] + " 0 R " +
                "/Rect [" + total.rect.map(num).join(" ") + "] " +
                "/F 4 /V () /Q 1 /MaxLen 5 " +
                "/DA (/F1 12 Tf 0.110 0.141 0.188 rg) " +
                "/MK << /BG [1 1 1] /BC [0 0.129 0.278] >> " +
                "/BS << /W 1 /S /S >> " +
                "/AP << /N " + totalAppearanceId + " 0 R >> " +
                "/AA << /C << /S /JavaScript /JS (" + pdfEscape(totalScript(marks.length)) + ") >> >> >>\nendobj\n"
            );
        }

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

        var bytesOut = lengthSoFar();
        var out = new Uint8Array(bytesOut);
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
        return {
            instrument: instrument,
            candidate: {
                number: fieldValue("candidateNumber"),
                rank: fieldValue("candidateRank"),
                name: fieldValue("candidateName"),
                date: formatDate(fieldValue("candidateDate")),
                band: fieldValue("candidateBand")
            },
            rows: rows
        };
    }

    function fieldValue(id) {
        var field = document.getElementById(id);
        if (!field || field.value == null) {
            return "";
        }
        return String(field.value).replace(/\s+/g, " ").trim();
    }

    function formatDate(value) {
        var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match) {
            return value;
        }
        var year = Number(match[1]);
        var month = Number(match[2]);
        var day = Number(match[3]);
        var months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        if (month < 1 || month > 12) {
            return value;
        }
        var parsed = new Date(Date.UTC(year, month - 1, day));
        if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
            return value;
        }
        return day + " " + months[month - 1] + " " + year;
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
