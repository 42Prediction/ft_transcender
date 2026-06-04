import { useState } from "react";
import { Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import { Mail, Lock, Eye, EyeOff, KeyRound, ChevronDown, Loader2, Check, X, } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";
type LoginMethod = "password" | "magic";
type FieldState = "default" | "focus" | "error" | "success";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: Tab;
}

const socialBrands = [
  { id: "google", label: "G", color: "text-[#EA4335]" },
  { id: "x", label: "𝕏", color: "text-foreground" },
  { id: "telegram", label: "✈", color: "text-[#229ED9]" },
  { id: "steam", label: "▶", color: "text-[#66c0f4]" },
  { id: "discord", label: "✱", color: "text-[#5865F2]" },
  { id: "more", label: "•••", color: "text-muted-foreground" },
];

function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-violet shadow-glow">
        <span className="font-display text-sm font-black tracking-tight text-white">EB</span>
        <span className="absolute inset-0 rounded-full bg-gradient-glow opacity-60 blur-md" />
      </div>
      <span className="font-display text-3xl font-bold tracking-tight">
        Exam<span className="text-primary">Bet</span>
      </span>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  state = "default",
  error,
  right,
  required,
  label,
}: {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  state?: FieldState;
  error?: string;
  right?: React.ReactNode;
  required?: boolean;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <div
        className={cn(
          "group relative flex items-center rounded-xl border bg-surface/60 transition-all",
          state === "default" && "border-border/60 hover:border-border",
          state === "focus" && "border-primary/60 shadow-[0_0_0_3px_oklch(0.88_0.22_130/0.15),0_0_20px_oklch(0.88_0.22_130/0.25)]",
          state === "error" && "border-destructive/70 shadow-[0_0_0_3px_oklch(0.65_0.24_22/0.18)]",
          state === "success" && "border-[var(--yes)]/60",
        )}
      >
        <Icon className={cn(
          "ml-3.5 h-4 w-4 shrink-0",
          state === "error" ? "text-destructive" : state === "focus" ? "text-primary" : "text-muted-foreground",
        )} />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        {right}
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SocialPill({ label, color, full }: { label: string; color: string; full?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition-all hover:border-primary/40 hover:bg-surface hover:shadow-[0_0_20px_oklch(0.88_0.22_130/0.15)]",
        full ? "w-full" : "h-11 w-11",
      )}
    >
      <span className={cn("font-display text-base font-bold", color)}>{label}</span>
    </button>
  );
}

export function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [showPwd, setShowPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [showRef, setShowRef] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^\+?\d{6,}$/.test(email);
  const emailState: FieldState = email.length === 0 ? "default" : validEmail ? "success" : "error";
  const regEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^\+?\d{6,}$/.test(regEmail);
  const regEmailState: FieldState = regEmail.length === 0 ? "default" : regEmailValid ? "success" : "error";

  const loginValid = validEmail && (loginMethod === "magic" || password.length >= 6);
  const registerValid = regEmailValid && regPassword.length >= 6 && accepted;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 1200);
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden border-border/60 bg-transparent p-0 sm:max-w-[460px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{tab === "login" ? "Sign in to ExamBet" : "Create your ExamBet account"}</DialogTitle>

        <div className="relative rounded-2xl border border-border/60 bg-gradient-card p-7 shadow-elevated backdrop-blur-2xl">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

          {/* Tabs */}
          <div className="relative mb-7 flex items-center border-b border-border/50">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative flex-1 pb-3 text-sm font-semibold transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                {t === "login" ? "Entrar" : "Cadastrar"}
                <span
                  className={cn(
                    "absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-primary shadow-glow transition-transform duration-300",
                    tab === t ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            ))}
          </div>

          {/* Logo */}
          <div className="relative mb-6">
            <Logo />
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--yes)] bg-[var(--yes)]/10 shadow-[0_0_30px_oklch(0.78_0.20_150/0.4)]">
                <Check className="h-8 w-8 text-[var(--yes)]" />
              </div>
              <p className="font-medium text-[var(--yes)]">
                {tab === "login" ? "Login realizado com sucesso!" : "Conta criada com sucesso!"}
              </p>
            </div>
          ) : tab === "login" ? (
            <form onSubmit={handleSubmit} className="relative space-y-5">
              {/* Method toggle */}
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/60 bg-surface/40 p-1">
                {[
                  { id: "password" as const, label: "Senha", icon: Lock },
                  { id: "magic" as const, label: "Código Único", icon: KeyRound },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLoginMethod(m.id)}
                    className={cn(
                      "flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all",
                      loginMethod === m.id
                        ? "bg-surface-elevated text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>

              <Field
                label="E-mail / Número de Telefone"
                required
                icon={Mail}
                placeholder="Digite seu e-mail ou telefone"
                value={email}
                onChange={setEmail}
                state={emailState}
                error={emailState === "error" ? "E-mail inválido" : undefined}
              />

              {loginMethod === "password" && (
                <Field
                  label="Senha"
                  required
                  icon={Lock}
                  type={showPwd ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={setPassword}
                  state={password.length === 0 ? "default" : password.length >= 6 ? "success" : "error"}
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="mr-3 text-muted-foreground transition hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              )}

              <div className="flex justify-end">
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Esqueceu sua senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={!loginValid || loading}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all",
                  loginValid && !loading
                    ? "shadow-[0_0_30px_oklch(0.88_0.22_130/0.4)] hover:opacity-95"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
              </button>

              <Divider>ou continue com</Divider>

              <SocialPill label="C  Cwallet" color="text-primary" full />
              <SocialPill label="G  Google" color="text-foreground" full />

              <div className="flex items-center justify-center gap-2 pt-1">
                {socialBrands.map((s) => (
                  <SocialPill key={s.id} label={s.label} color={s.color} />
                ))}
              </div>

              <p className="pt-2 text-center text-xs text-muted-foreground">
                Ao continuar, você concorda com os{" "}
                <a href="#" className="text-primary hover:underline">Termos e Condições</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <Field
                label="E-mail / Número de Telefone"
                required
                icon={Mail}
                placeholder="Digite seu e-mail ou telefone"
                value={regEmail}
                onChange={setRegEmail}
                state={regEmailState}
                error={regEmailState === "error" ? "E-mail inválido" : undefined}
              />

              <Field
                label="Senha"
                required
                icon={Lock}
                type={showRegPwd ? "text" : "password"}
                placeholder="Crie uma senha segura"
                value={regPassword}
                onChange={setRegPassword}
                state={regPassword.length === 0 ? "default" : regPassword.length >= 6 ? "success" : "error"}
                right={
                  <button
                    type="button"
                    onClick={() => setShowRegPwd((s) => !s)}
                    className="mr-3 text-muted-foreground transition hover:text-foreground"
                  >
                    {showRegPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <button
                type="button"
                onClick={() => setShowRef((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface/60 px-4 py-3 text-left text-sm text-muted-foreground transition hover:border-border"
              >
                <span>Digite Código de Referência / Promoção <span className="text-xs">(Opcional)</span></span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showRef && "rotate-180")} />
              </button>
              {showRef && (
                <input
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="Código"
                  className="h-11 w-full rounded-xl border border-border/60 bg-surface/60 px-4 text-sm focus:border-primary/60 focus:outline-none"
                />
              )}

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setAccepted((a) => !a)}
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all",
                    accepted
                      ? "border-primary bg-primary shadow-glow"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                  aria-pressed={accepted}
                >
                  {accepted && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                </button>
                <span className="leading-snug">
                  Sou maior de 18 anos e concordo com os{" "}
                  <a href="#" className="text-primary underline-offset-2 hover:underline">Termos e Condições</a>
                  <span className="text-primary"> *</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={!registerValid || loading}
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all",
                  registerValid && !loading
                    ? "shadow-[0_0_30px_oklch(0.88_0.22_130/0.4)] hover:opacity-95"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cadastrar"}
              </button>

              <Divider>ou continue com</Divider>

              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-primary">C</span> Cwallet
                </button>
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-[#EA4335]">G</span> Google
                </button>
                <button type="button" className="flex h-11 items-center justify-center gap-1 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium text-muted-foreground transition hover:border-primary/40">
                  Mais <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <button type="button" onClick={() => setTab("login")} className="font-medium text-primary hover:underline">
                  Entrar
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center py-1">
      <div className="h-px flex-1 bg-border/60" />
      <span className="px-3 text-xs text-muted-foreground">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
