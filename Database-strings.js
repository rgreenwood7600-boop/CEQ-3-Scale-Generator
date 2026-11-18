/*
 * Musician Class 3 strings, from the RMSM syllabus (Jul 24).
 * Each 12-character pattern is one row of the Scales and Arpeggios table,
 * in this key order:
 *   C  C#/Db  D  D#/Eb  E  F  F#/Gb  G  G#/Ab  A  Bb  B
 * A dot is a key the syllabus does not set. The digit is the number of octaves.
 * This file is not used by the brass, woodwind and percussion page.
 */
const STRING_KEYS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "Bb", "B"];

function keyed(pattern) {
    if (pattern.length !== STRING_KEYS.length) {
        throw new Error("A scale row must list 12 keys: " + pattern);
    }
    const row = {};
    for (let index = 0; index < STRING_KEYS.length; index += 1) {
        const octave = pattern.charAt(index);
        if (octave !== ".") {
            row[STRING_KEYS[index]] = octave;
        }
    }
    return row;
}

const UPPER_BOWINGS = {
    scales: ["Separate bows", "Slurred, 1 octave to a bow"],
    arpeggios: ["Separate bows", "Slurred, 3 or 9 notes to a bow"],
    chromatic: ["Separate bows", "Slurred, 6 or 12 notes to a bow"],
    sevenths: ["Separate bows", "Slurred, 4 or 8 notes to a bow"]
};

const stringDatabase = {
    "Violin": {
        tempos: {
            scales: "84-96",
            doubleStopped: "72",
            arpeggios: "46-48",
            sevenths: "69-72"
        },
        bowings: UPPER_BOWINGS,
        major: keyed("322222233333"),
        harmonicMinor: keyed("322222233333"),
        melodicMinor: keyed("322222233333"),
        majorArpeggio: keyed("322222233333"),
        minorArpeggio: keyed("322222233333"),
        chromatic: keyed("22.22...33.."),
        dominant7th: keyed(".3......22.."),
        diminished7th: keyed("2......2...."),
        doubleStopped: [
            { key: "G", octaves: "2", name: "Double Stopped in 6ths", bowing: "Separate bows" },
            { key: "D", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Separate bows" },
            { key: "G", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Separate bows" },
            { key: "Bb", octaves: "2", name: "Double Stopped in 3rds", bowing: "Slurred, repeated notes" }
        ]
    },
    "Viola": {
        tempos: {
            scales: "84-96",
            doubleStopped: "66",
            arpeggios: "42-44",
            sevenths: "63-66"
        },
        bowings: UPPER_BOWINGS,
        major: keyed("333333222222"),
        harmonicMinor: keyed("333333222222"),
        melodicMinor: keyed("333333222222"),
        majorArpeggio: keyed("333333222222"),
        minorArpeggio: keyed("333333222222"),
        chromatic: keyed(".3.322......"),
        dominant7th: keyed("..2...3.33.."),
        diminished7th: keyed("...22....2.."),
        doubleStopped: [
            { key: "C", octaves: "1", name: "Double Stopped in 6ths", bowing: "Separate bows" },
            { key: "G", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Separate bows" },
            { key: "C", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Separate bows" },
            { key: "D", octaves: "1", name: "Double Stopped in 3rds", bowing: "Slurred, repeated notes" }
        ]
    },
    "Cello": {
        tempos: {
            scales: "72-84",
            doubleStopped: "60",
            arpeggios: "38-40",
            sevenths: "58-60"
        },
        bowings: UPPER_BOWINGS,
        major: keyed("333333222222"),
        harmonicMinor: keyed("333333222222"),
        melodicMinor: keyed("333333222222"),
        majorArpeggio: keyed("333333222222"),
        minorArpeggio: keyed("333333222222"),
        chromatic: keyed(".2.322......"),
        dominant7th: keyed("..2...2.22.."),
        diminished7th: keyed("...22....2.."),
        doubleStopped: [
            { key: "C", octaves: "1", name: "Double Stopped in 6ths", bowing: "Separate bows" },
            { key: "G", octaves: "1", name: "Double Stopped in Octaves, Major", bowing: "Broken steps" },
            { key: "C", octaves: "1", name: "Double Stopped in Octaves", forms: ["Harmonic Minor", "Melodic Minor"], bowing: "Broken steps" },
            { key: "G", octaves: "1", name: "Double Stopped in 3rds", bowing: "Broken steps" }
        ]
    },
    "Double Bass": {
        tempos: {
            scales: "56-63",
            arpeggios: "34-36",
            octaveScales: "52",
            sevenths: "52-54"
        },
        bowings: {
            scales: ["Pizzicato", "Separate bows", "Slurred, 2 beats to a bow"],
            arpeggios: ["Pizzicato", "Separate bows", "Slurred, 1 beat to a bow"],
            chromatic: ["Pizzicato", "Slurred, 3 beats to a bow"],
            sevenths: ["Pizzicato", "Separate bows", "Slurred, 2 beats to a bow"],
            octaveScales: ["Separate bows", "Pizzicato"]
        },
        major: keyed("211122222222"),
        harmonicMinor: keyed("211122222222"),
        melodicMinor: keyed("211122222222"),
        majorArpeggio: keyed("211122222222"),
        minorArpeggio: keyed("211122222222"),
        chromatic: keyed("..1.2..2...2"),
        dominant7th: keyed("2.2.2....2.."),
        diminished7th: keyed("..1.2..2...2"),
        octaveScale: keyed(".....1.1....")
    }
};

globalThis.stringDatabase = stringDatabase;
