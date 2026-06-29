import { useEffect, useRef, useState } from "react";
import { appointmentService } from "../services/appointmentService";
import { Appointment } from "../types/appointment";
import { sanitizePublicAppointments } from "../utils/appointment";
import { addLocalDays, toDateValue } from "../utils/date";

type RefreshResult = "remote" | "empty";

export function usePublicAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);
  const [refreshingAgenda, setRefreshingAgenda] = useState(false);
  const agendaRequestSequenceRef = useRef(0);

  const getCurrentDate = () => toDateValue(new Date());
  const getTomorrowDate = () => toDateValue(addLocalDays(new Date(), 1));
  const isToday = (date: string) => date === getCurrentDate();
  const isTomorrow = (date: string) => date === getTomorrowDate();
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const fetchAppointments = async (
    notifyOnSuccess = true,
  ): Promise<RefreshResult> => {
    const requestSequence = ++agendaRequestSequenceRef.current;

    try {
      const result = await appointmentService.list();
      if (!result.success || !result.data) return "empty";

      const publicAppointments = sanitizePublicAppointments(result.data);
      // Ignore stale responses when a newer agenda request has already started.
      if (requestSequence !== agendaRequestSequenceRef.current) return "remote";

      setAppointments(publicAppointments);
      if (notifyOnSuccess) {
        setShowRefreshNotification(true);
        window.setTimeout(() => setShowRefreshNotification(false), 5000);
      }
      return "remote";
    } catch (error) {
      console.error("Error fetching appointments from API:", error);
      return "empty";
    }
  };

  const refreshAgendaManually = async () => {
    if (refreshingAgenda) return;

    setRefreshingAgenda(true);
    try {
      await fetchAppointments(false);
    } finally {
      setRefreshingAgenda(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("pt-BR", { hour12: false });
      setCurrentTime(time);
      setCurrentDate(now.toLocaleDateString("pt-BR"));
      if (time === "20:00:00") void fetchAppointments();
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const synchronizeAgenda = () => {
      if (document.visibilityState === "visible") void fetchAppointments(false);
    };

    void fetchAppointments(false);
    window.addEventListener("focus", synchronizeAgenda);
    document.addEventListener("visibilitychange", synchronizeAgenda);
    return () => {
      window.removeEventListener("focus", synchronizeAgenda);
      document.removeEventListener("visibilitychange", synchronizeAgenda);
    };
  }, []);

  return {
    agendaRequestSequenceRef,
    appointments,
    refreshAgendaManually,
    currentDate,
    fetchAppointments,
    getAppointmentsByDate: (date: string) =>
      appointments.filter((appointment) => appointment.date === date),
    getTomorrowDate,
    getCurrentDate,
    getCurrentTime,
    currentTime,
    isTomorrow,
    isToday,
    refreshingAgenda,
    setAppointments,
    setShowRefreshNotification,
    showRefreshNotification,
  };
}
