# Přehled plateb – Payments Report

> Current version: **v1.0.1**

Alma Cloud App for payment and fine/fee transaction reports from Alma Analytics.

## Availability
This version is restricted to **Czech Technical University in Prague** (`420CARDS_CVUT`).

## Features
- historical date range
- library filtering
- Czech and English output
- CSV export
- portrait/landscape browser printing
- library subtotals and overall payment total
- optional waived transactions
- read-only operation

### Waived transactions
`Waive` transactions are **hidden by default**. Enable **Show waived transactions** to include them in preview, print, and CSV. Payment subtotals and totals are still based on `Payment` transactions only.

## Alma Analytics report
The app uses an institution-configured report in the **Fines and Fees** subject area.

Required criteria order:
1. Unit Code
2. Unit Name
3. Fine Fee Additional Transaction Id
4. Fine Fee Status
5. Fine Fee Transaction Id
6. Fine Fee Type
7. Fine Fee Transaction Type
8. Payment Method
9. Transaction Note
10. Transaction Reference Number
11. Operator Full Name
12. Operator Primary Identifier
13. Transaction Date
14. User Primary Identifier
15. Transaction Amount

Required filters:
- `Transaction Date` — **Is Prompted**
- `Transaction Date` — **is not null**

The Analytics report path is configured in the Cloud App configuration and must start with `/shared/`.

## Security
The app is read-only. It does not create, modify, or delete Alma records.

## Repository
https://github.com/skopeant/prehled-plateb

## License
MIT License

Copyright (c) 2026 Antonín Skopec
