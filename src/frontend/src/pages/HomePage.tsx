import {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FocusEvent,
  FormEvent,
} from "react";
import {
  Calendar,
  Clock,
  Scissors,
  X,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { listServices } from "../services/serviceCatalog";
import { Appointment, Service } from "../types/appointment";
import { ApiError } from "../services/api";
import { DatePicker } from "../components/date-picker/DatePicker";
import {
  createAvailableTimes,
  formatPhone,
  hasAppointmentConflict,
  isValidPhone,
  sanitizePublicAppointments,
} from "../utils/appointment";
import { formatDisplayDate } from "../utils/date";
import { AppointmentModals } from "../components/appointments/AppointmentModals";
import { usePublicAppointments } from "../hooks/usePublicAppointments";
import {
  ContactSection,
  HomeHero,
  MobileMenu,
  ServicesSection,
} from "../components/home/HomeSections";
import { AvailabilityPanel } from "../components/appointments/AvailabilityPanel";

type FormField =
  | "customerName"
  | "customerPhone"
  | "serviceName"
  | "date"
  | "time";
type FormErrors = Partial<Record<FormField, string>>;
type StatusModal = {
  type: "success" | "error";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
} | null;

const STORAGE_KEY = "appointments";
const STORAGE_TIMESTAMP_KEY = "appointmentsTimestamp";

// User-facing validation messages remain localized.
const VALIDATION_MESSAGES = {
  NAME_REQUIRED: "Informe seu nome completo.",
  NAME_MIN_LENGTH: "O nome precisa ter pelo menos 3 caracteres.",
  NAME_FULL: "Informe nome e sobrenome.",
  PHONE_REQUIRED: "Informe um telefone com DDD.",
  PHONE_INVALID: "Use um telefone válido. Ex.: (27) 91234-5678.",
  SERVICE_REQUIRED: "Selecione um serviço.",
  SERVICE_INVALID: "Selecione um serviço válido.",
  DATE_REQUIRED: "Escolha uma data.",
  DATE_INVALID: "Escolha uma data válida.",
  DATE_PAST: "Escolha uma data a partir de hoje.",
  DATE_FUTURE: "Agende com, no máximo, 30 dias de antecedência.",
  TIME_REQUIRED: "Escolha um horário.",
  TIME_UNAVAILABLE: "Este horário não está disponível para a data selecionada.",
  TIME_TAKEN: "Este horário acabou de ser ocupado. Escolha outro.",
  FORM_ERROR: "Revise os campos destacados antes de continuar.",
  PRICE_NOT_FOUND: "Preço do serviço não encontrado. Tente novamente.",
  SCHEDULE_UPDATED:
    "A agenda foi atualizada. Escolha outro horário disponível.",
  SYNC_ERROR:
    "Não foi possível atualizar os horários agora. Verifique sua conexão e tente novamente.",
  PHONE_INVALID_SUBMIT:
    "⚠️ Por favor, insira um telefone válido com DDD. Ex: (27) 91234-5678",
  DATE_PAST_SUBMIT:
    "⚠️ Não é possível marcar para datas passadas. Por favor, escolha uma data futura.",
  TIME_TODAY_ADVANCE:
    "⚠️ Para agendamentos de hoje, escolha um horário com pelo menos 30 minutos de antecedência.",
  SERVICE_NOT_SELECTED: "Por favor, selecione um serviço.",
  TIME_CONFLICT:
    "Esse horário já está ocupado. Redirecionando para o WhatsApp do barbeiro para verificar outros horários...",
  PRICE_ERROR: "⚠️ Erro: Preço do serviço não encontrado. Tente novamente.",
  SUCCESS: "Agendamento realizado com sucesso!",
  CONFIRM_TITLE: "Agendamento confirmado",
  CONFIRM_MESSAGE:
    "Seu horário foi registrado e a agenda já foi atualizada. Esta confirmação fechará automaticamente.",
  WHATSAPP_LABEL: "Abrir WhatsApp",
  CONNECTION_ERROR:
    "A conexão foi interrompida. Verifique sua internet e tente novamente.",
  GENERIC_ERROR: "Não foi possível concluir o agendamento. Tente novamente.",
  UNAVAILABLE_TITLE: "Horário indisponível",
  SCHEDULE_ERROR_TITLE: "Não foi possível agendar",
  CONFIRM_ERROR_TITLE: "Não foi possível confirmar",
} as const;

function HomePage() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [statusModal, setStatusModal] = useState<StatusModal>(null);
  const [formData, setFormData] = useState<Appointment>({
    customerName: "",
    customerPhone: "",
    serviceName: "",
    date: "",
    time: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const appointmentInFlightRef = useRef(false);
  const {
    agendaRequestSequenceRef,
    appointments,
    refreshAgendaManually,
    currentDate,
    fetchAppointments,
    getAppointmentsByDate,
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
  } = usePublicAppointments();

  useEffect(() => {
    listServices().then((result) => {
      if (result.success && result.data?.length) {
        setServices(result.data);
      }
    });
  }, []);

  const getMinDate = (): string => getCurrentDate();

  const getMaxDate = (): string => {
    const now = new Date();
    const maxDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 30,
    );
    const year = maxDate.getFullYear();
    const month = (maxDate.getMonth() + 1).toString().padStart(2, "0");
    const day = maxDate.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const availableTimesBase = createAvailableTimes();
  const selectedService = services.find((s) => s.name === formData.serviceName);
  const selectedServiceDuration = selectedService?.duration || 30;

  const filteredTimes = formData.date
    ? availableTimesBase.filter((time) => {
        const occupied = hasAppointmentConflict(
          appointments,
          formData.date,
          time,
          selectedServiceDuration,
        );

        if (isToday(formData.date)) {
          // Same-day options need the same preparation buffer as the backend.
          const currentT = getCurrentTime();
          const currentMinutes =
            parseInt(currentT.split(":")[0]) * 60 +
            parseInt(currentT.split(":")[1]);
          const appointmentMinutes =
            parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
          return appointmentMinutes > currentMinutes + 30 && !occupied;
        }

        return !occupied;
      })
    : availableTimesBase;

  const validateField = (
    name: FormField,
    value: string,
    data = formData,
  ): string => {
    const cleanedValue = value.trim();

    // Client-side validation mirrors backend rules for faster feedback.
    if (name === "customerName") {
      if (!cleanedValue) return VALIDATION_MESSAGES.NAME_REQUIRED;
      if (cleanedValue.length < 3) return VALIDATION_MESSAGES.NAME_MIN_LENGTH;
      if (cleanedValue.replace(/\s+/g, " ").split(" ").length < 2) {
        return VALIDATION_MESSAGES.NAME_FULL;
      }
    }

    if (name === "customerPhone") {
      if (!cleanedValue) return VALIDATION_MESSAGES.PHONE_REQUIRED;
      if (!isValidPhone(cleanedValue)) return VALIDATION_MESSAGES.PHONE_INVALID;
    }

    if (name === "serviceName" && !cleanedValue) {
      return VALIDATION_MESSAGES.SERVICE_REQUIRED;
    }

    if (
      name === "serviceName" &&
      !services.some((service) => service.name === cleanedValue)
    ) {
      return VALIDATION_MESSAGES.SERVICE_INVALID;
    }

    if (name === "date") {
      if (!cleanedValue) return VALIDATION_MESSAGES.DATE_REQUIRED;

      const selectedDate = new Date(cleanedValue + "T00:00:00");
      const todayDate = new Date(getCurrentDate() + "T00:00:00");
      const maxDateValue = new Date(getMaxDate() + "T00:00:00");

      if (Number.isNaN(selectedDate.getTime()))
        return VALIDATION_MESSAGES.DATE_INVALID;
      if (selectedDate < todayDate) return VALIDATION_MESSAGES.DATE_PAST;
      if (selectedDate > maxDateValue) return VALIDATION_MESSAGES.DATE_FUTURE;
    }

    if (name === "time") {
      if (!cleanedValue) return VALIDATION_MESSAGES.TIME_REQUIRED;
      if (data.date && !filteredTimes.includes(cleanedValue)) {
        return VALIDATION_MESSAGES.TIME_UNAVAILABLE;
      }
    }

    return "";
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {
      customerName: validateField("customerName", formData.customerName),
      customerPhone: validateField("customerPhone", formData.customerPhone),
      serviceName: validateField("serviceName", formData.serviceName),
      date: validateField("date", formData.date),
      time: validateField("time", formData.time),
    };

    // Re-check cached appointments before opening the review modal.
    const conflict = appointments.find(
      (a: Appointment) =>
        a.status !== "cancelled" &&
        a.date === formData.date &&
        a.time === formData.time,
    );

    if (conflict) {
      nextErrors.time = VALIDATION_MESSAGES.TIME_TAKEN;
    }

    const cleanErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => Boolean(value)),
    ) as FormErrors;

    setFieldErrors(cleanErrors);

    if (Object.keys(cleanErrors).length > 0) {
      setError(VALIDATION_MESSAGES.FORM_ERROR);
      return false;
    }

    if (!selectedService?.price) {
      setError(VALIDATION_MESSAGES.PRICE_NOT_FOUND);
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const fieldName = name as FormField;
    const nextValue =
      fieldName === "customerPhone" ? formatPhone(value) : value;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: nextValue,
      ...(fieldName === "date" ? { time: "" } : {}),
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      if (fieldName === "date") delete next.time;
      return next;
    });
  };

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: value, time: "" }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.date;
      delete next.time;
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
      // Pull the selected date again to reduce stale availability before review.
      const result = await appointmentService.list({ date: formData.date });
      const latestAppointments = sanitizePublicAppointments(result.data || []);
      const otherDates = appointments.filter(
        (appointment) => appointment.date !== formData.date,
      );
      const synchronizedAppointments = [...otherDates, ...latestAppointments];

      if (requestSequence === agendaRequestSequenceRef.current) {
        // Replace only the selected date so other cached days remain available.
        setAppointments(synchronizedAppointments);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(synchronizedAppointments),
        );
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      }

      if (
        hasAppointmentConflict(
          latestAppointments,
          formData.date,
          formData.time,
          selectedServiceDuration,
        )
      ) {
        setFieldErrors((current) => ({
          ...current,
          time: VALIDATION_MESSAGES.TIME_TAKEN,
        }));
        setError(VALIDATION_MESSAGES.SCHEDULE_UPDATED);
        return;
      }
    } catch (error) {
      console.error(
        "Could not synchronize appointments before review:",
        error,
      );
      setError(VALIDATION_MESSAGES.SYNC_ERROR);
      return;
    }

    setReviewModalOpen(true);
  };

  const confirmAppointment = async () => {
    if (appointmentInFlightRef.current) return;

    if (!validateForm()) {
      setReviewModalOpen(false);
      return;
    }

    setReviewModalOpen(false);
    setError(null);
    setLoading(true);
    setSuccessMessage("");

    if (!isValidPhone(formData.customerPhone)) {
      setError(VALIDATION_MESSAGES.PHONE_INVALID_SUBMIT);
      setLoading(false);
      return;
    }

    const selectedDate = new Date(formData.date + "T00:00:00");
    const todayDate = new Date(getCurrentDate() + "T00:00:00");

    if (selectedDate < todayDate) {
      setError(VALIDATION_MESSAGES.DATE_PAST_SUBMIT);
      setLoading(false);
      return;
    }

    if (isToday(formData.date)) {
      const currentT = getCurrentTime();
      const currentMinutes =
        parseInt(currentT.split(":")[0]) * 60 +
        parseInt(currentT.split(":")[1]);
      const appointmentMinutes =
        parseInt(formData.time.split(":")[0]) * 60 +
        parseInt(formData.time.split(":")[1]);

      if (appointmentMinutes <= currentMinutes + 30) {
        setError(VALIDATION_MESSAGES.TIME_TODAY_ADVANCE);
        setLoading(false);
        return;
      }
    }

    if (!formData.serviceName) {
      setError(VALIDATION_MESSAGES.SERVICE_NOT_SELECTED);
      setLoading(false);
      return;
    }

    const conflict = appointments.find(
      (a: Appointment) =>
        a.status !== "cancelled" &&
        a.date === formData.date &&
        a.time === formData.time,
    );

    if (conflict) {
      const conflictMessage = encodeURIComponent(
        `Olá! Vi que o horário ${formData.time} do dia ${formatDisplayDate(formData.date)} está ocupado.` +
          ` Gostaria de verificar outros horários disponíveis para o serviço ${formData.serviceName}.`,
      );
      const barbershopNumber = "5527981911375";
      window.open(
        `https://wa.me/${barbershopNumber}?text=${conflictMessage}`,
        "_blank",
      );
      setError(VALIDATION_MESSAGES.TIME_CONFLICT);
      setLoading(false);
      return;
    }

    const selectedServiceData = services.find(
      (s) => s.name === formData.serviceName,
    );
    const price = selectedServiceData?.price || 0;

    if (!price || price === 0) {
      setError(VALIDATION_MESSAGES.PRICE_ERROR);
      setLoading(false);
      return;
    }

    const newAppointment: Appointment = {
      ...formData,
      price,
      idempotencyKey: crypto.randomUUID(),
      timestamp: new Date().getTime(),
    };

    appointmentInFlightRef.current = true;

    try {
      // Idempotency protects against duplicate bookings if the user retries.
      const result = await appointmentService.create({
        ...newAppointment,
        timestamp: new Date().getTime(),
        status: "pending",
      });
      const message = encodeURIComponent(
        `*Novo Agendamento Confirmado* 📅\n\n` +
          `👤 Nome: ${formData.customerName}\n` +
          `📞 Telefone: ${formData.customerPhone}\n` +
          `✂️ Serviço: ${formData.serviceName}\n` +
          `📅 Data: ${formatDisplayDate(formData.date)}\n` +
          `⏰ Horário: ${formData.time}\n` +
          `✅ Confirmação automática via site\n\n` +
          `📲 *Link do Agendamento:* ${window.location.origin}/`,
      );
      const whatsappUrl = `https://wa.me/5527981911375?text=${message}`;

      const publicAppointment = sanitizePublicAppointments([result.data])[0];
      setAppointments((currentAppointments) => {
        // Update the local public cache immediately so the new slot disappears.
        const withoutDuplicateTime = currentAppointments.filter(
          (appointment) =>
            appointment.date !== publicAppointment.date ||
            appointment.time !== publicAppointment.time,
        );
        const newAppointments = [...withoutDuplicateTime, publicAppointment];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        return newAppointments;
      });

      setSuccessMessage(VALIDATION_MESSAGES.SUCCESS);
      setStatusModal({
        type: "success",
        title: VALIDATION_MESSAGES.CONFIRM_TITLE,
        message: VALIDATION_MESSAGES.CONFIRM_MESSAGE,
        actionUrl: whatsappUrl,
        actionLabel: VALIDATION_MESSAGES.WHATSAPP_LABEL,
      });

      void fetchAppointments(true, false);
    } catch (error: unknown) {
      console.error("Could not save appointment:", error);

      if (error instanceof ApiError) {
        const isConflict = error.status === 409;

        if (isConflict) {
          // Refresh after conflicts so the user sees the newly occupied slot.
          setFieldErrors((prev) => ({
            ...prev,
            time: VALIDATION_MESSAGES.TIME_TAKEN,
          }));
          await fetchAppointments(true, false);
        }

        setStatusModal({
          type: "error",
          title: isConflict
            ? VALIDATION_MESSAGES.UNAVAILABLE_TITLE
            : VALIDATION_MESSAGES.SCHEDULE_ERROR_TITLE,
          message: error.message,
        });
        setError(error.message);
        setLoading(false);
        return;
      }

      setStatusModal({
        type: "error",
        title: VALIDATION_MESSAGES.CONFIRM_ERROR_TITLE,
        message:
          error instanceof TypeError
            ? VALIDATION_MESSAGES.CONNECTION_ERROR
            : VALIDATION_MESSAGES.GENERIC_ERROR,
      });
      setError(
        error instanceof TypeError
          ? VALIDATION_MESSAGES.CONNECTION_ERROR
          : VALIDATION_MESSAGES.GENERIC_ERROR,
      );
      setLoading(false);
      return;
    } finally {
      appointmentInFlightRef.current = false;
    }

    setFormData({
      customerName: "",
      customerPhone: "",
      serviceName: "",
      date: "",
      time: "",
    });

    setLoading(false);
  };

  useEffect(() => {
    if (menuOpen || reviewModalOpen || statusModal || refreshingAgenda) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen, reviewModalOpen, statusModal, refreshingAgenda]);

  useEffect(() => {
    if (!error) return;
    const errorTimer = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(errorTimer);
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;
    const successTimer = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(successTimer);
  }, [successMessage]);

  useEffect(() => {
    if (statusModal?.type !== "success") return;
    const closeTimer = window.setTimeout(() => setStatusModal(null), 4000);
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
          aria-labelledby="refresh-appointment-title"
          aria-describedby="refresh-appointment-description"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 text-center shadow-2xl shadow-black/70">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-amber-400/15" />
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-400/60" />
              <RefreshCw className="h-6 w-6 text-amber-300" />
            </div>
            <h3
              id="refresh-appointment-title"
              className="text-xl font-bold text-white"
            >
              Atualizando horários
            </h3>
            <p
              id="refresh-appointment-description"
              className="mt-2 text-sm leading-6 text-zinc-400"
            >
              Aguarde enquanto buscamos os horários ocupados mais recentes.
            </p>
            <div
              className="mt-5 flex items-center justify-center gap-1.5"
              aria-hidden="true"
            >
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

      <AppointmentModals
        reviewOpen={reviewModalOpen}
        status={statusModal}
        appointment={formData}
        selectedService={selectedService}
        loading={loading}
        onCloseReview={() => setReviewModalOpen(false)}
        onConfirm={confirmAppointment}
        onCloseStatus={() => setStatusModal(null)}
      />

      <div
        className={`transition-all duration-300 ${menuOpen ? "blur-sm opacity-80" : "blur-0 opacity-100"}`}
      >
        <HomeHero
          menuOpen={menuOpen}
          currentDate={currentDate}
          currentTime={currentTime}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
        />
        <ServicesSection
          services={services}
          onSelect={(service) =>
            setFormData({ ...formData, serviceName: service.name })
          }
        />

        <section id="booking" className="py-20 bg-black">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                <Calendar className="h-4 w-4" />
                Agendamento online
              </span>
              <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Agende seu horário
              </h2>
              <p className="mt-4 text-sm leading-6 text-zinc-400 sm:text-base">
                Escolha o serviço, a melhor data e confirme seus dados em poucos
                passos.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/50 sm:p-8 lg:flex-1">
                <div className="mb-7 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-4">
                  <p className="text-amber-200 text-sm font-semibold">
                    <MessageSquare className="inline-block mr-1" />
                    Horário de Funcionamento: de segunda a sábado. Agendamentos
                    disponíveis das 08:00 às 19:00, com intervalo para almoço
                    das 12:00 às 13:00.
                  </p>
                  <p className="text-zinc-300 text-xs mt-1">
                    Caso não veja horários disponíveis, tente novamente após
                    esse horário ou entre em contato via WhatsApp.
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
                  <div
                    className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4"
                    role="alert"
                  >
                    <p className="flex items-start gap-2 text-sm font-semibold text-red-300">
                      <AlertCircle
                        className="mt-0.5 shrink-0"
                        size={18}
                      />
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-zinc-200"
                      htmlFor="customerName"
                    >
                      Nome completo
                    </label>
                    <div className="group relative">
                      <User
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300"
                        size={19}
                      />
                      <input
                        id="customerName"
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("customerName")} pl-11`}
                        placeholder="Ex: João Silva"
                        autoComplete="name"
                        maxLength={80}
                        aria-invalid={Boolean(fieldErrors.customerName)}
                        aria-describedby={
                          fieldErrors.customerName
                            ? "customerName-error"
                            : undefined
                        }
                        required
                      />
                    </div>
                    {fieldErrors.customerName && (
                      <p
                        id="customerName-error"
                        role="alert"
                        className="text-xs font-medium text-red-300"
                      >
                        {fieldErrors.customerName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-zinc-200"
                      htmlFor="customerPhone"
                    >
                      Telefone
                    </label>
                    <div className="group relative">
                      <Phone
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300"
                        size={20}
                      />
                      <input
                        id="customerPhone"
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("customerPhone")} pl-11`}
                        placeholder="(27) 91234-5678"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        aria-invalid={Boolean(fieldErrors.customerPhone)}
                        aria-describedby={
                          fieldErrors.customerPhone
                            ? "customerPhone-error"
                            : "customerPhone-hint"
                        }
                        required
                      />
                    </div>
                    {fieldErrors.customerPhone ? (
                      <p
                        id="customerPhone-error"
                        role="alert"
                        className="text-xs font-medium text-red-300"
                      >
                        {fieldErrors.customerPhone}
                      </p>
                    ) : (
                      <p
                        id="customerPhone-hint"
                        className="text-xs text-zinc-500"
                      >
                        Informe o DDD e o número do WhatsApp.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-zinc-200"
                      htmlFor="serviceName"
                    >
                      Serviço
                    </label>
                    <div className="group relative">
                      <Scissors className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                      <select
                        id="serviceName"
                        name="serviceName"
                        value={formData.serviceName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("serviceName")} appearance-none pl-11 pr-11`}
                        aria-invalid={Boolean(fieldErrors.serviceName)}
                        aria-describedby={
                          fieldErrors.serviceName
                            ? "serviceName-error"
                            : "serviceName-hint"
                        }
                        required
                      >
                        <option value="">Selecione o serviço</option>
                        {services.map((s) => (
                          <option key={s._id || s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                    </div>
                    {fieldErrors.serviceName ? (
                      <p
                        id="serviceName-error"
                        role="alert"
                        className="text-xs font-medium text-red-300"
                      >
                        {fieldErrors.serviceName}
                      </p>
                    ) : selectedService ? (
                      <p
                        id="serviceName-hint"
                        className="flex items-center gap-2 text-xs text-amber-300"
                      >
                        <span className="font-bold">
                          R$ {selectedService.price.toFixed(2)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        {selectedService.duration}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-zinc-200"
                      htmlFor="date"
                    >
                      Data do agendamento
                    </label>
                    <DatePicker
                      variant="public"
                      value={formData.date}
                      min={getMinDate()}
                      max={getMaxDate()}
                      invalid={Boolean(fieldErrors.date)}
                      describedBy={
                        fieldErrors.date ? "date-error" : "date-hint"
                      }
                      onChange={handleDateChange}
                    />
                    {fieldErrors.date ? (
                      <p
                        id="date-error"
                        role="alert"
                        className="text-xs font-medium text-red-300"
                      >
                        {fieldErrors.date}
                      </p>
                    ) : formData.date ? (
                      <p id="date-hint" className="text-xs text-amber-300">
                        {formatDisplayDate(formData.date)}
                        {isToday(formData.date) && " (Hoje)"}
                        {isTomorrow(formData.date) && " (Amanhã)"}
                      </p>
                    ) : (
                      <p id="date-hint" className="text-xs text-zinc-500">
                        Você pode agendar com até 30 dias de antecedência.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-zinc-200"
                      htmlFor="time"
                    >
                      Horário disponível
                    </label>
                    <div className="group relative">
                      <Clock
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300"
                        size={20}
                      />
                      <select
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${getFieldClass("time")} appearance-none pl-11 pr-11`}
                        aria-invalid={Boolean(fieldErrors.time)}
                        aria-describedby={
                          fieldErrors.time ? "time-error" : "time-hint"
                        }
                        required
                      >
                        <option value="">Selecione um horário</option>
                        {filteredTimes.length === 0 ? (
                          <option disabled>
                            Nenhum horário disponível para esta data
                          </option>
                        ) : (
                          filteredTimes.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-amber-300" />
                    </div>
                    {fieldErrors.time ? (
                      <p
                        id="time-error"
                        role="alert"
                        className="text-xs font-medium text-red-300"
                      >
                        {fieldErrors.time}
                      </p>
                    ) : (
                      <p id="time-hint" className="text-xs text-zinc-500">
                        {formData.date
                          ? `${filteredTimes.length} horário(s) disponível(is)`
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
                today={getAppointmentsByDate(getCurrentDate())}
                tomorrow={getAppointmentsByDate(getTomorrowDate())}
                refreshing={refreshingAgenda}
                onRefresh={refreshAgendaManually}
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

export default HomePage;
