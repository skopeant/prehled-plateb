# Payments Report / Přehled plateb

> Current version: **v1.0.0**

Alma Cloud App for printable payment and fine/fee transaction reports over arbitrary historical date ranges. The app is read-only and uses an institution-configured Alma Analytics report in the **Fines and Fees** subject area.

## Features

- arbitrary historical date range,
- optional filtering by executed library,
- operator, payment method, fee/transaction type and status,
- library subtotals and overall total,
- CSV export,
- browser printing in portrait or landscape,
- Czech and English UI/output,
- `Waive` rows shown in italics and excluded from received-payment totals.

## Requirements

- Ex Libris Alma with Cloud Apps,
- Alma Analytics,
- access to the configured Analytics report,
- institution-wide Cloud App configuration.

## Analytics report

Create a report in the **Fines and Fees** subject area. The application expects the Analytics API criteria in this exact order:

1. Executed by Unit > Unit Code
2. Executed by Unit > Unit Name
3. Fines and Fees Transactions > Fine Fee Additional Transaction Id
4. Fines and Fees Transactions > Fine Fee Status
5. Fines and Fees Transactions > Fine Fee Transaction Id
6. Fines and Fees Transactions > Fine Fee Type
7. Fines and Fees Transactions > Fine Fee Transaction Type
8. Fines and Fees Transactions > Payment Method
9. Fines and Fees Transactions > Transaction Note
10. Fines and Fees Transactions > Transaction Reference Number
11. Staff Operator Details > Operator Full Name
12. Staff Operator Details > Operator Primary Identifier
13. Transaction Date > Transaction Date
14. User Details > User Primary Identifier
15. Fines and Fees Transactions > Transaction Amount

Filters:

- `Transaction Date > Transaction Date` — **Is Prompted**
- `Transaction Date > Transaction Date` — **is not null**
- `Executed by Unit > Unit Code` may also be **Is Prompted**; the current app performs library filtering after retrieval.

Store the report in a Shared folder, for example:

`/shared/Your Institution/CloudApp/prehled-plateb`

## Configuration

Open **Configuration** from the Cloud App menu, enter the full Analytics report path and save. The setting is shared by the institution.

## Data handling

The application reads Analytics results and the Alma Configuration API library list. It does not create, update, or delete Alma records.

## Local development

Run `eca init` to create a local `config.json` containing the Alma environment URL. `config.json` is ignored by Git and must not be committed.

## License

MIT License — Copyright (c) 2026 Antonín Skopec.
