import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidAppointmentTime,
  isValidCustomerName,
  isValidPhone,
  normalizeText
} from "../src/services/appointment.service.js";

test("normalizes appointment text fields", () => {
  assert.equal(normalizeText("  João   Silva  "), "João Silva");
});

test("validates appointment customer data", () => {
  assert.equal(isValidCustomerName("João Silva"), true);
  assert.equal(isValidCustomerName("João"), false);
  assert.equal(isValidPhone("(27) 99999-9999"), true);
  assert.equal(isValidPhone("123"), false);
});

test("validates the configured appointment time grid", () => {
  assert.equal(isValidAppointmentTime("08:00"), true);
  assert.equal(isValidAppointmentTime("12:00"), false);
  assert.equal(isValidAppointmentTime("19:00"), true);
});
