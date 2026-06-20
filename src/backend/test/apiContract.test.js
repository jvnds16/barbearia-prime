import assert from "node:assert/strict";
import test from "node:test";
import { Appointment } from "../src/models/appointment.model.js";
import { Barber } from "../src/models/barber.model.js";
import { Client } from "../src/models/client.model.js";
import { Service } from "../src/models/service.model.js";
import {
  appointmentToApi,
  barberToApi,
  clientToApi,
  serviceToApi
} from "../src/utils/apiSerializers.js";

test("API serializers expose only English resource fields", () => {
  const appointment = appointmentToApi(new Appointment({
    customerName: "John Silva",
    customerPhone: "(27) 99999-9999",
    serviceName: "Haircut",
    price: 30,
    durationMinutes: 30,
    date: "2026-06-20",
    time: "09:00",
    status: "pending"
  }));
  const barber = barberToApi(new Barber({ name: "Carlos", active: true }));
  const client = clientToApi(new Client({ name: "John Silva", phone: "27999999999" }));
  const service = serviceToApi(new Service({ name: "Haircut", price: 30, duration: "30 min", active: true }));

  assert.equal(appointment.customerName, "John Silva");
  assert.equal(appointment.status, "pending");
  assert.equal(barber.name, "Carlos");
  assert.equal(client.phone, "27999999999");
  assert.equal(service.price, 30);

  for (const resource of [appointment, barber, client, service]) {
    for (const legacyField of [
      "nome", "telefone", "servico", "preco", "duracao", "duracaoMinutos",
      "horario", "barbeiro", "ativo", "especialidades"
    ]) {
      assert.equal(Object.hasOwn(resource, legacyField), false);
    }
  }
});

test("appointment API exposes attendance statuses", () => {
  const present = appointmentToApi(new Appointment({
    customerName: "Maria Silva",
    customerPhone: "(27) 99999-9999",
    serviceName: "Haircut",
    price: 30,
    durationMinutes: 30,
    date: "2026-06-20",
    time: "10:00",
    status: "present"
  }));
  const absent = appointmentToApi(new Appointment({
    customerName: "Joana Silva",
    customerPhone: "(27) 98888-8888",
    serviceName: "Haircut",
    price: 30,
    durationMinutes: 30,
    date: "2026-06-20",
    time: "11:00",
    status: "absent"
  }));

  assert.equal(present.status, "present");
  assert.equal(absent.status, "absent");
});
