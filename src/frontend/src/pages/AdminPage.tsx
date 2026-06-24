import {
  Scissors,
  Trash2,
  Edit,
  X,
  Save,
  Clock,
  User,
  Phone,
  TrendingUp,
  Calendar,
  Plus,
  RotateCcw,
} from "lucide-react";
import { ModernDatePicker } from "../components/date-picker/ModernDatePicker";
import { formatDisplayDate } from "../utils/date";
import { useAdminPanel } from "../hooks/useAdminPanel";
import { Appointment } from "../types/appointment";
import { AdminLogin } from "../components/admin/AdminLogin";
import {
  AdminHeader,
  AdminMessageToast,
  AdminTabs,
  DeleteAppointmentModal,
} from "../components/admin/AdminChrome";

const appointmentStatusClasses: Record<
  NonNullable<Appointment["status"]>,
  string
> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  present: "bg-green-500/20 text-green-500",
  absent: "bg-orange-500/20 text-orange-400",
  cancelled: "bg-red-500/20 text-red-500",
};

const appointmentStatusLabels: Record<
  NonNullable<Appointment["status"]>,
  string
> = {
  pending: "Pendente",
  present: "Presente",
  absent: "Ausente",
  cancelled: "Cancelado",
};

function AdminPage() {
  const {
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
  } = useAdminPanel();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400" />
          <p className="mt-4 text-sm text-zinc-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        loading={loading}
        message={message}
        password={password}
        showPassword={showPassword}
        onSubmit={handleLogin}
        onPasswordChange={setPassword}
        onClearMessage={() => setMessage(null)}
        onTogglePassword={() => setShowPassword((current) => !current)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminMessageToast message={message} onClose={() => setMessage(null)} />
      <DeleteAppointmentModal
        target={deleteTarget}
        loading={loading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <AdminHeader onLogout={handleLogout} />
      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "dashboard" ? (
        /* Dashboard */
        <div className="container mx-auto px-4 pb-6 sm:px-6">
          {/* New appointment notification */}
          <div
            className="fixed top-4 right-4 z-50"
            id="notification-container"
          ></div>

          {/* Add appointment button */}
          <div className="mb-6">
            <a
              href="/#booking"
              target="_blank"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              <Plus className="h-5 w-5" />
              Novo agendamento
            </a>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20 transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Lucro hoje</h3>
              </div>
              <p className="text-3xl font-bold text-green-500">
                {formatCurrency(dashboardStats.todayProfit)}
              </p>
              <p className="text-xs text-white mt-1">
                {dashboardStats.todayAttendances} presença(s) confirmada(s)
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Lucro mensal</h3>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-500">
                {formatCurrency(dashboardStats.monthlyProfit)}
              </p>
              <p className="text-xs text-white mt-1">
                {dashboardStats.monthlyAttendances} presença(s) no mês
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">
                  Total de agendamentos
                </h3>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">
                {dashboardStats.totalAppointments}
              </p>
              <p className="text-xs text-white mt-1">
                Mês: {dashboardStats.monthlyAppointments} ·{" "}
                {dashboardStats.monthlyPending} pendente(s) ·{" "}
                {dashboardStats.monthlyAbsent} falta(s)
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Média Diária</h3>
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-500">
                {formatCurrency(dashboardStats.dailyAverage)}
              </p>
              <p className="text-xs text-white mt-1">Mês atual</p>
            </div>
          </div>

          {/* Daily profit chart */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Lucro por Dia -{" "}
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            {Object.keys(dashboardStats.dailyProfits).length === 0 ? (
              <p className="text-white text-center py-8">
                Nenhuma presença confirmada neste mês
              </p>
            ) : (
              <div className="space-y-4">
                {Object.keys(dashboardStats.dailyProfits)
                  .sort()
                  .map((day) => {
                    const profit = dashboardStats.dailyProfits[day];
                    const maxProfit = Math.max(
                      ...Object.values(dashboardStats.dailyProfits),
                    );
                    const percentage =
                      maxProfit > 0 ? (profit / maxProfit) * 100 : 0;

                    return (
                      <div key={day} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">
                            {formatDisplayDate(day)}
                          </span>
                          <span className="text-sm font-bold text-green-500">
                            {formatCurrency(profit)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Most popular services */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-amber-500" />
              Serviços mais populares do mês
            </h2>

            {dashboardStats.mostPopularServices.length === 0 ? (
              <p className="text-white text-center py-8">
                Nenhum serviço realizado neste mês
              </p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.mostPopularServices.map((service) => {
                  const percentage =
                    dashboardStats.monthlyAttendances > 0
                      ? (service.quantity / dashboardStats.monthlyAttendances) *
                        100
                      : 0;

                  return (
                    <div key={service.serviceName} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-white">
                            {service.serviceName}
                          </span>
                          <span className="text-sm text-white ml-2">
                            ({service.quantity}x)
                          </span>
                        </div>
                        <span className="text-sm font-bold text-green-500">
                          {formatCurrency(service.totalProfit)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Latest appointments */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">Últimos agendamentos</h2>
            </div>
            {loading && appointments.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Carregando...</p>
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {recentAppointments.map((appointment, index) => (
                  <div
                    key={
                      appointment._id ||
                      `${appointment.date}-${appointment.time}-${index}`
                    }
                    className="p-4 hover:bg-zinc-800 transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                          <p className="min-w-0 break-words text-lg font-semibold">
                            {appointment.customerName}
                          </p>
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-500">
                            {appointment.serviceName}
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${appointmentStatusClasses[appointment.status || "pending"]}`}
                          >
                            {
                              appointmentStatusLabels[
                                appointment.status || "pending"
                              ]
                            }
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white">
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {formatDisplayDate(appointment.date)}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Clock className="h-4 w-4 shrink-0" />
                            {appointment.time}
                          </div>
                          <div className="shrink-0 font-medium text-green-500">
                            {formatCurrency(appointment.price || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleEdit(appointment)}
                          disabled={loading || !appointment._id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-amber-500 transition-all hover:bg-amber-500/20 disabled:opacity-50"
                          title="Editar"
                          aria-label={`Editar agendamento de ${appointment.customerName}`}
                        >
                          <Edit className="h-5 w-5 shrink-0" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(appointment)}
                          disabled={loading || !appointment._id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          title="Cancelar agendamento"
                          aria-label={`Cancelar agendamento de ${appointment.customerName}`}
                        >
                          <Trash2 className="h-5 w-5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Appointments */
        <div className="container mx-auto px-6 pb-6">
          {/* Filters */}
          <div className="bg-zinc-900 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Filtros</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Filtrar por data
                </label>
                <ModernDatePicker
                  value={filterDate}
                  min={minFilterDate}
                  max={maxFilterDate}
                  onChange={setFilterDate}
                  placeholder="Todas as datas"
                  ariaLabel="Filtrar agendamentos por data"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilter}
                  disabled={clearingFilter || !filterDate}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 font-medium transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    clearingFilter ? "Limpando filtro" : "Limpar filtro de data"
                  }
                >
                  <RotateCcw
                    className={`h-4 w-4 ${clearingFilter ? "animate-spin" : ""}`}
                  />
                  {clearingFilter ? "Limpando..." : "Limpar filtro"}
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Total de agendamentos
              </h3>
              <p className="text-3xl font-bold text-amber-500">
                {dashboardStats.totalAppointments}
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Agendamentos hoje
              </h3>
              <p className="text-3xl font-bold text-amber-500">
                {dashboardStats.todayAppointments}
              </p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Filtrados
              </h3>
              <p className="text-3xl font-bold text-amber-500">
                {filteredAppointments.length}
              </p>
            </div>
          </div>

          {/* Appointment list */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">
                Agendamentos{" "}
                {filterDate && `- ${formatDisplayDate(filterDate)}`}
              </h2>
            </div>

            {sortedAppointments.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : loading && appointments.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Carregando agendamentos...</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {sortedAppointments.map((appointment, index) => {
                  const isEditing = editingId === appointment._id;
                  return (
                    <div
                      key={
                        appointment._id ||
                        `${appointment.date}-${appointment.time}-${index}`
                      }
                      className={`p-4 transition sm:p-6 ${isEditing ? "bg-zinc-900" : "hover:bg-zinc-800"}`}
                    >
                      {isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Nome
                              </label>
                              <input
                                type="text"
                                value={editForm?.customerName || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "customerName",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                              {editErrors.customerName && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.customerName}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={editForm?.customerPhone || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "customerPhone",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                              {editErrors.customerPhone && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.customerPhone}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Serviço
                              </label>
                              <select
                                value={editForm?.serviceName || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "serviceName",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="">Selecione o serviço</option>
                                {services.map((service) => (
                                  <option
                                    key={service._id || service.name}
                                    value={service.name}
                                  >
                                    {service.name}
                                  </option>
                                ))}
                              </select>
                              {editErrors.serviceName && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.serviceName}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Preço
                              </label>
                              <input
                                type="text"
                                value={formatCurrency(editForm?.price || 0)}
                                readOnly
                                aria-label="Valor do serviço"
                                className="w-full rounded-md bg-zinc-800 px-4 py-2 text-white outline-none"
                              />
                              <p className="mt-1 text-xs text-zinc-500">
                                Definido automaticamente pelo serviço.
                              </p>
                              {editErrors.price && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.price}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Data
                              </label>
                              <ModernDatePicker
                                value={editForm?.date || ""}
                                min={todayDate}
                                max={editLimitDate}
                                onChange={(value) =>
                                  handleEditChange("date", value)
                                }
                                ariaLabel="Alterar data do agendamento"
                              />
                              {editErrors.date && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.date}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Horário
                              </label>
                              <select
                                value={editForm?.time || ""}
                                onChange={(e) =>
                                  handleEditChange("time", e.target.value)
                                }
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="">Selecione o horário</option>
                                {allowedTimes.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                              {editErrors.time && (
                                <p className="mt-1 text-xs text-red-300">
                                  {editErrors.time}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Status
                              </label>
                              <select
                                value={editForm?.status || "pending"}
                                onChange={(e) =>
                                  handleEditChange("status", e.target.value)
                                }
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="pending">Pendente</option>
                                <option value="present">Presente</option>
                                <option value="absent">Ausente</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={handleSave}
                              disabled={loading}
                              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              <span>{loading ? "Salvando..." : "Salvar"}</span>
                            </button>
                            <button
                              onClick={() => {
                                cancelEdit();
                              }}
                              disabled={loading}
                              className="flex items-center space-x-2 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4">
                              <div className="flex min-w-0 items-start gap-2">
                                <User className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                                <span className="min-w-0 break-words text-lg font-semibold">
                                  {appointment.customerName}
                                </span>
                              </div>
                              <div className="flex min-w-0 items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-green-500" />
                                <span className="break-words text-white">
                                  {appointment.customerPhone}
                                </span>
                              </div>
                              {appointment.price && (
                                <div className="flex items-center">
                                  <span className="text-green-500 font-bold">
                                    {formatCurrency(appointment.price)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-start gap-2 text-sm text-white sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                              <div className="flex min-w-0 items-start gap-1.5">
                                <Scissors className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="break-words">
                                  {appointment.serviceName}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {formatDisplayDate(appointment.date)} às{" "}
                                    {appointment.time}
                                  </span>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${appointmentStatusClasses[appointment.status || "pending"]}`}
                                >
                                  {
                                    appointmentStatusLabels[
                                      appointment.status || "pending"
                                    ]
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-end gap-2 self-end md:self-auto">
                            <button
                              onClick={() => handleEdit(appointment)}
                              disabled={loading || !appointment._id}
                              className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-3 transition hover:bg-amber-700 disabled:opacity-50"
                              aria-label={`Editar agendamento de ${appointment.customerName}`}
                            >
                              <Edit className="h-4 w-4 shrink-0" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(appointment)}
                              disabled={loading || !appointment._id}
                              className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 transition hover:bg-red-700 disabled:opacity-50"
                              title="Cancelar agendamento"
                              aria-label={`Cancelar agendamento de ${appointment.customerName}`}
                            >
                              <Trash2 className="h-4 w-4 shrink-0" />
                              <span className="hidden sm:inline">Cancelar</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
