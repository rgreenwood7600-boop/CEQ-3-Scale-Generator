"use strict";

/*
 * Checks the scale PDF: one A4 page, the candidate header, a 1 / ½ / 0
 * radio group on every scale, and a total out of 20 that adds those marks.
 * Run with: node test-pdf.js
 */

const fs = require("fs");
const vm = require("vm");

vm.runInThisContext(fs.readFileSync(__dirname + "/download-pdf.js", "utf8"));

const PLAN = [
    ["Major Scale", 5],
    ["Harmonic Minor Scale", 2],
    ["Melodic Minor Scale", 2],
    ["Chromatic Scale", 1],
    ["Major Arpeggio", 2],
    ["Minor Arpeggio", 2],
    ["Dominant 7th", 2],
    ["Diminished 7th", 2],
    ["Whole Tone Scale", 2]
];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function sheet() {
    const rows = [];
    PLAN.forEach(function (group) {
        const discipline = group[0];
        const count = group[1];
        for (let index = 0; index < count; index += 1) {
            const arpeggio = discipline.indexOf("Arpeggio") !== -1;
            rows.push({
                discipline: discipline,
                note: index % 2 === 0 ? "C#/Db" : "Bb",
                range: index === 0 ? "To the 12th" : "2 Octaves",
                tempo: arpeggio ? "♩. = 48-54" : "♩ = 84-96",
                articulation: index % 3 === 0 ? "Legato Tongued" : "Slurred"
            });
        }
    });
    return {
        instrument: "Tenor Trombone Treble Clef",
        candidate: {
            number: "25123456",
            rank: "Musician",
            name: "Alex Morgan",
            date: "16 November 2026",
            band: "Central Band"
        },
        rows: rows
    };
}

function pdfText(bytes) {
    return Buffer.from(bytes).toString("latin1");
}

function xrefEntries(pdf) {
    const start = pdf.lastIndexOf("startxref");
    assert(start !== -1, "missing startxref");
    const at = Number(pdf.slice(start).match(/startxref\s+(\d+)/)[1]);
    assert(pdf.startsWith("xref\n", at), "startxref does not point at the xref table");
    const header = pdf.slice(at).match(/xref\n(\d+) (\d+)\n/);
    const count = Number(header[2]);
    const bodyAt = at + header[0].length;
    const entries = [];
    for (let index = 0; index < count; index += 1) {
        const line = pdf.slice(bodyAt + index * 20, bodyAt + index * 20 + 20);
        assert(line.length === 20, "xref entry " + index + " is not 20 bytes");
        entries.push({
            offset: Number(line.slice(0, 10)),
            generation: line.slice(11, 16),
            type: line.charAt(17)
        });
    }
    return entries;
}

function objectsById(pdf) {
    const entries = xrefEntries(pdf);
    const objects = new Map();
    entries.forEach(function (entry, id) {
        if (id === 0) {
            assert(entry.type === "f", "object 0 should be free");
            return;
        }
        assert(entry.type === "n", "object " + id + " is not in use");
        const slice = pdf.slice(entry.offset, entry.offset + 30);
        assert(slice.startsWith(id + " 0 obj"), "object " + id + " is not at its xref offset: " + JSON.stringify(slice));
        const next = entries[id + 1] ? entries[id + 1].offset : pdf.lastIndexOf("xref");
        objects.set(id, pdf.slice(entry.offset, next));
    });
    return objects;
}

function unescapePdfString(value) {
    let out = "";
    for (let index = 0; index < value.length; index += 1) {
        const ch = value.charAt(index);
        if (ch !== "\\") {
            out += ch;
            continue;
        }
        const next = value.charAt(index + 1);
        if (next === "n") {
            out += "\n";
            index += 1;
        } else if (next === "r") {
            out += "\r";
            index += 1;
        } else if (next === "t") {
            out += "\t";
            index += 1;
        } else if (next === "(" || next === ")" || next === "\\") {
            out += next;
            index += 1;
        } else if (/[0-7]/.test(next)) {
            let octal = next;
            for (let extra = 0; extra < 2; extra += 1) {
                const digit = value.charAt(index + 2 + extra);
                if (!/[0-7]/.test(digit)) {
                    break;
                }
                octal += digit;
            }
            out += String.fromCharCode(parseInt(octal, 8));
            index += octal.length;
        }
    }
    return out;
}

function scoreWith(script, values) {
    const fields = {};
    values.forEach(function (value, index) {
        fields["Mark" + (index + 1)] = { value: value };
    });
    const event = { value: "" };
    const fn = new Function("event", script + "\nreturn event.value;");
    return fn.call({
        getField: function (name) {
            return fields[name] || null;
        }
    }, event);
}

function rects(body) {
    const match = body.match(/\/Rect \[([^\]]+)\]/);
    assert(match, "missing rect in " + body.slice(0, 80));
    return match[1].trim().split(/\s+/).map(Number);
}

function testFullSheet() {
    const bytes = buildPdfBytes(sheet());
    const pdf = pdfText(bytes);
    const objects = objectsById(pdf);

    const pages = [];
    objects.forEach(function (body) {
        if (body.indexOf("/Type /Page ") !== -1 || body.indexOf("/Type /Page\n") !== -1) {
            if (body.indexOf("/Type /Pages") === -1) {
                pages.push(body);
            }
        }
    });
    assert(pages.length === 1, "expected one A4 page, got " + pages.length);
    assert(pages[0].indexOf("/MediaBox [0 0 595.28 841.89]") !== -1, "page is not A4");

    assert(pdf.indexOf("Alex Morgan") !== -1, "candidate name missing");
    assert(pdf.indexOf("25123456") !== -1, "candidate number missing");
    assert(pdf.indexOf("Musician") !== -1, "rank missing");
    assert(pdf.indexOf("Central Band") !== -1, "band missing");
    assert(pdf.indexOf("16 November 2026") !== -1, "date missing");
    assert(pdf.indexOf("Tenor Trombone Treble Clef") !== -1, "instrument missing");
    assert(pdf.indexOf("Legato Tongued") !== -1, "articulation missing");
    assert(pdf.indexOf("To the 12th") !== -1, "range missing");
    assert(pdf.indexOf("(Total:) Tj") !== -1, "Total label missing");
    assert(pdf.indexOf("(/ 20) Tj") !== -1, "total denominator missing");
    assert(pdf.indexOf("/Encoding /WinAnsiEncoding") !== -1, "fonts are not WinAnsi, so the half mark can draw as the wrong glyph");
    assert(pdf.indexOf("<BD> <00BD>") !== -1, "half mark has no Unicode mapping");
    assert(pdf.indexOf("\\275") !== -1, "half mark is not written as a WinAnsi fraction");
    assert((pdf.match(/\\275/g) || []).length === 20, "expected a half label on each of the 20 scales");
    assert(pdf.indexOf("Performance Requirements") === -1, "performance requirements were written into the PDF");
    assert(pdf.indexOf("from memory") === -1, "performance requirement text was written into the PDF");

    const buttons = [];
    const widgets = [];
    let totalField = "";
    objects.forEach(function (body) {
        if (body.indexOf("/FT /Btn") !== -1) {
            buttons.push(body);
        }
        if (body.indexOf("/Subtype /Widget") !== -1) {
            widgets.push(body);
        }
        if (body.indexOf("/T (TotalMark)") !== -1) {
            totalField = body;
        }
    });

    assert(buttons.length === 20, "expected 20 radio groups, got " + buttons.length);
    buttons.forEach(function (body, index) {
        assert(body.indexOf("/Ff 32768") !== -1, "Mark " + (index + 1) + " is not a radio group");
        assert(body.indexOf("/T (Mark" + (index + 1) + ")") !== -1, "radio groups are not named Mark1..Mark20 in order");
        assert(body.indexOf("/V /Off") !== -1, "a radio group starts with a value selected");
        const kids = body.match(/\/Kids \[([^\]]+)\]/);
        assert(kids && kids[1].match(/R/g).length === 3, "each scale should have three mark widgets");
    });

    const choiceWidgets = widgets.filter(function (body) {
        return body.indexOf("/FT /Tx") === -1;
    });
    assert(choiceWidgets.length === 60, "expected 60 mark boxes, got " + choiceWidgets.length);
    assert(widgets.length === 61, "expected 60 mark boxes plus the total field");

    const exportsByGroup = [];
    for (let index = 0; index < choiceWidgets.length; index += 3) {
        const group = choiceWidgets.slice(index, index + 3);
        const names = group.map(function (body) {
            const found = body.match(/\/N << \/Off \d+ 0 R \/([0-9A-Z]+) /);
            assert(found, "mark box is missing an on state");
            return found[1];
        });
        assert(names.join(",") === "1,H,0", "mark boxes are not 1, half, 0: " + names.join(","));
        const boxes = group.map(rects);
        boxes.forEach(function (rect, boxIndex) {
            assert(Math.abs(rect[2] - rect[0] - 11) < 0.05 && Math.abs(rect[3] - rect[1] - 11) < 0.05, "mark box is not 11pt square");
            assert(rect[0] > 470, "mark box collides with the articulation column: " + rect.join(" "));
            assert(rect[2] <= 547.28 + 0.01, "mark box passes the right margin");
            assert(rect[1] > 48, "mark box overlaps the footer");
            if (boxIndex > 0) {
                assert(boxes[boxIndex][0] > boxes[boxIndex - 1][2], "mark boxes overlap each other");
                assert(rect[1] === boxes[0][1], "mark boxes on one scale are not on the same line");
            }
            if (index === 0 && boxIndex === 0) {
                const placed = pdf.match(/1 0 0 1 ([\d.]+) [\d.]+ Tm\n\(Legato Tongued\) Tj/);
                assert(placed, "Legato Tongued was not placed as text");
                assert(Number(placed[1]) + 82 < rect[0], "Legato Tongued runs into the mark boxes");
            }
        });
        exportsByGroup.push(boxes[0][1]);
    }
    for (let index = 1; index < exportsByGroup.length; index += 1) {
        assert(exportsByGroup[index] < exportsByGroup[index - 1], "scales are not stacked down the page");
    }

    assert(totalField, "total field missing");
    assert(totalField.indexOf("/FT /Tx") !== -1, "total is not a text field");
    assert(totalField.indexOf("/V ()") !== -1, "total should start blank so it can be typed");
    assert(totalField.indexOf("/MaxLen 5") !== -1, "total field length is unset");
    const totalRect = rects(totalField);
    assert(totalRect[1] > 48, "total box overlaps the footer");
    assert(totalRect[1] < exportsByGroup[exportsByGroup.length - 1], "total sits above the last scale");
    assert(totalRect[2] - totalRect[0] >= 36, "total box is too narrow for a mark such as 19.5");

    const scriptMatch = totalField.match(/\/JS \(([\s\S]*)\) >> >> >>/);
    assert(scriptMatch, "total field has no calculation script");
    const script = unescapePdfString(scriptMatch[1]);
    assert(script.indexOf("getField") !== -1, "calculation does not read the marks");
    assert(script.indexOf("0.5") !== -1, "half marks are not scored");
    assert(scoreWith(script, Array(20).fill("Off")) === "0", "an unmarked sheet should total 0");
    assert(scoreWith(script, Array(20).fill("1")) === "20", "twenty full marks should total 20");
    assert(scoreWith(script, Array(20).fill("0")) === "0", "zeros should not add");
    const mixed = Array(20).fill("Off");
    mixed[0] = "1";
    mixed[1] = "1";
    mixed[2] = "1";
    mixed[3] = "H";
    mixed[4] = "0";
    assert(scoreWith(script, mixed) === "3.5", "three full marks and a half should total 3.5, got " + scoreWith(script, mixed));
    const halves = Array(20).fill("H");
    assert(scoreWith(script, halves) === "10", "twenty half marks should total 10");

    const catalog = objects.get(1);
    assert(catalog.indexOf("/AcroForm") !== -1, "catalog has no form");
    const acro = Array.from(objects.values()).find(function (body) {
        return body.indexOf("/Fields [") !== -1 && body.indexOf("/CO [") !== -1;
    });
    assert(acro, "AcroForm is missing the total in its calculation order");
    assert(pdf.indexOf("%%EOF") !== -1, "PDF is truncated");
}

function testMissingRowAndEmptySheet() {
    const rows = sheet().rows;
    rows[4] = { discipline: "Major Scale", missing: true, message: "No major scale entries are saved for this instrument." };
    const bytes = buildPdfBytes({
        instrument: "Flute",
        candidate: sheet().candidate,
        rows: rows
    });
    const pdf = pdfText(bytes);
    const objects = objectsById(pdf);
    let buttons = 0;
    objects.forEach(function (body) {
        if (body.indexOf("/FT /Btn") !== -1) {
            buttons += 1;
        }
    });
    assert(buttons === 19, "a missing scale should not get mark boxes, got " + buttons);
    assert(pdf.indexOf("(/ 20) Tj") !== -1, "the total stays out of 20 when a scale is missing");
    assert(pdf.indexOf("No major scale entries") !== -1, "missing-scale message was dropped");

    const pages = [];
    objectsById(pdfText(buildPdfBytes({ instrument: "", rows: [] }))).forEach(function (body) {
        if (body.indexOf("/Type /Page ") !== -1 && body.indexOf("/Type /Pages") === -1) {
            pages.push(body);
        }
    });
    assert(pages.length === 1, "an empty sheet should still be one page");
    assert(pdfText(buildPdfBytes({ instrument: "", rows: [] })).indexOf("/FT /Btn") === -1, "an empty sheet should not invent marks");
}

testFullSheet();
testMissingRowAndEmptySheet();
console.log("pdf tests passed");
