declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(params?: Record<string, string | number | bigint | null>): unknown;
      get(...params: unknown[]): unknown;
      all(...params: unknown[]): unknown[];
    };
  }
}
