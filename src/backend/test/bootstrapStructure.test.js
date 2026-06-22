import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("normal application startup does not execute data migrations", async () => {
  const serverSource = await readFile(
    new URL("../src/server.js", import.meta.url),
    "utf8"
  );
  const vercelSource = await readFile(
    new URL("../../api/index.js", import.meta.url),
    "utf8"
  );

  assert.equal(serverSource.includes("migrateModelFieldsToEnglish"), false);
  assert.equal(vercelSource.includes("migrateModelFieldsToEnglish"), false);
});

test("the OpenAPI contract is versioned with the backend", async () => {
  const specification = await readFile(
    new URL("../openapi.yaml", import.meta.url),
    "utf8"
  );

  assert.match(specification, /^openapi: 3\.1\.0/m);
  assert.match(specification, /\/appointments:/);
  assert.match(specification, /bearerAuth:/);
});
