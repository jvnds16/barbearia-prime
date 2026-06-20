import assert from "node:assert/strict";
import test from "node:test";
import { validatePublicClient } from "../src/controllers/client.controller.js";

test("accepts and normalizes only name and phone in public creation", () => {
  const result = validatePublicClient({
    name: "  João   Silva  ",
    phone: "(27) 99999-9999",
    email: "nao-deve-ser-aceito@example.com",
    role: "admin",
    _id: "507f1f77bcf86cd799439011"
  });

  assert.deepEqual(result, {
    name: "João Silva",
    phone: "(27) 99999-9999"
  });
});

test("rejects non-string values in public creation", () => {
  assert.throws(
    () => validatePublicClient({ name: { $ne: null }, phone: { $gt: "" } }),
    (error) => error.statusCode === 400
  );
});

test("rejects an invalid phone in public creation", () => {
  assert.throws(
    () => validatePublicClient({ name: "João Silva", phone: "123" }),
    (error) => error.statusCode === 400
  );
});
