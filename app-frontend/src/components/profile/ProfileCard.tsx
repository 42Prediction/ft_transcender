interface Bettor {
  nick: string;
  bio: string;
  avatar: string | null;
}

interface Props {
  bettor: Bettor;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export default function ProfileCard({ bettor, isOwnProfile, onEditClick }: Props) {
  const avatarUrl = bettor.avatar
    ? `${import.meta.env.VITE_API_URL}${bettor.avatar}`
    : null;
  console.log("avatar:", bettor.avatar);

  return (
    <div className="flex flex-col items-center gap-5 p-10 max-w-sm mx-auto mt-16 bg-zinc-900 border border-zinc-800 rounded-2xl">

      {/* Avatar */}
      {/* Avatar */}
      <div className="w-24 h-24 rounded-full border-2 border-zinc-700 bg-zinc-800 overflow-hidden flex items-center justify-center">
        {bettor.avatar ? (
          <img
            src={bettor.avatar}
            alt={bettor.nick}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl font-black text-[#00FF9D]">
            {bettor.nick?.[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <h2 className="text-white font-black text-xl tracking-tight">
          @{bettor.nick}
        </h2>
        <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
          {bettor.bio || 'Sem bio.'}
        </p>
      </div>

      {/* Botão só no próprio perfil */}
      {isOwnProfile && (
        <button
          onClick={onEditClick}
          className="mt-1 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
        >
          Editar perfil
        </button>
      )}
    </div>
  );
}