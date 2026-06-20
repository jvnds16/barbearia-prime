import assert from "node:assert/strict";
import test from "node:test";
import { resolveFrontendUrl } from "../src/config/env.js";

test("uses the explicitly configured frontend URL first", () => {
  assert.equal(
    resolveFrontendUrl({
      FRONTEND_URL: "https://barbearia.example.com/",
      VERCEL_URL: "preview.vercel.app"
    }),
    "https://barbearia.example.com"
  );
});

test("uses Vercel's production URL when FRONTEND_URL is absent", () => {
  assert.equal(
    resolveFrontendUrl({
      VERCEL_PROJECT_PRODUCTION_URL: "barbearia-prime-alpha.vercel.app"
    }),
    "https://barbearia-prime-alpha.vercel.app"
  );
});

test("uses the current Vercel deployment URL for previews", () => {
  assert.equal(
    resolveFrontendUrl({
      VERCEL_URL: "barbearia-prime-git-main.example.vercel.app"
    }),
    "https://barbearia-prime-git-main.example.vercel.app"
  );
});
