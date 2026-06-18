
export function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <div className="rounded-2xl border border-dashed border-border/60 bg-surface/30 p-12 text-center text-sm text-muted-foreground">
        Em breve. As configurações de {title.toLowerCase()} aparecerão aqui.
      </div>
    </div>
  );
}