# Guide: running and updating the website

Everything is still plain Jekyll on GitHub Pages: free, no server, no database.
You edit text files, push, and the site updates about a minute later.

## 1. Installing this update

1. Copy the content of this zip over your local repository (say "yes" to replace files).
2. Delete the files listed in `DELETE-THESE-FILES.txt`.
3. Commit and push:

```bash
git add -A
git commit -m "New design, course data, quizzes, resources page"
git push
```

To preview on your laptop before pushing:

```bash
bundle install          # once
bundle exec jekyll serve
# then open http://localhost:4000
```

Tip: every file can also be edited directly on github.com (open the file, click the pencil icon, then "Commit changes"). PDFs can be uploaded with "Add file → Upload files". You don't need your laptop for small updates.

---

## 2. Adding a document to a course

Each course is one file in `_teaching/<course>/index.md`. All documents are listed at the top, between the `---` lines. Paths are relative to the course's `folder`.

```yaml
folder: /assets/resources/proba/

sequences:
  - title: "Probabilités conditionnelles"
    slides: parts/slides_proba3.pdf          # "Cours" button
    td: TD/TD02_PROBA_ENSAT_2025.pdf         # "TD" button
    correction: TD/correction-td02.pdf       # "Corrigé" button
    quiz: probabilites-premiers-pas          # name of a quiz file (without .html)
    note: "Chapitre 3 du polycopié."         # optional one-line note
    extra:                                   # optional, any other files or links
      - { label: "Vidéo", file: "https://vimeo.com/721553133", kind: video }
      - { label: "Feuille Python", file: TD/td2.ipynb }
```

So to publish a new TD: upload the PDF into the right folder, then add one line `td: TD/the-file.pdf` under the sequence. Every field is optional. Leave out what doesn't exist yet, and no button appears.

Past exams go under `archives`, one block per year:

```yaml
archives:
  - year: "2026"
    files:
      - { label: "Examen", file: exams/EXAM_2026.pdf }
      - { label: "Rattrapage", file: exams/RATT_2026.pdf }
      - { label: "TD 1 corrigé", file: TD/old_td/TD01_corrige.pdf }
```

The colour of each button comes from its label: anything with "Examen" or "Rattrapage" is red, anything with "corrigé" is green.

The course book (with its cover in the sidebar):

```yaml
notes:
  file: proba.pdf
  cover: cover-thumb.jpg     # a small JPG (≈ 360 px wide) loads fast
```

Everything you add here also appears automatically on the **Resources** page. You never list a file twice.

### Large files

GitHub refuses files over 100 MB, and the whole repository should stay under about 1 GB. For a big book or video, upload it to Google Drive (or as a "Release" on GitHub) and put the full link instead of a path:

```yaml
notes:
  file: https://drive.google.com/file/d/XXXX/view
```

## 3. Adding a new course

Copy an existing folder in `_teaching/`, rename it, and edit the top of `index.md`:

```yaml
---
title: "Algèbre 2"
code: algebre2                  # short id, letters only; quizzes use it
order: 5                        # position on the shelf
permalink: /teaching/algebra-2/
summary: "Espaces vectoriels, applications linéaires, matrices."
level: "SMP / SMIA"
folder: /assets/resources/algebra2/
sequences:
  - title: "Espaces vectoriels"
    slides: parts/ev.pdf
---
```

Without a `notes.cover`, the course gets a blue notebook cover with its title.

A course with several parts can use `modules:` instead of `sequences:` (see `_teaching/stochastic_finance/index.md`).

Any text written below the second `---` appears at the bottom of the course page (warnings, instructions, etc.).

---

## 4. Writing a quiz

A quiz is one file in `_quizzes/`, for example `_quizzes/polynomes.html`. The file name becomes the address: `/quiz/polynomes/`.

```text
---
title: "Polynômes : racines et degré"
course: algebre1
description: "Une ligne qui dit de quoi parle le quiz."
---
An optional introduction paragraph, shown above the first question.

? Text of question 1, with math like $x^2-5x+6$.
+ a correct choice
- a wrong choice
> The explanation shown after answering.
```

No YAML quoting, no escaping. Write LaTeX exactly as you would in a `.tex` file.

### The markers

Each line starts with one character followed by a space:

| Marker | Meaning |
|---|---|
| `?` | Starts a new question |
| `+` | A correct choice |
| `-` | A wrong choice |
| `=` | The expected math answer (the student types it) |
| `~` | The expected word(s), alternatives separated by `\|` |
| `!` | A hint (an "Indice" button appears) |
| `>` | Explanation, shown once the question is answered |
| `%` | A comment: never shown to students |

A line without a marker continues the line above (for a long question or a long explanation). Blank lines are fine.

### Question types, with examples

**One correct choice**

```text
? Quel est le degré de $(x^2+1)(x^3-x)$ ?
- 3
+ 5
- 6
```

**Several correct choices** (just put several `+`; the student sees "Plusieurs réponses possibles")

```text
? Quelles valeurs sont racines de $x^2-5x+6$ ?
+ $2$
+ $3$
- $-2$
- $6$
```

**Vrai / Faux**

```text
? Tout polynôme de degré 3 à coefficients réels a au moins une racine réelle.
+ Vrai
- Faux
```

**A number.** The student can type `1/4`, `0,25`, `0.25`, `25%`, `sqrt(2)/2`, `5!`, `e^2`, `pi/4`…

```text
? Calculez $P(X=2)$ pour $X\sim\mathcal{B}(4, 1/2)$.
= 6/16
```

By default an answer within 0.5 % is accepted (so `0,167` is accepted for `1/6`). To set your own margin, use `±`:

```text
= 1/6 ± 0.01
= 3 ± 0
```

**A formula.** Use any letters as variables; the answer is checked mathematically, so equivalent forms are accepted (`(x^2+2x)e^x` = `2xe^x + x^2e^x`).

```text
? Dérivée de $f(x)=x\ln x$ ?
= ln(x) + 1
```

Functions of several variables work the same way (`= 2xy`).

For a primitive, end with `+ C`: any constant is then accepted, with or without `+C` from the student.

```text
? Une primitive de $\cos x$ ?
= sin(x) + C
```

**A word**

```text
? Comment s'appelle la loi du nombre de succès dans $n$ épreuves de Bernoulli ?
~ binomiale | loi binomiale
```

Capitals, accents and articles ("la", "le", "l'") are ignored.

### What students can type in math answers

`+ - * / ^`, parentheses, `sqrt()`, `exp()` or `e^`, `ln()`, `sin cos tan`, `arctan`, `abs()`, `pi` or `π`, `!` (factorial), `%`.
Multiplication signs are optional: `2x`, `3(x+1)`, `x e^x` all work. Under the box, a live preview shows how the answer was understood, so students catch typos like a missing parenthesis themselves.

### Options (in the header)

```yaml
shuffle_questions: true   # different order each time
shuffle_choices: true     # shuffle the choices (Vrai/Faux is never shuffled)
```

### Linking a quiz to a course

- `course: proba` in the quiz header lists it on the course page and the Quizzes page.
- `quiz: polynomes` in a sequence adds a "Quiz" button right next to that lesson.

### Good to know

- The grade is out of 20 and counts only **first attempts**. Students can retry or reveal the correction, but that doesn't change the grade.
- The best grade is saved in the student's browser, on their own device. Nothing is sent anywhere, and you don't receive results. (If one day you want results, the feedback form service, Formspree, could be added.)
- Keep choices short: long formulas inside a choice need sideways scrolling on a phone.
- Avoid writing two braces in a row, `{{`, in a quiz (Jekyll reads it as a command). Write `{ {` instead.
- If an `=` answer can't be read, the quiz shows an error in red on that question, so you'll see it when you preview.

---

## 5. Other things you may update

| What | Where |
|---|---|
| Name, title, bio, photo, social links | `_config.yml` (`author:`) |
| Top menu | `_data/navigation.yml` |
| A news item | a new file in `_posts/`, named `2026-03-15-short-title.md` (copy an existing one) |
| A publication | a new file in `_research/` (copy an existing one: title, year, authors, journal, details, doi, then the abstract) |
| A video | `_data/videos.yml` (the Vimeo number and thumbnail) |
| A book or external link on the Resources page | `_data/library.yml` |
| A student message on the home page | `_data/testimonials.yml`, add `featured: true` |
| The CV | `_pages/cv.md` |
| Colours and fonts | top of `assets/css/main.scss` |

Your name in author lists (`H El Mahjour`) is bolded automatically.

## 6. Optional clean-up

The old animated headers in `assets/header/` (about 60 MB) and the original photos `assets/images/bio-photo*.jpg` are no longer used. Deleting them makes the repository lighter; nothing on the site depends on them.
