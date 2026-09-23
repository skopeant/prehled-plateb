import { Component, OnInit } from '@angular/core';
import { CloudAppConfigService, CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

interface AlmaLibrary {
  code: string;
  name: string;
}

interface PaymentRow {
  key: string;
  userId: string;
  unitCode: string;
  unitName: string;
  operatorName: string;
  operatorId: string;
  transactionDate: string;
  transactionId: string;
  additionalTransactionId: string;
  referenceNumber: string;
  feeType: string;
  transactionType: string;
  paymentMethod: string;
  status: string;
  transactionNote: string;
  amount: number;
  credit: number;
  debit: number;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  analyticsReportPath = '';
  configurationLoaded = false;
  configurationSaving = false;
  configurationMessage = '';
  configurationError = '';

  dateFrom = '';
  dateTo = '';
  libraries: AlmaLibrary[] = [];
  rows: PaymentRow[] = [];
  selectedLibraryCode = '';

  loadingLibraries = false;
  loading = false;
  creatingPrint = false;
  printOrientation: 'portrait' | 'landscape' = 'landscape';
  showWaived = false;

  progressMessage = '';
  resultMessage = '';
  errorMessage = '';

  constructor(
    private restService: CloudAppRestService,
    private configService: CloudAppConfigService,
    private translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateFrom = this.toDateInput(first);
    this.dateTo = this.toDateInput(now);
    await this.loadConfiguration();
    if (!this.configMode) {
      await this.loadLibraries();
    }
  }

  get configMode(): boolean {
    return window.location.hash.toLowerCase().includes('/config');
  }

  get isConfigured(): boolean {
    return this.analyticsReportPath.trim().startsWith('/shared/');
  }

  async loadConfiguration(): Promise<void> {
    try {
      const config: any = await firstValueFrom(this.configService.get());
      this.analyticsReportPath = String(config?.analyticsReportPath || '').trim();
    } catch (error) {
      console.error('Configuration load error:', error);
      this.configurationError = this.t('Config.LoadError');
    } finally {
      this.configurationLoaded = true;
    }
  }

  async saveConfiguration(): Promise<void> {
    this.configurationMessage = '';
    this.configurationError = '';

    const analyticsReportPath = this.analyticsReportPath.trim();
    if (!analyticsReportPath) {
      this.configurationError = this.t('Config.PathRequired');
      return;
    }
    if (!analyticsReportPath.startsWith('/shared/')) {
      this.configurationError = this.t('Config.PathShared');
      return;
    }

    this.configurationSaving = true;
    try {
      await firstValueFrom(this.configService.set({ analyticsReportPath }));
      this.analyticsReportPath = analyticsReportPath;
      this.configurationMessage = this.t('Config.Saved');
    } catch (error: any) {
      console.error('Configuration save error:', error);
      this.configurationError = error?.message || this.t('Config.SaveError');
    } finally {
      this.configurationSaving = false;
    }
  }

  goToMain(): void {
    window.location.hash = '#/';
  }

  async loadLibraries(): Promise<void> {
    this.loadingLibraries = true;
    this.errorMessage = '';

    try {
      const result: AlmaLibrary[] = [];
      let offset = 0;

      while (true) {
        const response: any = await firstValueFrom(
          this.restService.call(
            `/conf/libraries?limit=100&offset=${offset}&format=json`
          )
        );

        const list = this.arrayOf(
          response?.library ?? response?.libraries?.library
        );

        for (const row of list) {
          const code = this.value(row?.code);
          if (!code) continue;

          result.push({
            code,
            name: this.value(row?.name) || this.value(row?.desc) || code
          });
        }

        const total = Number(
          response?.total_record_count ??
          response?.libraries?.total_record_count ??
          result.length
        );

        if (list.length < 100 || result.length >= total) break;
        offset += list.length;
      }

      this.libraries = result.sort((a, b) =>
        a.name.localeCompare(b.name, this.currentLang(), {
          numeric: true,
          sensitivity: 'base'
        })
      );
    } catch (e) {
      console.error(e);
      this.errorMessage = this.t('Errors.Libraries');
    } finally {
      this.loadingLibraries = false;
    }
  }

  async loadReport(): Promise<void> {
    this.errorMessage = '';
    this.resultMessage = '';
    this.progressMessage = '';
    this.rows = [];

    if (!this.isValidDate(this.dateFrom) || !this.isValidDate(this.dateTo)) {
      this.errorMessage = this.t('Errors.Dates');
      return;
    }

    if (this.dateTo < this.dateFrom) {
      this.errorMessage = this.t('Errors.DateOrder');
      return;
    }

    if (!this.isConfigured) {
      this.errorMessage = this.t('Errors.NotConfigured');
      return;
    }

    this.loading = true;

    try {
      this.progressMessage = this.t('Main.ProgressAnalytics');

      const response = await this.loadAnalytics(
        this.dateFrom,
        this.dateTo
      );

      let rows = this.parseAnalyticsResponse(response);

      // First test version: Unit Code is filtered client-side.
      if (this.selectedLibraryCode) {
        rows = rows.filter(
          row => row.unitCode === this.selectedLibraryCode
        );
      }

      this.rows = rows.sort((a, b) => {
        const unit = a.unitCode.localeCompare(
          b.unitCode,
          undefined,
          { numeric: true, sensitivity: 'base' }
        );
        if (unit !== 0) return unit;

        const date = a.transactionDate.localeCompare(b.transactionDate);
        if (date !== 0) return date;

        const ref = a.referenceNumber.localeCompare(
          b.referenceNumber,
          undefined,
          { numeric: true, sensitivity: 'base' }
        );
        if (ref !== 0) return ref;

        return a.transactionId.localeCompare(
          b.transactionId,
          undefined,
          { numeric: true, sensitivity: 'base' }
        );
      });

      this.resultMessage = this.rows.length
        ? this.t('Main.Count', { count: this.rows.length })
        : this.t('Main.NoData');
    } catch (e: any) {
      console.error(e);
      this.errorMessage =
        e?.message || this.t('Errors.Analytics');
    } finally {
      this.progressMessage = '';
      this.loading = false;
    }
  }

  private async loadAnalytics(
    from: string,
    to: string
  ): Promise<any> {
    // Exact OBI syntax copied from the working Analytics Advanced XML:
    // xsd:date + greater/notNull/less on Transaction Date.
    //
    // The Analytics operators are strict (> and <), so make the UI range
    // inclusive by sending one day before/after the selected dates.
    const lower = this.shiftIsoDate(from, -1);
    const upper = this.shiftIsoDate(to, 1);
    const field = '"Transaction Date"."Transaction Date"';

    const filter =
      `<sawx:expr xsi:type="sawx:logical" op="and" ` +
      `xmlns:saw="com.siebel.analytics.web/report/v1.1" ` +
      `xmlns:sawx="com.siebel.analytics.web/expression/v1.1" ` +
      `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
      `xmlns:xsd="http://www.w3.org/2001/XMLSchema">` +

      `<sawx:expr xsi:type="sawx:comparison" op="greater">` +
      `<sawx:expr xsi:type="sawx:sqlExpression">${field}</sawx:expr>` +
      `<sawx:expr xsi:type="xsd:date">${this.escapeXml(lower)}</sawx:expr>` +
      `</sawx:expr>` +

      `<sawx:expr xsi:type="sawx:comparison" op="notNull">` +
      `<sawx:expr xsi:type="sawx:sqlExpression">${field}</sawx:expr>` +
      `</sawx:expr>` +

      `<sawx:expr xsi:type="sawx:comparison" op="less">` +
      `<sawx:expr xsi:type="sawx:sqlExpression">${field}</sawx:expr>` +
      `<sawx:expr xsi:type="xsd:date">${this.escapeXml(upper)}</sawx:expr>` +
      `</sawx:expr>` +

      `</sawx:expr>`;

    const url =
      '/almaws/v1/analytics/reports' +
      `?path=${encodeURIComponent(this.analyticsReportPath)}` +
      `&filter=${encodeURIComponent(filter)}` +
      '&limit=1000' +
      '&col_names=true';

    return await firstValueFrom(
      this.restService.call<any>({
        url,
        headers: {
          accept: 'application/xml'
        }
      } as any)
    );
  }

  private shiftIsoDate(value: string, days: number): string {
    const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return value;

    const date = new Date(
      Date.UTC(
        Number(parts[1]),
        Number(parts[2]) - 1,
        Number(parts[3])
      )
    );

    date.setUTCDate(date.getUTCDate() + days);

    return (
      `${date.getUTCFullYear()}-` +
      `${String(date.getUTCMonth() + 1).padStart(2, '0')}-` +
      `${String(date.getUTCDate()).padStart(2, '0')}`
    );
  }

  private parseAnalyticsResponse(response: any): PaymentRow[] {
    const rawRows = this.extractAnalyticsRows(response);
    const result: PaymentRow[] = [];

    let carry = {
      userId: '',
      unitCode: '',
      unitName: '',
      operatorName: '',
      operatorId: '',
      transactionDate: ''
    };

    for (const columns of rawRows) {
      // IMPORTANT:
      // Alma Analytics API returns Column1..Column15 in the report's internal
      // criteria order, not in the visual left-to-right order shown in Results.
      // The report must use this criteria order; see README / Help:
      //
      //  1 Unit Code
      //  2 Unit Name
      //  3 Fine Fee Additional Transaction Id
      //  4 Fine Fee Status
      //  5 Fine Fee Transaction Id
      //  6 Fine Fee Type
      //  7 Fine Fee Transaction Type
      //  8 Payment Method
      //  9 Transaction Note
      // 10 Transaction Reference Number
      // 11 Operator Full Name
      // 12 Operator Primary Identifier
      // 13 Transaction Date
      // 14 User Primary Identifier
      // 15 Transaction Amount
      const unitCode = this.text(columns[0]) || carry.unitCode;
      const unitName = this.text(columns[1]) || carry.unitName;
      const additionalTransactionId = this.text(columns[2]);
      const status = this.text(columns[3]);
      const transactionId = this.text(columns[4]);
      const feeType = this.text(columns[5]);
      const transactionType = this.text(columns[6]);
      const paymentMethod = this.text(columns[7]);
      const transactionNote = this.text(columns[8]);
      const referenceNumber = this.text(columns[9]);
      const operatorName =
        this.text(columns[10]) || carry.operatorName;
      const operatorId =
        this.text(columns[11]) || carry.operatorId;
      const transactionDate =
        this.normalizeAnalyticsDate(this.text(columns[12])) ||
        carry.transactionDate;
      const userId = this.text(columns[13]) || carry.userId;
      const amount = this.toNumber(columns[14]);

      carry = {
        userId,
        unitCode,
        unitName,
        operatorName,
        operatorId,
        transactionDate
      };

      if (
        !transactionDate ||
        transactionId === '-1' ||
        (!transactionId && !referenceNumber && amount === 0)
      ) {
        continue;
      }

      const credit = amount < 0 ? Math.abs(amount) : 0;
      const debit = amount >= 0 ? amount : 0;

      const key = [
        transactionId,
        additionalTransactionId,
        referenceNumber,
        userId,
        transactionDate,
        amount
      ].join('|');

      result.push({
        key,
        userId,
        unitCode,
        unitName:
          this.libraryName(unitCode) ||
          unitName ||
          unitCode,
        operatorName,
        operatorId,
        transactionDate,
        transactionId,
        additionalTransactionId,
        referenceNumber,
        feeType,
        transactionType,
        paymentMethod,
        status,
        transactionNote,
        amount,
        credit,
        debit
      });
    }

    const unique = new Map<string, PaymentRow>();
    for (const row of result) {
      unique.set(row.key, row);
    }
    return Array.from(unique.values());
  }

  private extractAnalyticsRows(response: any): string[][] {
    const doc = this.toXmlDocument(response);

    if (doc) {
      const rowNodes = Array.from(
        doc.getElementsByTagNameNS('*', 'Row')
      );

      if (rowNodes.length) {
        return rowNodes.map(row =>
          Array.from(
            { length: 15 },
            (_, i) =>
              this.getXmlChildText(
                row as Element,
                `Column${i + 1}`
              )
          )
        );
      }
    }

    const rows = this.findAnalyticsRows(response);

    return rows.map((row: any) =>
      Array.from(
        { length: 15 },
        (_, i) =>
          this.objectValue(
            this.getObjectProperty(
              row,
              `Column${i + 1}`
            )
          )
      )
    );
  }

  private toXmlDocument(value: any): XMLDocument | null {
    const candidate =
      value?.body ??
      value?.entity ??
      value?.entities ??
      value?.response ??
      value ??
      null;

    if (
      typeof Document !== 'undefined' &&
      candidate instanceof Document
    ) {
      return candidate as XMLDocument;
    }

    if (
      typeof Element !== 'undefined' &&
      candidate instanceof Element
    ) {
      const xml = new XMLSerializer().serializeToString(candidate);
      return this.parseXmlString(xml);
    }

    if (typeof candidate === 'string') {
      const parsed = this.parseXmlString(candidate);
      if (parsed) {
        return parsed;
      }
    }

    // CloudAppRestService may wrap Analytics XML, for example as
    // { entities: ["<QueryResult>...</QueryResult>"] }.
    // Search recursively for the first valid XML string/document.
    const seen = new Set<any>();

    const findXml = (node: any): XMLDocument | null => {
      if (node === null || node === undefined) {
        return null;
      }

      if (typeof node === 'string') {
        const text = node.trim();
        if (!text.startsWith('<')) {
          return null;
        }
        return this.parseXmlString(text);
      }

      if (
        typeof Document !== 'undefined' &&
        node instanceof Document
      ) {
        return node as XMLDocument;
      }

      if (
        typeof Element !== 'undefined' &&
        node instanceof Element
      ) {
        const xml = new XMLSerializer().serializeToString(node);
        return this.parseXmlString(xml);
      }

      if (typeof node !== 'object' || seen.has(node)) {
        return null;
      }

      seen.add(node);

      if (Array.isArray(node)) {
        for (const item of node) {
          const parsed = findXml(item);
          if (parsed) {
            return parsed;
          }
        }
        return null;
      }

      for (const key of Object.keys(node)) {
        const parsed = findXml(node[key]);
        if (parsed) {
          return parsed;
        }
      }

      return null;
    };

    return findXml(value);
  }

  private parseXmlString(xml: string): XMLDocument | null {
    const document = new DOMParser().parseFromString(
      xml,
      'application/xml'
    );

    if (document.querySelector('parsererror')) {
      return null;
    }

    return document;
  }

  private getXmlChildText(
    row: Element,
    localName: string
  ): string {
    const node =
      row.getElementsByTagNameNS('*', localName)[0];
    return node?.textContent?.trim() || '';
  }

  private findAnalyticsRows(value: any): any[] {
    const found: any[] = [];
    const seen = new Set<any>();

    const visit = (node: any): void => {
      if (
        !node ||
        typeof node !== 'object' ||
        seen.has(node)
      ) {
        return;
      }

      seen.add(node);

      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }

      for (const key of Object.keys(node)) {
        const child = node[key];
        const localKey =
          (key.includes(':') ? key.split(':').pop() : key)!
            .toLowerCase();

        if (localKey === 'row') {
          if (Array.isArray(child)) found.push(...child);
          else if (child) found.push(child);
        } else {
          visit(child);
        }
      }
    };

    visit(value);
    return found;
  }

  private getObjectProperty(
    value: any,
    wanted: string
  ): any {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        value,
        wanted
      )
    ) {
      return value[wanted];
    }

    for (const key of Object.keys(value)) {
      const localKey =
        (key.includes(':') ? key.split(':').pop() : key)!;

      if (
        localKey.toLowerCase() ===
        wanted.toLowerCase()
      ) {
        return value[key];
      }
    }

    return undefined;
  }

  private objectValue(value: any): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'object') {
      return String(
        value.value ??
        value._ ??
        value['#text'] ??
        value.text ??
        ''
      ).trim();
    }

    return String(value).trim();
  }

  get visibleRows(): PaymentRow[] {
    if (this.showWaived) {
      return this.rows;
    }

    return this.rows.filter(row => !this.isWaive(row));
  }

  get groupedRows(): Array<{
    unitCode: string;
    unitName: string;
    rows: PaymentRow[];
    credit: number;
    debit: number;
  }> {
    const groups = new Map<string, PaymentRow[]>();

    for (const row of this.visibleRows) {
      const key =
        row.unitCode ||
        row.unitName ||
        '—';

      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(
      ([unitCode, rows]) => ({
        unitCode,
        unitName:
          this.libraryName(unitCode) ||
          rows[0]?.unitName ||
          unitCode,
        rows,
        credit:
          rows
            .filter(row => row.transactionType === 'Payment')
            .reduce((sum, row) => sum + row.credit, 0),
        debit:
          rows
            .filter(row => row.transactionType === 'Payment')
            .reduce((sum, row) => sum + row.debit, 0)
      })
    );
  }

  get totalCredit(): number {
    return this.visibleRows
      .filter(row => row.transactionType === 'Payment')
      .reduce((sum, row) => sum + row.credit, 0);
  }

  get totalDebit(): number {
    return this.visibleRows
      .filter(row => row.transactionType === 'Payment')
      .reduce((sum, row) => sum + row.debit, 0);
  }

  get selectedLibraryName(): string {
    if (!this.selectedLibraryCode) {
      return this.t('Main.AllLibraries');
    }

    return (
      this.libraryName(this.selectedLibraryCode) ||
      this.selectedLibraryCode
    );
  }

  printReport(): void {
    if (!this.visibleRows.length || this.creatingPrint) return;

    this.creatingPrint = true;
    this.errorMessage = '';

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error(this.t('Errors.Popup'));
      }

      const body = this.groupedRows.map(group => `
        <tr class="group-row">
          <td colspan="13">${this.escapeHtml(group.unitName)} (${this.escapeHtml(group.unitCode)})</td>
        </tr>
        ${group.rows.map(row => this.printRow(row)).join('')}
        <tr class="subtotal-row">
          <td colspan="11">${this.escapeHtml(this.t('Main.Subtotal'))}</td>
          <td class="num">${this.escapeHtml(this.formatMoney(group.credit))}</td>
          <td class="num">${this.escapeHtml(this.formatMoney(group.debit))}</td>
        </tr>
      `).join('');

      printWindow.document.open();
      printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${this.escapeHtml(this.t('Main.Title'))}</title>
<style>
  @page { size: A4 ${this.printOrientation}; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${this.printOrientation === 'portrait' ? '7.2px' : '8.5px'};
  }
  .screen-only { text-align: right; margin-bottom: 8px; }
  .screen-only button { padding: 7px 14px; cursor: pointer; }
  table { width: calc(100% - 1px); border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  th, td {
    border: 1px solid #444;
    padding: 2px 3px;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .num { text-align: right; white-space: nowrap; }
  .group-row td,
  .subtotal-row td,
  .total-row td { font-weight: 700; }
  .group-row td { background: #eee; }
  .waive-row td { font-style: italic; }
  .total-row td { border-top: 2px solid #000; }
  @media print { .screen-only { display: none !important; } }
</style>
</head>
<body>
<div class="screen-only">
  <button id="print-button" type="button">${this.escapeHtml(this.t('Main.Print'))}</button>
</div>
<h2>${this.escapeHtml(this.t('Main.Title'))}</h2>
<div>${this.escapeHtml(this.t('Main.Period'))}: ${this.escapeHtml(this.formatDate(this.dateFrom))} – ${this.escapeHtml(this.formatDate(this.dateTo))}</div>
<div>${this.escapeHtml(this.t('Main.SelectedLibrary'))}: ${this.escapeHtml(this.selectedLibraryName)}</div>

<table>
<thead>
<tr>
  <th>${this.escapeHtml(this.t('Columns.User'))}</th>
  <th>${this.escapeHtml(this.t('Columns.Operator'))}</th>
  <th>${this.escapeHtml(this.t('Columns.Date'))}</th>
  <th>${this.escapeHtml(this.t('Columns.TransactionId'))}</th>
  <th>${this.escapeHtml(this.t('Columns.ReferenceNumber'))}</th>
  <th>${this.escapeHtml(this.t('Columns.FeeType'))}</th>
  <th>${this.escapeHtml(this.t('Columns.TransactionType'))}</th>
  <th>${this.escapeHtml(this.t('Columns.PaymentMethod'))}</th>
  <th>${this.escapeHtml(this.t('Columns.Status'))}</th>
  <th>${this.escapeHtml(this.t('Columns.OperatorId'))}</th>
  <th>${this.escapeHtml(this.t('Columns.AdditionalTransactionId'))}</th>
  <th>${this.escapeHtml(this.t('Columns.Credit'))}</th>
  <th>${this.escapeHtml(this.t('Columns.Debit'))}</th>
</tr>
</thead>
<tbody>
${body}
<tr class="total-row">
  <td colspan="11">${this.escapeHtml(this.t('Main.Total'))}</td>
  <td class="num">${this.escapeHtml(this.formatMoney(this.totalCredit))}</td>
  <td class="num">${this.escapeHtml(this.formatMoney(this.totalDebit))}</td>
</tr>
</tbody>
</table>
</body>
</html>`);

      printWindow.document.close();

      printWindow.document
        .getElementById('print-button')
        ?.addEventListener('click', () => {
          printWindow.focus();
          printWindow.print();
        });

      setTimeout(() => printWindow.focus(), 100);
      this.resultMessage = this.t('Main.PrintReady');
    } catch (e: any) {
      this.errorMessage =
        e?.message || this.t('Errors.Popup');
    } finally {
      this.creatingPrint = false;
    }
  }

  downloadCsv(): void {
    if (!this.visibleRows.length) return;

    const headers = [
      'User',
      'UnitCode',
      'UnitName',
      'Operator',
      'OperatorId',
      'Date',
      'TransactionId',
      'AdditionalTransactionId',
      'ReferenceNumber',
      'FeeType',
      'TransactionType',
      'PaymentMethod',
      'Status',
      'TransactionNote',
      'Credit',
      'Debit'
    ].map(key => this.t(`Columns.${key}`));

    const lines = [
      headers.map(value => this.csvCell(value)).join(';'),
      ...this.visibleRows.map(row => [
        row.userId,
        row.unitCode,
        row.unitName,
        row.operatorName,
        row.operatorId,
        this.formatDate(row.transactionDate),
        row.transactionId,
        row.additionalTransactionId,
        row.referenceNumber,
        this.displayFeeType(row.feeType),
        this.displayTransactionType(row.transactionType),
        this.displayPaymentMethod(row.paymentMethod),
        this.displayStatus(row.status),
        row.transactionNote,
        row.credit ? this.formatMoney(row.credit) : '',
        row.debit ? this.formatMoney(row.debit) : ''
      ].map(value => this.csvCell(value)).join(';'))
    ];

    const blob = new Blob(
      ['\uFEFF' + lines.join('\r\n')],
      { type: 'text/csv;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      `prehled-plateb-${this.dateFrom}-${this.dateTo}.csv`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.resultMessage = this.t('Main.CsvReady');
  }

  private printRow(row: PaymentRow): string {
    return `
<tr${this.isWaive(row) ? ' class="waive-row"' : ''}>
  <td>${this.escapeHtml(row.userId)}</td>
  <td>${this.escapeHtml(row.operatorName)}</td>
  <td>${this.escapeHtml(this.formatDate(row.transactionDate))}</td>
  <td>${this.escapeHtml(row.transactionId)}</td>
  <td>${this.escapeHtml(row.referenceNumber)}</td>
  <td>${this.escapeHtml(this.displayFeeType(row.feeType))}</td>
  <td>${this.escapeHtml(this.displayTransactionType(row.transactionType))}</td>
  <td>${this.escapeHtml(this.displayPaymentMethod(row.paymentMethod))}</td>
  <td>${this.escapeHtml(this.displayStatus(row.status))}</td>
  <td>${this.escapeHtml(row.operatorId)}</td>
  <td>${this.escapeHtml(row.additionalTransactionId)}</td>
  <td class="num">${row.credit ? this.escapeHtml(this.formatMoney(row.credit)) : ''}</td>
  <td class="num">${row.debit ? this.escapeHtml(this.formatMoney(row.debit)) : ''}</td>
</tr>`;
  }

  displayFeeType(value: string): string {
    if (this.currentLang() !== 'cs') return value;
    const map: Record<string, string> = {
      'Overdue Loan notification fine': 'Poplatek za upomínku'
    };
    return map[value] || value;
  }

  displayTransactionType(value: string): string {
    if (this.currentLang() !== 'cs') return value;
    const map: Record<string, string> = {
      'Payment': 'Platba',
      'Waive': 'Prominutí'
    };
    return map[value] || value;
  }

  displayPaymentMethod(value: string): string {
    if (this.currentLang() !== 'cs') return value;
    const map: Record<string, string> = {
      'Cash': 'Hotovost'
    };
    return map[value] || value;
  }

  displayStatus(value: string): string {
    if (this.currentLang() !== 'cs') return value;
    const map: Record<string, string> = {
      'Closed': 'Uzavřený',
      'Active': 'Aktivní'
    };
    return map[value] || value;
  }

  isWaive(row: PaymentRow): boolean {
    return row.transactionType === 'Waive';
  }

  formatMoney(value: number): string {
    return Number(value || 0).toLocaleString(
      this.currentLang() === 'cs' ? 'cs-CZ' : 'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
  }

  formatDate(value: string): string {
    if (!value) return '';

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return value;

    return this.currentLang() === 'cs'
      ? `${Number(match[3])}.${Number(match[2])}.${match[1]}`
      : `${match[1]}-${match[2]}-${match[3]}`;
  }

  private normalizeAnalyticsDate(value: string): string {
    if (!value) return '';

    let match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    match = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (match) {
      return (
        `${match[3]}-` +
        `${String(match[2]).padStart(2, '0')}-` +
        `${String(match[1]).padStart(2, '0')}`
      );
    }

    return value;
  }

  private toNumber(value: any): number {
    const number = Number(
      String(value ?? '')
        .replace(/\s/g, '')
        .replace(',', '.')
    );
    return Number.isFinite(number) ? number : 0;
  }

  private text(value: any): string {
    return String(value ?? '').trim();
  }

  private libraryName(code: string): string {
    return this.libraries.find(
      library => library.code === code
    )?.name || '';
  }

  private value(value: any): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'object') {
      return String(
        value.value ??
        value.code ??
        value.desc ??
        ''
      ).trim();
    }

    return String(value).trim();
  }

  private arrayOf(value: any): any[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private toDateInput(value: Date): string {
    return (
      `${value.getFullYear()}-` +
      `${String(value.getMonth() + 1).padStart(2, '0')}-` +
      `${String(value.getDate()).padStart(2, '0')}`
    );
  }

  private isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private currentLang(): string {
    return String(
      this.translate.currentLang ||
      this.translate.defaultLang ||
      'en'
    ).toLowerCase().split('-')[0];
  }

  private t(key: string, params?: Record<string, any>): string {
    return this.translate.instant(key, params);
  }

  private csvCell(value: any): string {
    return `"${String(value ?? '')
      .replace(/\r?\n/g, ' ')
      .replace(/"/g, '""')}"`;
  }

  private escapeXml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
