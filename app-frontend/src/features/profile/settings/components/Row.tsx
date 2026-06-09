
export function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="mt-1 max-w-md text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2">{children}</div>
    </div>
  );
}