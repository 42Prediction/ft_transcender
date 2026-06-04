import { useState, useRef, useCallback } from 'react';
import { bettor } from '../../api/bettor/bettor.api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCamera } from '@fortawesome/free-solid-svg-icons';

interface Bettor {
  nick: string;
  bio: string;
  avatar: string | null;
}

interface Props {
  bettorData: Bettor;
  onClose: () => void;
  onSaved: (updated: Bettor) => void;
}

export default function EditProfileModal({ bettorData, onClose, onSaved }: Props) {
  const [nick, setNick]       = useState(bettorData.nick ?? '');
  const [bio, setBio]         = useState(bettorData.bio ?? '');
  const [preview, setPreview] = useState<string | null>(
    bettorData.avatar ? `${import.meta.env.VITE_API_URL}${bettorData.avatar}` : null
  );
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(selected.type)) {
      setError('Tipo inválido. Use JPG, PNG ou WebP.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 5MB.');
      return;
    }

    setFile(selected);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await bettor.updateMe(
        { nick: nick || undefined, bio: bio || undefined },
        file ?? undefined,
      );
      onSaved(updated.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
            Editar perfil
          </span>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Avatar picker */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 bg-cover bg-center flex items-center justify-center cursor-pointer group overflow-hidden"
                style={{ backgroundImage: preview ? `url(${preview})` : 'none' }}
                onClick={() => inputRef.current?.click()}
              >
                {!preview && (
                  <span className="text-2xl font-black text-[#00FF9D]">
                    {bettorData.nick?.[0]?.toUpperCase()}
                  </span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <FontAwesomeIcon icon={faCamera} className="text-white text-lg" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-white text-sm font-bold">Foto de perfil</p>
              <p className="text-zinc-500 text-xs">JPG, PNG ou WebP · máx. 5MB</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-[#00FF9D] transition-colors cursor-pointer w-fit"
              >
                Alterar foto
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Nick */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Nick
            </label>
            <input
              className="bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00FF9D] transition-colors placeholder:text-zinc-700"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              minLength={4}
              maxLength={16}
              placeholder="seu_nick"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Bio
            </label>
            <textarea
              className="bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[#00FF9D] transition-colors placeholder:text-zinc-700 resize-none font-sans"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={255}
              placeholder="Conta um pouco sobre você..."
              rows={3}
            />
          </div>

          {/* Erro */}
          {error && (
            <p className="text-red-400 text-xs font-bold uppercase tracking-wide -mt-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] bg-[#00FF9D] text-black rounded-lg hover:bg-[#00e68a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}