import { useState } from "react";
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

function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative grid h-12 w-12 place-items-center">
         <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 500 500"
              className="drop-shadow-lg"
              fill="currentColor"
            >
              <path
                d="M451.5 137.56 c-.55 .22 -7.52 1.53 -15.5 2.9 -7.98 1.37 -19.56 3.4 -25.75 4.52 -6.19 1.11 -16.29 2.91 -22.44 3.98 l-11.19 1.96 -9.81 9.77 c-10.6 10.56 -11.81 12.74 -6.56 11.84 28.51 -4.88 62.23 -10.38 62.42 -10.2 .38 .38 -27.71 68.18 -44.39 107.16 -8.24 19.25 -15.22 35.68 -15.51 36.5 -.34 .95 -1.32 -.34 -2.68 -3.5 -3.86 -8.99 -5.52 -11.61 -11.4 -18.07 -28.14 -30.85 -85.57 -15.73 -112.3 29.57 -11.25 19.05 -15.45 38.63 -11.89 55.41 3.43 16.2 12.69 28.56 26.63 35.53 10.31 5.16 16.8 6.4 30.34 5.79 20.33 -.91 37.97 -8.76 54.28 -24.15 15.19 -14.33 24.43 -32.09 27.67 -53.18 1.13 -7.32 2.25 -10.52 6.29 -17.91 14.91 -27.28 85.64 -168.06 86.84 -172.86 .98 -3.92 -1.57 -6.49 -5.05 -5.07z m-129.94 137.55 c2.44 .62 4.44 1.36 4.44 1.66 0 .3 -1.42 2.76 -3.15 5.46 -2.59 4.04 -3.53 4.8 -5.25 4.25 -1.15 -.36 -5.77 -.9 -10.27 -1.2 -5.42 -.36 -8.05 -.92 -7.8 -1.66 .2 -.62 .86 -3.04 1.46 -5.38 l1.09 -4.25 7.52 0 c4.14 0 9.52 .5 11.96 1.12z m-52.63 17.65 l1.28 3.87 -7.91 7.93 c-4.35 4.36 -9.01 9.44 -10.36 11.28 -2.36 3.22 -2.64 3.32 -7.2 2.63 l-4.75 -.71 2.2 -3.63 c6.21 -10.27 22.42 -27.12 24.72 -25.7 .41 .26 1.33 2.21 2.03 4.33z m49.79 2.17 c6.25 2.73 13.51 10.15 16.45 16.81 2.62 5.93 3.51 18.65 1.87 26.59 -3.32 15.98 -16.2 32.45 -31.53 40.32 -10.16 5.21 -16.64 6.71 -26.49 6.14 -27.91 -1.62 -40.32 -29.39 -26.08 -58.34 7.12 -14.47 22.03 -27.68 36.06 -31.97 3.02 -.92 5.95 -1.85 6.5 -2.06 3.24 -1.23 18.41 .41 23.21 2.51z m33.68 4.77 c3.52 7.38 4.93 12.93 5.02 19.71 .05 3.81 .17 5.61 -.79 6.66 -.96 1.06 -3 1.37 -7.25 2.21 l-3.14 .62 -1.09 -7.3 c-.6 -4.02 -2 -9.43 -3.11 -12.04 -1.12 -2.6 -2.03 -5.1 -2.03 -5.55 0 -.81 8.97 -7.92 10.06 -7.98 .31 -.02 1.36 1.64 2.33 3.67z m-112.1 57.55 c.32 3.44 1.26 7.87 2.09 9.84 l1.51 3.59 -4.7 3.41 c-2.58 1.87 -4.97 3.53 -5.3 3.69 -1.49 .7 -4.28 -9.76 -4.34 -16.24 l-.06 -6.95 4.5 -1.69 c2.47 -.93 4.77 -1.74 5.11 -1.8 .33 -.06 .87 2.71 1.19 6.15z m100.7 14.57 c0 1.55 -8.4 10.27 -14.73 15.3 -5.6 4.45 -8.29 6.65 -9.96 6.99 -1.67 .34 -2.33 -1.18 -3.85 -4.19 -1.43 -2.82 -2.45 -5.22 -2.28 -5.33 5.48 -3.67 11.56 -8.71 16.23 -13.46 l5.91 -6.01 4.34 3.11 c2.38 1.71 4.34 3.33 4.34 3.59z m-71.5 19.3 c2.75 .59 6.44 1.37 8.19 1.73 l3.19 .66 -1.79 5.27 c-.99 2.9 -2.08 5.55 -2.42 5.9 -.91 .91 -13.95 -1.4 -18.73 -3.31 -4.44 -1.78 -4.45 -2 -.42 -8.38 2.14 -3.39 3.04 -4.06 4.81 -3.55 1.2 .34 4.43 1.1 7.18 1.69z M303.44 326.14 c-6.02 5.58 -12.57 11.68 -14.55 13.57 l-3.61 3.43 -5.23 -6.57 c-2.87 -3.61 -5.86 -6.57 -6.64 -6.57 -1.81 0 -9.42 6.84 -9.42 8.47 0 .68 3.51 5.92 7.8 11.63 6.49 8.65 8.24 10.39 10.47 10.39 2.09 0 6.86 -3.92 21.7 -17.82 10.47 -9.8 19.03 -18.32 19.03 -18.94 0 -2.36 -4.56 -7.73 -6.56 -7.74 -1.23 -0 -6.47 4.08 -13 10.14z"
                fill="#24ee89"
              />
              <path
                d="M356 58.5 c-4.12 1.26 -21.23 6.36 -38 11.33 -16.77 4.97 -35 10.38 -40.5 12.04 -5.5 1.66 -21.48 6.45 -35.5 10.65 -14.03 4.2 -32.25 9.66 -40.5 12.14 -8.25 2.48 -16.35 4.89 -18 5.36 -1.65 .47 -6.6 1.96 -11 3.31 -4.4 1.35 -15.65 4.78 -25 7.63 -37.82 11.52 -39.39 12.08 -44.12 15.68 -6.71 5.12 -9.88 7.08 -13.65 19.26 -3.76 12.18 -8.12 34.58 -17.22 80.6 -8.59 43.45 -16.54 83.45 -17.68 88.9 -4.58 21.88 .46 36.4 15.36 44.23 5.2 2.73 17.96 2.89 35.81 .43 8.53 -1.17 22.25 -3 30.5 -4.06 8.25 -1.06 18.15 -2.36 22 -2.89 12.11 -1.65 46.73 -6.11 47.45 -6.11 .77 0 3.13 -16.25 2.45 -16.93 -.23 -.23 -6.38 .37 -13.66 1.34 -7.28 .97 -16.17 2.15 -19.74 2.62 -9.18 1.2 -45.23 5.97 -53 7.01 -3.58 .48 -11.67 1.56 -18 2.41 -6.33 .84 -13.66 1.54 -16.3 1.54 -10.28 .02 -18.7 -7.87 -18.7 -17.52 0 -1.81 1.41 -10.19 3.13 -18.63 1.72 -8.44 3.34 -16.47 3.6 -17.84 1.75 -9.2 9.66 -48.45 16.41 -81.5 4.38 -21.45 8.67 -42.82 9.53 -47.5 1.9 -10.3 5.36 -17.12 10.7 -21.04 2.42 -1.78 9.14 -4.55 17.06 -7.02 7.19 -2.25 15.77 -4.94 19.07 -5.98 3.3 -1.04 22.65 -6.89 43 -13.01 20.35 -6.11 48.7 -14.63 63 -18.93 14.3 -4.3 37.7 -11.27 52 -15.5 14.3 -4.23 30.95 -9.19 37 -11.03 6.05 -1.84 12.42 -3.63 14.15 -3.97 6.66 -1.33 13.35 4.2 13.35 11.03 0 1.45 -.87 6.99 -1.93 12.3 -1.06 5.31 -4.01 20.46 -6.55 33.66 -2.54 13.2 -5.24 27.15 -5.99 31 -.75 3.85 -1.16 7.2 -.91 7.46 .25 .25 4.97 -4.06 10.49 -9.57 l10.03 -10.03 3.43 -17.42 c1.89 -9.58 5 -25.35 6.93 -35.03 1.93 -9.68 3.5 -20.56 3.5 -24.17 0 -5.87 -.35 -7.02 -3.28 -10.89 -1.8 -2.38 -4.84 -5.11 -6.75 -6.08 -4.81 -2.42 -14.62 -2.12 -23.97 .75z M307.5 135 c-12.65 2.63 -31.32 6.45 -41.5 8.49 -10.18 2.04 -18.89 4.07 -19.36 4.51 -.47 .44 -1.46 4.56 -2.2 9.15 -.74 4.59 -2.06 12.79 -2.94 18.22 -.88 5.43 -1.35 10.13 -1.04 10.44 .59 .59 2.41 -1.04 19.97 -17.95 15.12 -14.56 16.59 -15.67 22.43 -17.02 2.81 -.65 5.31 -.98 5.55 -.74 .24 .24 -.42 6.06 -1.47 12.92 -1.05 6.86 -1.92 13.36 -1.94 14.43 -.02 1.19 -9.37 11.35 -23.94 26 l-23.91 24.05 -3.71 22.33 c-2.09 12.55 -3.33 22.69 -2.84 23.15 .48 .45 6.72 -.17 13.87 -1.39 10.62 -1.81 14.19 -2.88 19.5 -5.84 11.45 -6.38 20.72 -9.47 36.76 -12.27 4.72 -.82 8.75 -1.66 8.95 -1.86 .2 -.2 .05 -5.19 -.33 -11.08 -.53 -8.27 -1.04 -10.85 -2.23 -11.31 -1.06 -.41 -4.83 2.9 -12.1 10.59 -9.69 10.26 -10.95 11.25 -15.31 12.05 -2.61 .48 -4.75 .53 -4.75 .1 0 -.42 1.13 -7.58 2.52 -15.9 l2.52 -15.13 23.73 -24.06 c20.2 -20.48 23.82 -24.6 24.35 -27.72 .34 -2.01 1.88 -10.91 3.41 -19.77 2.75 -15.83 2.79 -19.5 .25 -19.28 -.7 .06 -11.63 2.26 -24.28 4.89z M206.72 154.85 l-17.78 3.65 -20.53 24 c-11.29 13.2 -23.76 27.8 -27.72 32.45 -3.95 4.64 -9 10.49 -11.21 13 -7.87 8.9 -11.66 13.12 -13.71 16.39 -2.05 3.27 -2.37 5.6 -3.3 10.72 -.95 5.19 -1.93 12.19 -2.19 15.54 -.45 5.71 -.3 6.23 2.27 8.25 3.66 2.88 4.57 2.81 37.47 -2.78 15.68 -2.66 28.69 -4.66 28.93 -4.44 .51 .48 -1.34 12.37 -4.49 28.88 -1.77 9.27 -2.02 12.28 -1.11 13.22 1.47 1.51 32.42 -2.71 33.58 -4.59 .4 -.65 1.48 -5.33 2.39 -10.41 .92 -5.08 3.22 -17.78 5.12 -28.23 5.17 -28.52 6.76 -38.65 6.15 -39.26 -.3 -.3 -3.82 -.07 -7.81 .51 -10.28 1.5 -60.01 10.18 -61.51 10.73 -.69 .25 -1.24 .13 -1.24 -.26 .02 -.75 12.62 -15.35 33 -38.22 16.27 -18.26 44.96 -51.59 44.97 -52.25 .02 -1.15 -2.12 -.84 -21.27 3.1z"
                fill="#f9faf9"
              />
            </svg>
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
            <Logo />
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
