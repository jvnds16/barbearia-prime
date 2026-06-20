import assert from "node:assert/strict";
import test from "node:test";
import handler, { restoreOriginalApiPath } from "../../api/index.js";

test("exports a Vercel-compatible request handler", () => {
  assert.equal(typeof handler, "function");
});

test("restores the original Express API path after the Vercel rewrite", () => {
  const request = {
    url: "/api?path=appointments&date=2026-06-19",
    query: {
      path: "appointments",
      date: "2026-06-19"
    }
  };

  restoreOriginalApiPath(request);

  assert.equal(request.url, "/api/appointments?date=2026-06-19");
});
