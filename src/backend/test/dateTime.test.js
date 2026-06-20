import test from "node:test";
import assert from "node:assert/strict";
import { addDaysToISO, businessDateISO, isSunday } from "../src/utils/dateTime.js";
import { parseDurationMinutes } from "../src/services/serviceCatalog.service.js";

test("formata a data no fuso de São Paulo", () => {
  const instant = new Date("2026-06-19T02:30:00.000Z");
  assert.equal(businessDateISO(instant), "2026-06-18");
});

test("soma dias sem depender do fuso do servidor", () => {
  assert.equal(addDaysToISO("2026-06-19", 30), "2026-07-19");
});

test("identifica domingos", () => {
  assert.equal(isSunday("2026-06-21"), true);
  assert.equal(isSunday("2026-06-22"), false);
});

test("converte a duração textual para minutos", () => {
  assert.equal(parseDurationMinutes("80 min"), 80);
  assert.equal(parseDurationMinutes("inválida"), 30);
});
