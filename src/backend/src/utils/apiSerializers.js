function plain(value) {
  return value?.toObject ? value.toObject() : value;
}

// Serializers define the public API shape and keep private model fields internal.
export function appointmentToApi(value) {
  const appointment = plain(value);
  if (!appointment) return appointment;

  return {
    _id: appointment._id,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    serviceName: appointment.serviceName,
    price: appointment.price,
    durationMinutes: appointment.durationMinutes,
    date: appointment.date,
    time: appointment.time,
    barber: appointment.barber,
    status: appointment.status,
    cancelledAt: appointment.cancelledAt,
    cancelledBy: appointment.cancelledBy,
    timestamp: appointment.timestamp,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };
}

export function barberToApi(value) {
  const barber = plain(value);
  if (!barber) return barber;

  return {
    _id: barber._id,
    name: barber.name,
    phone: barber.phone,
    specialties: barber.specialties,
    active: barber.active,
    createdAt: barber.createdAt,
    updatedAt: barber.updatedAt
  };
}

export function clientToApi(value) {
  const client = plain(value);
  if (!client) return client;

  return {
    _id: client._id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt
  };
}

export function serviceToApi(value) {
  const service = plain(value);
  if (!service) return service;

  return {
    _id: service._id,
    name: service.name,
    price: service.price,
    duration: service.duration,
    active: service.active,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}
