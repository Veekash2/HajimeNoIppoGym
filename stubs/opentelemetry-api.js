// No-op stub for @opentelemetry/api — not needed in React Native
module.exports = {
  trace: { getTracer: () => ({ startSpan: () => ({ end: () => {}, setAttribute: () => {} }) }) },
  context: { with: (_ctx, fn) => fn(), active: () => ({}) },
  propagation: { inject: () => {}, extract: () => ({}) },
  diag: { setLogger: () => {}, warn: () => {}, error: () => {}, info: () => {} },
  SpanStatusCode: { OK: 1, ERROR: 2, UNSET: 0 },
};
