import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/api/auth/auth.api";
import { cn } from "@/lib/utils";

export function TwoFactorVerify() {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();

    const handleChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...code];
        next[index] = value;
        setCode(next);
        setError(null);
        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(""));
            inputs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length < 6) {
            setError("Enter all 6 digits.");
            return;
        }
        try {
            setLoading(true);
            await auth.twoFactor.authenticate(fullCode);
            navigate("/", { replace: true });
        } catch {
            setError("Invalid or expired code. Try again.");
            setCode(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-gradient-card p-8 shadow-elevated backdrop-blur-2xl">
                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Two-Factor Authentication</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code from your authenticator app.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className={cn(
                                    "h-12 w-10 rounded-xl border bg-background/60 text-center text-lg font-semibold outline-none transition",
                                    error
                                        ? "border-destructive text-destructive"
                                        : "border-border/60 text-foreground focus:border-primary"
                                )}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-center text-xs text-destructive">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-11 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground transition hover:opacity-80 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </button>
                </form>
            </div>
        </div>
    );
}
