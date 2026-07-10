import { bettor as bettorApi } from "../../../../api/bettor/bettor.api";
import { useRef, useState } from "react";
import { Row } from "./Row";
import { Pencil, Save } from "lucide-react";
import { useRevalidator } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PerfilPanel({ bettor }: { bettor: any }) {
  const revalidator = useRevalidator();

  // ── estados ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false); // declarado primeiro

  const [photo, setPhoto] = useState<string | null>(bettor?.avatar ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoHasChanges, setPhotoHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(bettor?.nick ?? "");
  const [isEditingName, setIsEditingName] = useState(false);

  const [bio, setBio] = useState(bettor?.bio ?? ""); // fallback para string vazia
  const [bioHasChanges, setBioHasChanges] = useState(false);

  // ── avatar ───────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setPhotoFile(file);
    setPhotoHasChanges(true);
  };

  const savePhoto = async () => {
    if (!photoFile) return;
    try {
      setLoading(true);
      await bettorApi.updateMe({ avatar: photoFile });
      setPhotoHasChanges(false);
      setPhotoFile(null);
      await revalidator.revalidate();
      setPhoto(bettor?.avatar ?? null); // volta ao URL da BD após revalidate
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // ── nome ─────────────────────────────────────────────────
  const saveName = async () => {
    try {
      setLoading(true);
      await bettorApi.updateMe({ nick: name });
      setIsEditingName(false);
      await revalidator.revalidate();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // ── bio ──────────────────────────────────────────────────
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value.slice(0, 200));
    setBioHasChanges(true);
  };

  const saveBio = async () => {
    try {
      setLoading(true);
      await bettorApi.updateMe({ bio });
      setBioHasChanges(false);
      await revalidator.revalidate(); // estava em falta
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>

      <div className="rounded-2xl border border-border/60 bg-surface/40">
        <Row label="Profile picture">
          <div className="relative">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-brand shadow-glow">
              {photo && (
                <img src={photo} alt="Profile picture" className="h-full w-full object-cover" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {!photoHasChanges && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            )}
            {photoHasChanges && (
              <button
                onClick={savePhoto}
                disabled={loading}
                className="absolute -bottom-1 right-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
              >
                <Save size={14} />
              </button>
            )}
          </div>
        </Row>

        <Row label="Username">
          {isEditingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-border/60 bg-background/60 px-2 py-1 text-sm"
            />
          ) : (
            <span className="truncate font-mono text-sm text-muted-foreground">{name}</span>
          )}
          {isEditingName && (
            <Button
              onClick={saveName}
              disabled={loading}
              className="h-auto rounded-md px-2 py-1 text-xs"
            >
              <Save size={16} />
            </Button>
          )}
          <button
            onClick={() => setIsEditingName((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </Row>

        <Row label="E-mail">
          <span className="truncate text-sm text-muted-foreground">{bettor?.user?.email}</span>
        </Row>
      </div>

      <label className="text-sm font-medium text-foreground">Bio</label>
      <div className="relative mt-3">
        <textarea
          value={bio}
          onChange={handleBioChange}
          placeholder="Tell others about yourself..."
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
        />
        {bioHasChanges && (
          <Button
            onClick={saveBio}
            disabled={loading}
            className="mt-2 h-auto rounded-md px-3 py-1 text-sm"
          >
            Save
          </Button>
        )}
        <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[11px] text-muted-foreground">
          {bio.length}/200
        </span>
      </div>
    </div>
  );
}