export function gerarHorariosDisponiveis() {
  const horarios = [];

  for (let hora = 8; hora <= 19; hora += 1) {
    if (hora === 12) continue;

    horarios.push(`${String(hora).padStart(2, "0")}:00`);

    if (hora !== 19) {
      horarios.push(`${String(hora).padStart(2, "0")}:30`);
    }
  }

  return horarios;
}

export function hojeISO() {
  return businessDateISO();
}
import { businessDateISO } from "./dateTime.js";
