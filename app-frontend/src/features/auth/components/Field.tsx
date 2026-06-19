export default function Field({
  icon: Icon,
  type = "text",
  placeholder,
  error,
  right,
  required,
  label,
  name,
  value,
  onChange,
  autoFocus,
  autocomplete,
  id,
}: {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  error?: string;
  right?: React.ReactNode;
  required?: boolean;
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  autocomplete?: string;
  id: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-primary">*</span>}
      </label>

      <div className="group relative flex items-center rounded-xl border bg-surface/60">
        <Icon className="ml-3.5 h-4 w-4 text-muted-foreground" />

        <input
          id={id}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          type={type}
          required={required}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-12 w-full bg-transparent px-3 text-sm focus:outline-none"
          onFocus={(e) => e.stopPropagation()}
          autoComplete={autocomplete}
        />

        {right}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
