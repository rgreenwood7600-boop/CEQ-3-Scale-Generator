# CEQ-3 Scale Generator

A static tool for building an ARB Class 3 scale list at the Royal Military School of Music. Brass, woodwind and percussion are on `index.html`. Violin, viola, cello and double bass are on `strings.html`. The two pages work the same way. A link at the top of each page opens the other.

You choose an instrument, fill in the candidate’s number, rank, name, band and date, and press **Generate Scales**. The page lists the scales and arpeggios for that instrument. Each line has a starting note, a range, a tempo and an articulation. **Download PDF** saves that same list as an A4 PDF, with those five details in a header at the top. Each scale has boxes for a mark of 1, ½ or 0, and the sheet ends with a total out of 20.

The notes, ranges, tempi and articulations come from `Database-v5.js`. The page does not change that list.

## Open it

Nothing to install, and there is no build step.

- Open `index.html` in a browser, or open `strings.html` for strings, or
- Publish this folder as a static site. It works on GitHub Pages when the site serves the folder that contains `index.html`.

Keep these files together. The brass, woodwind and percussion page loads `styles.css`, `app.js`, `download-pdf.js` and `Database-v5.js` from the same folder. The strings page loads `styles.css`, `strings-app.js`, `download-pdf.js` and `Database-strings.js`. The PDF is built in the browser. It does not need a server or an internet connection.

## How to use it

1. Choose an instrument. The list is grouped into woodwind, brass and percussion.
2. Fill in Number, Rank, Name, Date and Band. These can be entered before or after the list is generated.
3. Press **Generate Scales**.
4. Read the list from the top. Play each line with the articulation and tempo shown there. Scales and 7ths are in crotchet beats. Arpeggios are in dotted crotchet beats. Dominant 7ths resolve to the tonic, with the leading note rising to the tonic.
5. Press **Download PDF**. That saves an A4 PDF of the same list. The number, rank, name, date and band are printed in a header above the scales. Beside each scale are three boxes, marked 1, ½ and 0. One box is the mark for that scale. The total at the bottom is out of 20. Open it in any PDF viewer, or print it.

The boxes are fields in the PDF. In a viewer that fills in forms, the examiner clicks one box on each scale. Adobe Acrobat, and other viewers that run form calculations, add the marks up into the total. The total can also be typed. On paper, the boxes are empty squares to tick.

The page also lists the performance requirements under the scale list. Those stay on the page. They are not written into the PDF.

Generating again replaces the list.

## Strings

Open `strings.html`. Choose Violin, Viola, Cello or Double Bass, fill in the same candidate details, and press **Generate Scales**. Each line has a key, a scale type, a range, a tempo and a bowing. **Download PDF** saves the same A4 marksheet as the brass, woodwind and percussion page: the candidate header, one line per scale, boxes for 1, ½ and 0, and a total out of 20. The fourth column is the bowing instead of an articulation. There is no Word download. The live brass, woodwind and percussion page does not produce a Word file either.

The syllabus says a selection of 20 scales and arpeggios is tested. It does not say how many of each type. The strings page uses the same mix as the other page, which is also 20:

- 5 major scales
- 2 harmonic minor scales
- 2 melodic minor scales
- 1 chromatic scale
- 2 major arpeggios
- 2 minor arpeggios
- 2 dominant 7ths
- 2 diminished 7ths
- 2 double-stopped scales on violin, viola and cello, drawn from the four patterns in the syllabus table (6ths, octaves in a major, octaves in a minor, and 3rds). The note names the pattern, for example “G in 6ths” or “G, harmonic minor octaves”
- 2 octave scales on double bass (both keys in the table, F and G)

A key is not repeated inside a major, minor, chromatic, arpeggio, 7th or octave-scale group. The two double-stopped lines are different patterns, so the same letter can appear on both when the table sets it twice. Only keys in that instrument’s syllabus table can come up. Where the syllabus gives more than one bowing, the page picks one at random, in the same way the other page picks an articulation. When a slurred bowing is printed as “3 or 9”, “6 or 12” or “4 or 8” notes to a bow, that grouping is the candidate’s choice, as the syllabus says. Separate bows, pizzicato, broken steps and a slurred octave are stipulated by the line.

The octave row for double-stopped minor scales is a single cell, “Harmonic and Melodic Minor”. The page asks for one of those two forms.

Single-note scales, chromatic scales and 7ths use a crotchet tempo. Arpeggios use a dotted-crotchet tempo. Double-stopped scales and double bass octave scales have their own crotchet tempi. The figures are the ones printed in the syllabus.

Bowing technical exercises are a separate part of the exam (the Technical Discipline, marked out of 10). The syllabus points to an exercise in the TDT library, or, for some double bass candidates, a bass-guitar improvisation. They are not a list of keys, so this page does not generate them.

## What each brass, woodwind and percussion list contains

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

- `index.html` — brass, woodwind and percussion
- `strings.html` — violin, viola, cello and double bass
- `styles.css` — how both pages look on a screen, on a phone and when printed
- `app.js` — choosing the exercises on the brass, woodwind and percussion page
- `strings-app.js` — choosing the exercises on the strings page
- `download-pdf.js` — saving either list as a PDF
- `Database-v5.js` — the brass, woodwind and percussion lists (left as they are)
- `Database-strings.js` — the string keys, octaves, tempi and bowings
