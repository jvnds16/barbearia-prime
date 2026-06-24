import { FormEvent, useEffect, useRef, useState } from "react";
import { authService } from "../services/authService";
import { appointmentService } from "../services/appointmentService";
import { defaultServices, listServices } from "../services/serviceCatalog";
import { ApiError } from "../services/api";
import { Appointment, DashboardStats, Service } from "../types/appointment";
import { calculateDashboardStats } from "../utils/dashboard";
import { toDateValue } from "../utils/date";

export type AdminMessage = {
  type: "success" | "error";
  text: string;
} | null;

export type EditErrors = Partial<
  Record<
    | "customerName"
    | "customerPhone"
    | "serviceName"
    | "price"
    | "date"
    | "time",
    string
  >
>;

const initialDashboardStats: DashboardStats = {
  todayProfit: 0,
  monthlyProfit: 0,
  totalAppointments: 0,
  dailyAverage: 0,
  todayAppointments: 0,
  monthlyAppointments: 0,
  todayAttendances: 0,
  monthlyAttendances: 0,
  monthlyPending: 0,
  monthlyAbsent: 0,
  dailyProfits: {},
  mostPopularServices: [],
};

// User-facing admin messages remain localized.
const MESSAGES = {
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  UNABLE_TO_UPDATE: "Não foi possível atualizar os dados do painel.",
  PASSWORD_REQUIRED: "Informe a senha de administrador para entrar.",
  UNABLE_TO_LOGIN: "Não foi possível entrar.",
  NAME_VALIDATION: "Informe nome e sobrenome.",
  PHONE_VALIDATION: "Telefone inválido com DDD.",
  SERVICE_VALIDATION: "Selecione um serviço válido.",
  PRICE_VALIDATION: "Informe um preço válido.",
  DATE_VALIDATION: "Escolha uma data.",
  DATE_RANGE_VALIDATION: "Escolha uma data entre hoje e os próximos 30 dias.",
  TIME_VALIDATION: "Escolha um horário válido.",
  FORM_ERROR: "Revise os campos destacados antes de salvar.",
  UPDATE_SUCCESS: "Agendamento atualizado com sucesso.",
  UPDATE_ERROR: "Não foi possível atualizar o agendamento.",
  CANCEL_SUCCESS: "Agendamento cancelado com sucesso.",
  CANCEL_ERROR: "Não foi possível excluir o agendamento.",
} as const;

export function useAdminPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Appointment | null>(null);
  const [filterDate, setFilterDate] = useState(() => toDateValue(new Date()));
  const [clearingFilter, setClearingFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AdminMessage>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [activeTab, setActiveTab] = useState<"appointments" | "dashboard">(
    "dashboard",
  );
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(
    initialDashboardStats,
  );
  const loadingAppointmentsRef = useRef(false);

  const today = new Date();
  const todayDate = toDateValue(today);
  const editLimit = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 30,
  );
  const editLimitDate = toDateValue(editLimit);
  const allowedTimes = Array.from({ length: 23 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }).filter((time) => !time.startsWith("12:"));

  useEffect(() => {
    document.title = "Painel Admin | Barbearia Prime";
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    authService
      .getSession()
      .then(() => setIsAuthenticated(true))
      .catch(() => authService.logout())
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    listServices()
      .then((result) => {
        if (result.success && result.data.length) setServices(result.data);
      })
      .catch(() => setServices(defaultServices));
  }, []);

  const loadAppointments = async (silent = false) => {
    if (loadingAppointmentsRef.current) return;

    // Avoid overlapping admin refreshes from manual actions and polling.
    loadingAppointmentsRef.current = true;
    if (!silent) setLoading(true);

    try {
      const { data, success } = await appointmentService.listAdmin();
      if (success) {
        setAppointments(data);
        setDashboardStats(calculateDashboardStats(data));
        setMessage((current) =>
          current?.text === MESSAGES.UNABLE_TO_UPDATE ? null : current,
        );
      }
    } catch (error) {
      console.error("Could not load appointments:", error);
      if (error instanceof ApiError && error.status === 401) {
        authService.logout();
        setIsAuthenticated(false);
        setMessage({ type: "error", text: MESSAGES.SESSION_EXPIRED });
        return;
      }
      if (!silent) {
        setMessage({ type: "error", text: MESSAGES.UNABLE_TO_UPDATE });
      }
    } finally {
      loadingAppointmentsRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    void loadAppointments();
    // Admin dashboard stays live while the barber keeps the page open.
    const interval = window.setInterval(
      () => void loadAppointments(true),
      30000,
    );
    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setMessage({ type: "error", text: MESSAGES.PASSWORD_REQUIRED });
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        authService.login(password),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      setIsAuthenticated(true);
      setPassword("");
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : MESSAGES.UNABLE_TO_LOGIN,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setEditingId(null);
    setEditForm(null);
  };

  const handleEdit = (appointment: Appointment) => {
    if (!appointment._id) return;

    setEditingId(appointment._id);
    setEditForm({ ...appointment });
    setEditErrors({});
    setMessage(null);
    if (activeTab === "dashboard") {
      // Jump from a dashboard card into the editable appointment list context.
      setFilterDate(appointment.date);
      setActiveTab("appointments");
    }
  };

  const handleClearFilter = () => {
    if (clearingFilter) return;
    setFilterDate("");
    setClearingFilter(true);
    window.setTimeout(() => setClearingFilter(false), 500);
  };

  const validateEditForm = () => {
    if (!editForm) return false;

    const nextErrors: EditErrors = {};
    const name = editForm.customerName.trim().replace(/\s+/g, " ");
    const phone = editForm.customerPhone.replace(/\D/g, "");
    const original = appointments.find(
      (appointment) => appointment._id === editingId,
    );

    // Edited appointments follow the same public booking constraints.
    if (name.length < 3 || name.split(" ").length < 2)
      nextErrors.customerName = MESSAGES.NAME_VALIDATION;
    if (!/^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(phone))
      nextErrors.customerPhone = MESSAGES.PHONE_VALIDATION;
    if (!services.some((service) => service.name === editForm.serviceName))
      nextErrors.serviceName = MESSAGES.SERVICE_VALIDATION;
    if (!editForm.price || editForm.price < 0)
      nextErrors.price = MESSAGES.PRICE_VALIDATION;
    if (!editForm.date) {
      nextErrors.date = MESSAGES.DATE_VALIDATION;
    } else if (
      editForm.date !== original?.date &&
      (editForm.date < todayDate || editForm.date > editLimitDate)
    ) {
      nextErrors.date = MESSAGES.DATE_RANGE_VALIDATION;
    }
    if (!allowedTimes.includes(editForm.time))
      nextErrors.time = MESSAGES.TIME_VALIDATION;

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;
    if (!validateEditForm()) {
      setMessage({ type: "error", text: MESSAGES.FORM_ERROR });
      return;
    }

    setLoading(true);
    try {
      const updateData = { ...editForm };
      delete updateData._id;
      const result = await appointmentService.update(editingId, updateData);
      if (!result.success) throw new Error(result.error || "Unknown error");

      const updated = appointments.map((appointment) =>
        appointment._id === editingId ? { ...result.data } : appointment,
      );
      setAppointments(updated);
      setDashboardStats(calculateDashboardStats(updated));
      setEditingId(null);
      setEditForm(null);
      setEditErrors({});
      setMessage({ type: "success", text: MESSAGES.UPDATE_SUCCESS });
    } catch (error) {
      console.error("Could not update appointment:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : MESSAGES.UPDATE_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await appointmentService.remove(id);
      if (!result.success) throw new Error(result.error || "Unknown error");

      const updated = appointments.map((appointment) =>
        appointment._id === id ? result.data : appointment,
      );
      setAppointments(updated);
      setDashboardStats(calculateDashboardStats(updated));
      setDeleteTarget(null);
      setMessage({ type: "success", text: MESSAGES.CANCEL_SUCCESS });
    } catch (error) {
      console.error("Could not cancel appointment:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : MESSAGES.CANCEL_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (
    field: keyof Appointment,
    value: string | number,
  ) => {
    if (!editForm || field === "_id") return;

    // Changing the service should immediately keep the derived price in sync.
    const selectedService =
      field === "serviceName"
        ? services.find((service) => service.name === value)
        : undefined;
    setEditForm({
      ...editForm,
      [field]: value,
      ...(selectedService ? { price: selectedService.price } : {}),
    });
    setEditErrors((current) => {
      const next = { ...current };
      delete next[field as keyof EditErrors];
      return next;
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditErrors({});
  };

  const filteredAppointments = filterDate
    ? appointments.filter((appointment) => appointment.date === filterDate)
    : appointments;
  const sortedAppointments = [...filteredAppointments].sort((first, second) =>
    first.date !== second.date
      ? first.date.localeCompare(second.date)
      : first.time.localeCompare(second.time),
  );
  const recentAppointments = [...appointments]
    .sort((first, second) => {
      if (first.timestamp !== second.timestamp)
        return (second.timestamp || 0) - (first.timestamp || 0);
      if (first.date !== second.date)
        return second.date.localeCompare(first.date);
      return second.time.localeCompare(first.time);
    })
    .slice(0, 5);
  const minFilterDate = appointments.reduce(
    (earliest, appointment) =>
      appointment.date < earliest ? appointment.date : earliest,
    `${today.getFullYear() - 5}-01-01`,
  );
  const maxFilterDate = appointments.reduce(
    (latest, appointment) =>
      appointment.date > latest ? appointment.date : latest,
    `${today.getFullYear() + 1}-12-31`,
  );

  return {
    activeTab,
    appointments,
    filteredAppointments,
    sortedAppointments,
    recentAppointments,
    cancelEdit,
    checkingAuth,
    clearingFilter,
    dashboardStats,
    todayDate,
    editLimitDate,
    maxFilterDate,
    minFilterDate,
    deleteTarget,
    editErrors,
    editForm,
    editingId,
    filterDate,
    handleClearFilter,
    handleDelete,
    handleEdit,
    handleEditChange,
    handleLogin,
    handleLogout,
    handleSave,
    allowedTimes,
    isAuthenticated,
    loading,
    message,
    password,
    services,
    setActiveTab,
    setDeleteTarget,
    setFilterDate,
    setMessage,
    setPassword,
    setShowPassword,
    showPassword,
  };
}
