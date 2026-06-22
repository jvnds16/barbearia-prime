import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { serviceRoutes } from "../src/routes/service.routes.js";
import { clientRoutes } from "../src/routes/client.routes.js";
import { appointmentRoutes } from "../src/routes/appointment.routes.js";
import { errorHandler } from "../src/middlewares/errorHandler.js";

function authenticatedTestApp(path, router) {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(path, router);
  testApp.use(errorHandler);
  return testApp;
}

function adminToken() {
  return jwt.sign({ role: "admin", name: "Administrator" }, env.jwtSecret);
}

test("health endpoint reports degraded state without a database", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 503);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "degraded");
});

test("authentication validates the request body over HTTP", async () => {
  const missing = await request(app).post("/api/auth/login").send({});
  assert.equal(missing.status, 400);
  assert.equal(missing.body.success, false);
  assert.equal(Array.isArray(missing.body.details), true);

  const valid = await request(app)
    .post("/api/auth/login")
    .send({ password: env.adminPassword });
  assert.equal(valid.status, 200);
  assert.equal(valid.body.success, true);
  assert.equal(typeof valid.body.token, "string");
});

test("invalid JSON receives a stable client error", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{");

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid JSON body.");
});

test("unknown API routes use the standard error envelope", async () => {
  const response = await request(app).get("/api/does-not-exist");

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, {
    success: false,
    error: "Route not found: GET /api/does-not-exist"
  });
});

test("resource routes reject invalid IDs before reaching MongoDB", async () => {
  const testApp = authenticatedTestApp("/services", serviceRoutes);
  const response = await request(testApp)
    .put("/services/not-an-id")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ name: "Corte" });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "Invalid resource ID.");
});

test("client creation is administrative and rejects invalid payloads", async () => {
  const testApp = authenticatedTestApp("/clients", clientRoutes);

  const unauthenticated = await request(testApp)
    .post("/clients")
    .send({ name: "João Silva", phone: "(27) 99999-9999" });
  assert.equal(unauthenticated.status, 401);

  const invalid = await request(testApp)
    .post("/clients")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ name: "João Silva", phone: "123", role: "admin" });
  assert.equal(invalid.status, 400);
});

test("appointment payload validation runs before persistence", async () => {
  const testApp = authenticatedTestApp("/appointments", appointmentRoutes);
  const response = await request(testApp)
    .post("/appointments")
    .send({ customerName: "João Silva" });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("slot conflicts use HTTP 409 without leaking database errors", async () => {
  const testApp = express();
  testApp.get("/conflict", (req, res, next) => {
    const error = new Error("Mongo duplicate details");
    error.code = 11000;
    error.keyPattern = { slotKeys: 1 };
    next(error);
  });
  testApp.use(errorHandler);

  const response = await request(testApp).get("/conflict");
  assert.equal(response.status, 409);
  assert.equal(response.body.error, "This time slot was just booked. Choose another one.");
});
