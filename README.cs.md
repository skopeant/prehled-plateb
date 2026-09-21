# Přehled plateb / Payments Report

> Aktuální verze: **v1.0.0**

Cloud App pro Alma vytvářející tisknutelné přehledy plateb a transakcí poplatků za libovolné historické období. Aplikace je pouze pro čtení a používá institucí nastavený report Alma Analytics v subject area **Fines and Fees**.

## Funkce

- libovolné historické období OD–DO,
- volitelné filtrování podle knihovny, která transakci provedla,
- obsluha, způsob platby, typ poplatku/transakce a stav,
- souhrny po knihovnách a celkový součet,
- export CSV,
- tisk z prohlížeče na výšku i na šířku,
- české a anglické rozhraní/výstup,
- řádky `Waive` jsou kurzívou a nezapočítávají se do součtu přijatých plateb.

## Požadavky

- Ex Libris Alma s Cloud Apps,
- Alma Analytics,
- přístup k nastavenému Analytics reportu,
- jednorázová konfigurace aplikace na úrovni instituce.

## Analytics report

V subject area **Fines and Fees** vytvořte report. Aplikace očekává kritéria Analytics API přesně v tomto pořadí:

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

Filtry:

- `Transaction Date > Transaction Date` — **Is Prompted / obsahuje výzvu**
- `Transaction Date > Transaction Date` — **is not null / není prázdné**
- `Executed by Unit > Unit Code` může být také **Is Prompted**; aktuální verze filtruje vybranou knihovnu po načtení dat.

Report uložte do Shared složky, například:

`/shared/Your Institution/CloudApp/prehled-plateb`

## Konfigurace

V menu Cloud App otevřete **Konfiguraci**, zadejte úplnou cestu k Analytics reportu a nastavení uložte. Konfigurace je společná pro celou instituci.

## Práce s daty

Aplikace čte výsledek Analytics a číselník knihoven z Alma Configuration API. V Almě žádná data nevytváří, neupravuje ani nemaže.

## Lokální vývoj

Příkaz `eca init` vytvoří lokální `config.json` s URL Alma prostředí. Soubor je v `.gitignore` a nesmí se commitovat.

## Licence

MIT License — Copyright (c) 2026 Antonín Skopec.
