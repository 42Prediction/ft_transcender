import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { auth } from "@/api/auth/auth.api";
import { useRevalidator } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SecurityPanelProps {
    isTwoFactorEnabled: boolean;
}

type Step = "idle" | "qr" | "verify" | "done";

export function SecurityPanel({ isTwoFactorEnabled }: SecurityPanelProps) {
    const revalidator = useRevalidator();
    const [step, setStep] = useState<Step>("idle");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(isTwoFactorEnabled);

    const handleEnable = async () => {
        try {
            setLoading(true);
            const res = await auth.twoFactor.generate();
            setQrCode(res.qrCode);
            setStep("qr");
        } catch {
            setError("Failed to generate QR code.");
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        try {
            setLoading(true);
            await auth.twoFactor.turnOff();
            setEnabled(false);
            await revalidator.revalidate();
        } catch {
            setError("Failed to disable 2FA.");
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...code];
        next[index] = value;
        setCode(next);
        setError(null);
        if (value && index < 5) {
            (document.getElementById(`2fa-input-${index + 1}`) as HTMLInputElement)?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            (document.getElementById(`2fa-input-${index - 1}`) as HTMLInputElement)?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(""));
            (document.getElementById("2fa-input-5") as HTMLInputElement)?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length < 6) {
            setError("Enter all 6 digits.");
            return;
        }
        try {
            setLoading(true);
            await auth.twoFactor.turnOn(fullCode);
            setEnabled(true);
            setStep("done");
            await revalidator.revalidate();
        } catch {
            setError("Invalid code. Try again.");
            setCode(["", "", "", "", "", ""]);
            (document.getElementById("2fa-input-0") as HTMLInputElement)?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Security</h1>

            <div className="rounded-2xl border border-border/60 bg-surface/40 p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                            enabled ? "bg-primary/10" : "bg-muted/40"
                        )}>
                            {enabled
                                ? <ShieldCheck className="h-5 w-5 text-primary" />
                                : <ShieldOff className="h-5 w-5 text-muted-foreground" />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {enabled
                                    ? "Your account is protected with an authenticator app."
                                    : "Add an extra layer of security to your account."}
                            </p>
                        </div>
                    </div>

                    {step === "idle" && (
                        <button
                            onClick={enabled ? handleDisable : handleEnable}
                            disabled={loading}
                            className={cn(
                                "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
                                enabled
                                    ? "border border-destructive/50 text-destructive hover:bg-destructive/10"
                                    : "bg-primary text-primary-foreground hover:opacity-80"
                            )}
                        >
                            {loading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : enabled ? "Disable" : "Enable"
                            }
                        </button>
                    )}
                </div>

                {step === "qr" && qrCode && (
                    <div className="space-y-4 pt-2 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the code to confirm.
                        </p>
                        <div className="flex justify-center">
                            <img src={qrCode} alt="2FA QR Code" className="h-44 w-44 rounded-xl border border-border/60 bg-white p-2" />
                        </div>
                        <button
                            onClick={() => setStep("verify")}
                            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-80 transition"
                        >
                            I've scanned it — enter code
                        </button>
                    </div>
                )}

                {step === "verify" && (
                    <form onSubmit={handleVerify} className="space-y-4 pt-2 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`2fa-input-${i}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className={cn(
                                        "h-11 w-10 rounded-xl border bg-background/60 text-center text-lg font-semibold outline-none transition",
                                        error
                                            ? "border-destructive text-destructive"
                                            : "border-border/60 text-foreground focus:border-primary"
                                    )}
                                />
                            ))}
                        </div>
                        {error && <p className="text-center text-xs text-destructive">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-80 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Enable"}
                        </button>
                    </form>
                )}

                {step === "done" && (
                    <div className="pt-2 border-t border-border/40 text-center text-sm text-primary font-medium">
                        2FA enabled successfully.
                    </div>
                )}

                {error && step === "idle" && (
                    <p className="text-xs text-destructive">{error}</p>
                )}
            </div>
        </div>
    );
}
