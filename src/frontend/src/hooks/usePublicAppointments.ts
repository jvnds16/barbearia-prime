import { useEffect, useRef, useState } from "react";
import { appointmentService } from "../services/appointmentService";
import { Appointment } from "../types/appointment";
import { sanitizePublicAppointments } from "../utils/appointment";
import { addLocalDays, toDateValue } from "../utils/date";

type RefreshResult = "remote" | "local" | "empty";

const STORAGE_KEY = "appointments";
const STORAGE_TIMESTAMP_KEY = "appointmentsTimestamp";

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
    forceRefresh = false,
    notifyOnSuccess = true,
  ): Promise<RefreshResult> => {
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      let hasLocalData = false;
      if (localData && !forceRefresh) {
        // Local cache keeps the booking UI useful before the remote refresh finishes.
        const parsedData = sanitizePublicAppointments(JSON.parse(localData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
        setAppointments(parsedData);
        hasLocalData = true;
      }

      if (forceRefresh) {
        const requestSequence = ++agendaRequestSequenceRef.current;
        const result = await appointmentService.list();
        if (result.success && result.data) {
          const publicAppointments = sanitizePublicAppointments(result.data);
          // Ignore stale responses when a newer agenda request has already started.
          if (requestSequence !== agendaRequestSequenceRef.current)
            return "remote";

          localStorage.setItem(STORAGE_KEY, JSON.stringify(publicAppointments));
          localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
          setAppointments(publicAppointments);
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
      console.error(
        "Error fetching appointments from API, using localStorage:",
        error,
      );
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        setAppointments(sanitizePublicAppointments(JSON.parse(localData)));
        return "local";
      }
      return "empty";
    }
  };

  const refreshAgendaManually = async () => {
    if (refreshingAgenda) return;

    setRefreshingAgenda(true);
    try {
      await Promise.all([
        fetchAppointments(true, false),
        new Promise((resolve) => window.setTimeout(resolve, 900)),
      ]);
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
      // Refresh once at closing time so stale same-day bookings disappear.
      if (time === "20:00:00") void fetchAppointments(true);
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const clearOldData = () => {
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (timestamp && Date.now() - Number(timestamp) >= 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    };

    clearOldData();
    void fetchAppointments(true, false);
    // Expire the local snapshot daily even if the tab stays open.
    const interval = window.setInterval(clearOldData, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const synchronizeAgenda = () => {
      if (document.visibilityState === "visible")
        void fetchAppointments(true, false);
    };

    // Visible tabs poll often enough to reduce double-booking without feeling heavy.
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
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      ) as Appointment[];
      const current = saved.filter(
        (appointment) => appointment.date >= getCurrentDate(),
      );
      if (saved.length !== current.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        setAppointments(current);
      }
    };

    removePastAppointments();
    // Keep old appointments from blocking future date calculations in long-lived sessions.
    const interval = window.setInterval(removePastAppointments, 60000);
    return () => window.clearInterval(interval);
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
