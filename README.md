# Competition Cards 参赛卡

A single-page tool for printing wushu competition cards filled from a spreadsheet. Load an `.xlsx`
or `.csv` of competitors, get one card per row laid out for cutting, and print. Both cards are
supported:

- **Form divisions 套路组** — Event across the card, then the Open Hand / Weapon checkboxes.
- **Combat divisions 对抗组** — Event shares its row with Weight 体重, and there are no checkboxes.

A single sheet can hold both; each row prints on the card its `Division` column names.

No build step, no server, no dependencies to install. Open `index.html` locally or host the folder
on any static host.

## Using it

1. Open the page.
2. Load a spreadsheet, or paste rows copied straight out of Excel or Google Sheets.
3. Leave **Card type** on *From spreadsheet* for a mixed sheet, or pin the whole run to
   *Form Divisions* or *Combat Divisions*.
4. Pick paper size (Letter or A4) and cards per page (4, 6, or 8).
5. Print at 100% scale with headers and footers off.

Competitor data stays in the browser. Nothing is uploaded anywhere.

### Spreadsheet columns

First row is the header row. Column order does not matter; extra columns are ignored.

| Column     | Also accepted                  | Fills                              |
| ---------- | ------------------------------ | ---------------------------------- |
| `Division` | Card, Card Type, Group, 组别     | Which card the row prints on       |
| `Name`     | 姓名, Competitor               | Name 姓名                          |
| `ID`       | ID#, 参赛号, Number, Bib       | ID# 参赛号                         |
| `Age`      | 年龄                           | Age 年龄                           |
| `Gender`   | Sex, 性别                      | Gender 性别                        |
| `Level`    | 级别                           | Level 级别                         |
| `Event`    | 项目, Form                     | Event 项目                         |
| `Category` | Type, Weapon, 类别             | The checkbox row — form card only  |
| `Weight`   | 体重, Weight Class             | Weight 体重 — combat card only     |

`Division` accepts `Form` (套路, Taolu, Routine) or `Combat` (对抗, Sparring, Sanda 散打,
Push Hands 推手). With no `Division` column, a row carrying a weight gets the combat card and
everything else gets the form card; the **Card type** control overrides this for the whole sheet.

`Category` accepts `Open Hand`, `Short`, `Long`, `Other`, or 拳术 / 短器械 / 长器械 / 其他.
Alternatively, use separate `Open Hand`, `Short`, `Long`, and `Other` columns marked with `x`,
`yes`, or `1`.

`competitor-template.csv` is a starting point with the headers already in place and a row of each
kind. It is saved with a UTF-8 BOM so Excel opens the Chinese characters correctly.

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

The two cards share a header and their Name/ID and Age/Gender/Level rows; only the last row
differs, so `cardHTML` in `app.js` swaps in `formRows` or `combatRows` for it. A third card would
be another such function plus an option in the `cardtype` select.

## Known gaps

- Long names and event titles are truncated with an ellipsis rather than shrunk to fit.
- Printing depends on the browser honoring `@page size`; Chrome and Edge are the safest bets.
