import { ReportsModels } from 'api/schema';

export interface LRReportRowItemModel {
  id: string;
  type: "Guest" | "External" | "Booking";
  arrival?: string;
  departure?: string;
  status?: string;
  transactions: ReportsModels["TransactionsGrossExportListItemModel"][];
  receivables: number;
  liabilities: {
    [vatType: string]: number;
    total: number;
  };
}

export interface VatInfo {
  key: string;
  type?: string;
  percent?: number;
}
