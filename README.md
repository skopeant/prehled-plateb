# Přehled plateb – Payments Report

> Current version: **v1.1.0**

Alma Cloud App for payment and fine/fee transaction reports from Alma Analytics.

## Availability

This version is restricted to **Czech Technical University in Prague** (`420CARDS_CVUT`).

## Features

- arbitrary historical date range
- library filtering
- operator filtering
- Czech and English output
- CSV export
- portrait/landscape browser printing
- library subtotals and overall payment total
- optional waived transactions
- read-only operation

## Operator filter

After loading Analytics data for the selected date range and library, the app builds a list of operators that actually occur in the loaded transactions.

The **Processed by** filter:
- defaults to **All operators**
- shows operators from the current loaded result only
- uses `Operator Primary Identifier` internally when available
- immediately filters preview, print, CSV export, subtotals, and totals
- works together with the optional waived-transactions filter

## Waived transactions

`Waive` transactions are **hidden by default**.

Enable **Show waived transactions** to include them in:
- preview
- browser print
- CSV export

Payment subtotals and totals remain based on `Payment` transactions only.

## Date filtering

The selected date range is applied to the Alma Analytics request and is additionally enforced client-side after parsing the returned data. This prevents transactions outside the selected inclusive range from appearing if Analytics returns a broader result set.

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
