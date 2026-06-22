import { FormEvent } from "react";
import { Eye, EyeOff, Home, LogOut } from "lucide-react";
import { AdminMessage } from "../../hooks/useAdminPanel";

type AdminLoginProps = {
  loading: boolean;
  message: AdminMessage;
  password: string;
  showPassword: boolean;
  onSubmit: (event: FormEvent) => void;
  onPasswordChange: (value: string) => void;
  onClearMessage: () => void;
  onTogglePassword: () => void;
};

export function AdminLogin({
  loading,
  message,
  password,
  showPassword,
  onSubmit,
  onPasswordChange,
  onClearMessage,
  onTogglePassword
}: AdminLoginProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {loading && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-login-loading-title" aria-describedby="admin-login-loading-description">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 p-7 text-center shadow-2xl shadow-black/70">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-amber-400/15" />
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-amber-400/60 border-t-amber-400" />
              <LogOut className="h-6 w-6 rotate-180 text-amber-300" />
            </div>
            <h2 id="admin-login-loading-title" className="text-xl font-bold text-white">Entrando no painel</h2>
            <p id="admin-login-loading-description" className="mt-2 text-sm leading-6 text-zinc-400">Aguarde enquanto verificamos seu acesso.</p>
            <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <span key={item} className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" style={{ animationDelay: `${item * 160}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.png" className="h-20 w-26 text-amber-500 bg-amber-500 mr-3" />
          <h1 className="text-2xl font-bold">Admin Prime</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {message && (
            <div id="admin-login-alert" role="alert" className={`rounded-lg border p-3 text-sm ${
              message.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-green-500/40 bg-green-500/10 text-green-300"
            }`}>
              {message.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Senha de administrador</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  onPasswordChange(event.target.value);
                  if (message?.type === "error") onClearMessage();
                }}
                className={`w-full rounded-md border bg-zinc-800 px-4 py-3 pr-12 outline-none transition focus:ring-2 ${
                  message?.type === "error" && !password.trim()
                    ? "border-red-400 focus:border-red-300 focus:ring-red-400/30"
                    : "border-transparent focus:border-amber-500 focus:ring-amber-500/30"
                }`}
                placeholder="Digite a senha"
                autoComplete="current-password"
                aria-invalid={message?.type === "error" && !password.trim()}
                aria-describedby={message?.type === "error" ? "admin-login-alert" : undefined}
              />
              <button type="button" onClick={onTogglePassword} className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-700 hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} title={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-amber-500 text-black py-3 rounded-md font-semibold hover:bg-amber-600 transition disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-700">
          <a href="/" className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-md font-semibold transition">
            <Home className="h-4 w-4" />
            Voltar para o site
          </a>
        </div>
        <p className="text-white text-sm mt-4 text-center">Acesso restrito ao barbeiro</p>
      </div>
    </div>
  );
}
