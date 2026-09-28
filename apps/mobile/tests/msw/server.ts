import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/**
 * The MSW server for integration tests. Each test file that talks to the network starts it:
 *
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 *
 * `onUnhandledRequest: 'error'` makes a request with no handler fail the test instead of
 * reaching the real network.
 */
export const server = setupServer(...handlers);
