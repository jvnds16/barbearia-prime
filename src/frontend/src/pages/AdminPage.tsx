import React, { useState, useEffect, useRef } from 'react';
import { Scissors, LogOut, Trash2, Edit, X, Save, Clock, User, Phone, Home, DollarSign, TrendingUp, Calendar, Plus, Eye, EyeOff, RotateCcw } from 'lucide-react';

import { authService } from '../services/authService';
import { schedulingService } from '../services/schedulingService';
import { defaultServices, listServices } from '../services/serviceCatalog';
import { Agendamento, DashboardStats, Servico } from '../types/scheduling';
import { ModernDatePicker } from '../components/ModernDatePicker';
import { ApiError } from '../services/api';

type AdminMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type EditErrors = Partial<Record<'nome' | 'telefone' | 'servico' | 'preco' | 'data' | 'horario', string>>;

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function Admin() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Agendamento | null>(null);
  const [filterDate, setFilterDate] = useState(() => formatDateValue(new Date()));
  const [clearingFilter, setClearingFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AdminMessage>(null);
  const [deleteTarget, setDeleteTarget] = useState<Agendamento | null>(null);
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [servicos, setServicos] = useState<Servico[]>(defaultServices);
  const [activeTab, setActiveTab] = useState<'agendamentos' | 'dashboard'>('dashboard');
  const loadingAppointmentsRef = useRef(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    lucroHoje: 0,
    lucroMensal: 0,
    totalAgendamentos: 0,
    mediaDiaria: 0,
    agendamentosHoje: 0,
    agendamentosMes: 0,
    lucrosPorDia: {},
    servicosMaisPopulares: []
  });
  const hoje = new Date();
  const dataHoje = formatDateValue(hoje);
  const limiteEdicao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30);
  const dataLimiteEdicao = `${limiteEdicao.getFullYear()}-${String(limiteEdicao.getMonth() + 1).padStart(2, '0')}-${String(limiteEdicao.getDate()).padStart(2, '0')}`;
  const horariosPermitidos = Array.from({ length: 23 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }).filter((horario) => !horario.startsWith('12:'));

  useEffect(() => {
    document.title = 'Painel Admin | Barbearia Prime';
  }, []);

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

  useEffect(() => {
    if (!isAuthenticated) return;

    loadAgendamentos();
    const interval = window.setInterval(() => loadAgendamentos(true), 30000);
    return () => {
      window.clearInterval(interval);
    };
  // A atualização periódica é recriada apenas quando o estado de autenticação muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const calcularEstatisticas = (agendamentos: Agendamento[]) => {
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    const mesAtual = hoje.substring(0, 7);
    const agendamentosAtivos = agendamentos.filter(a => a.status !== 'cancelado');
    const agendamentosConcluidos = agendamentos.filter(a => a.status === 'concluido');

    const agendamentosHoje = agendamentosAtivos.filter(a => a.data === hoje);
    const agendamentosMes = agendamentosAtivos.filter(a => a.data.startsWith(mesAtual));
    const concluidosHoje = agendamentosConcluidos.filter(a => a.data === hoje);
    const concluidosMes = agendamentosConcluidos.filter(a => a.data.startsWith(mesAtual));

    const lucroHoje = concluidosHoje.reduce((total, a) => total + (a.preco || 0), 0);
    const lucroMensal = concluidosMes.reduce((total, a) => total + (a.preco || 0), 0);

    // Agrupar lucros por dia
    const lucrosPorDia = concluidosMes.reduce((acc, a) => {
      const dia = a.data;
      acc[dia] = (acc[dia] || 0) + (a.preco || 0);
      return acc;
    }, {} as Record<string, number>);

    // Serviços mais populares
    const servicosAgrupados = concluidosMes.reduce((acc, a) => {
      const servico = a.servico;
      if (!acc[servico]) {
        acc[servico] = { quantidade: 0, lucroTotal: 0 };
      }
      acc[servico].quantidade++;
      acc[servico].lucroTotal += a.preco || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; lucroTotal: number }>);

    const servicosMaisPopulares = Object.entries(servicosAgrupados)
      .map(([servico, stats]) => ({
        servico,
        quantidade: stats.quantidade,
        lucroTotal: stats.lucroTotal
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const diasComAgendamento = Object.keys(lucrosPorDia).length;
    const mediaDiaria = diasComAgendamento > 0 ? lucroMensal / diasComAgendamento : 0;

    setDashboardStats({
      lucroHoje,
      lucroMensal,
      totalAgendamentos: agendamentosAtivos.length,
      mediaDiaria,
      agendamentosHoje: agendamentosHoje.length,
      agendamentosMes: agendamentosMes.length,
      lucrosPorDia,
      servicosMaisPopulares
    });
  };

  const loadAgendamentos = async (silent = false) => {
    if (loadingAppointmentsRef.current) return;

    loadingAppointmentsRef.current = true;
    if (!silent) setLoading(true);

    try {
      const { data, success } = await schedulingService.listAdmin();
      if (success) {
        setAgendamentos(data);
        calcularEstatisticas(data);
        setMessage((current) =>
          current?.text === 'Não foi possível atualizar os dados do painel.' ? null : current
        );
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      if (error instanceof ApiError && error.status === 401) {
        authService.logout();
        setIsAuthenticated(false);
        setMessage({ type: 'error', text: 'Sua sessão expirou. Entre novamente.' });
        return;
      }

      if (!silent) {
        setMessage({ type: 'error', text: 'Não foi possível atualizar os dados do painel.' });
      }
    } finally {
      loadingAppointmentsRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setMessage({ type: 'error', text: 'Informe a senha de administrador para entrar.' });
      return;
    }

    setLoading(true);

    try {
      await Promise.all([
        authService.login(password),
        new Promise((resolve) => window.setTimeout(resolve, 700))
      ]);
      setIsAuthenticated(true);
      setPassword('');
      setMessage(null);
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível entrar.'
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

  const handleEdit = (agendamento: Agendamento) => {
    if (agendamento._id) {
      setEditingId(agendamento._id);
      setEditForm({ ...agendamento });
      setEditErrors({});
      setMessage(null);
    }
  };

  const handleClearFilter = () => {
    if (clearingFilter) return;

    setFilterDate('');
    setClearingFilter(true);
    window.setTimeout(() => setClearingFilter(false), 500);
  };

  const validateEditForm = () => {
    if (!editForm) return false;

    const nextErrors: EditErrors = {};
    const nome = editForm.nome.trim().replace(/\s+/g, ' ');
    const telefone = editForm.telefone.replace(/\D/g, '');
    const original = agendamentos.find((appointment) => appointment._id === editingId);

    if (nome.length < 3 || nome.split(' ').length < 2) nextErrors.nome = 'Informe nome e sobrenome.';
    if (!/^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(telefone)) nextErrors.telefone = 'Telefone inválido com DDD.';
    if (!servicos.some((servico) => servico.nome === editForm.servico)) nextErrors.servico = 'Selecione um serviço válido.';
    if (!editForm.preco || editForm.preco < 0) nextErrors.preco = 'Informe um preço válido.';
    if (!editForm.data) {
      nextErrors.data = 'Escolha uma data.';
    } else if (editForm.data !== original?.data && (editForm.data < dataHoje || editForm.data > dataLimiteEdicao)) {
      nextErrors.data = 'Escolha uma data entre hoje e os próximos 30 dias.';
    }
    if (!horariosPermitidos.includes(editForm.horario)) nextErrors.horario = 'Escolha um horário válido.';

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;
    if (!validateEditForm()) {
      setMessage({ type: 'error', text: 'Revise os campos destacados antes de salvar.' });
      return;
    }

    setLoading(true);
    try {
      // Remove o campo _id do objeto que será enviado para atualização
      const updateData = { ...editForm };
      delete updateData._id;
      const result = await schedulingService.update(editingId, updateData);

      if (result.success) {
        const updatedAgendamentos = agendamentos.map(a =>
          a._id === editingId ? { ...result.data } : a
        );
        setAgendamentos(updatedAgendamentos);
        calcularEstatisticas(updatedAgendamentos);

        setEditingId(null);
        setEditForm(null);
        setEditErrors({});
        setMessage({ type: 'success', text: 'Agendamento atualizado com sucesso.' });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: unknown) {
      console.error('Erro ao atualizar agendamento:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível atualizar o agendamento.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const result = await schedulingService.remove(id);

      if (result.success) {
        const updatedAgendamentos = agendamentos.map(a =>
          a._id === id ? result.data : a
        );
        setAgendamentos(updatedAgendamentos);
        calcularEstatisticas(updatedAgendamentos);

        setDeleteTarget(null);
        setMessage({ type: 'success', text: 'Agendamento cancelado com sucesso.' });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: unknown) {
      console.error('Erro ao excluir agendamento:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível excluir o agendamento.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: keyof Agendamento, value: string | number) => {
    if (!editForm || field === '_id') return; // Impede modificação do _id

    const selectedService = field === 'servico'
      ? servicos.find((servico) => servico.nome === value)
      : undefined;
    const newForm = {
      ...editForm,
      [field]: value,
      ...(selectedService ? { preco: selectedService.preco } : {})
    };
    setEditForm(newForm);
    setEditErrors((current) => {
      const next = { ...current };
      delete next[field as keyof EditErrors];
      return next;
    });
  };

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Agendamentos filtrados e ordenados
  const agendamentosFiltrados = filterDate
    ? agendamentos.filter(a => a.data === filterDate)
    : agendamentos;

  const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.horario.localeCompare(b.horario);
  });
  const agendamentosRecentes = [...agendamentos]
    .sort((a, b) => {
      if (a.timestamp !== b.timestamp) return (b.timestamp || 0) - (a.timestamp || 0);
      if (a.data !== b.data) return b.data.localeCompare(a.data);
      return b.horario.localeCompare(a.horario);
    })
    .slice(0, 5);
  const dataMinimaFiltro = agendamentos.reduce(
    (earliest, appointment) => appointment.data < earliest ? appointment.data : earliest,
    `${hoje.getFullYear() - 5}-01-01`
  );
  const dataMaximaFiltro = agendamentos.reduce(
    (latest, appointment) => appointment.data > latest ? appointment.data : latest,
    `${hoje.getFullYear() + 1}-12-31`
  );

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        {loading && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-loading-title"
            aria-describedby="admin-login-loading-description"
          >
            <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 text-center shadow-2xl shadow-black/70">
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-amber-400/15" />
                <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-amber-400/60 border-t-amber-400" />
                <LogOut className="h-6 w-6 rotate-180 text-amber-300" />
              </div>
              <h2 id="admin-login-loading-title" className="text-xl font-bold text-white">
                Entrando no painel
              </h2>
              <p id="admin-login-loading-description" className="mt-2 text-sm leading-6 text-zinc-400">
                Aguarde enquanto verificamos seu acesso.
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

        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-6">
            <img src='/logo.png' className="h-20 w-26 text-amber-500 bg-amber-500 mr-3" />
            <h1 className="text-2xl font-bold">Admin Prime</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {message && (
              <div id="admin-login-alert" role="alert" className={`rounded-lg border p-3 text-sm ${
                message.type === 'error'
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-green-500/40 bg-green-500/10 text-green-300'
              }`}>
                {message.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Senha de administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (message?.type === 'error') setMessage(null);
                  }}
                  className={`w-full rounded-md border bg-zinc-800 px-4 py-3 pr-12 outline-none transition focus:ring-2 ${
                    message?.type === 'error' && !password.trim()
                      ? 'border-red-400 focus:border-red-300 focus:ring-red-400/30'
                      : 'border-transparent focus:border-amber-500 focus:ring-amber-500/30'
                  }`}
                  placeholder="Digite a senha"
                  autoComplete="current-password"
                  aria-invalid={message?.type === 'error' && !password.trim()}
                  aria-describedby={message?.type === 'error' ? 'admin-login-alert' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-700 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-black py-3 rounded-md font-semibold hover:bg-amber-600 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Botão para voltar ao site principal */}
          <div className="mt-6 pt-4 border-t border-zinc-700">
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-md font-semibold transition"
            >
              <Home className="h-4 w-4" />
              Voltar para o site
            </a>
          </div>

          <p className="text-white text-sm mt-4 text-center">
            Acesso restrito ao barbeiro
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {message && (
        <div className={`fixed right-4 top-4 z-[100] flex max-w-sm items-start gap-3 rounded-xl border p-4 shadow-2xl ${
          message.type === 'error'
            ? 'border-red-500/40 bg-red-950 text-red-200'
            : 'border-green-500/40 bg-green-950 text-green-200'
        }`}>
          <span className="text-sm font-semibold">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Fechar mensagem">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold">Cancelar agendamento?</h2>
            <p className="mt-2 text-center text-sm text-zinc-400">
              O agendamento de <strong className="text-white">{deleteTarget.nome}</strong> será marcado como cancelado e permanecerá no histórico.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={loading}
                className="flex-1 rounded-lg border border-zinc-700 px-4 py-3 font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteTarget._id && handleDelete(deleteTarget._id)}
                disabled={loading || !deleteTarget._id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? 'Cancelando...' : 'Cancelar agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
     <header className="bg-zinc-900 border-b border-zinc-700">
  <div className="container mx-auto px-6 py-4">

    {/* MOBILE: coluna */}
    <div className="flex flex-col items-center text-center md:hidden space-y-4">

      {/* Logo e textos centralizados */}
      <div className="flex flex-col items-center space-y-1">
        <img src="/logo.png" className="h-12 w-12 rounded-full bg-amber-500" />
        <h1 className="text-2xl font-bold">Painel Admin</h1>
        <p className="text-white text-sm">
          Gerencie os agendamentos e finanças
        </p>
      </div>

      {/* Botões ocupando toda largura */}
      <div className="w-full flex flex-col space-y-3">
        <a
          href="/"
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full px-4 py-2 rounded-md transition"
        >
          <Home className="h-5 w-5" />
          <span>Voltar ao site</span>
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 w-full px-4 py-2 rounded-md transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>

    {/* DESKTOP: linha */}
    <div className="hidden md:flex justify-between items-center">

      {/* Logo + Títulos */}
      <div className="flex items-center space-x-3">
        <img src="/logo.png" className="h-10 w-10 rounded-full bg-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">Painel Admin</h1>
          <p className="text-white text-sm">Gerencie os agendamentos e finanças</p>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center space-x-3">
        <a
          href="/"
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition"
        >
          <Home className="h-5 w-5" />
          <span>Voltar ao site</span>
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>

    </div>

  </div>
</header>


      {/* Tabs */}
      <div className="container mx-auto px-6 pt-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${activeTab === 'dashboard'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
          >
            <TrendingUp className="h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`px-6 py-3 rounded-md font-semibold transition flex items-center gap-2 ${activeTab === 'agendamentos'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
          >
            <Calendar className="h-5 w-5" />
            Agendamentos
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        /* Dashboard */
        <div className="container mx-auto px-6 pb-6">
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
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-500">{formatarMoeda(dashboardStats.lucroHoje)}</p>
              <p className="text-xs text-white mt-1">{dashboardStats.agendamentosHoje} agendamento(s)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Lucro mensal</h3>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-amber-500">{formatarMoeda(dashboardStats.lucroMensal)}</p>
              <p className="text-xs text-white mt-1">{dashboardStats.agendamentosMes} agendamento(s)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Total de agendamentos</h3>
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">{dashboardStats.totalAgendamentos}</p>
              <p className="text-xs text-white mt-1">Mês: {dashboardStats.agendamentosMes}</p>
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
              <p className="text-white text-center py-8">Nenhum agendamento neste mês</p>
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
                          <span className="text-sm text-white">{formatarData(dia)}</span>
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
              <p className="text-white text-center py-8">Nenhum serviço registrado este mês</p>
            ) : (
              <div className="space-y-4">
                {dashboardStats.servicosMaisPopulares.map((servico) => {
                  const porcentagem = (servico.quantidade / dashboardStats.agendamentosMes) * 100;

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
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{agendamento.nome}</p>
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-500">
                            {agendamento.servico}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatarData(agendamento.data)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {agendamento.horario}
                          </div>
                          <div className="flex items-center gap-1 text-green-500">
                            <DollarSign className="h-4 w-4" />
                            {formatarMoeda(agendamento.preco || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(agendamento)}
                          className="p-2 text-amber-500 hover:bg-amber-500/20 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(agendamento)}
                          className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Cancelar agendamento"
                        >
                          <Trash2 className="h-5 w-5" />
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
                Agendamentos {filterDate && `- ${formatarData(filterDate)}`}
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
                    <div key={agendamento._id || `${agendamento.data}-${agendamento.horario}-${index}`} className="p-6 hover:bg-zinc-800 transition">
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
                                type="number"
                                step="0.01"
                                value={editForm?.preco || 0}
                                readOnly
                                className="w-full cursor-not-allowed rounded-md bg-zinc-900 px-4 py-2 text-zinc-400 outline-none"
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
                                disableSundays
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
                                <option value="concluido">Concluído</option>
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
                                 setEditingId(null);
                                 setEditForm(null);
                                 setEditErrors({});
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-amber-500" />
                                <span className="font-semibold text-lg">{agendamento.nome}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-green-500" />
                                <span className="text-white">{agendamento.telefone}</span>
                              </div>
                              {agendamento.preco && (
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                  <span className="text-green-500 font-bold">{formatarMoeda(agendamento.preco)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-white">
                              <div className="flex items-center space-x-1">
                                <Scissors className="h-4 w-4" />
                                <span>{agendamento.servico}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {formatarData(agendamento.data)} às {agendamento.horario}
                                  </span>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${{
                                  'pendente': 'bg-yellow-500/20 text-yellow-500',
                                  'concluido': 'bg-green-500/20 text-green-500',
                                  'cancelado': 'bg-red-500/20 text-red-500'
                                }[agendamento.status || 'pendente']}`}>
                                  {{
                                    'pendente': 'Pendente',
                                    'concluido': 'Concluído',
                                    'cancelado': 'Cancelado'
                                  }[agendamento.status || 'pendente']}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-4 md:mt-0">
                            <button
                              onClick={() => handleEdit(agendamento)}
                              disabled={loading || !agendamento._id}
                              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-md transition disabled:opacity-50"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(agendamento)}
                              disabled={loading || !agendamento._id}
                              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md transition disabled:opacity-50"
                              title="Cancelar agendamento"
                            >
                              <Trash2 className="h-4 w-4" />
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
