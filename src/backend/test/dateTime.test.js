import test from "node:test";
import assert from "node:assert/strict";
import { addDaysToISO, businessDateISO, isSunday } from "../src/utils/dateTime.js";
import { parseDurationMinutes } from "../src/services/serviceCatalog.service.js";

test("formats the date in the Sao Paulo business time zone", () => {
  const instant = new Date("2026-06-19T02:30:00.000Z");
  assert.equal(businessDateISO(instant), "2026-06-18");
});

test("adds days without depending on the server time zone", () => {
  assert.equal(addDaysToISO("2026-06-19", 30), "2026-07-19");
});

test("identifies Sundays", () => {
  assert.equal(isSunday("2026-06-21"), true);
  assert.equal(isSunday("2026-06-22"), false);
});

test("converts text duration to minutes", () => {
  assert.equal(parseDurationMinutes("80 min"), 80);
  assert.equal(parseDurationMinutes("inválida"), 30);
});
