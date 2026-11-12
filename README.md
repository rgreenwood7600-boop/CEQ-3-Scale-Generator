# CEQ-3 Scale Generator

A one-page tool for building an ARB Class 3 scales sheet at the Royal Military School of Music. It covers brass, woodwind and percussion.

You choose an instrument and press **Generate Scales**. The page makes a list of scales and arpeggios for that instrument, each with a starting note, a range, a tempo and an articulation, and it gives the sheet a new assessment ID. The candidate records a video of those scales. **Download PDF** saves the examiner’s marksheet: the generated scales are filled in, and the boxes for pieces, sight reading, transposition and the scores are left blank for the examiner.

The notes, ranges, tempi and articulations come from `Database-v5.js`. The page does not change that list.

## Open it

Nothing to install, and there is no build step.

- Open `index.html` in a browser, or
- Publish this folder as a static site. It works on GitHub Pages when the site serves the folder that contains `index.html`.

Keep these files together. The page loads `styles.css`, `app.js`, `download-pdf.js` and `Database-v5.js` from the same folder. The PDF is built in the browser with a library loaded from a content-delivery network, so the page needs an internet connection when it opens. It works on GitHub Pages.

## How to use it

1. Choose an instrument. The list is grouped into woodwind, brass and percussion.
2. Press **Generate Scales**.
3. Fill in number, rank, name, date and band. These details stay put if you generate another list.
4. Record the exercises from the top of the table, using the articulation and tempo on each row. Tempi are crotchet beats per minute.
5. Press **Download PDF**. That saves the marksheet. The scales from this page are written into the scale boxes. Pieces or songs, sight reading, transposition, the score boxes, the mark summary and the examiner’s signature are left blank.

Generating again keeps the candidate details, replaces the scale list, and creates a new assessment ID.

## What each sheet contains

For every instrument the page draws, with no repeated note inside a group:

- 5 major scales
- 2 harmonic minor scales
- 2 melodic minor scales
- 1 chromatic scale
- 2 major arpeggios
- 2 minor arpeggios
- 2 dominant 7ths
- 2 diminished 7ths
- 2 whole-tone scales

Only notes saved for that instrument can come up. A range is either a number of octaves or “To the 12th”. Whole-tone scales, chromatic scales and the other scales share the scale tempo. Arpeggios use the arpeggio tempo. Dominant 7ths and diminished 7ths use their own tempo.

## Files

- `index.html` — the sheet
- `styles.css` — how it looks on a computer and on a phone
- `app.js` — choosing the exercises and filling in the sheet
- `download-pdf.js` — saving the examiner’s marksheet as a PDF
- `Database-v5.js` — the scale lists (left as they are)
