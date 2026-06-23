import { Calendar, Home, LogOut, Trash2, TrendingUp, X } from "lucide-react";
import { AdminMessage } from "../../hooks/useAdminPanel";
import { Appointment } from "../../types/appointment";

export function AdminMessageToast({
  message,
  onClose,
}: {
  message: AdminMessage;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div
      className={`fixed right-4 top-4 z-[100] flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-2xl ${
        message.type === "error"
          ? "border-red-500/40 bg-red-950 text-red-200"
          : "border-green-500/40 bg-green-950 text-green-200"
      }`}
    >
      <span className="text-sm font-semibold">{message.text}</span>
      <button type="button" onClick={onClose} aria-label="Fechar mensagem">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function DeleteAppointmentModal({
  target,
  loading,
  onClose,
  onConfirm,
}: {
  target: Appointment | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300">
          <Trash2 className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-center text-xl font-bold">
          Cancelar agendamento?
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          O agendamento de{" "}
          <strong className="text-white">{target.customerName}</strong> será
          marcado como cancelado e permanecerá no histórico.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-3 font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => target._id && onConfirm(target._id)}
            disabled={loading || !target._id}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Cancelando..." : "Cancelar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-700">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col items-center text-center md:hidden space-y-4">
          <div className="flex flex-col items-center space-y-1">
            <img
              src="/logo.png"
              className="h-12 w-12 rounded-full bg-amber-500"
            />
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <p className="text-white text-sm">
              Gerencie os agendamentos e finanças
            </p>
          </div>
          <div className="w-full flex flex-col space-y-3">
            <a
              href="/"
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full px-4 py-2 rounded-md transition"
            >
              <Home className="h-5 w-5" />
              <span>Voltar ao site</span>
            </a>
            <button
              onClick={onLogout}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 w-full px-4 py-2 rounded-md transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              className="h-10 w-10 rounded-full bg-amber-500"
            />
            <div>
              <h1 className="text-2xl font-bold">Painel Admin</h1>
              <p className="text-white text-sm">
                Gerencie os agendamentos e finanças
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="/"
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
            >
              <Home className="h-5 w-5" />
              <span>Voltar ao site</span>
            </a>
            <button
              onClick={onLogout}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminTabs({
  activeTab,
  onChange,
}: {
  activeTab: "dashboard" | "appointments";
  onChange: (tab: "dashboard" | "appointments") => void;
}) {
  return (
    <div className="container mx-auto px-6 pt-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => onChange("dashboard")}
          className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          <TrendingUp className="h-5 w-5" />
          Dashboard
        </button>
        <button
          onClick={() => onChange("appointments")}
          className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${
            activeTab === "appointments"
              ? "bg-amber-500 text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          <Calendar className="h-5 w-5" />
          Agendamentos
        </button>
      </div>
    </div>
  );
}
