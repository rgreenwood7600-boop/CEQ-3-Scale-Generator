"use strict";

/*
 * Builds an ARB Class 3 scale list from the syllabus in Database-v5.js.
 * That file holds the notes, ranges, tempi and articulations.
 * This file only chooses from those lists and fills in the page.
 *
 * A list still has the same exercises as before:
 * 5 major scales, 2 harmonic minor, 2 melodic minor, 1 chromatic,
 * 2 major arpeggios, 2 minor arpeggios, 2 dominant 7ths,
 * 2 diminished 7ths and 2 whole-tone scales.
 */

const EXERCISE_PLAN = [
    { name: "Major Scale", count: 5, sourceKey: "major", tempoKey: "scales" },
    { name: "Harmonic Minor Scale", count: 2, sourceKey: "harmonicMinor", tempoKey: "scales" },
    { name: "Melodic Minor Scale", count: 2, sourceKey: "melodicMinor", tempoKey: "scales" },
    { name: "Chromatic Scale", count: 1, sourceKey: "chromatic", tempoKey: "scales" },
    { name: "Major Arpeggio", count: 2, sourceKey: "majorArpeggio", tempoKey: "arpeggios" },
    { name: "Minor Arpeggio", count: 2, sourceKey: "minorArpeggio", tempoKey: "arpeggios" },
    { name: "Dominant 7th", count: 2, sourceKey: "dominant7th", tempoKey: "dominantAndDiminished" },
    { name: "Diminished 7th", count: 2, sourceKey: "diminished7th", tempoKey: "dominantAndDiminished" },
    { name: "Whole Tone Scale", count: 2, sourceKey: "wholeTone", tempoKey: "scales" }
];

const INSTRUMENTS = [
    { group: "Woodwind", name: "Flute", databaseKey: "Flute" },
    { group: "Woodwind", name: "Oboe", databaseKey: "Oboe" },
    { group: "Woodwind", name: "Bb Clarinet", databaseKey: "Bb Clarinet" },
    { group: "Woodwind", name: "Saxophone", databaseKey: "Saxophone" },
    { group: "Woodwind", name: "Bassoon", databaseKey: "Bassoon" },
    { group: "Brass", name: "French Horn", databaseKey: "French Horn" },
    { group: "Brass", name: "Eb Cornet", databaseKey: "Eb Cornet" },
    { group: "Brass", name: "Cornet", databaseKey: "Cornet" },
    { group: "Brass", name: "Trumpet", databaseKey: "Trumpet" },
    { group: "Brass", name: "Flugel Horn", databaseKey: "Flugel Horn" },
    { group: "Brass", name: "Eb Tenor Horn", databaseKey: "Tenor Horn" },
    { group: "Brass", name: "Tenor Trombone Treble Clef", databaseKey: "Tenor Trombone (Treble Clef)" },
    { group: "Brass", name: "Tenor Trombone Bass Clef", databaseKey: "Tenor Trombone (Bass Clef)" },
    { group: "Brass", name: "Bass Trombone", databaseKey: "Bass Trombone" },
    { group: "Brass", name: "Euphonium Treble Clef", databaseKey: "Euphonium (Treble Clef)" },
    { group: "Brass", name: "Euphonium Bass Clef", databaseKey: "Euphonium (Bass Clef)" },
    { group: "Brass", name: "Baritone Treble Clef", databaseKey: "Baritone (Treble Clef)" },
    { group: "Brass", name: "Baritone Bass Clef", databaseKey: "Baritone (Bass Clef)" },
    { group: "Brass", name: "Eb Tuba Treble Clef", databaseKey: "Eb Tuba (Treble Clef)" },
    { group: "Brass", name: "Eb Tuba Bass Clef", databaseKey: "Eb Tuba (Bass Clef)" },
    { group: "Brass", name: "Bb Tuba Treble Clef", databaseKey: "Bb Tuba (Treble Clef)" },
    { group: "Brass", name: "Bb Tuba Bass Clef", databaseKey: "Bb Tuba (Bass Clef)" },
    { group: "Percussion", name: "Percussion", databaseKey: "Percussion" }
];

const instrumentSelect = document.getElementById("instrument");
const generateButton = document.getElementById("generateButton");
const downloadButton = document.getElementById("downloadButton");
const resultInstrument = document.getElementById("resultInstrument");
const scaleTable = document.getElementById("scaleTable");
const assessmentBody = document.getElementById("assessmentBody");
const statusLine = document.getElementById("status");

function loadInstruments() {
    const groups = new Map();

    INSTRUMENTS.forEach((instrument) => {
        if (!groups.has(instrument.group)) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = instrument.group;
            groups.set(instrument.group, optgroup);
            instrumentSelect.append(optgroup);
        }

        const option = document.createElement("option");
        option.value = instrument.databaseKey;
        option.textContent = instrument.name;
        groups.get(instrument.group).append(option);
    });
}

function selectedEntry() {
    const option = instrumentSelect.selectedOptions[0];
    return {
        name: option ? option.textContent : "",
        databaseKey: option ? option.value : ""
    };
}

function syllabus() {
    return typeof database === "undefined" ? null : database;
}

/* A fair shuffle. Sorting by a random number does not give every note an equal chance. */
function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        const held = copy[index];
        copy[index] = copy[swapIndex];
        copy[swapIndex] = held;
    }
    return copy;
}

function selectUnique(data, count) {
    const entries = Object.entries(data || {});
    return shuffle(entries)
        .slice(0, count)
        .map(([key, octaves]) => ({
            key: key,
            octaves: octaves
        }));
}

function randomItem(items) {
    if (!items || items.length === 0) {
        return "";
    }
    return items[Math.floor(Math.random() * items.length)];
}

function formatTempo(tempoKey, value) {
    if (!value) {
        return "";
    }
    if (tempoKey === "arpeggios") {
        return "♩. = " + value;
    }
    return "♩ = " + value;
}

function formatRange(octaves) {
    if (octaves === "12th") {
        return "To the 12th";
    }
    return octaves + " Octaves";
}

function cell(text) {
    const element = document.createElement("td");
    element.textContent = text;
    return element;
}

function labelledCell(label, text, valueClass) {
    const element = document.createElement("td");
    const name = document.createElement("span");
    name.className = "cell-label";
    name.textContent = label;
    const value = document.createElement("span");
    if (valueClass) {
        value.className = valueClass;
    }
    value.textContent = text;
    element.append(name, value);
    return element;
}

function showMessage(message) {
    assessmentBody.replaceChildren();
    scaleTable.classList.remove("is-ready");
    resultInstrument.hidden = true;
    resultInstrument.textContent = "";
    const row = document.createElement("tr");
    const messageCell = cell(message);
    messageCell.colSpan = 4;
    messageCell.className = "empty";
    row.append(messageCell);
    assessmentBody.append(row);
}

function renderRows(rows) {
    assessmentBody.replaceChildren();
    scaleTable.classList.add("is-ready");
    let exerciseCount = 0;
    let lastDiscipline = "";

    rows.forEach((item) => {
        if (item.discipline !== lastDiscipline) {
            const heading = document.createElement("tr");
            heading.className = "group-heading";
            const title = document.createElement("th");
            title.scope = "rowgroup";
            title.colSpan = 4;
            title.textContent = item.discipline;
            heading.append(title);
            assessmentBody.append(heading);
            lastDiscipline = item.discipline;
        }

        if (item.missing) {
            const row = document.createElement("tr");
            row.className = "missing";
            row.dataset.missing = "true";
            row.dataset.discipline = item.discipline;
            const messageCell = cell("No " + item.discipline.toLowerCase() + " entries are saved for this instrument.");
            messageCell.colSpan = 4;
            row.append(messageCell);
            assessmentBody.append(row);
            return;
        }

        exerciseCount += 1;
        const row = document.createElement("tr");
        row.dataset.discipline = item.discipline;
        row.dataset.note = item.note;
        row.dataset.range = item.range;
        row.dataset.tempo = item.tempo;
        row.dataset.articulation = item.articulation;

        row.append(
            labelledCell("Note", item.note),
            labelledCell("Octaves", item.range),
            labelledCell("Tempo", item.tempo, "tempo"),
            labelledCell("Articulation", item.articulation)
        );
        assessmentBody.append(row);
    });

    return exerciseCount;
}

function buildRows(instrument) {
    const rows = [];

    EXERCISE_PLAN.forEach((section, sectionIndex) => {
        const chosen = selectUnique(instrument[section.sourceKey], section.count);
        const tempo = formatTempo(section.tempoKey, instrument.tempos && instrument.tempos[section.tempoKey]);

        if (chosen.length === 0) {
            rows.push({
                missing: true,
                discipline: section.name,
                sectionIndex: sectionIndex,
                index: 0,
                countInSection: 1
            });
            return;
        }

        chosen.forEach((item, index) => {
            rows.push({
                missing: false,
                discipline: section.name,
                note: item.key,
                range: formatRange(item.octaves),
                tempo: tempo,
                articulation: randomItem(instrument.articulations),
                sectionIndex: sectionIndex,
                index: index,
                countInSection: chosen.length
            });
        });
    });

    return rows;
}

function announce(message) {
    statusLine.textContent = "";
    window.setTimeout(() => {
        statusLine.textContent = message;
    }, 30);
}

function generateAssessment() {
    const entry = selectedEntry();
    const data = syllabus();

    if (!data) {
        showMessage("The scale list could not be loaded. Reload the page.");
        announce("The scale list could not be loaded.");
        return;
    }

    const instrument = data[entry.databaseKey];
    if (!instrument) {
        announce(entry.name + " is not in the scale list. The current list was left as it is.");
        return;
    }

    const exerciseCount = renderRows(buildRows(instrument));
    resultInstrument.hidden = false;
    resultInstrument.textContent = entry.name;
    announce("Generated " + exerciseCount + " exercises for " + entry.name + ".");
}

function downloadAssessment() {
    const hasScales = assessmentBody.querySelector("tr[data-note], tr[data-missing]");
    if (!hasScales) {
        announce("Generate a scale list before downloading the PDF.");
        return;
    }
    try {
        const filename = downloadScaleSheet();
        announce("Downloaded " + filename + ".");
    } catch (error) {
        announce("The PDF could not be created. Reload the page and try again.");
    }
}

loadInstruments();

generateButton.addEventListener("click", generateAssessment);
downloadButton.addEventListener("click", downloadAssessment);
