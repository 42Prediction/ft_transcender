import { faCamera, faEdit, faPen, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface UserProfile {
    id: number;
    username: string
    email: string;
    avatar_url: string;
    is_online: boolean;
    created_at: string
}
interface ProfileCardProps {
    profile :UserProfile;
}
export default function ProfileCard({profile} :ProfileCardProps){
   
    const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex flex-col items-center">
      {/* Container Principal do Perfil */}
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl p-8 relative overflow-hidden">
        
        {/* Detalhe estético em Verde Neon no topo do card */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00FF9D]" />

        {/* Cabeçalho do Perfil (Avatar + Info Rápida) */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-zinc-900">
          <div className="relative">
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-24 h-24 rounded-full border-2 border-zinc-800 object-cover"
            />
            {/* Indicador de Status Dinâmico */}
            <span 
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-4 border-zinc-950 ${
                profile.is_online ? "bg-[#00FF9D]" : "bg-zinc-600"
              }`} 
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-wide text-white">
              {profile.username}
            </h1>
            <p className="text-xs text-zinc-500 font-medium font-mono">
              ID do Jogador: #{profile.id}
            </p>
            <p className="text-xs text-zinc-400">
              Membro desde <span className="text-zinc-200 uppercase font-bold text-[11px] tracking-wide">{memberSince}</span>
            </p>
          </div>
        </div>

        {/* Detalhes da Conta */}
        <div className="mt-8 space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FF9D]">
            Informações de Conta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-4 border border-zinc-900 rounded-lg">
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                E-mail Cadastrado
              </label>
              <p className="text-sm text-zinc-300 font-medium">{profile.email}</p>
            </div>

            <div className="bg-zinc-900/50 p-4 border border-zinc-900 rounded-lg">
              <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                Status de Conexão
              </label>
              <p className={`text-sm font-bold ${profile.is_online ? "text-[#00FF9D]" : "text-zinc-500"}`}>
                {profile.is_online ? "Disponível / Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}