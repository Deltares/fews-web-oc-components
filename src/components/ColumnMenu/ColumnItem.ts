export interface ColumnItem {
  id: string;
  text: string;
  children?: ColumnItem[];
  to?: any;
}
