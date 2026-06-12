export default function Field({
  icon: Icon,
  type = "text",
  placeholder,
  error,
  right,
  required,
  label,
  name,
}: {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  error?: string;
  right?: React.ReactNode;
  required?: boolean;
  label: string;
  name: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-primary">*</span>}
      </label>

      <div className="group relative flex items-center rounded-xl border bg-surface/60">
        <Icon className="ml-3.5 h-4 w-4 text-muted-foreground" />

        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent px-3 text-sm focus:outline-none"
        />

        {right}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
