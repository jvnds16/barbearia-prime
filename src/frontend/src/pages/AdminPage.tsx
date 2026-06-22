import { Scissors, Trash2, Edit, X, Save, Clock, User, Phone, TrendingUp, Calendar, Plus, RotateCcw } from 'lucide-react';
import { ModernDatePicker } from '../components/ModernDatePicker';
import { formatDisplayDate } from '../utils/date';
import { useAdminPanel } from '../hooks/useAdminPanel';
import { Agendamento } from '../types/scheduling';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminHeader, AdminMessageToast, AdminTabs, DeleteAppointmentModal } from '../components/admin/AdminChrome';

const appointmentStatusClasses: Record<NonNullable<Agendamento['status']>, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-500',
  presente: 'bg-green-500/20 text-green-500',
  ausente: 'bg-orange-500/20 text-orange-400',
  cancelado: 'bg-red-500/20 text-red-500'
};

const appointmentStatusLabels: Record<NonNullable<Agendamento['status']>, string> = {
  pendente: 'Pendente',
  presente: 'Presente',
  ausente: 'Ausente',
  cancelado: 'Cancelado'
};

function Admin() {
  const {
    activeTab, agendamentos, agendamentosFiltrados, agendamentosOrdenados,
    agendamentosRecentes, cancelEdit, checkingAuth, clearingFilter,
    dashboardStats, dataHoje, dataLimiteEdicao, dataMaximaFiltro, dataMinimaFiltro,
    deleteTarget, editErrors, editForm, editingId, filterDate, handleClearFilter,
    handleDelete, handleEdit, handleEditChange, handleLogin, handleLogout, handleSave,
    horariosPermitidos, isAuthenticated, loading, message, password, servicos,
    setActiveTab, setDeleteTarget, setFilterDate, setMessage, setPassword,
    setShowPassword, showPassword
  } = useAdminPanel();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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

      {activeTab === 'dashboard' ? (
        /* Dashboard */
        <div className="container mx-auto px-4 pb-6 sm:px-6">
          {/* Notificação de novo agendamento */}
          <div className="fixed top-4 right-4 z-50" id="notification-container"></div>

          {/* Botão de Adicionar Agendamento */}
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

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20 transform transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Lucro hoje</h3>
              </div>
              <p className="text-3xl font-bold text-green-500">{formatarMoeda(dashboardStats.lucroHoje)}</p>
              <p className="text-xs text-white mt-1">{dashboardStats.atendimentosHoje} presença(s) confirmada(s)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Lucro mensal</h3>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-500">{formatarMoeda(dashboardStats.lucroMensal)}</p>
              <p className="text-xs text-white mt-1">{dashboardStats.atendimentosMes} presença(s) no mês</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Total de agendamentos</h3>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">{dashboardStats.totalAgendamentos}</p>
              <p className="text-xs text-white mt-1">
                Mês: {dashboardStats.agendamentosMes} · {dashboardStats.pendentesMes} pendente(s) · {dashboardStats.ausentesMes} falta(s)
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Média Diária</h3>
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-purple-500">
                {formatarMoeda(dashboardStats.mediaDiaria)}
              </p>
              <p className="text-xs text-white mt-1">Mês atual</p>
            </div>
          </div>

          {/* Gráfico de Lucros Diários */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Lucro por Dia - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>

            {Object.keys(dashboardStats.lucrosPorDia).length === 0 ? (
              <p className="text-white text-center py-8">Nenhuma presença confirmada neste mês</p>
            ) : (
              <div className="space-y-4">
                {Object.keys(dashboardStats.lucrosPorDia)
                  .sort()
                  .map((dia) => {
                    const lucro = dashboardStats.lucrosPorDia[dia];
                    const maxLucro = Math.max(...Object.values(dashboardStats.lucrosPorDia));
                    const porcentagem = maxLucro > 0 ? (lucro / maxLucro) * 100 : 0;

                    return (
                      <div key={dia} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">{formatDisplayDate(dia)}</span>
                          <span className="text-sm font-bold text-green-500">{formatarMoeda(lucro)}</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Serviços Mais Populares */}
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-amber-500" />
              Serviços mais populares do mês
            </h2>

            {dashboardStats.servicosMaisPopulares.length === 0 ? (
              <p className="text-white text-center py-8">Nenhum serviço realizado neste mês</p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.servicosMaisPopulares.map((servico) => {
                  const porcentagem = dashboardStats.atendimentosMes > 0
                    ? (servico.quantidade / dashboardStats.atendimentosMes) * 100
                    : 0;

                  return (
                    <div key={servico.servico} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-white">{servico.servico}</span>
                          <span className="text-sm text-white ml-2">({servico.quantidade}x)</span>
                        </div>
                        <span className="text-sm font-bold text-green-500">{formatarMoeda(servico.lucroTotal)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-green-500 h-full rounded-full transition-all"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos Agendamentos */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">Últimos agendamentos</h2>
            </div>
            {loading && agendamentos.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Carregando...</p>
              </div>
            ) : agendamentosRecentes.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {agendamentosRecentes.map((agendamento, index) => (
                  <div key={agendamento._id || `${agendamento.data}-${agendamento.horario}-${index}`} className="p-4 hover:bg-zinc-800 transition">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                          <p className="min-w-0 break-words text-lg font-semibold">{agendamento.nome}</p>
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-500">
                            {agendamento.servico}
                          </span>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${appointmentStatusClasses[agendamento.status || 'pendente']}`}>
                            {appointmentStatusLabels[agendamento.status || 'pendente']}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white">
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {formatDisplayDate(agendamento.data)}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Clock className="h-4 w-4 shrink-0" />
                            {agendamento.horario}
                          </div>
                          <div className="shrink-0 font-medium text-green-500">
                            {formatarMoeda(agendamento.preco || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-end gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleEdit(agendamento)}
                          disabled={loading || !agendamento._id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-amber-500 transition-all hover:bg-amber-500/20 disabled:opacity-50"
                          title="Editar"
                          aria-label={`Editar agendamento de ${agendamento.nome}`}
                        >
                          <Edit className="h-5 w-5 shrink-0" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(agendamento)}
                          disabled={loading || !agendamento._id}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          title="Cancelar agendamento"
                          aria-label={`Cancelar agendamento de ${agendamento.nome}`}
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
        /* Agendamentos */
        <div className="container mx-auto px-6 pb-6">
          {/* Filtros */}
          <div className="bg-zinc-900 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Filtros</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Filtrar por data
                </label>
                <ModernDatePicker
                  value={filterDate}
                  min={dataMinimaFiltro}
                  max={dataMaximaFiltro}
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
                  aria-label={clearingFilter ? 'Limpando filtro' : 'Limpar filtro de data'}
                >
                  <RotateCcw className={`h-4 w-4 ${clearingFilter ? 'animate-spin' : ''}`} />
                  {clearingFilter ? 'Limpando...' : 'Limpar filtro'}
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Total de agendamentos</h3>
              <p className="text-3xl font-bold text-amber-500">{dashboardStats.totalAgendamentos}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Agendamentos hoje</h3>
              <p className="text-3xl font-bold text-amber-500">{dashboardStats.agendamentosHoje}</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Filtrados</h3>
              <p className="text-3xl font-bold text-amber-500">{agendamentosFiltrados.length}</p>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">
                Agendamentos {filterDate && `- ${formatDisplayDate(filterDate)}`}
              </h2>
            </div>

            {agendamentosOrdenados.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Nenhum agendamento encontrado.</p>
              </div>
            ) : loading && agendamentos.length === 0 ? (
              <div className="p-8 text-center text-white">
                <p>Carregando agendamentos...</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-700">
                {agendamentosOrdenados.map((agendamento, index) => {
                  const isEditing = editingId === agendamento._id;
                  return (
                    <div
                      key={agendamento._id || `${agendamento.data}-${agendamento.horario}-${index}`}
                      className={`p-4 transition sm:p-6 ${isEditing ? 'bg-zinc-900' : 'hover:bg-zinc-800'}`}
                    >
                      {isEditing ? (
                        // Modo Edição
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Nome
                              </label>
                              <input
                                type="text"
                                value={editForm?.nome || ''}
                                onChange={(e) => handleEditChange('nome', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                              {editErrors.nome && <p className="mt-1 text-xs text-red-300">{editErrors.nome}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Telefone
                              </label>
                              <input
                                type="tel"
                                value={editForm?.telefone || ''}
                                onChange={(e) => handleEditChange('telefone', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                              {editErrors.telefone && <p className="mt-1 text-xs text-red-300">{editErrors.telefone}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Serviço
                              </label>
                              <select
                                value={editForm?.servico || ''}
                                onChange={(e) => handleEditChange('servico', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="">Selecione o serviço</option>
                                {servicos.map((servico) => (
                                  <option key={servico._id || servico.nome} value={servico.nome}>
                                    {servico.nome}
                                  </option>
                                ))}
                              </select>
                              {editErrors.servico && <p className="mt-1 text-xs text-red-300">{editErrors.servico}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Preço
                              </label>
                              <input
                                type="text"
                                value={formatarMoeda(editForm?.preco || 0)}
                                readOnly
                                aria-label="Valor do serviço"
                                className="w-full rounded-md bg-zinc-800 px-4 py-2 text-white outline-none"
                              />
                              <p className="mt-1 text-xs text-zinc-500">Definido automaticamente pelo serviço.</p>
                              {editErrors.preco && <p className="mt-1 text-xs text-red-300">{editErrors.preco}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Data
                              </label>
                              <ModernDatePicker
                                value={editForm?.data || ''}
                                min={dataHoje}
                                max={dataLimiteEdicao}
                                onChange={(value) => handleEditChange('data', value)}
                                ariaLabel="Alterar data do agendamento"
                              />
                              {editErrors.data && <p className="mt-1 text-xs text-red-300">{editErrors.data}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Horário
                              </label>
                              <select
                                value={editForm?.horario || ''}
                                onChange={(e) => handleEditChange('horario', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="">Selecione o horário</option>
                                {horariosPermitidos.map((horario) => (
                                  <option key={horario} value={horario}>{horario}</option>
                                ))}
                              </select>
                              {editErrors.horario && <p className="mt-1 text-xs text-red-300">{editErrors.horario}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Status
                              </label>
                              <select
                                value={editForm?.status || 'pendente'}
                                onChange={(e) => handleEditChange('status', e.target.value)}
                                className="w-full bg-zinc-800 rounded-md px-4 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="presente">Presente</option>
                                <option value="ausente">Ausente</option>
                                <option value="cancelado">Cancelado</option>
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
                              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
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
                        // Modo Visualização
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4">
                              <div className="flex min-w-0 items-start gap-2">
                                <User className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                                <span className="min-w-0 break-words text-lg font-semibold">{agendamento.nome}</span>
                              </div>
                              <div className="flex min-w-0 items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0 text-green-500" />
                                <span className="break-words text-white">{agendamento.telefone}</span>
                              </div>
                              {agendamento.preco && (
                                <div className="flex items-center">
                                  <span className="text-green-500 font-bold">{formatarMoeda(agendamento.preco)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-start gap-2 text-sm text-white sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                              <div className="flex min-w-0 items-start gap-1.5">
                                <Scissors className="mt-0.5 h-4 w-4 shrink-0" />
                                <span className="break-words">{agendamento.servico}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {formatDisplayDate(agendamento.data)} às {agendamento.horario}
                                  </span>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${appointmentStatusClasses[agendamento.status || 'pendente']}`}>
                                  {appointmentStatusLabels[agendamento.status || 'pendente']}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-end gap-2 self-end md:self-auto">
                            <button
                              onClick={() => handleEdit(agendamento)}
                              disabled={loading || !agendamento._id}
                              className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-3 transition hover:bg-amber-700 disabled:opacity-50"
                              aria-label={`Editar agendamento de ${agendamento.nome}`}
                            >
                              <Edit className="h-4 w-4 shrink-0" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(agendamento)}
                              disabled={loading || !agendamento._id}
                              className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 transition hover:bg-red-700 disabled:opacity-50"
                              title="Cancelar agendamento"
                              aria-label={`Cancelar agendamento de ${agendamento.nome}`}
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

export default Admin; 
