---
title: "Probabilités et Statistiques"
code: proba                      # short id, used to attach quizzes to this course
order: 1                         # position in the course list
permalink: /teaching/probability/
summary: "Événements, dénombrement, probabilités conditionnelles, variance et covariance, loi normale."
level: "Cycle ingénieur, 2e année"
folder: /assets/resources/proba/ # every path below is relative to this folder

notes:                           # the course book (shown with its cover)
  file: proba.pdf
  cover: cover-thumb.jpg

sequences:
  - title: "Introduction aux probabilités"
    slides: parts/slides_proba1.pdf
    td: TD/TD01_PROBA_ENSAT_2025.pdf
    correction: TD/corrige-td-proba01_2025.pdf
    quiz: probabilites-premiers-pas
  - title: "Dénombrement"
    slides: parts/slides_proba2.pdf
  - title: "Probabilités conditionnelles"
    slides: parts/slides_proba3.pdf
    td: TD/TD02_PROBA_ENSAT_2025.pdf
    correction: TD/correction-td02-proba-part1.pdf
  - title: "Écart-type, variance et covariance"
    slides: parts/variance_covariance.pdf
  - title: "Loi normale et convergences"
    slides: parts/loi_normale_convergence.pdf

archives:
  - year: "2025"
    files:
      - { label: "Examen", file: exams/EXAM_2025_PROBA_ENSAT_AP2.pdf }
---
