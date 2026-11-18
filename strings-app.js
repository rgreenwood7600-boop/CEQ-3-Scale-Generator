"use strict";

/*
 * Builds an ARB Class 3 string scale list from Database-strings.js.
 * The syllabus tests a selection of 20 and does not say how many of
 * each type. This uses the same mix as the brass, woodwind and
 * percussion page. The two whole-tone scales on that page are, here,
 * two double-stopped scales (violin, viola and cello) or the two
 * octave scales (double bass). See the README.
 */

const CORE_PLAN = [
    { name: "Major Scale", count: 5, sourceKey: "major", tempoKey: "scales", bowingKey: "scales" },
    { name: "Harmonic Minor Scale", count: 2, sourceKey: "harmonicMinor", tempoKey: "scales", bowingKey: "scales" },
    { name: "Melodic Minor Scale", count: 2, sourceKey: "melodicMinor", tempoKey: "scales", bowingKey: "scales" },
    { name: "Chromatic Scale", count: 1, sourceKey: "chromatic", tempoKey: "scales", bowingKey: "chromatic" },
    { name: "Major Arpeggio", count: 2, sourceKey: "majorArpeggio", tempoKey: "arpeggios", bowingKey: "arpeggios" },
    { name: "Minor Arpeggio", count: 2, sourceKey: "minorArpeggio", tempoKey: "arpeggios", bowingKey: "arpeggios" },
    { name: "Dominant 7th", count: 2, sourceKey: "dominant7th", tempoKey: "sevenths", bowingKey: "sevenths" },
    { name: "Diminished 7th", count: 2, sourceKey: "diminished7th", tempoKey: "sevenths", bowingKey: "sevenths" }
];

const PDF_LEGEND = [
    "Scales, chromatic scales, double stops and 7ths are in crotchet beats. Arpeggios are in dotted crotchet beats.",
    "Dominant 7ths resolve to the tonic, with the leading note rising to the tonic."
];

const PDF_COLUMNS = [
    { label: "Note", x: 48 },
    { label: "Octaves", x: 200 },
    { label: "Tempo", x: 262 },
    { label: "Bowing", x: 332 }
];

const INSTRUMENTS = [
    { name: "Violin", databaseKey: "Violin" },
    { name: "Viola", databaseKey: "Viola" },
    { name: "Cello", databaseKey: "Cello" },
    { name: "Double Bass", databaseKey: "Double Bass" }
];

function syllabus() {
    if (typeof stringDatabase !== "undefined") {
        return stringDatabase;
    }
    return globalThis.stringDatabase || null;
}

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
        .map(function (entry) {
            return { key: entry[0], octaves: entry[1] };
        });
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
    if (octaves === "1") {
        return "1 Octave";
    }
    return octaves + " Octaves";
}

function exercisePlan(instrument) {
    const plan = CORE_PLAN.slice();
    if (instrument.octaveScale) {
        plan.push({
            name: "Octave Scale",
            count: 2,
            sourceKey: "octaveScale",
            tempoKey: "octaveScales",
            bowingKey: "octaveScales"
        });
    } else {
        plan.push({
            name: "Double Stopped Scale",
            count: 2,
            sourceKey: "doubleStopped",
            tempoKey: "doubleStopped",
            bowingKey: ""
        });
    }
    return plan;
}

function patternRank(spec) {
    if (spec.name.indexOf("6ths") !== -1) {
        return 0;
    }
    if (spec.name.indexOf("Major") !== -1) {
        return 1;
    }
    if (spec.name.indexOf("Octaves") !== -1) {
        return 2;
    }
    if (spec.name.indexOf("3rds") !== -1) {
        return 3;
    }
    return 9;
}

function doubleStopNote(spec) {
    if (spec.name.indexOf("6ths") !== -1) {
        return spec.key + " in 6ths";
    }
    if (spec.name.indexOf("3rds") !== -1) {
        return spec.key + " in 3rds";
    }
    if (spec.name.indexOf("Major") !== -1) {
        return spec.key + ", major octaves";
    }
    const form = randomItem(spec.forms);
    const minor = form === "Melodic Minor" ? "melodic" : "harmonic";
    return spec.key + ", " + minor + " minor octaves";
}

function buildStringRows(instrument) {
    const rows = [];

    exercisePlan(instrument).forEach(function (section, sectionIndex) {
        const tempo = formatTempo(section.tempoKey, instrument.tempos && instrument.tempos[section.tempoKey]);
        const source = instrument[section.sourceKey];

        if (Array.isArray(source)) {
            const chosen = shuffle(source).slice(0, section.count).sort(function (a, b) {
                return patternRank(a) - patternRank(b);
            });
            if (chosen.length === 0) {
                rows.push({
                    missing: true,
                    discipline: section.name,
                    sectionIndex: sectionIndex
                });
                return;
            }
            chosen.forEach(function (spec) {
                rows.push({
                    missing: false,
                    discipline: "Double Stopped Scale",
                    note: doubleStopNote(spec),
                    range: formatRange(spec.octaves),
                    tempo: tempo,
                    articulation: spec.bowing,
                    bowing: spec.bowing
                });
            });
            return;
        }

        const chosen = selectUnique(source, section.count);
        if (chosen.length === 0) {
            rows.push({
                missing: true,
                discipline: section.name,
                sectionIndex: sectionIndex
            });
            return;
        }

        const bowings = instrument.bowings && instrument.bowings[section.bowingKey];
        chosen.forEach(function (item) {
            const bowing = randomItem(bowings);
            rows.push({
                missing: false,
                discipline: section.name,
                note: item.key,
                range: formatRange(item.octaves),
                tempo: tempo,
                articulation: bowing,
                bowing: bowing
            });
        });
    });

    return rows;
}

function bootStrings() {
    if (typeof document === "undefined" || !document.getElementById("instrument")) {
        return;
    }

    const instrumentSelect = document.getElementById("instrument");
    const generateButton = document.getElementById("generateButton");
    const downloadButton = document.getElementById("downloadButton");
    const resultInstrument = document.getElementById("resultInstrument");
    const scaleTable = document.getElementById("scaleTable");
    const assessmentBody = document.getElementById("assessmentBody");
    const statusLine = document.getElementById("status");

    function loadInstruments() {
        INSTRUMENTS.forEach(function (instrument) {
            const option = document.createElement("option");
            option.value = instrument.databaseKey;
            option.textContent = instrument.name;
            instrumentSelect.append(option);
        });
    }

    function selectedEntry() {
        const option = instrumentSelect.selectedOptions[0];
        return {
            name: option ? option.textContent : "",
            databaseKey: option ? option.value : ""
        };
    }

    function cell(text) {
        const element = document.createElement("td");
        element.textContent = text;
        return element;
    }

    function labelledCell(label, text, valueClass, cellClass) {
        const element = document.createElement("td");
        if (cellClass) {
            element.className = cellClass;
        }
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

        rows.forEach(function (item) {
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
            row.dataset.articulation = item.bowing;
            row.dataset.bowing = item.bowing;

            row.append(
                labelledCell("Note", item.note, "", "cell-note"),
                labelledCell("Octaves", item.range),
                labelledCell("Tempo", item.tempo, "tempo"),
                labelledCell("Bowing", item.bowing, "", "cell-bowing")
            );
            assessmentBody.append(row);
        });

        return exerciseCount;
    }

    function announce(message) {
        statusLine.textContent = "";
        window.setTimeout(function () {
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
            announce(entry.name + " is not in the scale list.");
            return;
        }

        const exerciseCount = renderRows(buildStringRows(instrument));
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
            const filename = downloadScaleSheet({
                subtitle: "Strings",
                legend: PDF_LEGEND,
                columns: PDF_COLUMNS
            });
            announce("Downloaded " + filename + ".");
        } catch (error) {
            announce("The PDF could not be created. Reload the page and try again.");
        }
    }

    loadInstruments();
    generateButton.addEventListener("click", generateAssessment);
    downloadButton.addEventListener("click", downloadAssessment);
}

var stringsRoot = typeof window !== "undefined" ? window : globalThis;
stringsRoot.buildStringRows = buildStringRows;
stringsRoot.stringPdfLegend = PDF_LEGEND;
stringsRoot.stringPdfColumns = PDF_COLUMNS;

bootStrings();
