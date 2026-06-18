import { bettor as bettorApi } from "../../../../api/bettor/bettor.api";
import { useRef, useState } from "react";
import { Row } from "./Row";
import { Pencil, Save } from "lucide-react";
import { useRevalidator } from "react-router-dom";

export function PerfilPanel({ bettor }: {bettor: any}) {
  const revalidator = useRevalidator();
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasChanges, setHasChanges] = useState(false);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPhoto(imageUrl);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  const [bio, setBio] = useState(bettor.bio ?? "");

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [name, setName] = useState(bettor.nick);
  const [email, setEmail] = useState(bettor.user.email);
  const [loading, setLoading] = useState(false);

  const saveName = async () => {
    try {
      setLoading(true);
      await bettorApi.updateMe({
        nick: name,
      });
      setIsEditingName(false);
      await revalidator.revalidate()
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
const saveBio = async () => {
    try {
      setLoading(true);
      await bettorApi.updateMe({
        bio: bio,
      });
      setIsEditingName(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value.slice(0, 200));
    setHasChanges(true);
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
              onChange={(e) => {setName(e.target.value)}}
              className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm"
            />

          ) : (
            <span className="truncate font-mono text-sm text-muted-foreground">
              {name}
            </span>
          )}
          {
            isEditingName && (
              <button
                onClick={saveName}
                className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              >
                <Save size={16} />
              </button>
            )
          }
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

        </Row>

      </div>
      <label className="text-sm font-medium text-foreground">Bio</label>
      <div className="relative mt-3">
        <textarea
          value={bio}
          onChange={handleBioChange}
          placeholder="Conte aos outros sobre você"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
        {hasChanges && (
          <button
            onClick={saveBio}
            className="mt-2 rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
          >
            Salvar
          </button>
        )}
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-muted-foreground">
          {bio.length}/200
        </span>
      </div>
    </div>
  );
}
