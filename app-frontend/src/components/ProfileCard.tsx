//import { faCamera, faEdit, faPen, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
//import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    <div className="md:col-span-1 bg-[#1A1A1A] border border-[#333] rounded-lg p-6 flex flex-col items-center text-center">
      <div className="relative mb-4">
        <img
          src={profile.avatar_url || "https://github.com/marccarv.png"}
          alt={profile.username}
          className="w-32 h-32 rounded-full border-2 border-[#00FF9D] object-cover"
        />
        <span className={`absolute bottom-1 right-2 w-4 h-4 rounded-full border-2 border-black ${profile.is_online ? "bg-[#00FF9D]" : "bg-zinc-600"}`} />
      </div>      <h2 className="text-2xl font-black text-white uppercase tracking-wide">{profile.username}</h2>
      <p className="text-zinc-500 text-sm mb-4">{profile.email}</p>      <div className="w-full border-t border-[#333] pt-4 mt-2 text-left space-y-2 text-sm text-zinc-400">
        <div>Status: <span className={profile.is_online ? "text-[#00FF9D]" : "text-zinc-500"}>{profile.is_online ? "Online" : "Offline"}</span></div>
        <div>Membro desde: <span className="text-white capitalize">{memberSince}</span></div>
      </div>
    </div>
  );
}


