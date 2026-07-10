import { useState } from "react";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import { bettor } from "@/api/bettor/bettor.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AccountPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bettor.exportMyData();
      downloadJson(data, `my-data-${new Date().toISOString().slice(0, 10)}.json`);
    } catch {
      setError("Could not export your data. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account</h1>

      <Card className="rounded-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Your data</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Download everything the platform holds about your account: profile, wallet
              balance and transaction history, and your full bet history — as a single JSON
              file.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleExport}
          disabled={loading}
          className="mt-4 h-auto gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export my data (JSON)
        </Button>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </Card>
    </div>
  );
}
