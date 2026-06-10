import { cn } from "@/lib/utils";
import type { FieldState } from "./AuthModal";

export default function Field({
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
