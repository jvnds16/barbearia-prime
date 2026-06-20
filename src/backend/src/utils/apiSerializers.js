function plain(value) {
  return value?.toObject ? value.toObject() : value;
}

export function appointmentToApi(value) {
  return plain(value);
}

export function barberToApi(value) {
  return plain(value);
}

export function clientToApi(value) {
  return plain(value);
}

export function serviceToApi(value) {
  return plain(value);
}
