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
  profile: UserProfile;
}
export default function ProfileCard({ profile }: ProfileCardProps) {

  const memberSince = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return (
    <div className="md:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-lg p-6">

      <div className="flex items-center gap-6">

        {/* Avatar */}
        <div className="relative w-32 h-32 shrink-0">

          <img
            src={profile.avatar_url || "https://github.com/marccarv.png"}
            alt={profile.username}
            className="w-full h-full rounded-full object-cover border-4 border-[#2a2a2a]"
          />

          {/* Botão câmera */}
          <label   htmlFor="file-upload" className="
          absolute bottom-1 right-1
          w-9 h-9 rounded-full
          bg-white text-black
          flex items-center justify-center
          cursor-pointer
          shadow-lg
          hover:scale-110
          transition-all duration-200
        "
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />

            <input
              id="file-upload"
              type="file"
              className="hidden"
            />
          </label>

          {/* Status online */}
          <span
            className={`
          absolute bottom-2 left-2
          w-4 h-4 rounded-full
          border-2 border-[#1a1a1a]
          ${profile.is_online ? "bg-[#00ff9d]" : "bg-zinc-500"}
        `}
          />
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">

          <h2 className="text-2xl font-black text-white uppercase tracking-wide truncate">
            {profile.username}
          </h2>

          <p className="text-zinc-500 text-sm mb-4 truncate">
            {profile.email}
          </p>

          <div className="border-t border-[#333] pt-4 space-y-2 text-sm text-zinc-400">

            <div className="flex justify-between">
              <span>Status:</span>

              <span
                className={
                  profile.is_online
                    ? "text-[#00ff9d]"
                    : "text-zinc-500"
                }
              >
                {profile.is_online ? "Online" : "Offline"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Membro desde:</span>

              <span className="text-white capitalize">
                {memberSince}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}