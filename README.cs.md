# Přehled plateb – Payments Report

> Aktuální verze: **v1.0.1**

Alma Cloud App pro přehledy plateb a transakcí poplatků z Alma Analytics.

## Dostupnost
Tato verze je určena pouze pro **České vysoké učení technické v Praze** (`420CARDS_CVUT`).

## Funkce
- historický rozsah dat
- filtrování podle knihovny
- český a anglický výstup
- export CSV
- tisk na výšku / na šířku
- mezisoučty za knihovny a celkový součet plateb
- volitelné zobrazení prominutí
- pouze čtení

### Prominutí
Transakce `Waive / Prominutí` jsou ve výchozím stavu **skryté**. Po zaškrtnutí **Zobrazovat prominutí** se zahrnou do náhledu, tisku a CSV. Mezisoučty a celkový součet se nadále počítají pouze z `Payment / Platba`.

## Alma Analytics report
Aplikace používá institucí nastavený report v subject area **Fines and Fees**.

Požadované pořadí kritérií:
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

Požadované filtry:
- `Transaction Date` — **Is Prompted**
- `Transaction Date` — **is not null**

Cesta k Analytics reportu se nastavuje v konfiguraci Cloud App a musí začínat `/shared/`.

## Bezpečnost
Aplikace je pouze pro čtení. V Almě nevytváří, neupravuje ani nemaže žádné záznamy.

## Repozitář
https://github.com/skopeant/prehled-plateb

## Licence
MIT License

Copyright (c) 2026 Antonín Skopec
