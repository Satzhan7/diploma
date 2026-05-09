# 09 — LaTeX Conversion Plan

This document specifies how to move the markdown documentation under `docs/diploma/` into the SDU 2025 LaTeX bachelor-thesis template. It identifies the document class, geometry, file-by-file mapping, figure conventions, BibTeX entries, and a compilation checklist.

## 1. Template overview

Path: `~/Desktop/SDU IS and CS Bachelor Thesis Template 2025 - Latex (Unzipped Files)/`

| File | Purpose |
|---|---|
| `main.tex` | Document entry point. Defines class, packages, and the `\input{}` order. |
| `titlepage1.tex` | Front cover. |
| `titlepage2.tex` | Approval / supervisor page. |
| `abstract_english.tex` | English abstract. |
| `abstract_kazakh.tex` | Kazakh abstract (Аңдатпа). |
| `abstract_russian.tex` | Russian abstract (Аннотация). |
| `introduction.tex` | Chapter 1 — Introduction. |
| `chapterA.tex` | Chapter 2 — Literature Review. |
| `chapterB.tex` | Chapter 3 — Design and Methodology. |
| `chapterC.tex` | Chapter 4 — Results and Discussion. |
| `conclusion.tex` | Conclusion. |
| `appendixA.tex`, `appendixB.tex` | Appendices. |
| `bibliography.bib` | BibTeX bibliography. |
| `figures/` | Figure assets. |
| `logo_sdu.png` | University logo. |

## 2. Required `main.tex` overrides for AdPartners.kz

The default template carries Information Systems / 6B070300. Replace those values:

```latex
\def\myauthor{Kadir Satzhan, Abenov Aslan}
\def\mycoach{Akhmetov Tolegen}
\def\mytitle{Web platform connecting brands with local influencers in Kazakhstan and the CIS region}
\def\mydegree{Bachelor in Computer Science}
\def\mydegreecode{6B06102}
```

Also update the strings used inside `titlepage1.tex` and `titlepage2.tex` (these are hard-coded in the template, not driven by the `\def`s above):

| Slot | New value |
|---|---|
| University | SDU University |
| Faculty | Faculty of Engineering and Natural Sciences |
| Title | Web platform connecting brands with local influencers in Kazakhstan and the CIS region |
| Course code | `6B06102 - "Computer Science"` |
| Students | Kadir Satzhan, Abenov Aslan |
| Dean | Ramis Akhmedov, Assistant Professor, Ph.D. |
| Supervisor | Akhmetov Tolegen |
| City, year | Kaskelen, 2025 |

## 3. Document class and geometry (already correct in the template)

```latex
\documentclass[a4paper,14pt]{extreport}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian,english]{babel}
\usepackage[left=30mm, right=10mm, top=20mm, bottom=20mm]{geometry}
\usepackage{graphicx}
\graphicspath{{figures/}}
\usepackage{hyperref}
\usepackage[style=numeric]{biblatex}
\addbibresource{bibliography.bib}
```

These settings are correct for the SDU 2025 specification. Do not change them.

## 4. Markdown → LaTeX file mapping

| Markdown source | LaTeX file / section | Notes |
|---|---|---|
| `00_PROJECT_CONTEXT.md` §1 | `titlepage1.tex`, `titlepage2.tex` | Overwrite the placeholder values listed in §2 of this document. |
| `00_PROJECT_CONTEXT.md` §2 (summary) and PDF page 3 (English abstract) | `abstract_english.tex` | Replace `\blindtext` with the polished abstract. |
| Existing PDF page 4 | `abstract_kazakh.tex` | Paste the Kazakh abstract. |
| Existing PDF page 5 | `abstract_russian.tex` | Paste the Russian abstract. |
| `08_FINAL_THESIS_STRUCTURE.md` §2; existing PDF Chapter 1 | `introduction.tex` | Sections 1.1 Problem Background, 1.2 Aims and Objectives, 1.3 Team Roles, 1.4 Thesis Outline. |
| `08_FINAL_THESIS_STRUCTURE.md` §3; existing PDF Chapter 2 | `chapterA.tex` | Sections 2.1–2.6 as described. |
| `08_FINAL_THESIS_STRUCTURE.md` §4; existing PDF Chapter 3; `04_TECHNICAL_DOCUMENTATION.md`; `05_DATABASE_DOCUMENTATION.md`; `06_API_DOCUMENTATION.md`; `03_FUNCTION_BY_FUNCTION_DOCUMENTATION.md` | `chapterB.tex` | Sections 3.1 Development Methodology, 3.2 Product Requirements, 3.3 User Roles, 3.4 User Flow, 3.5 UI/UX Design, 3.6 System Architecture, 3.7 Database Design, 3.8 Security and Authentication, 3.9 Implementation (with sub-sub-sections per module). |
| `08_FINAL_THESIS_STRUCTURE.md` §5; `07_TESTING_DOCUMENTATION.md`; `02_PRODUCT_REQUIREMENTS_DOCUMENT.md` §13–§14 | `chapterC.tex` | Sections 4.1 Testing Methodology, 4.2 Functional Test Cases, 4.3 Results, 4.4 Discussion, 4.5 Limitations. |
| `08_FINAL_THESIS_STRUCTURE.md` §6 | `conclusion.tex` | One- to two-page conclusion. |
| `08_FINAL_THESIS_STRUCTURE.md` §7 | (place inline before References) | Acronyms list. Insert as a `\chapter*{Acronyms}` between the Conclusion and References. |
| Existing PDF Appendix A; `07_TESTING_DOCUMENTATION.md` §3 | `appendixA.tex` | UML, sitemap, full test cases. |
| Existing PDF Appendix B; `04_TECHNICAL_DOCUMENTATION.md` §12 | `appendixB.tex` | Project structure and key components. |

## 5. Figure naming convention

Place every figure under `figures/`. Use the snake_case naming below; reference them with `\ref{fig:<label>}`.

| Label | Source | Description |
|---|---|---|
| `fig:role_access_map` | `04_TECHNICAL_DOCUMENTATION.md §5` | Role-based access map. |
| `fig:brand_flow` | `02_PRODUCT_REQUIREMENTS_DOCUMENT.md §8.1` | Brand publishes a campaign and selects an influencer. |
| `fig:influencer_flow` | `02_PRODUCT_REQUIREMENTS_DOCUMENT.md §8.2` | Influencer discovers brands and applies. |
| `fig:system_architecture` | `04_TECHNICAL_DOCUMENTATION.md §1` | Three-tier architecture. |
| `fig:er_diagram` | `04_TECHNICAL_DOCUMENTATION.md §6` | Database ER diagram. |
| `fig:auth_sequence` | `04_TECHNICAL_DOCUMENTATION.md §4` | Authentication sequence diagram. |
| `fig:order_state` | `04_TECHNICAL_DOCUMENTATION.md §7` | Order lifecycle state machine. |
| `fig:application_state` | `04_TECHNICAL_DOCUMENTATION.md §8` | Application state machine. |
| `fig:match_state` | `04_TECHNICAL_DOCUMENTATION.md §9` | Match lifecycle state machine. |
| `fig:messaging_sequence` | `04_TECHNICAL_DOCUMENTATION.md §10` | Real-time messaging sequence. |
| `fig:deployment_topology` | `04_TECHNICAL_DOCUMENTATION.md §14` | Compose deployment topology. |
| `fig:brand_dashboard` | Screenshot | Brand dashboard. |
| `fig:influencer_dashboard` | Screenshot | Influencer dashboard. |
| `fig:match_list` | Screenshot | Match listing page. |
| `fig:chat_window` | Screenshot | Real-time chat window. |
| `fig:create_order_form` | Screenshot | Brand's CreateOrder form. |
| `fig:profile_view` | Screenshot | Profile page. |
| `fig:landing_page` | Screenshot | Public landing page. |
| `fig:competitor_matrix` | Existing PDF Figure 2.1 | Competitor analysis. |
| `fig:ui_kit` | Existing PDF Figure 3.x | UI kit / design system snapshot. |
| `fig:lo_fi_prototype_1..N` | Existing PDF | Low-fidelity prototypes. |
| `fig:hi_fi_prototype_1..N` | Existing PDF | High-fidelity prototypes. |

To convert Mermaid diagrams to PNG:

```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i diagram.mmd -o figures/system_architecture.png -t neutral -b transparent
```

## 6. Table conventions

Use `\begin{table}[h] ... \end{table}` with `\caption` above the tabular and `\label{tab:<label>}` immediately after the caption. Suggested labels:

| Label | Source |
|---|---|
| `tab:competitive_analysis` | `08_FINAL_THESIS_STRUCTURE.md §3.3` |
| `tab:functional_requirements` | Subset of `02_PRODUCT_REQUIREMENTS_DOCUMENT.md §9` |
| `tab:nonfunctional_requirements` | `02_PRODUCT_REQUIREMENTS_DOCUMENT.md §10` |
| `tab:entity_field_users` ... `tab:entity_field_message` | `05_DATABASE_DOCUMENTATION.md §Field reference` |
| `tab:api_auth` ... `tab:api_statistics` | `06_API_DOCUMENTATION.md` per module |
| `tab:test_cases_selected` | Subset of `07_TESTING_DOCUMENTATION.md §3` |
| `tab:acronyms` | `08_FINAL_THESIS_STRUCTURE.md §7` |

For wide tables, prefer `\begin{table}[h] \resizebox{\linewidth}{!}{ ... } \end{table}` to avoid overflow.

## 7. Citation style

The template enables `\usepackage[style=numeric]{biblatex}`. Use numeric in-text citations: `\cite{deveirman2017}`. Add the following BibTeX entries to `bibliography.bib`:

```bibtex
@article{deveirman2017,
  author  = {De Veirman, Marijke and Cauberghe, Veroline and Hudders, Liselot},
  title   = {Marketing through Instagram influencers: the impact of number of followers and product divergence on brand attitude},
  journal = {International Journal of Advertising},
  volume  = {36},
  number  = {5},
  pages   = {798--828},
  year    = {2017}
}

@book{brownhayes2008,
  author    = {Brown, Duncan and Hayes, Nick},
  title     = {Influencer Marketing},
  publisher = {Routledge},
  year      = {2008}
}

@misc{influencermarketinghub2023,
  author       = {{Influencer Marketing Hub}},
  title        = {The State of Influencer Marketing 2023: Benchmark Report},
  year         = {2023},
  howpublished = {\url{https://influencermarketinghub.com}}
}

@article{yessimovatulegenov2021,
  author  = {Yessimova, A. and Tulegenov, S.},
  title   = {Digital marketing trends in Central Asia},
  year    = {2021}
}

@article{abdikarimova2020,
  author  = {Abdikarimova, A.},
  title   = {Influencer marketing practices in Kazakhstan},
  year    = {2020}
}

@misc{kantar2022,
  author = {{Kantar}},
  title  = {Media Reactions: Influencer Marketing Trends},
  year   = {2022}
}

@misc{nestjs,
  author = {{NestJS}},
  title  = {NestJS - A progressive Node.js framework},
  year   = {2024},
  howpublished = {\url{https://nestjs.com}}
}

@misc{react,
  author = {{Meta Platforms}},
  title  = {React - A JavaScript library for building user interfaces},
  year   = {2024},
  howpublished = {\url{https://react.dev}}
}

@misc{postgresql,
  author = {{PostgreSQL Global Development Group}},
  title  = {PostgreSQL: The world's most advanced open source database},
  year   = {2024},
  howpublished = {\url{https://www.postgresql.org}}
}

@misc{rfc7519,
  author = {Jones, M. and Bradley, J. and Sakimura, N.},
  title  = {JSON Web Token (JWT)},
  year   = {2015},
  howpublished = {\url{https://datatracker.ietf.org/doc/html/rfc7519}},
  note   = {RFC 7519}
}

@misc{socketio,
  author = {{Socket.IO}},
  title  = {Socket.IO: Bidirectional and low-latency communication for every platform},
  year   = {2024},
  howpublished = {\url{https://socket.io}}
}

@misc{typeorm,
  author = {{TypeORM Contributors}},
  title  = {TypeORM - Object Relational Mapper},
  year   = {2024},
  howpublished = {\url{https://typeorm.io}}
}
```

## 8. Required chapters / sections checklist

| Required artefact | Source | LaTeX target |
|---|---|---|
| English abstract | Existing PDF page 3 | `abstract_english.tex` |
| Аңдатпа | Existing PDF page 4 | `abstract_kazakh.tex` |
| Аннотация | Existing PDF page 5 | `abstract_russian.tex` |
| Chapter 1 — Introduction | `08_FINAL_THESIS_STRUCTURE.md §2` | `introduction.tex` |
| Chapter 2 — Literature Review | `08_FINAL_THESIS_STRUCTURE.md §3` | `chapterA.tex` |
| Chapter 3 — Design and Methodology (incl. Implementation) | `08_FINAL_THESIS_STRUCTURE.md §4` | `chapterB.tex` |
| Chapter 4 — Results and Discussion | `08_FINAL_THESIS_STRUCTURE.md §5` | `chapterC.tex` |
| Conclusion | `08_FINAL_THESIS_STRUCTURE.md §6` | `conclusion.tex` |
| Acronyms | `08_FINAL_THESIS_STRUCTURE.md §7` | Insert before References |
| References | Section 7 of this document + new entries | biblatex |
| Appendix A — Source code, surveys, large diagrams | `08_FINAL_THESIS_STRUCTURE.md §9` | `appendixA.tex` |
| Appendix B — Project structure and key components | `08_FINAL_THESIS_STRUCTURE.md §10` | `appendixB.tex` |

## 9. Required figures and tables

Already enumerated in §5 and §6 of this document.

## 10. Required appendices

- `appendixA.tex`: UML diagram, sitemap, full functional test cases (from `07_TESTING_DOCUMENTATION.md §3`), execution plan, low-fidelity design.
- `appendixB.tex`: repository tree, models, services, controllers (from `04_TECHNICAL_DOCUMENTATION.md §12` and `06_API_DOCUMENTATION.md`).

## 11. LaTeX compilation checklist

| Step | Command | Notes |
|---|---|---|
| 1 | `pdflatex main` | First pass, generates `.aux`. |
| 2 | `biber main` | Resolves bibliography. |
| 3 | `pdflatex main` | Second pass, fills citations. |
| 4 | `pdflatex main` | Third pass, finalises ToC and references. |
| 5 | Open `main.pdf` and inspect: title page, abstracts, ToC, every chapter heading, all figures rendered, all citations resolved. | |

If a TeXLive distribution with `latexmk` is installed:

```bash
latexmk -pdf -bibtex main.tex
```

## 12. Final PDF checklist

| Item | Pass condition |
|---|---|
| Page count | At least 50 pages (matching SDU bachelor-thesis convention). |
| Margins | 30 mm left, 10 mm right, 20 mm top/bottom. |
| Font size | 14 pt body. |
| Cyrillic | Kazakh and Russian abstracts render correctly. |
| Figures | Every figure has a caption and a `\label`; references via `\ref{fig:...}` resolve. |
| Tables | Every table has a caption above and a `\label`; references via `\ref{tab:...}` resolve. |
| Citations | Numeric, all citations appear in the bibliography. |
| Hyperlinks | `\hyperref` table of contents and reference cross-links work in the PDF. |
| Title page | Reflects AdPartners.kz, course code 6B06102, supervisor Akhmetov Tolegen, students Kadir Satzhan and Abenov Aslan, year 2025. |
| Approval page | Includes Dean Ramis Akhmedov and the supervisor, with signature lines. |
| Abstracts | All three are present and accurate. |
| Open team-input items from [01 §6](./01_DIPLOMA_MASTER_PLAN.md) | All resolved before the final PDF goes to print. |
