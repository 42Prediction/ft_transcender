import { useRef, useState } from "react";
import { Row } from "./Row";
import { ArrowUpRight, Check, Copy, Pencil } from "lucide-react";

export function PerfilPanel({ bettor }) {

  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPhoto(imageUrl);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  const [copied, setCopied] = useState(false);
  const [bio, setBio] = useState("");
  const [referral, setReferral] = useState("");

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [name, setName] = useState(bettor.nick);
  const [email, setEmail] = useState(bettor.user.email);

  const address = "0x0d7888c6823eD6bc6d788b6bc6cA2BC0Cb293014";

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };



  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Perfil</h1>

      <div className="rounded-2xl border border-border/60 bg-surface/40">
              <Row label="Foto de perfil">
        <div className="relative">
          {/* avatar */}
          <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-brand shadow-glow">
            {photo && (
              <img
                src={photo}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* input escondido */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* botão editar */}
          <button
            onClick={openFilePicker}
            className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
        </div>
      </Row>


        <Row label="Nome de utilizador">
          {isEditingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm"
            />
          ) : (
            <span className="truncate font-mono text-sm text-muted-foreground">
              {name}
            </span>
          )}

          <button
            onClick={() => setIsEditingName((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </Row>

        <Row label="E-mail">
          {isEditingEmail ? (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm"
            />
          ) : (
            <span className="truncate text-sm text-muted-foreground">
              {email}
            </span>
          )}

          <button
            onClick={() => setIsEditingEmail((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </Row>

        
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/40 px-6 py-5">
        <label className="text-sm font-medium text-foreground">Bio</label>
        <div className="relative mt-3">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Conte aos outros sobre você"
            rows={3}
            className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-muted-foreground">
            {bio.length}/200
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/40 px-6 py-5">
        <label className="text-sm font-medium text-foreground">Código de indicação</label>
        <div className="mt-3 flex gap-2">
          <input
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            placeholder="Insira o código de quem te indicou"
            className="h-11 w-full rounded-xl border border-border/60 bg-background/60 px-4 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          <button className="h-11 rounded-xl bg-gradient-brand px-5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
            Aplicar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Você só pode definir um código de indicação dentro de 24 horas após criar sua conta.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-medium text-foreground">Ligações Sociais</h2>
        <div className="mt-3 rounded-2xl border border-border/60 bg-surface/40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-background text-foreground">
                <span className="font-display text-lg font-bold">𝕏</span>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">X</div>
                <div className="text-xs text-muted-foreground">
                  Vincule a sua conta X para exibir no seu perfil.
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
              Conectar X <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}