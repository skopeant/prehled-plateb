# Changelog

## 1.1.1

- Security/dependency update only; no functional changes.
- Added npm override `piscina: 4.9.4` to replace vulnerable transitive `piscina` 4.6.1 from the Angular 18 build toolchain.
- Kept `tar: 7.5.22` override.
- Release remains restricted to Czech Technical University in Prague (`420CARDS_CVUT`).

## 1.1.0

- Added operator filtering using `Operator Full Name` and `Operator Primary Identifier` from the existing Analytics report.
- Operator list is built dynamically from transactions loaded for the selected date range and library.
- Selecting **All operators / Všichni** reliably clears the operator filter.
- Operator filtering affects preview, browser print, CSV export, subtotals, and totals.
- Print orientation can be changed after Analytics data are loaded.
- Moved print orientation, CSV export, and Print controls below the report filters and aligned them on one row.
- Added a defensive client-side date-range filter so transactions outside the selected inclusive range are excluded even if Analytics returns broader data.
- Kept optional waived transactions and CTU-only restriction (`420CARDS_CVUT`).

## 1.0.1

- Added **Show waived transactions / Zobrazovat prominutí** checkbox.
- Waived transactions are hidden by default.
- When enabled, waived transactions are included in preview, browser print, and CSV export.
- Payment subtotals and totals remain based on `Payment` transactions only.
- Restricted release to Czech Technical University in Prague (`420CARDS_CVUT`).

## 1.0.0

- First stable release prepared for Ex Libris App Center submission.
- Added institution-wide configuration for the Analytics report path.
- Removed the CTU institution restriction and hard-coded report path.
- Added Config and Help pages to the manifest.
- Cleaned test/debug logging and legacy REST-report texts.
- Retains verified Analytics parsing, Czech/English output, CSV export, portrait/landscape printing, localized library names, and italic Waive rows.

## 0.2.8

- Prefer library names loaded from Alma Configuration API over the English Analytics Unit Name, so print/preview/CSV use the same localized names as the library dropdown.
- Fixed the missing right table border in portrait printing by accounting for borders in table width.
- No changes to Analytics mapping, filters, totals, translations or Waive styling.

## 0.2.7

- Czech display translations for fee type, transaction type, payment method and status.
- Waive rows are italic in preview and print.
- Czech CSV uses the same translated values.

## 0.2.6

- Corrected the last two swapped Analytics API columns: Column2 is Unit Name and Column3 is Fine Fee Additional Transaction Id.
- This fixes library names in Cloud App/print group headings and restores the Additional Transaction ID column.
- No other working Analytics mapping, parser, filters, totals, CSV or print logic was changed.

## 0.2.5

- Fixed the Analytics Column1..Column15 mapping using the actual API order observed from the CTU report.
- Transaction Amount is now read from Column15, so row amounts are shown again.
- User ID, operator, date, transaction/reference IDs, payment method and status are mapped to the correct values.
- Transaction Note is preserved in CSV export.
- Library subtotals and overall totals count only actual `Payment` transactions; `Waive` rows remain visible but do not increase received-payment totals.
- Kept the proven Analytics XML parser from the Accession List app.

## 0.2.4

- Fixed parsing of Alma Analytics responses wrapped by CloudAppRestService, e.g. XML inside `entities`.
- Reused the robust Analytics XML extraction pattern already proven in the Accession List Cloud App.
- Added temporary console logging of parsed Analytics row count and first rows.

## 0.2.3

- Uses the exact Analytics Advanced XML date syntax verified in the institution.
- Date literals are sent as `xsd:date`.
- Comparisons use `greater`, `notNull`, and `less`.
- The selected date range remains inclusive by expanding the strict bounds by one day.

## 0.2.2

- Reworked the Analytics date range filter as a logical AND of `greaterOrEqual` and `lessOrEqual` comparisons.
- Uses the prompted field `"Transaction Date"."Transaction Date"`.
- Logs the generated Analytics XML filter to the browser console for testing.

## 0.2.1

- Fixed the Analytics prompted date field expression to `"Transaction Date"."Transaction Date"`.
- Added temporary raw Analytics response logging for testing.

## 0.2.0

- Switched primary data source to Alma Analytics Fines and Fees.
- Prompted Transaction Date range for arbitrary historical periods.
- Carry-forward for suppressed repeated Analytics values.
- Sorting by Unit Code, Transaction Date, reference and transaction ID.
- Non-transaction rows such as Transaction Id = -1 are ignored.
- CSV export and portrait / landscape printing retained.
