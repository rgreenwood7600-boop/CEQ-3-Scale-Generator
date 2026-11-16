# CEQ-3 Scale Generator

A one-page tool for building an ARB Class 3 scale list at the Royal Military School of Music. It covers brass, woodwind and percussion.

You choose an instrument, fill in the candidate’s number, rank, name, band and date, and press **Generate Scales**. The page lists the scales and arpeggios for that instrument. Each line has a starting note, a range, a tempo and an articulation. **Download PDF** saves that same list as an A4 PDF, with those five details in a header at the top. Each scale has boxes for a mark of 1, ½ or 0, and the sheet ends with a total out of 20.

The notes, ranges, tempi and articulations come from `Database-v5.js`. The page does not change that list.

## Open it

Nothing to install, and there is no build step.

- Open `index.html` in a browser, or
- Publish this folder as a static site. It works on GitHub Pages when the site serves the folder that contains `index.html`.

Keep these files together. The page loads `styles.css`, `app.js`, `download-pdf.js` and `Database-v5.js` from the same folder. The PDF is built in the browser. It does not need a server or an internet connection.

## How to use it

1. Choose an instrument. The list is grouped into woodwind, brass and percussion.
2. Fill in Number, Rank, Name, Date and Band. These can be entered before or after the list is generated.
3. Press **Generate Scales**.
4. Read the list from the top. Play each line with the articulation and tempo shown there. Scales and 7ths are in crotchet beats. Arpeggios are in dotted crotchet beats. Dominant 7ths resolve to the tonic, with the leading note rising to the tonic.
5. Press **Download PDF**. That saves an A4 PDF of the same list. The number, rank, name, date and band are printed in a header above the scales. Beside each scale are three boxes, marked 1, ½ and 0. One box is the mark for that scale. The total at the bottom is out of 20. Open it in any PDF viewer, or print it.

The boxes are fields in the PDF. In a viewer that fills in forms, the examiner clicks one box on each scale. Adobe Acrobat, and other viewers that run form calculations, add the marks up into the total. The total can also be typed. On paper, the boxes are empty squares to tick.

The page also lists the performance requirements under the scale list. Those stay on the page. They are not written into the PDF.

Generating again replaces the list.

## What each list contains

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

- `index.html` — the page
- `styles.css` — how it looks on a screen, on a phone and when printed
- `app.js` — choosing the exercises and filling in the list
- `download-pdf.js` — saving the list as a PDF
- `Database-v5.js` — the scale lists (left as they are)
