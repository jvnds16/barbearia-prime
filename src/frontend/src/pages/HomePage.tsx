import { useState, useEffect, useRef, ChangeEvent, FocusEvent, FormEvent } from "react";
import { Scissors, Instagram, Menu, X, Clock, Calendar, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import {
  IconAlarm,
  IconScissors,
  IconAlertSquareRounded,
  IconCalendarEvent,
  IconBrandMessenger,
  IconPhone,
  IconCurrencyReal,
  IconUserFilled,
  IconBrandWhatsapp,
  IconMapPinFilled
} from '@tabler/icons-react';
import { schedulingService } from "../services/schedulingService";
import { defaultServices, listServices } from "../services/serviceCatalog";
import { Agendamento } from "../types/scheduling";
import { ApiError } from "../services/api";

type FormField = "nome" | "telefone" | "servico" | "data" | "horario";
type FormErrors = Partial<Record<FormField, string>>;
type StatusModal = {
  type: "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
} | null;
type RefreshResult = "remote" | "local" | "empty";

const sanitizePublicAppointments = (appointments: Agendamento[]): Agendamento[] =>
  appointments.map(({ data, horario, status, duracaoMinutos }) => ({
    nome: "",
    telefone: "",
    servico: "",
    data,
    horario,
    status,
    duracaoMinutos
  }));

type DatePickerProps = {
  value: string;
  min: string;
  max: string;
  invalid: boolean;
  describedBy: string;
  onChange: (value: string) => void;
};

const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function DatePicker({ value, min, max, invalid, describedBy, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = value ? parseLocalDate(value) : parseLocalDate(min);
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const minDate = parseLocalDate(min);
  const maxDate = parseLocalDate(max);
  const selectedDate = value ? parseLocalDate(value) : null;
  const todayValue = toDateValue(new Date());

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!value) return;
    const nextDate = parseLocalDate(value);
    setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value]);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const canGoPrevious = previousMonth >= minMonth;
  const canGoNext = nextMonth <= maxMonth;
  const monthTitle = visibleMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
  const formattedMonthTitle = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const selectDate = (date: Date) => {
    onChange(toDateValue(date));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id="data"
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center justify-between rounded-lg border bg-zinc-950/70 px-4 py-3 text-left outline-none transition focus:ring-2 focus:ring-amber-400/30 ${
          invalid
            ? "border-red-400/80 focus:border-red-300"
            : "border-zinc-700 hover:border-zinc-500 focus:border-amber-400"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      >
        <span className={selectedDate ? "text-white" : "text-zinc-500"}>
          {selectedDate
            ? selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
            : "Escolha uma data"}
        </span>
        <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300 transition group-hover:border-amber-400/45 group-focus:border-amber-300/70 group-focus:bg-amber-400/20">
          <IconCalendarEvent size={19} stroke={1.8} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Escolher data do agendamento"
          className="absolute left-0 top-[calc(100%+0.6rem)] z-50 w-full min-w-[19rem] rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl shadow-black/70 sm:w-[22rem]"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => canGoPrevious && setVisibleMonth(previousMonth)}
              disabled={!canGoPrevious}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <strong className="text-sm text-white">
              {formattedMonthTitle}
            </strong>
            <button
              type="button"
              onClick={() => canGoNext && setVisibleMonth(nextMonth)}
              disabled={!canGoNext}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`} className="py-1 text-[0.65rem] font-bold uppercase text-zinc-600">
                {day}
              </span>
            ))}
            {days.map((date) => {
              const dateValue = toDateValue(date);
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isDisabled = !isCurrentMonth || date.getDay() === 0 || date < minDate || date > maxDate;
              const isSelected = dateValue === value;
              const isToday = dateValue === todayValue;

              return (
                <button
                  key={dateValue}
                  type="button"
                  onClick={() => selectDate(date)}
                  disabled={isDisabled}
                  className={`relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? "bg-amber-400 text-black shadow-md shadow-amber-500/20"
                      : isDisabled
                        ? "cursor-not-allowed text-zinc-800"
                        : "text-zinc-300 hover:bg-amber-400/10 hover:text-amber-300"
                  }`}
                  aria-label={date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                  aria-pressed={isSelected}
                >
                  {date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500">Disponível por até 30 dias</span>
            <button
              type="button"
              onClick={() => selectDate(minDate)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-400/10"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [horaAtual, setHoraAtual] = useState<string>("");
  const [dataAtual, setDataAtual] = useState<string>("");
  const [showRefreshNotification, setShowRefreshNotification] = useState<boolean>(false);
  const [refreshingAgenda, setRefreshingAgenda] = useState<boolean>(false);
  const [servicos, setServicos] = useState(defaultServices);
  const schedulingInFlightRef = useRef(false);

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

  const getDataAtual = (): string => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const dia = agora.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

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

  const getHoraAtual = (): string => {
    const agora = new Date();
    return `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const atualizarTempo = () => {
      const agora = new Date();
      const hora = agora.toLocaleTimeString("pt-BR", { hour12: false });
      const data = agora.toLocaleDateString("pt-BR");
      setHoraAtual(hora);
      setDataAtual(data);

      if (hora === "20:00:00") {
        console.log("🕗 São 20:00 - Forçando refresh dos agendamentos...");
        fetchAgendamentos(true);
      }
    };

    atualizarTempo();
    const timer = setInterval(atualizarTempo, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAgendamentos = async (forceRefresh: boolean = false, notifyOnSuccess: boolean = true): Promise<RefreshResult> => {
    try {
      const localData = localStorage.getItem('agendamentos');
      let hasLocalData = false;
      if (localData) {
        const parsedData = sanitizePublicAppointments(JSON.parse(localData));
        localStorage.setItem('agendamentos', JSON.stringify(parsedData));
        setAgendamentos(parsedData);
        hasLocalData = true;
        console.log('📂 Agendamentos carregados do localStorage:', parsedData.length);
      }

      if (forceRefresh) {
        console.log('🔄 Buscando agendamentos da API...');
        const result = await schedulingService.list();
        if (result.success && result.data) {
          const publicAppointments = sanitizePublicAppointments(result.data);
          localStorage.setItem('agendamentos', JSON.stringify(publicAppointments));
          localStorage.setItem('agendamentosTimestamp', new Date().getTime().toString());
          setAgendamentos(publicAppointments);
          if (notifyOnSuccess) {
            setShowRefreshNotification(true);
            setTimeout(() => setShowRefreshNotification(false), 5000);
          }
          return "remote";
        }

        return hasLocalData ? "local" : "empty";
      }

      return hasLocalData ? "local" : "empty";
    } catch (err) {
      console.error("Erro ao buscar agendamentos da API, usando localStorage:", err);
      const localData = localStorage.getItem('agendamentos');
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
    setError(null);

    try {
      await Promise.all([
        fetchAgendamentos(true, false),
        new Promise((resolve) => window.setTimeout(resolve, 900))
      ]);
    } catch (error) {
      console.error("Erro ao atualizar agenda manualmente:", error);
    } finally {
      setRefreshingAgenda(false);
    }
  };

  const limparDadosAntigos = () => {
    const timestamp = localStorage.getItem('agendamentosTimestamp');
    if (timestamp) {
      const agora = new Date().getTime();
      if (agora - Number(timestamp) >= 24 * 60 * 60 * 1000) {
        localStorage.removeItem('agendamentos');
        localStorage.removeItem('agendamentosTimestamp');
      }
    }
  };

  useEffect(() => {
    console.log('Iniciando aplicação...');
    limparDadosAntigos();
    fetchAgendamentos(true, false);
    const cleanupInterval = setInterval(limparDadosAntigos, 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  const isHoje = (data: string): boolean => {
    return data === getDataAtual();
  };

  const isAmanha = (data: string): boolean => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const ano = amanha.getFullYear();
    const mes = (amanha.getMonth() + 1).toString().padStart(2, '0');
    const dia = amanha.getDate().toString().padStart(2, '0');
    return data === `${ano}-${mes}-${dia}`;
  };

  const formatarData = (data: string): string => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const formatarTelefone = (telefone: string): string => {
    const numeros = telefone.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  };

  const getDataAmanha = (): string => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, "0");
    const dia = String(amanha.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const validarTelefone = (telefone: string): boolean => {
    const numeros = telefone.replace(/\D/g, '');
    return /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(numeros);
  };

  const gerarHorariosCompletos = () => {
    const horarios = [];
    for (let hora = 8; hora <= 19; hora++) {
      if (hora === 12) continue;
      horarios.push(`${hora.toString().padStart(2, "0")}:00`);
      if (hora !== 19) {
        horarios.push(`${hora.toString().padStart(2, "0")}:30`);
      }
    }
    return horarios;
  };

  const horariosDisponiveisBase = gerarHorariosCompletos();
  const selectedService = servicos.find(s => s.nome === formData.servico);
  const selectedServiceDuration = Number.parseInt(selectedService?.duracao || "30", 10) || 30;

  const horariosFiltrados = formData.data ? horariosDisponiveisBase.filter((h) => {
    const [candidateHour, candidateMinute] = h.split(":").map(Number);
    const candidateStart = candidateHour * 60 + candidateMinute;
    const candidateEnd = candidateStart + selectedServiceDuration;
    const ocupado = agendamentos.some((a) => {
      if (a.status === "cancelado" || a.data !== formData.data) return false;
      const [appointmentHour, appointmentMinute] = a.horario.split(":").map(Number);
      const appointmentStart = appointmentHour * 60 + appointmentMinute;
      const appointmentEnd = appointmentStart + (a.duracaoMinutos || 30);
      return candidateStart < appointmentEnd && candidateEnd > appointmentStart;
    });

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
      if (!validarTelefone(cleanedValue)) return "Use um telefone válido. Ex.: (27) 91234-5678.";
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
    const nextValue = fieldName === "telefone" ? formatarTelefone(value) : value;

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");

    if (validateForm()) {
      setReviewModalOpen(true);
    }
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

    if (!validarTelefone(formData.telefone)) {
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
        `Olá! Vi que o horário ${formData.horario} do dia ${formatarData(formData.data)} está ocupado.` +
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
        `📅 Data: ${formatarData(formData.data)}\n` +
        `⏰ Horário: ${formData.horario}\n` +
        `✅ Confirmação automática via site\n\n` +
        `📲 *Link do Agendamento:* ${window.location.origin}/`
      );
      const whatsappUrl = `https://wa.me/5527981911375?text=${mensagem}`;

      setSuccessMessage("Agendamento realizado com sucesso!");
      setStatusModal({
        type: "success",
        title: "Agendamento confirmado",
        message: "Seu horário foi registrado. Use o botão abaixo para enviar os dados pelo WhatsApp.",
        actionUrl: whatsappUrl,
        actionLabel: "Abrir WhatsApp"
      });

      const agendamentoPublico = sanitizePublicAppointments([result.data])[0];
      const novosAgendamentos = [...agendamentos, agendamentoPublico];
      setAgendamentos(novosAgendamentos);
      localStorage.setItem("agendamentos", JSON.stringify(novosAgendamentos));

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
    const verificarEApagarAntigos = () => {
      const dataHoje = getDataAtual();
      const agendamentosSalvos = JSON.parse(localStorage.getItem("agendamentos") ?? "[]") as Agendamento[];
      const agendamentosAtuais = agendamentosSalvos.filter((a) => a.data >= dataHoje);

      if (agendamentosSalvos.length !== agendamentosAtuais.length) {
        localStorage.setItem("agendamentos", JSON.stringify(agendamentosAtuais));
        setAgendamentos(agendamentosAtuais);
      }
    };

    const interval = setInterval(verificarEApagarAntigos, 60000);
    verificarEApagarAntigos();
    return () => clearInterval(interval);
  }, []);

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

  const getAgendamentosPorData = (data: string) => {
    return agendamentos.filter(a => a.data === data);
  };

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

      {reviewModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">Revisão</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Confirmar agendamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Fechar revisão"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 text-sm text-zinc-200">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Cliente</span>
                <strong className="mt-1 block text-base text-white">{formData.nome}</strong>
                <span className="mt-1 block text-zinc-400">{formData.telefone}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Serviço</span>
                  <strong className="mt-1 block text-white">{formData.servico}</strong>
                  <span className="mt-1 block text-amber-300">R$ {selectedService?.preco?.toFixed(2) ?? "0.00"}</span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-zinc-500">Data e hora</span>
                  <strong className="mt-1 block text-white">{formData.data ? formatarData(formData.data) : "--"}</strong>
                  <span className="mt-1 block text-amber-300">{formData.horario}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-zinc-800"
              >
                Editar dados
              </button>
              <button
                type="button"
                onClick={confirmarAgendamento}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar e enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-950 p-6 text-center shadow-2xl">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              statusModal.type === "success" ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
            }`}>
              {statusModal.type === "success" ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <h3 className="text-2xl font-bold text-white">{statusModal.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{statusModal.message}</p>
            {statusModal.actionUrl && (
              <a
                href={statusModal.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-500"
              >
                <IconBrandWhatsapp size={20} />
                {statusModal.actionLabel || "Continuar"}
              </a>
            )}
            <button
              type="button"
              onClick={() => setStatusModal(null)}
              className={`${statusModal.actionUrl ? "mt-3" : "mt-6"} w-full rounded-lg bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400`}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 ${menuOpen ? 'blur-sm opacity-80' : 'blur-0 opacity-100'}`}>
        <header className="relative h-screen" id="home">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80")' }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <nav className="relative z-30 container mx-auto px-6 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-amber-500" />
              <span className="text-1xl font-bold">Prime</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="hover:text-amber-500 transition">Início</a>
              <a href="#services" className="hover:text-amber-500 transition">Serviços</a>
              <a href="#booking" className="hover:text-amber-500 transition">Agendamento</a>
              <a href="#contact" className="hover:text-amber-500 transition">Contato</a>
              <a
                href="/admin"
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition font-semibold"
              >
                <IconUserFilled className="w-4 h-4" />
                Área do Barbeiro
              </a>
            </div>

            <div className="md:hidden flex items-center">
              <button
                className="focus:outline-none z-50 relative"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="h-8 w-8 text-amber-500" />
                ) : (
                  <Menu className="h-8 w-8 text-amber-500" />
                )}
              </button>
            </div>
          </nav>

          <div className="relative z-10 container mx-auto px-6 h-[calc(100vh-88px)] flex items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Tradição no corte, atitude no estilo.
                <br />
                Bem-vindo à Barbearia Prime!
              </h1>
              
              <div className="flex items-center gap-4 text-white mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span className="font-medium">{dataAtual}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="font-mono">{horaAtual}</span>
                </div>
              </div>

              <p className="text-lg md:text-xl mb-8 text-white">
                Agende seu horário online e transforme seu visual com a gente!
              </p>
              <a
                href="#booking"
                className="bg-amber-500 text-black px-8 py-4 rounded-md font-semibold hover:bg-amber-600 transition"
              >
                Agende seu Horário
              </a>
            </div>
          </div>
        </header>

        <section id="services" className="py-20 bg-zinc-900 text-center">
          <h2 className="text-5xl font-bold mb-8">Catálogo de serviços</h2>
          <p className="text-white mb-12">
            Escolha o corte que combina com seu estilo.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
            {servicos.map((s, i) => (
              <div
                key={i}
                className="bg-zinc-800 p-6 rounded-lg shadow-lg hover:scale-105 transition cursor-pointer"
                onClick={() => setFormData({ ...formData, servico: s.nome })}
              >
                <h3 className="text-2xl font-bold text-amber-500 mb-3">{s.nome}</h3>
                <p className="text-white mb-2">
                  <IconCurrencyReal size={19.5} className="inline-block mr-1" />
                  {s.preco.toFixed(2)}
                </p>
                <p className="text-white flex justify-center items-center gap-2">
                  <Clock className="w-4 h-4 text-white" />
                  {s.duracao}
                </p>
              </div>
            ))}
          </div>
        </section>

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
                    <DatePicker
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
                        {formatarData(formData.data)}
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

              <div className="w-full lg:w-96 space-y-6">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/30">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Horários ocupados — hoje</h3>
                    <button
                      type="button"
                      onClick={atualizarAgendaManual}
                      disabled={refreshingAgenda}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      title="Atualizar lista de horários"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingAgenda ? "animate-spin" : ""}`} />
                      {refreshingAgenda ? "Atualizando..." : "Atualizar"}
                    </button>
                  </div>

                  {getAgendamentosPorData(getDataAtual()).length === 0 ? (
                    <p className="text-white">Nenhum agendamento para hoje.</p>
                  ) : (
                    <ul className="space-y-2">
                      {getAgendamentosPorData(getDataAtual())
                        .sort((a, b) => a.horario.localeCompare(b.horario))
                        .map((a, i) => (
                          <li key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-amber-400">Horário ocupado</span>
                                <div className="text-white mt-1">
                                  <IconScissors className="inline-block mr-1" />
                                  Indisponível para agendamento
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono bg-zinc-800 px-2 py-1 rounded">
                                  <IconAlarm className="inline-block mr-1" />
                                  {a.horario}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))
                      }
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/30">
                  <h3 className="text-xl font-bold mb-4">Horários ocupados — amanhã</h3>

                  {getAgendamentosPorData(
                    getDataAmanha()
                  ).length === 0 ? (
                    <p className="text-white">Nenhum agendamento para amanhã.</p>
                  ) : (
                    <ul className="space-y-2">
                      {getAgendamentosPorData(
                        getDataAmanha()
                      )
                        .sort((a, b) => a.horario.localeCompare(b.horario))
                        .map((a, i) => (
                          <li key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-amber-400">Horário ocupado</span>
                                <div className="text-white mt-1">
                                  <IconScissors className="inline-block mr-1" />
                                  Indisponível para agendamento
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono bg-zinc-800 px-2 py-1 rounded">
                                  <IconAlarm className="inline-block mr-1" />
                                  {a.horario}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))
                      }
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 bg-zinc-900 text-center">
          <h2 className="text-3xl font-bold mb-4">Entre em contato</h2>
          <p className="text-white mb-6">
            <IconMapPinFilled className="inline-block mr-1" /> Av. s/n Serra<br />
            <IconPhone className="inline-block mr-1" /> (27) 98191-1375
          </p>
          <div className="flex justify-center space-x-8">
            <a href="https://www.instagram.com/imkleitondev/" target="_blank" rel="noreferrer">
              <Instagram className="h-8 w-8 text-amber-500 hover:text-amber-600 transition" />
            </a>
            <a href="https://wa.me/5527981911375" target="_blank" rel="noreferrer">
              <IconBrandWhatsapp className="h-8 w-8 text-green-500 hover:text-green-600 transition" />
            </a>
          </div>
        </section>
      </div>

      <div className={`fixed top-0 right-0 h-full w-80 bg-zinc-950 z-50 transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2 text-amber-500">
              <img src="/logo.png" className="h-8 w-8 bg-amber-500 rounded w-8 h-8" />
              <span className="text-xl font-bold">Prime</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
            >
              <X className="h-6 w-6 text-white hover:text-amber-500" />
            </button>
          </div>

          <div className="flex flex-col space-y-2 text-lg flex-1">
            <a href="#home" onClick={() => setMenuOpen(false)} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Início</a>
            <a href="#services" onClick={() => setMenuOpen(false)} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Serviços</a>
            <a href="#booking" onClick={() => setMenuOpen(false)} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Agendamento</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="hover:text-amber-500 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700">Contato</a>
            <a href="/admin" onClick={() => setMenuOpen(false)} className="text-amber-500 hover:text-amber-400 transition py-4 px-4 hover:bg-zinc-800 rounded-lg border-b border-zinc-700 font-semibold">Área do barbeiro</a>
          </div>

          <div className="mt-auto pt-6">
            <div className="flex justify-center space-x-6 mb-4">
              <a href="https://www.instagram.com/imkleitondev/" target="_blank" rel="noreferrer" className="p-3 hover:bg-zinc-800 rounded-lg transition">
                <Instagram className="h-6 w-6 text-amber-500 hover:text-amber-600" />
              </a>
              <a href="https://wa.me/5527981911375" target="_blank" rel="noreferrer" className="p-3 hover:bg-zinc-800 rounded-lg transition">
                <IconBrandWhatsapp className="h-6 w-6 text-green-500 hover:text-green-600" />
              </a>
            </div>
            <p className="text-center text-white text-sm"><IconMapPinFilled className="inline-block mr-1" /> Av. s/n, Serra</p>
            <p className="text-center text-white text-sm mt-2"><IconPhone className="inline-block mr-1" /> (27) 98191-1375</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
