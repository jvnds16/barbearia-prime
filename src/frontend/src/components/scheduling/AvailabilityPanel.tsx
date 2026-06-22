import { RefreshCw } from "lucide-react";
import { IconAlarm, IconScissors } from "@tabler/icons-react";
import { Agendamento } from "../../types/scheduling";

function OccupiedTimes({
  title,
  appointments,
  emptyMessage
}: {
  title: string;
  appointments: Agendamento[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/30">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {appointments.length === 0 ? (
        <p className="text-white">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {[...appointments]
            .sort((first, second) => first.horario.localeCompare(second.horario))
            .map((appointment, index) => (
              <li key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-amber-400">Horário ocupado</span>
                    <div className="text-white mt-1">
                      <IconScissors className="inline-block mr-1" />
                      Indisponível para agendamento
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 font-mono">
                      <IconAlarm className="shrink-0" />
                      {appointment.horario}
                    </span>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export function AvailabilityPanel({
  today,
  tomorrow,
  refreshing,
  onRefresh
}: {
  today: Agendamento[];
  tomorrow: Agendamento[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="w-full lg:w-96 space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Horários ocupados — hoje</h3>
          <button type="button" onClick={onRefresh} disabled={refreshing} className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition text-sm disabled:cursor-not-allowed disabled:opacity-60" title="Atualizar lista de horários">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
        {today.length === 0 ? (
          <p className="text-white">Nenhum agendamento para hoje.</p>
        ) : (
          <ul className="space-y-2">
            {[...today]
              .sort((first, second) => first.horario.localeCompare(second.horario))
              .map((appointment, index) => (
                <li key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-amber-400">Horário ocupado</span>
                      <div className="text-white mt-1">
                        <IconScissors className="inline-block mr-1" />
                        Indisponível para agendamento
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 font-mono">
                        <IconAlarm className="shrink-0" />
                        {appointment.horario}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
      <OccupiedTimes title="Horários ocupados — amanhã" appointments={tomorrow} emptyMessage="Nenhum agendamento para amanhã." />
    </div>
  );
}
