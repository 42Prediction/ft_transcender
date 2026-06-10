import { useState } from "react";
import Logo from "@/components/Logo";
import { Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import { Mail, Lock, Eye, EyeOff, KeyRound, ChevronDown, Loader2, Check, X, } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "signin" | "signup";
type LoginMethod = "password";
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

function LogoAuth() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center">
         <Logo/>
      </div>
      <span className="font-display text-3xl font-bold tracking-tight">
        <span className="text-primary">Prediction</span>
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

export function AuthModal({ open, onOpenChange, defaultTab = "signin" }: AuthModalProps) {
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

  const loginValid = validEmail && password.length >= 6;
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
        <DialogTitle className="sr-only">{tab === "signin" ? "Sign in to 42 Prediction" : "Create your 42 Prediction account"}</DialogTitle>

        <div className="relative rounded-2xl border border-border/60 bg-gradient-card p-7 shadow-elevated backdrop-blur-2xl">
          {/* Tabs */}
          <div className="relative mb-7 flex items-center border-b border-border/50">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative flex-1 pb-3 text-sm font-semibold transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
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
            <LogoAuth />
          </div>

          {success ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--yes)] bg-[var(--yes)]/10 shadow-[0_0_30px_oklch(0.78_0.20_150/0.4)]">
                <Check className="h-8 w-8 text-[var(--yes)]" />
              </div>
              <p className="font-medium text-[var(--yes)]">
                {tab === "signin" ? "Login successful!!" : "Account created successfully!"}
              </p>
            </div>
          ) : tab === "signin" ? (
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <Field
                label="Email"
                required
                icon={Mail}
                placeholder="Enter your email"
                value={email}
                onChange={setEmail}
                state={emailState}
                error={emailState === "error" ? "Invalid email address" : undefined}
              />

              {loginMethod === "password" && (
                <Field
                  label="Password"
                  required
                  icon={Lock}
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                  state={password.length === 0 ? "default" : password.length >= 8 ? "success" : "error"}
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
                  Forgot your password?
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </button>

              <Divider>or continue with</Divider>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-primary">42</span> School
                </button>
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-[#EA4335]">G</span> Google
                </button>
              </div>

              <p className="pt-2 text-center text-xs text-muted-foreground">
                By continuing, you agree to the{" "}
                <a href="#" className="text-primary hover:underline">Terms and Conditions</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <Field
                label="Email"
                required
                icon={Mail}
                placeholder="Enter your email address"
                value={regEmail}
                onChange={setRegEmail}
                state={regEmailState}
                error={regEmailState === "error" ? "Invalid email address" : undefined}
              />

              <Field
                label="Password"
                required
                icon={Lock}
                type={showRegPwd ? "text" : "password"}
                placeholder="Create a secure password"
                value={regPassword}
                onChange={setRegPassword}
                state={regPassword.length === 0 ? "default" : regPassword.length >= 8 ? "success" : "error"}
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
                  I am over 18 years old and I agree with the{" "}
                  <a href="#" className="text-primary underline-offset-2 hover:underline">Terms and Conditions</a>
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
              </button>

              <Divider>or signin with</Divider>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-primary">42</span> School
                </button>
                <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
                  <span className="font-display font-bold text-[#EA4335]">G</span> Google
                </button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Do you already have an account?{" "}
                <button type="button" onClick={() => setTab("signin")} className="font-medium text-primary hover:underline">
                  Sign In
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
