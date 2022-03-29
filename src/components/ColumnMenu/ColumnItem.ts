import { RouteLocationRaw } from 'vue-router'

export interface ColumnItem {
  id: string;
  text: string;
  children?: ColumnItem[];
  to?: RouteLocationRaw;
}
