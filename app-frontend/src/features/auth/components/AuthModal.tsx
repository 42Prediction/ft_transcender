import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import OAuth from "./OAuth";
import Field from "./Field";
import Divider from "./Divider";
import { Form, useActionData, useNavigation} from "react-router-dom";

export type Tab = "signin" | "signup";
type LoginMethod = "password";
export type FieldState = "default" | "focus" | "error" | "success";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: Tab;
}

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

export function AuthModal({ open, onOpenChange, defaultTab = "signin" }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loginMethod] = useState<LoginMethod>("password");
  const [showPwd, setShowPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const navigation = useNavigation();
  const actionData = useActionData<{ error?: string }>();
  const loading = navigation.state === "submitting";
  const [localError, setLocalError] = useState<string | null>(null);
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  const isValidPassword = (password: string) => PASSWORD_REGEX.test(password);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^\+?\d{6,}$/.test(email);
  const emailState: FieldState = email.length === 0 ? "default" : validEmail ? "success" : "error";
  const regEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^\+?\d{6,}$/.test(regEmail);
  const regEmailState: FieldState = regEmail.length === 0 ? "default" : regEmailValid ? "success" : "error";

  const regValidPassword = isValidPassword(regPassword)

  const regPasswordState: FieldState = regPassword.length === 0
    ? "default": regValidPassword
    ? "success": "error";

  const registerValid = regEmailValid && regValidPassword && accepted;

  useEffect(() => {
    if (actionData?.error) {
      setLocalError(actionData.error);
    }
  }, [actionData]);

  useEffect(() => {
    setLocalError(null);
  }, [tab]);

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

          {tab === "signin" ? (
            <Form key="signin"  method="post" action="/signin" className="relative space-y-5">
              <Field
                name="email"
                autoFocus={true}
                value={email}
                onChange={setEmail}
                label="Email"
                required
                icon={Mail}
                placeholder="Enter your email"
                error={emailState === "error" ? "Invalid email address" : undefined}
              />

              {loginMethod === "password" && (
                <Field
                  name="password"
                  value={password}
                  onChange={setPassword}
                  label="Password"
                  required
                  icon={Lock}
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
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
              {localError && (
                <div className="text-center text-xs text-destructive/80">
                  {localError}
                </div>
              )}
              <button
                type="submit"
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:opacity-80",
                )}
              >
                {(loading) ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
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
            </Form>
          ) : (
            <Form key="signup" method="post" action="/signup" className="relative space-y-5">
              <Field
                name="email"
                autoFocus={true}
                value={regEmail}
                onChange={setRegEmail}
                label="Email"
                required
                icon={Mail}
                placeholder="Enter your email address"
                error={regEmailState === "error" ? "Invalid email address" : undefined}
              />

              <Field
                name="password"
                value={regPassword}
                onChange={setRegPassword}
                label="Password"
                required
                icon={Lock}
                type={showRegPwd ? "text" : "password"}
                placeholder="Create a secure password"
                error={
                  regPasswordState === "error"
                  ? "Password must be at least 8 characters long and contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character."
                  : undefined
                }
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
              {localError && (
                <div className="text-center text-xs text-destructive/80">
                  {localError}
                </div>
              )}
              <button
                type="submit"
                disabled={!registerValid || loading}
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition-all",
                  registerValid && !loading
                    ? "hover:opacity-95"
                    : "cursor-not-allowed opacity-50",
                )}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign Up"}
              </button>

              <Divider>or signin with</Divider>

              <OAuth/>

              <p className="text-center text-sm text-muted-foreground">
                Do you already have an account?{" "}
                <button type="button" onClick={() => setTab("signin")} className="font-medium text-primary hover:underline">
                  Sign In
                </button>
              </p>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
