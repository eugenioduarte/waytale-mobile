/** A request the mock answered (a subset of Mockoon's `Transaction`). */
export type MockRequest = {
  request: {
    method: string;
    urlPath: string | null;
    body: string;
    headers: { key: string; value: string }[];
  };
  response: { statusCode: number; body: string };
};

export type MockServer = {
  /** Base URL, e.g. `http://127.0.0.1:53124` — where the client under test points. */
  url: string;
  /** Every request answered so far, in order. */
  requests(): Promise<MockRequest[]>;
  clearRequests(): Promise<void>;
  stop(): Promise<void>;
};

/** Starts the Waytale mock (`waytale.json`) in its own process, on a free port. */
export declare function startMockServer(): Promise<MockServer>;
