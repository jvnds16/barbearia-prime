import { useState, useEffect, useRef, ChangeEvent, FocusEvent, FormEvent } from "react";
import { Calendar, Scissors, X, RefreshCw, CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import {
  IconAlarm,
  IconAlertSquareRounded,
  IconBrandMessenger,
  IconPhone,
  IconUserFilled,
} from '@tabler/icons-react';
import { schedulingService } from "../services/schedulingService";
import { defaultServices, listServices } from "../services/serviceCatalog";
import { Agendamento } from "../types/scheduling";
import { ApiError } from "../services/api";
import { PublicDatePicker } from "../components/PublicDatePicker";
import {
  createAvailableTimes,
  formatPhone,
  hasAppointmentConflict,
  isValidPhone,
  sanitizePublicAppointments
} from "../utils/appointment";
import { formatDisplayDate } from "../utils/date";
import { SchedulingModals } from "../components/scheduling/SchedulingModals";
import { usePublicAgenda } from "../hooks/usePublicAgenda";
import { ContactSection, HomeHero, MobileMenu, ServicesSection } from "../components/home/HomeSections";
import { AvailabilityPanel } from "../components/scheduling/AvailabilityPanel";

type FormField = "nome" | "telefone" | "servico" | "data" | "horario";
type FormErrors = Partial<Record<FormField, string>>;
type StatusModal = {
  type: "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
} | null;
function App() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [statusModal, setStatusModal] = useState<StatusModal>(null);
  const [formData, setFormData] = useState<Agendamento>({
    nome: "",
    telefone: "",
    servico: "",
    data: "",
    horario: "",
  });
  const [servicos, setServicos] = useState(defaultServices);
  const schedulingInFlightRef = useRef(false);
  const {
    agendaRequestSequenceRef, agendamentos, atualizarAgendaManual, dataAtual,
    fetchAgendamentos, getAgendamentosPorData, getDataAmanha, getDataAtual,
    getHoraAtual, horaAtual, isAmanha, isHoje, refreshingAgenda,
    setAgendamentos, setShowRefreshNotification, showRefreshNotification
  } = usePublicAgenda();

  useEffect(() => {
    const carregarServicos = async () => {
      try {
        const result = await listServices();
        if (result.success && result.data?.length) {
          setServicos(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar serviços da API, usando a alternativa local:", error);
      }
    };

    carregarServicos();
  }, []);

  const getDataMinima = (): string => {
    return getDataAtual();
  };

  const getDataMaxima = (): string => {
    const agora = new Date();
    const dataMaxima = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 30);
    const ano = dataMaxima.getFullYear();
    const mes = (dataMaxima.getMonth() + 1).toString().padStart(2, '0');
    const dia = dataMaxima.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const horariosDisponiveisBase = createAvailableTimes();
  const selectedService = servicos.find(s => s.nome === formData.servico);
  const selectedServiceDuration = Number.parseInt(selectedService?.duracao || "30", 10) || 30;

  const horariosFiltrados = formData.data ? horariosDisponiveisBase.filter((h) => {
    const ocupado = hasAppointmentConflict(
      agendamentos,
      formData.data,
      h,
      selectedServiceDuration
    );

    if (isHoje(formData.data)) {
      const horaAtual = getHoraAtual();
      const minutosAtuais = parseInt(horaAtual.split(":")[0]) * 60 + parseInt(horaAtual.split(":")[1]);
      const minutosAgendamento = parseInt(h.split(":")[0]) * 60 + parseInt(h.split(":")[1]);
      return (minutosAgendamento > minutosAtuais + 30) && !ocupado;
    }

    return !ocupado;
  }) : horariosDisponiveisBase;

  const validateField = (name: FormField, value: string, data = formData): string => {
    const cleanedValue = value.trim();

    if (name === "nome") {
      if (!cleanedValue) return "Informe seu nome completo.";
      if (cleanedValue.length < 3) return "O nome precisa ter pelo menos 3 caracteres.";
      if (cleanedValue.replace(/\s+/g, " ").split(" ").length < 2) {
        return "Informe nome e sobrenome.";
      }
    }

    if (name === "telefone") {
      if (!cleanedValue) return "Informe um telefone com DDD.";
      if (!isValidPhone(cleanedValue)) return "Use um telefone válido. Ex.: (27) 91234-5678.";
    }

    if (name === "servico" && !cleanedValue) {
      return "Selecione um serviço.";
    }

    if (name === "servico" && !servicos.some((servico) => servico.nome === cleanedValue)) {
      return "Selecione um serviço válido.";
    }

    if (name === "data") {
      if (!cleanedValue) return "Escolha uma data.";

      const dataSelecionada = new Date(cleanedValue + 'T00:00:00');
      const dataHoje = new Date(getDataAtual() + 'T00:00:00');
      const dataMaxima = new Date(getDataMaxima() + 'T00:00:00');

      if (Number.isNaN(dataSelecionada.getTime())) return "Escolha uma data valida.";
      if (dataSelecionada < dataHoje) return "Escolha uma data a partir de hoje.";
      if (dataSelecionada > dataMaxima) return "Agende com, no máximo, 30 dias de antecedência.";
    }

    if (name === "horario") {
      if (!cleanedValue) return "Escolha um horário.";
      if (data.data && !horariosFiltrados.includes(cleanedValue)) {
        return "Este horário não está disponível para a data selecionada.";
      }
    }

    return "";
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {
      nome: validateField("nome", formData.nome),
      telefone: validateField("telefone", formData.telefone),
      servico: validateField("servico", formData.servico),
      data: validateField("data", formData.data),
      horario: validateField("horario", formData.horario),
    };

    const conflito = agendamentos.find(
      (a: Agendamento) => a.status !== "cancelado" && a.data === formData.data && a.horario === formData.horario
    );

    if (conflito) {
      nextErrors.horario = "Este horário acabou de ser ocupado. Escolha outro.";
    }

    const cleanErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value))
    ) as FormErrors;

    setFieldErrors(cleanErrors);

    if (Object.keys(cleanErrors).length > 0) {
      setError("Revise os campos destacados antes de continuar.");
      return false;
    }

    if (!selectedService?.preco) {
      setError("Preço do serviço não encontrado. Tente novamente.");
      return false;
    }

    setError(null);
    return true;
  };

  const getFieldClass = (field: FormField) =>
    `w-full rounded-lg border bg-zinc-950/70 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-400/30 ${
      fieldErrors[field]
        ? "border-red-400/80 focus:border-red-300"
        : "border-zinc-700 hover:border-zinc-500 focus:border-amber-400"
    }`;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FormField;
    const nextValue = fieldName === "telefone" ? formatPhone(value) : value;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: nextValue,
      ...(fieldName === "data" ? { horario: "" } : {}),
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      if (fieldName === "data") delete next.horario;
      return next;
    });
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      data: value,
      horario: "",
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.data;
      delete next.horario;
      return next;
    });
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = e.target.name as FormField;
    const message = validateField(fieldName, e.target.value);

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[fieldName] = message;
      } else {
        delete next[fieldName];
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      const requestSequence = ++agendaRequestSequenceRef.current;
      const result = await schedulingService.list({ data: formData.data });
      const latestAppointments = sanitizePublicAppointments(result.data || []);
      const otherDates = agendamentos.filter((appointment) => appointment.data !== formData.data);
      const synchronizedAppointments = [...otherDates, ...latestAppointments];

      if (requestSequence === agendaRequestSequenceRef.current) {
        setAgendamentos(synchronizedAppointments);
        localStorage.setItem("agendamentos", JSON.stringify(synchronizedAppointments));
        localStorage.setItem("agendamentosTimestamp", Date.now().toString());
      }

      if (
        hasAppointmentConflict(
          latestAppointments,
          formData.data,
          formData.horario,
          selectedServiceDuration
        )
      ) {
        setFieldErrors((current) => ({
          ...current,
          horario: "Este horário acabou de ser ocupado. Escolha outro."
        }));
        setError("A agenda foi atualizada. Escolha outro horário disponível.");
        return;
      }
    } catch (error) {
      console.error("Não foi possível sincronizar a agenda antes da revisão:", error);
      setError("Não foi possível atualizar os horários agora. Verifique sua conexão e tente novamente.");
      return;
    }

    setReviewModalOpen(true);
  };

  const confirmarAgendamento = async () => {
    if (schedulingInFlightRef.current) return;

    if (!validateForm()) {
      setReviewModalOpen(false);
      return;
    }

    setReviewModalOpen(false);
    setError(null);
    setLoading(true);
    setSuccessMessage("");

    if (!isValidPhone(formData.telefone)) {
      setError("⚠️ Por favor, insira um telefone válido com DDD. Ex: (27) 91234-5678");
      setLoading(false);
      return;
    }

    const dataSelecionada = new Date(formData.data + 'T00:00:00');
    const dataHoje = new Date(getDataAtual() + 'T00:00:00');

    if (dataSelecionada < dataHoje) {
      setError("⚠️ Não é possível marcar para datas passadas. Por favor, escolha uma data futura.");
      setLoading(false);
      return;
    }

    if (isHoje(formData.data)) {
      const horaAtual = getHoraAtual();
      const minutosAtuais = parseInt(horaAtual.split(":")[0]) * 60 + parseInt(horaAtual.split(":")[1]);
      const minutosAgendamento = parseInt(formData.horario.split(":")[0]) * 60 + parseInt(formData.horario.split(":")[1]);

      if (minutosAgendamento <= minutosAtuais + 30) {
        setError("⚠️ Para agendamentos de hoje, escolha um horário com pelo menos 30 minutos de antecedência.");
        setLoading(false);
        return;
      }
    }

    if (!formData.servico) {
      setError("Por favor, selecione um serviço.");
      setLoading(false);
      return;
    }

    const conflito = agendamentos.find(
      (a: Agendamento) => a.status !== "cancelado" && a.data === formData.data && a.horario === formData.horario
    );

    if (conflito) {
      const mensagemConflito = encodeURIComponent(
        `Olá! Vi que o horário ${formData.horario} do dia ${formatDisplayDate(formData.data)} está ocupado.` +
        ` Gostaria de verificar outros horários disponíveis para o serviço ${formData.servico}.`
      );
      const numeroBarbearia = "5527981911375";
      window.open(`https://wa.me/${numeroBarbearia}?text=${mensagemConflito}`, "_blank");
      setError("Esse horário já está ocupado. Redirecionando para o WhatsApp do barbeiro para verificar outros horários...");
      setLoading(false);
      return;
    }

    const servicoSelecionado = servicos.find(s => s.nome === formData.servico);
    const preco = servicoSelecionado?.preco || 0;

    if (!preco || preco === 0) {
      setError("⚠️ Erro: Preço do serviço não encontrado. Tente novamente.");
      setLoading(false);
      return;
    }

    const novoAgendamento: Agendamento = {
      ...formData,
      preco,
      idempotencyKey: crypto.randomUUID(),
      timestamp: new Date().getTime()
    };

    schedulingInFlightRef.current = true;

    try {
      const result = await schedulingService.create({
        ...novoAgendamento,
        timestamp: new Date().getTime(),
        status: 'pendente'
      });
      console.log('Resposta do servidor:', result);

      const mensagem = encodeURIComponent(
        `*Novo Agendamento Confirmado* 📅\n\n` +
        `👤 Nome: ${formData.nome}\n` +
        `📞 Telefone: ${formData.telefone}\n` +
        `✂️ Serviço: ${formData.servico}\n` +
        `📅 Data: ${formatDisplayDate(formData.data)}\n` +
        `⏰ Horário: ${formData.horario}\n` +
        `✅ Confirmação automática via site\n\n` +
        `📲 *Link do Agendamento:* ${window.location.origin}/`
      );
      const whatsappUrl = `https://wa.me/5527981911375?text=${mensagem}`;

      const agendamentoPublico = sanitizePublicAppointments([result.data])[0];
      setAgendamentos((agendamentosAtuais) => {
        const semHorarioDuplicado = agendamentosAtuais.filter(
          (agendamento) =>
            agendamento.data !== agendamentoPublico.data ||
            agendamento.horario !== agendamentoPublico.horario
        );
        const novosAgendamentos = [...semHorarioDuplicado, agendamentoPublico];
        localStorage.setItem("agendamentos", JSON.stringify(novosAgendamentos));
        localStorage.setItem("agendamentosTimestamp", Date.now().toString());
        return novosAgendamentos;
      });

      setSuccessMessage("Agendamento realizado com sucesso!");
      setStatusModal({
        type: "success",
        title: "Agendamento confirmado",
        message: "Seu horário foi registrado e a agenda já foi atualizada. Esta confirmação fechará automaticamente.",
        actionUrl: whatsappUrl,
        actionLabel: "Abrir WhatsApp"
      });

      void fetchAgendamentos(true, false);

    } catch (error: unknown) {
      console.error("Erro ao salvar agendamento:", error);

      if (error instanceof ApiError) {
        const isConflict = error.status === 409;

        if (isConflict) {
          setFieldErrors((prev) => ({
            ...prev,
            horario: "Este horário acabou de ser ocupado. Escolha outro."
          }));
          await fetchAgendamentos(true, false);
        }

        setStatusModal({
          type: "error",
          title: isConflict ? "Horário indisponível" : "Não foi possível agendar",
          message: error.message
        });
        setError(error.message);
        setLoading(false);
        return;
      }

      setStatusModal({
        type: "error",
        title: "Não foi possível confirmar",
        message: error instanceof TypeError
          ? "A conexão foi interrompida. Verifique sua internet e tente novamente."
          : "Não foi possível concluir o agendamento. Tente novamente."
      });
      setError(
        error instanceof TypeError
          ? "A conexão foi interrompida. Verifique sua internet e tente novamente."
          : "Não foi possível concluir o agendamento. Tente novamente."
      );
      setLoading(false);
      return;
    } finally {
      schedulingInFlightRef.current = false;
    }

    setFormData({
      nome: "",
      telefone: "",
      servico: "",
      data: "",
      horario: "",
    });

    setLoading(false);
  };

  useEffect(() => {
    if (menuOpen || reviewModalOpen || statusModal || refreshingAgenda) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen, reviewModalOpen, statusModal, refreshingAgenda]);

  useEffect(() => {
    if (!error) return;

    const errorTimer = window.setTimeout(() => {
      setError(null);
    }, 5000);

    return () => window.clearTimeout(errorTimer);
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;

    const successTimer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(successTimer);
  }, [successMessage]);

  useEffect(() => {
    if (statusModal?.type !== "success") return;

    const closeTimer = window.setTimeout(() => {
      setStatusModal(null);
    }, 4000);

    return () => window.clearTimeout(closeTimer);
  }, [statusModal]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {showRefreshNotification && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-black px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="font-semibold">Agenda atualizada!</span>
          <button
            onClick={() => setShowRefreshNotification(false)}
            className="ml-2 text-black hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {refreshingAgenda && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refresh-agenda-title"
          aria-describedby="refresh-agenda-description"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 text-center shadow-2xl shadow-black/70">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-amber-400/15" />
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-400/60" />
              <RefreshCw className="h-6 w-6 text-amber-300" />
            </div>
            <h3 id="refresh-agenda-title" className="text-xl font-bold text-white">
              Atualizando horários
            </h3>
            <p id="refresh-agenda-description" className="mt-2 text-sm leading-6 text-zinc-400">
              Aguarde enquanto buscamos os horários ocupados mais recentes.
            </p>
            <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"
                  style={{ animationDelay: `${item * 160}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <SchedulingModals
        reviewOpen={reviewModalOpen}
        status={statusModal}
        appointment={formData}
        selectedService={selectedService}
        loading={loading}
        onCloseReview={() => setReviewModalOpen(false)}
        onConfirm={confirmarAgendamento}
        onCloseStatus={() => setStatusModal(null)}
      />

      <div className={`transition-all duration-300 ${menuOpen ? 'blur-sm opacity-80' : 'blur-0 opacity-100'}`}>
        <HomeHero
          menuOpen={menuOpen}
          dataAtual={dataAtual}
          horaAtual={horaAtual}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
        />
        <ServicesSection
          services={servicos}
          onSelect={(service) => setFormData({ ...formData, servico: service.nome })}
        />

        <section id="booking" className="py-20 bg-black">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                <Calendar className="h-4 w-4" />
                Agendamento online
              </span>
              <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Agende seu horário</h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">
                Escolha o serviço, a melhor data e confirme seus dados em poucos passos.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/50 sm:p-8 lg:flex-1">
                <div className="mb-7 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4">
                  <p className="text-amber-200 text-sm font-semibold">
                    <IconBrandMessenger className="inline-block mr-1" />
                    Horário de Funcionamento: de segunda a sábado.
                    Agendamentos disponíveis das 08:00 às 19:00, com intervalo para almoço das 12:00 às 13:00.
                  </p>
                  <p className="text-zinc-300 text-xs mt-1">
                    Caso não veja horários disponíveis, tente novamente após esse horário ou entre em contato via WhatsApp.
                  </p>
                </div>

                {successMessage && (
                  <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {successMessage}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4" role="alert">
                    <p className="flex items-start gap-2 text-sm font-semibold text-red-300">
                      <IconAlertSquareRounded className="mt-0.5 shrink-0" size={18} />
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor="nome">Nome completo</label>
                    <div className="group relative">
                      <IconUserFilled className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" size={19} />
                      <input
                        id="nome"
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("nome")} pl-11`}
                        placeholder="Ex: João Silva"
                        autoComplete="name"
                        maxLength={80}
                        aria-invalid={Boolean(fieldErrors.nome)}
                        aria-describedby={fieldErrors.nome ? "nome-error" : undefined}
                        required
                      />
                    </div>
                    {fieldErrors.nome && <p id="nome-error" role="alert" className="text-xs font-medium text-red-300">{fieldErrors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor="telefone">Telefone</label>
                    <div className="group relative">
                      <IconPhone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" size={20} />
                      <input
                        id="telefone"
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("telefone")} pl-11`}
                        placeholder="(27) 91234-5678"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        aria-invalid={Boolean(fieldErrors.telefone)}
                        aria-describedby={fieldErrors.telefone ? "telefone-error" : "telefone-hint"}
                        required
                      />
                    </div>
                    {fieldErrors.telefone ? (
                      <p id="telefone-error" role="alert" className="text-xs font-medium text-red-300">{fieldErrors.telefone}</p>
                    ) : (
                      <p id="telefone-hint" className="text-xs text-zinc-500">Informe o DDD e o número do WhatsApp.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor="servico">Serviço</label>
                    <div className="group relative">
                      <Scissors className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                      <select
                        id="servico"
                        name="servico"
                        value={formData.servico}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("servico")} appearance-none pl-11 pr-11`}
                        aria-invalid={Boolean(fieldErrors.servico)}
                        aria-describedby={fieldErrors.servico ? "servico-error" : "servico-hint"}
                        required
                      >
                        <option value="">Selecione o serviço</option>
                        {servicos.map((s) => (
                          <option key={s._id || s.nome} value={s.nome}>{s.nome}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                    </div>
                    {fieldErrors.servico ? (
                      <p id="servico-error" role="alert" className="text-xs font-medium text-red-300">{fieldErrors.servico}</p>
                    ) : selectedService ? (
                      <p id="servico-hint" className="flex items-center gap-2 text-xs text-amber-300">
                        <span className="font-bold">R$ {selectedService.preco.toFixed(2)}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        {selectedService.duracao}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor="data">Data do agendamento</label>
                    <PublicDatePicker
                      value={formData.data}
                      min={getDataMinima()}
                      max={getDataMaxima()}
                      invalid={Boolean(fieldErrors.data)}
                      describedBy={fieldErrors.data ? "data-error" : "data-hint"}
                      onChange={handleDateChange}
                    />
                    {fieldErrors.data ? (
                      <p id="data-error" role="alert" className="text-xs font-medium text-red-300">{fieldErrors.data}</p>
                    ) : formData.data ? (
                      <p id="data-hint" className="text-xs text-amber-300">
                        {formatDisplayDate(formData.data)}
                        {isHoje(formData.data) && " (Hoje)"}
                        {isAmanha(formData.data) && " (Amanhã)"}
                      </p>
                    ) : (
                      <p id="data-hint" className="text-xs text-zinc-500">Você pode agendar com até 30 dias de antecedência.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-zinc-200" htmlFor="horario">Horário disponível</label>
                    <div className="group relative">
                      <IconAlarm className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" size={20} />
                      <select
                        id="horario"
                        name="horario"
                        value={formData.horario}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("horario")} appearance-none pl-11 pr-11`}
                        aria-invalid={Boolean(fieldErrors.horario)}
                        aria-describedby={fieldErrors.horario ? "horario-error" : "horario-hint"}
                        required
                      >
                        <option value="">Selecione um horário</option>
                        {horariosFiltrados.length === 0 ? (
                          <option disabled>Nenhum horário disponível para esta data</option>
                        ) : (
                          horariosFiltrados.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                    </div>
                    {fieldErrors.horario ? (
                      <p id="horario-error" role="alert" className="text-xs font-medium text-red-300">{fieldErrors.horario}</p>
                    ) : (
                      <p id="horario-hint" className="text-xs text-zinc-500">
                        {formData.data
                          ? `${horariosFiltrados.length} horário(s) disponível(is)`
                          : "Escolha uma data para consultar os horários."}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-4 font-bold text-black shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:shadow-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Revisar agendamento
                        <ChevronDown className="h-4 w-4 -rotate-90 transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                  <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
                    <ShieldCheck className="h-4 w-4 text-amber-400/80" />
                    Seus dados são usados apenas para confirmar o agendamento.
                  </p>
                </form>
              </div>

              <AvailabilityPanel
                today={getAgendamentosPorData(getDataAtual())}
                tomorrow={getAgendamentosPorData(getDataAmanha())}
                refreshing={refreshingAgenda}
                onRefresh={atualizarAgendaManual}
              />
            </div>
          </div>
        </section>

        <ContactSection />
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

export default App;
