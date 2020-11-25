export declare type LoadTableOptions = {
  employees?: number;
  tasks?: number;
};
export default class TaskAppExampleLoader {
  constructor(service: object);
  makeTable(): Promise<void>;
  dropTable(): Promise<void>;
  loadTable({ employees, tasks }?: LoadTableOptions): Promise<void>;
}