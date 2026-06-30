import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface InfoModalProps {
    message: string;
    onClose: () => void;
}

/**
 * Modal informativo genérico.
 *
 * Fecha ao:
 *   - clicar no botão "OK"
 *   - clicar no botão X
 *   - clicar no backdrop (fora da janela)
 *   - premir a tecla Escape
 *
 * Previne scroll do body enquanto aberto.
 * Garante que apenas um está aberto de cada vez (controlado pelo pai).
 */
export function InfoModal({ message, onClose }: InfoModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Fechar com Escape + bloquear scroll do body
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    // Fechar ao clicar no backdrop (fora do painel)
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        /* Backdrop */
        <div
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm px-4"
        >
            {/* Painel */}
            <div
                ref={dialogRef}
                className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-surface/80 p-6 shadow-xl backdrop-blur-md"
            >
                {/* Botão fechar (X) */}
                <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Mensagem */}
                <p className="pr-6 text-sm leading-relaxed text-foreground">
                    {message}
                </p>

                {/* Botão OK */}
                <div className="mt-5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
