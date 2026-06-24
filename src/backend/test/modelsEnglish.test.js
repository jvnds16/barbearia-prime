import assert from "node:assert/strict";
import test from "node:test";
import { Appointment } from "../src/models/appointment.model.js";
import { Barber } from "../src/models/barber.model.js";
import { Client } from "../src/models/client.model.js";
import { Service } from "../src/models/service.model.js";

test("models use English field names", () => {
  assert.deepEqual(
    ["customerName", "customerPhone", "serviceName", "price", "durationMinutes", "date", "time", "barber"]
      .filter((field) => !Appointment.schema.path(field)),
    []
  );
  assert.deepEqual(["name", "phone", "specialties", "active"].filter((field) => !Barber.schema.path(field)), []);
  assert.deepEqual(["name", "phone", "email"].filter((field) => !Client.schema.path(field)), []);
  assert.deepEqual(["name", "price", "duration", "active"].filter((field) => !Service.schema.path(field)), []);
});

test("models do not expose legacy Portuguese fields", () => {
  const oldFields = [
    [Appointment, ["nome", "telefone", "servico", "preco", "duracaoMinutos", "data", "horario", "barbeiro"]],
    [Barber, ["nome", "telefone", "especialidades", "ativo"]],
    [Client, ["nome", "telefone"]],
    [Service, ["nome", "preco", "duracao", "ativo"]]
  ];

  for (const [Model, fields] of oldFields) {
    assert.deepEqual(fields.filter((field) => Model.schema.path(field)), []);
  }
});

test("model collections use English names", () => {
  assert.equal(Appointment.collection.collectionName, "appointments");
  assert.equal(Barber.collection.collectionName, "barbers");
  assert.equal(Client.collection.collectionName, "clients");
  assert.equal(Service.collection.collectionName, "services");
});

test("appointments support present and absent statuses", () => {
  const allowedStatuses = Appointment.schema.path("status").enumValues;

  assert.equal(allowedStatuses.includes("pending"), true);
  assert.equal(allowedStatuses.includes("present"), true);
  assert.equal(allowedStatuses.includes("absent"), true);
  assert.equal(allowedStatuses.includes("cancelled"), true);
});
