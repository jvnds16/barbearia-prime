import { AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { Agendamento, Servico } from "../../types/scheduling";
import { formatDisplayDate } from "../../utils/date";

type StatusModal = {
  type: "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
} | null;

type SchedulingModalsProps = {
  reviewOpen: boolean;
  status: StatusModal;
  appointment: Agendamento;
  selectedService?: Servico;
  loading: boolean;
  onCloseReview: () => void;
  onConfirm: () => void;
  onCloseStatus: () => void;
};

export function SchedulingModals({
  reviewOpen,
  status,
  appointment,
  selectedService,
  loading,
  onCloseReview,
  onConfirm,
  onCloseStatus
}: SchedulingModalsProps) {
  return (
    <>
      {reviewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Revisão</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Confirmar agendamento</h3>
              </div>
              <button type="button" onClick={onCloseReview} className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white" aria-label="Fechar revisão">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 text-sm text-zinc-200">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Cliente</span>
                <strong className="mt-1 block text-base text-white">{appointment.nome}</strong>
                <span className="mt-1 block text-zinc-400">{appointment.telefone}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Serviço</span>
                  <strong className="mt-1 block text-white">{appointment.servico}</strong>
                  <span className="mt-1 block text-amber-300">R$ {selectedService?.preco?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Data e hora</span>
                  <strong className="mt-1 block text-white">{appointment.data ? formatDisplayDate(appointment.data) : "--"}</strong>
                  <span className="mt-1 block text-amber-300">{appointment.horario}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCloseReview} className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-zinc-800">
                Editar dados
              </button>
              <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar e enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {status && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-950 p-6 text-center shadow-2xl">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              status.type === "success" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
            }`}>
              {status.type === "success" ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <h3 className="text-2xl font-bold text-white">{status.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{status.message}</p>
            {status.actionUrl && (
              <a href={status.actionUrl} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-500">
                <IconBrandWhatsapp size={20} />
                {status.actionLabel || "Continuar"}
              </a>
            )}
            <button type="button" onClick={onCloseStatus} className={`${status.actionUrl ? "mt-3" : "mt-6"} w-full rounded-lg bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400`}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
