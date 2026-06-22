import { FormEvent, useEffect, useRef, useState } from "react";
import { authService } from "../services/authService";
import { schedulingService } from "../services/schedulingService";
import { defaultServices, listServices } from "../services/serviceCatalog";
import { ApiError } from "../services/api";
import { Agendamento, DashboardStats, Servico } from "../types/scheduling";
import { calculateDashboardStats } from "../utils/dashboard";
import { toDateValue } from "../utils/date";

export type AdminMessage = {
  type: "success" | "error";
  text: string;
} | null;

export type EditErrors = Partial<
  Record<"nome" | "telefone" | "servico" | "preco" | "data" | "horario", string>
>;

const initialDashboardStats: DashboardStats = {
  lucroHoje: 0,
  lucroMensal: 0,
  totalAgendamentos: 0,
  mediaDiaria: 0,
  agendamentosHoje: 0,
  agendamentosMes: 0,
  atendimentosHoje: 0,
  atendimentosMes: 0,
  pendentesMes: 0,
  ausentesMes: 0,
  lucrosPorDia: {},
  servicosMaisPopulares: []
};

export function useAdminPanel() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Agendamento | null>(null);
  const [filterDate, setFilterDate] = useState(() => toDateValue(new Date()));
  const [clearingFilter, setClearingFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AdminMessage>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agendamento | null>(null);
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [servicos, setServicos] = useState<Servico[]>(defaultServices);
  const [activeTab, setActiveTab] = useState<"agendamentos" | "dashboard">("dashboard");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialDashboardStats);
  const loadingAppointmentsRef = useRef(false);

  const today = new Date();
  const dataHoje = toDateValue(today);
  const editLimit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
  const dataLimiteEdicao = toDateValue(editLimit);
  const horariosPermitidos = Array.from({ length: 23 }, (_, index) => {
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
    authService.getSession()
      .then(() => setIsAuthenticated(true))
      .catch(() => authService.logout())
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    listServices()
      .then((result) => {
        if (result.success && result.data.length) setServicos(result.data);
      })
      .catch(() => setServicos(defaultServices));
  }, []);

  const loadAgendamentos = async (silent = false) => {
    if (loadingAppointmentsRef.current) return;

    loadingAppointmentsRef.current = true;
    if (!silent) setLoading(true);

    try {
      const { data, success } = await schedulingService.listAdmin();
      if (success) {
        setAgendamentos(data);
        setDashboardStats(calculateDashboardStats(data));
        setMessage((current) =>
          current?.text === "Não foi possível atualizar os dados do painel." ? null : current
        );
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      if (error instanceof ApiError && error.status === 401) {
        authService.logout();
        setIsAuthenticated(false);
        setMessage({ type: "error", text: "Sua sessão expirou. Entre novamente." });
        return;
      }
      if (!silent) {
        setMessage({ type: "error", text: "Não foi possível atualizar os dados do painel." });
      }
    } finally {
      loadingAppointmentsRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    void loadAgendamentos();
    const interval = window.setInterval(() => void loadAgendamentos(true), 30000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setMessage({ type: "error", text: "Informe a senha de administrador para entrar." });
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        authService.login(password),
        new Promise((resolve) => window.setTimeout(resolve, 700))
      ]);
      setIsAuthenticated(true);
      setPassword("");
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível entrar."
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

  const handleEdit = (appointment: Agendamento) => {
    if (!appointment._id) return;

    setEditingId(appointment._id);
    setEditForm({ ...appointment });
    setEditErrors({});
    setMessage(null);
    if (activeTab === "dashboard") {
      setFilterDate(appointment.data);
      setActiveTab("agendamentos");
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
    const name = editForm.nome.trim().replace(/\s+/g, " ");
    const phone = editForm.telefone.replace(/\D/g, "");
    const original = agendamentos.find((appointment) => appointment._id === editingId);

    if (name.length < 3 || name.split(" ").length < 2) nextErrors.nome = "Informe nome e sobrenome.";
    if (!/^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(phone)) nextErrors.telefone = "Telefone inválido com DDD.";
    if (!servicos.some((service) => service.nome === editForm.servico)) nextErrors.servico = "Selecione um serviço válido.";
    if (!editForm.preco || editForm.preco < 0) nextErrors.preco = "Informe um preço válido.";
    if (!editForm.data) {
      nextErrors.data = "Escolha uma data.";
    } else if (editForm.data !== original?.data && (editForm.data < dataHoje || editForm.data > dataLimiteEdicao)) {
      nextErrors.data = "Escolha uma data entre hoje e os próximos 30 dias.";
    }
    if (!horariosPermitidos.includes(editForm.horario)) nextErrors.horario = "Escolha um horário válido.";

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;
    if (!validateEditForm()) {
      setMessage({ type: "error", text: "Revise os campos destacados antes de salvar." });
      return;
    }

    setLoading(true);
    try {
      const updateData = { ...editForm };
      delete updateData._id;
      const result = await schedulingService.update(editingId, updateData);
      if (!result.success) throw new Error(result.error || "Erro desconhecido");

      const updated = agendamentos.map((appointment) =>
        appointment._id === editingId ? { ...result.data } : appointment
      );
      setAgendamentos(updated);
      setDashboardStats(calculateDashboardStats(updated));
      setEditingId(null);
      setEditForm(null);
      setEditErrors({});
      setMessage({ type: "success", text: "Agendamento atualizado com sucesso." });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível atualizar o agendamento."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await schedulingService.remove(id);
      if (!result.success) throw new Error(result.error || "Erro desconhecido");

      const updated = agendamentos.map((appointment) =>
        appointment._id === id ? result.data : appointment
      );
      setAgendamentos(updated);
      setDashboardStats(calculateDashboardStats(updated));
      setDeleteTarget(null);
      setMessage({ type: "success", text: "Agendamento cancelado com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível excluir o agendamento."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof Agendamento, value: string | number) => {
    if (!editForm || field === "_id") return;

    const selectedService = field === "servico"
      ? servicos.find((service) => service.nome === value)
      : undefined;
    setEditForm({
      ...editForm,
      [field]: value,
      ...(selectedService ? { preco: selectedService.preco } : {})
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

  const agendamentosFiltrados = filterDate
    ? agendamentos.filter((appointment) => appointment.data === filterDate)
    : agendamentos;
  const agendamentosOrdenados = [...agendamentosFiltrados].sort((first, second) =>
    first.data !== second.data
      ? first.data.localeCompare(second.data)
      : first.horario.localeCompare(second.horario)
  );
  const agendamentosRecentes = [...agendamentos]
    .sort((first, second) => {
      if (first.timestamp !== second.timestamp) return (second.timestamp || 0) - (first.timestamp || 0);
      if (first.data !== second.data) return second.data.localeCompare(first.data);
      return second.horario.localeCompare(first.horario);
    })
    .slice(0, 5);
  const dataMinimaFiltro = agendamentos.reduce(
    (earliest, appointment) => appointment.data < earliest ? appointment.data : earliest,
    `${today.getFullYear() - 5}-01-01`
  );
  const dataMaximaFiltro = agendamentos.reduce(
    (latest, appointment) => appointment.data > latest ? appointment.data : latest,
    `${today.getFullYear() + 1}-12-31`
  );

  return {
    activeTab,
    agendamentos,
    agendamentosFiltrados,
    agendamentosOrdenados,
    agendamentosRecentes,
    cancelEdit,
    checkingAuth,
    clearingFilter,
    dashboardStats,
    dataHoje,
    dataLimiteEdicao,
    dataMaximaFiltro,
    dataMinimaFiltro,
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
    horariosPermitidos,
    isAuthenticated,
    loading,
    message,
    password,
    servicos,
    setActiveTab,
    setDeleteTarget,
    setFilterDate,
    setMessage,
    setPassword,
    setShowPassword,
    showPassword
  };
}
