import { Car } from './car';

export interface Response {
  paging: Paging;
  versions: Car[];
  facets: Facet[];
  versionCount: number;
}

export interface Facet {
  name: string;
  values: Value[];
}

export interface Value {
  key: string;
  count: number;
}

export interface Paging {
  currentPage: number;
  numberOfPages: number;
  pageSize: number;
}
