export interface Agendamento {
  _id?: string;
  nome: string;
  telefone: string;
  servico: string;
  preco?: number;
  data: string;
  horario: string;
  timestamp?: number;
  idempotencyKey?: string;
  duracaoMinutos?: number;
  canceladoEm?: string;
  canceladoPor?: string;
  status?: "pendente" | "concluido" | "cancelado";
}

export interface DashboardStats {
  lucroHoje: number;
  lucroMensal: number;
  totalAgendamentos: number;
  mediaDiaria: number;
  agendamentosHoje: number;
  agendamentosMes: number;
  lucrosPorDia: Record<string, number>;
  servicosMaisPopulares: Array<{
    servico: string;
    quantidade: number;
    lucroTotal: number;
  }>;
}

export interface Servico {
  _id?: string;
  nome: string;
  preco: number;
  duracao: string;
  ativo?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
