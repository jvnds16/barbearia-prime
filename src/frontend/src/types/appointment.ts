export interface Appointment {
  _id?: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  price?: number;
  date: string;
  time: string;
  timestamp?: number;
  idempotencyKey?: string;
  durationMinutes?: number;
  cancelledAt?: string;
  cancelledBy?: string;
  status?: "pending" | "present" | "absent" | "cancelled";
}

export interface DashboardStats {
  todayProfit: number;
  monthlyProfit: number;
  totalAppointments: number;
  dailyAverage: number;
  todayAppointments: number;
  monthlyAppointments: number;
  todayAttendances: number;
  monthlyAttendances: number;
  monthlyPending: number;
  monthlyAbsent: number;
  dailyProfits: Record<string, number>;
  mostPopularServices: Array<{
    serviceName: string;
    quantity: number;
    totalProfit: number;
  }>;
}

export interface Service {
  _id?: string;
  name: string;
  price: number;
  duration: number;
  active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
