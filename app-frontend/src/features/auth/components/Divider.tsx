export default function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center py-1">
      <div className="h-px flex-1 bg-border/60" />
      <span className="px-3 text-xs text-muted-foreground">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
