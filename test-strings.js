"use strict";

/*
 * Checks the string syllabus tables and a generated strings PDF.
 * Run with: node test-strings.js
 */

const fs = require("fs");
const vm = require("vm");

vm.runInThisContext(fs.readFileSync(__dirname + "/Database-strings.js", "utf8"));
vm.runInThisContext(fs.readFileSync(__dirname + "/download-pdf.js", "utf8"));
vm.runInThisContext(fs.readFileSync(__dirname + "/strings-app.js", "utf8"));

const KEYS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "Bb", "B"];

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function fromPattern(pattern) {
    assert(pattern.length === 12, "pattern is not 12 keys: " + pattern);
    const row = {};
    for (let index = 0; index < KEYS.length; index += 1) {
        if (pattern.charAt(index) !== ".") {
            row[KEYS[index]] = pattern.charAt(index);
        }
    }
    return row;
}

function sameRow(actual, pattern, label) {
    const expected = fromPattern(pattern);
    assert(JSON.stringify(actual) === JSON.stringify(expected), label + " is " + JSON.stringify(actual) + ", expected " + pattern);
}

function sameList(actual, expected, label) {
    assert(JSON.stringify(actual) === JSON.stringify(expected), label + " bowings changed: " + JSON.stringify(actual));
}

const upperBowings = {
    scales: ["Separate bows", "Slurred, 1 octave to a bow"],
    arpeggios: ["Separate bows", "Slurred, 3 or 9 notes to a bow"],
    chromatic: ["Separate bows", "Slurred, 6 or 12 notes to a bow"],
    sevenths: ["Separate bows", "Slurred, 4 or 8 notes to a bow"]
};

const data = globalThis.stringDatabase;

sameRow(data.Violin.major, "322222233333", "violin major");
sameRow(data.Violin.harmonicMinor, "322222233333", "violin harmonic minor");
sameRow(data.Violin.melodicMinor, "322222233333", "violin melodic minor");
sameRow(data.Violin.majorArpeggio, "322222233333", "violin major arpeggio");
sameRow(data.Violin.minorArpeggio, "322222233333", "violin minor arpeggio");
sameRow(data.Violin.chromatic, "22.22...33..", "violin chromatic");
sameRow(data.Violin.dominant7th, ".3......22..", "violin dominant");
sameRow(data.Violin.diminished7th, "2......2....", "violin diminished");
assert(data.Violin.tempos.scales === "84-96", "violin scale tempo");
assert(data.Violin.tempos.doubleStopped === "72", "violin double-stop tempo");
assert(data.Violin.tempos.arpeggios === "46-48", "violin arpeggio tempo");
assert(data.Violin.tempos.sevenths === "69-72", "violin 7th tempo");
sameList(data.Violin.bowings, upperBowings, "violin");

sameRow(data.Viola.major, "333333222222", "viola major");
sameRow(data.Viola.harmonicMinor, "333333222222", "viola harmonic minor");
sameRow(data.Viola.melodicMinor, "333333222222", "viola melodic minor");
sameRow(data.Viola.majorArpeggio, "333333222222", "viola major arpeggio");
sameRow(data.Viola.minorArpeggio, "333333222222", "viola minor arpeggio");
sameRow(data.Viola.chromatic, ".3.322......", "viola chromatic");
sameRow(data.Viola.dominant7th, "..2...3.33..", "viola dominant");
sameRow(data.Viola.diminished7th, "...22....2..", "viola diminished");
assert(data.Viola.tempos.scales === "84-96", "viola scale tempo");
assert(data.Viola.tempos.doubleStopped === "66", "viola double-stop tempo");
assert(data.Viola.tempos.arpeggios === "42-44", "viola arpeggio tempo");
assert(data.Viola.tempos.sevenths === "63-66", "viola 7th tempo");
sameList(data.Viola.bowings, upperBowings, "viola");

sameRow(data.Cello.major, "333333222222", "cello major");
sameRow(data.Cello.chromatic, ".2.322......", "cello chromatic");
sameRow(data.Cello.dominant7th, "..2...2.22..", "cello dominant");
sameRow(data.Cello.diminished7th, "...22....2..", "cello diminished");
assert(data.Cello.tempos.scales === "72-84", "cello scale tempo");
assert(data.Cello.tempos.doubleStopped === "60", "cello double-stop tempo");
assert(data.Cello.tempos.arpeggios === "38-40", "cello arpeggio tempo");
assert(data.Cello.tempos.sevenths === "58-60", "cello 7th tempo");
sameList(data.Cello.bowings, upperBowings, "cello");

sameRow(data["Double Bass"].major, "211122222222", "bass major");
sameRow(data["Double Bass"].chromatic, "..1.2..2...2", "bass chromatic");
sameRow(data["Double Bass"].dominant7th, "2.2.2....2..", "bass dominant");
sameRow(data["Double Bass"].diminished7th, "..1.2..2...2", "bass diminished");
sameRow(data["Double Bass"].octaveScale, ".....1.1....", "bass octave scales");
assert(data["Double Bass"].octaveScale.F === "1" && data["Double Bass"].octaveScale.G === "1", "bass octave scales are F and G");
assert(data["Double Bass"].tempos.scales === "56-63", "bass scale tempo");
assert(data["Double Bass"].tempos.arpeggios === "34-36", "bass arpeggio tempo");
assert(data["Double Bass"].tempos.octaveScales === "52", "bass octave tempo");
assert(data["Double Bass"].tempos.sevenths === "52-54", "bass 7th tempo");
assert(!data["Double Bass"].doubleStopped, "bass has no double stops");
sameList(data["Double Bass"].bowings.scales, ["Pizzicato", "Separate bows", "Slurred, 2 beats to a bow"], "bass scales");
sameList(data["Double Bass"].bowings.arpeggios, ["Pizzicato", "Separate bows", "Slurred, 1 beat to a bow"], "bass arpeggios");
sameList(data["Double Bass"].bowings.chromatic, ["Pizzicato", "Slurred, 3 beats to a bow"], "bass chromatic");
sameList(data["Double Bass"].bowings.octaveScales, ["Separate bows", "Pizzicato"], "bass octave bowings");

function expectStops(instrument, expected) {
    assert(JSON.stringify(instrument.doubleStopped) === JSON.stringify(expected), JSON.stringify(instrument.doubleStopped));
}

expectStops(data.Violin, [
    { key: "G", octaves: "2", name: "Double Stopped in 6ths", bowing: "Separate bows" },
    { key: "D", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Separate bows" },
    { key: "G", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Separate bows" },
    { key: "Bb", octaves: "2", name: "Double Stopped in 3rds", bowing: "Slurred, repeated notes" }
]);
expectStops(data.Viola, [
    { key: "C", octaves: "1", name: "Double Stopped in 6ths", bowing: "Separate bows" },
    { key: "G", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Separate bows" },
    { key: "C", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Separate bows" },
    { key: "D", octaves: "1", name: "Double Stopped in 3rds", bowing: "Slurred, repeated notes" }
]);
expectStops(data.Cello, [
    { key: "C", octaves: "1", name: "Double Stopped in 6ths", bowing: "Separate bows" },
    { key: "G", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Broken steps" },
    { key: "C", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Broken steps" },
    { key: "G", octaves: "1", name: "Double Stopped in 3rds", bowing: "Broken steps" }
]);

const COUNTS = {
    "Major Scale": 5,
    "Harmonic Minor Scale": 2,
    "Melodic Minor Scale": 2,
    "Chromatic Scale": 1,
    "Major Arpeggio": 2,
    "Minor Arpeggio": 2,
    "Dominant 7th": 2,
    "Diminished 7th": 2
};

function sourceFor(instrument, discipline) {
    const map = {
        "Major Scale": instrument.major,
        "Harmonic Minor Scale": instrument.harmonicMinor,
        "Melodic Minor Scale": instrument.melodicMinor,
        "Chromatic Scale": instrument.chromatic,
        "Major Arpeggio": instrument.majorArpeggio,
        "Minor Arpeggio": instrument.minorArpeggio,
        "Dominant 7th": instrument.dominant7th,
        "Diminished 7th": instrument.diminished7th,
        "Octave Scale": instrument.octaveScale
    };
    return map[discipline] || null;
}

function bowingsFor(instrument, discipline) {
    if (discipline === "Major Scale" || discipline === "Harmonic Minor Scale" || discipline === "Melodic Minor Scale") {
        return instrument.bowings.scales;
    }
    if (discipline === "Chromatic Scale") {
        return instrument.bowings.chromatic;
    }
    if (discipline === "Major Arpeggio" || discipline === "Minor Arpeggio") {
        return instrument.bowings.arpeggios;
    }
    if (discipline === "Dominant 7th" || discipline === "Diminished 7th") {
        return instrument.bowings.sevenths;
    }
    if (discipline === "Octave Scale") {
        return instrument.bowings.octaveScales;
    }
    return null;
}

Object.keys(data).forEach(function (name) {
    const instrument = data[name];
    for (let trial = 0; trial < 40; trial += 1) {
        const rows = buildStringRows(instrument);
        assert(rows.length === 20, name + " drew " + rows.length);
        const seen = {};
        rows.forEach(function (row) {
            assert(!row.missing, name + " has a missing row");
            const family = Object.keys(COUNTS).indexOf(row.discipline) === -1 && row.discipline.indexOf("Double Stopped") !== 0 && row.discipline !== "Octave Scale"
                ? row.discipline
                : row.discipline;
            if (row.discipline === "Double Stopped Scale") {
                seen["Double Stopped"] = (seen["Double Stopped"] || 0) + 1;
                const spec = instrument.doubleStopped.find(function (item) {
                    return row.note.indexOf(item.key) === 0 && (
                        (item.name.indexOf("6ths") !== -1 && row.note.indexOf("6ths") !== -1) ||
                        (item.name.indexOf("3rds") !== -1 && row.note.indexOf("3rds") !== -1) ||
                        (item.name.indexOf("Major") !== -1 && row.note.indexOf("major octaves") !== -1) ||
                        (item.forms && row.note.indexOf("minor octaves") !== -1)
                    );
                });
                assert(spec, name + " double stop is not in the table: " + row.note);
                assert(row.range === (spec.octaves === "1" ? "1 Octave" : spec.octaves + " Octaves"), "double stop range");
                assert(row.bowing === spec.bowing, "double stop bowing");
                assert(row.tempo === "♩ = " + instrument.tempos.doubleStopped, "double stop tempo");
                if (spec.forms) {
                    assert(row.note.indexOf("harmonic") !== -1 || row.note.indexOf("melodic") !== -1, "minor form missing");
                }
            } else {
                seen[row.discipline] = (seen[row.discipline] || 0) + 1;
                const source = sourceFor(instrument, row.discipline);
                assert(source && source[row.note], name + " drew a key that is not set: " + row.discipline + " " + row.note);
                const octaves = source[row.note];
                assert(row.range === (octaves === "1" ? "1 Octave" : octaves + " Octaves"), name + " range " + row.range);
                const allowed = bowingsFor(instrument, row.discipline);
                assert(allowed.indexOf(row.bowing) !== -1, name + " bowing " + row.bowing);
            }
            assert(row.articulation === row.bowing, "bowing was not copied for the PDF column");
        });
        Object.keys(COUNTS).forEach(function (discipline) {
            assert(seen[discipline] === COUNTS[discipline], name + " " + discipline + " count " + seen[discipline]);
        });
        if (instrument.octaveScale) {
            assert(seen["Octave Scale"] === 2, name + " octave scales");
            assert(!seen["Double Stopped"], name + " should not draw double stops");
        } else {
            assert(seen["Double Stopped"] === 2, name + " double stops " + seen["Double Stopped"]);
        }
        ["Major Scale", "Harmonic Minor Scale", "Chromatic Scale", "Dominant 7th", "Diminished 7th", "Octave Scale"].forEach(function (discipline) {
            const notes = rows.filter(function (row) { return row.discipline === discipline; }).map(function (row) { return row.note; });
            assert(new Set(notes).size === notes.length, name + " repeated a note in " + discipline);
        });
    }
});

function pdfText(bytes) {
    return Buffer.from(bytes).toString("latin1");
}

const sample = buildStringRows(data.Violin);
const bytes = buildPdfBytes({
    instrument: "Violin",
    subtitle: "Strings",
    legend: stringPdfLegend,
    columns: stringPdfColumns,
    candidate: {
        number: "25123456",
        rank: "Musician",
        name: "Alex Morgan",
        date: "16 November 2026",
        band: "Countess of Wessex's String Orchestra"
    },
    rows: sample
});
const pdf = pdfText(bytes);
assert(pdf.indexOf("(Bowing) Tj") !== -1, "strings PDF has no Bowing column");
assert(pdf.indexOf("(Articulation) Tj") === -1, "strings PDF still says Articulation");
assert(pdf.indexOf("(Strings) Tj") !== -1, "strings subtitle missing");
assert(pdf.indexOf("(Violin) Tj") !== -1, "violin missing from the PDF");
assert(pdf.indexOf("Alex Morgan") !== -1, "candidate missing from the strings PDF");
assert(pdf.indexOf("(/ 20) Tj") !== -1, "strings total is not out of 20");
assert((pdf.match(/\/T \(Mark/g) || []).length === 20, "strings PDF should have 20 mark groups");
sample.forEach(function (row) {
    if (!row.bowing) {
        return;
    }
    assert(pdf.indexOf("(" + row.bowing + ") Tj") !== -1, "bowing was cut: " + row.bowing);
});
assert(pdf.indexOf("...") === -1, "a strings line was ellipsized");
assert(pdf.indexOf("1 of 1") !== -1, "a 20-line strings sheet should stay on one page");
assert(pdf.indexOf("2 of 2") === -1, "the total spilled onto a second page");

console.log("strings tests passed");
