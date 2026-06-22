import { useEffect, useRef, useState } from "react";
import { schedulingService } from "../services/schedulingService";
import { Agendamento } from "../types/scheduling";
import { sanitizePublicAppointments } from "../utils/appointment";
import { addLocalDays, toDateValue } from "../utils/date";

type RefreshResult = "remote" | "local" | "empty";

export function usePublicAgenda() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [horaAtual, setHoraAtual] = useState("");
  const [dataAtual, setDataAtual] = useState("");
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  const [refreshingAgenda, setRefreshingAgenda] = useState(false);
  const agendaRequestSequenceRef = useRef(0);

  const getDataAtual = () => toDateValue(new Date());
  const getDataAmanha = () => toDateValue(addLocalDays(new Date(), 1));
  const isHoje = (date: string) => date === getDataAtual();
  const isAmanha = (date: string) => date === getDataAmanha();
  const getHoraAtual = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const fetchAgendamentos = async (
    forceRefresh = false,
    notifyOnSuccess = true
  ): Promise<RefreshResult> => {
    try {
      const localData = localStorage.getItem("agendamentos");
      let hasLocalData = false;
      if (localData && !forceRefresh) {
        const parsedData = sanitizePublicAppointments(JSON.parse(localData));
        localStorage.setItem("agendamentos", JSON.stringify(parsedData));
        setAgendamentos(parsedData);
        hasLocalData = true;
      }

      if (forceRefresh) {
        const requestSequence = ++agendaRequestSequenceRef.current;
        const result = await schedulingService.list();
        if (result.success && result.data) {
          const publicAppointments = sanitizePublicAppointments(result.data);
          if (requestSequence !== agendaRequestSequenceRef.current) return "remote";

          localStorage.setItem("agendamentos", JSON.stringify(publicAppointments));
          localStorage.setItem("agendamentosTimestamp", Date.now().toString());
          setAgendamentos(publicAppointments);
          if (notifyOnSuccess) {
            setShowRefreshNotification(true);
            window.setTimeout(() => setShowRefreshNotification(false), 5000);
          }
          return "remote";
        }
        return hasLocalData ? "local" : "empty";
      }

      return hasLocalData ? "local" : "empty";
    } catch (error) {
      console.error("Erro ao buscar agendamentos da API, usando localStorage:", error);
      const localData = localStorage.getItem("agendamentos");
      if (localData) {
        setAgendamentos(sanitizePublicAppointments(JSON.parse(localData)));
        return "local";
      }
      return "empty";
    }
  };

  const atualizarAgendaManual = async () => {
    if (refreshingAgenda) return;

    setRefreshingAgenda(true);
    try {
      await Promise.all([
        fetchAgendamentos(true, false),
        new Promise((resolve) => window.setTimeout(resolve, 900))
      ]);
    } finally {
      setRefreshingAgenda(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("pt-BR", { hour12: false });
      setHoraAtual(time);
      setDataAtual(now.toLocaleDateString("pt-BR"));
      if (time === "20:00:00") void fetchAgendamentos(true);
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const clearOldData = () => {
      const timestamp = localStorage.getItem("agendamentosTimestamp");
      if (timestamp && Date.now() - Number(timestamp) >= 24 * 60 * 60 * 1000) {
        localStorage.removeItem("agendamentos");
        localStorage.removeItem("agendamentosTimestamp");
      }
    };

    clearOldData();
    void fetchAgendamentos(true, false);
    const interval = window.setInterval(clearOldData, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const synchronizeAgenda = () => {
      if (document.visibilityState === "visible") void fetchAgendamentos(true, false);
    };

    const interval = window.setInterval(synchronizeAgenda, 15000);
    window.addEventListener("focus", synchronizeAgenda);
    document.addEventListener("visibilitychange", synchronizeAgenda);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", synchronizeAgenda);
      document.removeEventListener("visibilitychange", synchronizeAgenda);
    };
  }, []);

  useEffect(() => {
    const removePastAppointments = () => {
      const saved = JSON.parse(localStorage.getItem("agendamentos") ?? "[]") as Agendamento[];
      const current = saved.filter((appointment) => appointment.data >= getDataAtual());
      if (saved.length !== current.length) {
        localStorage.setItem("agendamentos", JSON.stringify(current));
        setAgendamentos(current);
      }
    };

    removePastAppointments();
    const interval = window.setInterval(removePastAppointments, 60000);
    return () => window.clearInterval(interval);
  }, []);

  return {
    agendaRequestSequenceRef,
    agendamentos,
    atualizarAgendaManual,
    dataAtual,
    fetchAgendamentos,
    getAgendamentosPorData: (date: string) =>
      agendamentos.filter((appointment) => appointment.data === date),
    getDataAmanha,
    getDataAtual,
    getHoraAtual,
    horaAtual,
    isAmanha,
    isHoje,
    refreshingAgenda,
    setAgendamentos,
    setShowRefreshNotification,
    showRefreshNotification
  };
}
