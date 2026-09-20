# Competition Cards 参赛卡

A single-page tool for printing wushu competition cards (form divisions / 套路组) filled from a
spreadsheet. Load an `.xlsx` or `.csv` of competitors, get one card per row laid out for cutting,
and print.

No build step, no server, no dependencies to install. Open `index.html` locally or host the folder
on any static host.

## Using it

1. Open the page.
2. Load a spreadsheet, or paste rows copied straight out of Excel or Google Sheets.
3. Pick paper size (Letter or A4) and cards per page (4, 6, or 8).
4. Print at 100% scale with headers and footers off.

Competitor data stays in the browser. Nothing is uploaded anywhere.

### Spreadsheet columns

First row is the header row. Column order does not matter; extra columns are ignored.

| Column     | Also accepted                  | Fills                    |
| ---------- | ------------------------------ | ------------------------ |
| `Name`     | 姓名, Competitor               | Name 姓名                |
| `ID`       | ID#, 参赛号, Number, Bib       | ID# 参赛号               |
| `Age`      | 年龄                           | Age 年龄                 |
| `Gender`   | Sex, 性别                      | Gender 性别              |
| `Level`    | 级别                           | Level 级别               |
| `Event`    | 项目, Form                     | Event/项目               |
| `Category` | Type, Weapon, 类别             | The checkbox row         |

`Category` accepts `Open Hand`, `Short`, `Long`, `Other`, or 拳术 / 短器械 / 长器械 / 其他.
Alternatively, use separate `Open Hand`, `Short`, `Long`, and `Other` columns marked with `x`,
`yes`, or `1`.

`competitor-template.csv` is a starting point with the headers already in place. It is saved with a
UTF-8 BOM so Excel opens the Chinese characters correctly.

## Publishing with GitHub Pages

```bash
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, folder `/ (root)`. The site appears at `https://<user>.github.io/<repo>/` within a
minute or two.

With the `gh` CLI the whole thing is:

```bash
gh repo create <repo> --public --source=. --push
gh api -X POST repos/<user>/<repo>/pages -f 'source[branch]=main' -f 'source[path]=/'
```

## Files

```
index.html             markup for the controls and the card template
styles.css             screen chrome plus the print layout (@media print)
app.js                 spreadsheet parsing, column matching, card rendering
competitor-template.csv
```

## How it works

[SheetJS](https://sheetjs.com/) parses the workbook in the browser. Headers are normalized (case,
spaces, and punctuation stripped) and matched against the alias lists in `ALIASES` at the top of
`app.js` — add a column name there to support it.

Card sizing uses container query units (`cqw`) against the page element, so one set of dimensions
covers both the on-screen preview and the printed sheet. Paper size is set at print time by
rewriting the `@page` rule in the `page-rule` style element.

## Known gaps

- Only the form-divisions card exists. The sparring card, which adds Weight/体重, is not built yet.
- Long names and event titles are truncated with an ellipsis rather than shrunk to fit.
- Printing depends on the browser honoring `@page size`; Chrome and Edge are the safest bets.
