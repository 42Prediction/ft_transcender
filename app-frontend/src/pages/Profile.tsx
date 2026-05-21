import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FriendsList from "../components/FriendsList.tsx";

interface UserProfile {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    is_online: boolean;
    created_at: string;
}

export default function Profile() {
    const { user } = useParams();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3000/users/${user}`)
            .then((res) => {
                if (!res.ok) throw new Error("User Não encontrado");
                return res.json();
            })
            .then((data) => {
                setProfile(data);
            })
            .catch((err) => {
                console.log("Erro ao procurar utilizador:", err);
                setProfile(null); // Garante que o estado fica explicitamente nulo em caso de erro
            })   
            .finally(() => {
                setIsLoading(false);
            });
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 uppercase tracking-widest">
                Carregando Dados do servidor....
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-screen bg-black items-center justify-center text-[#ff0000] italic">
                <h1 className="text-2xl font-black uppercase tracking-wider">USUÁRIO NÃO ENCONTRADO</h1>
            </div>
        );
    }

    const memberSince = new Date(profile.created_at).toLocaleDateString("pt-PT", {
        month: "long",
        year: "numeric",
    });

    return (
        <div className="p-8 bg-[#121212] min-h-screen text-white flex justify-center items-start">
            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CARTÃO DE PERFIL: COMPONENTE QUE FALTAVA VISUALMENTE */}
                <div className="md:col-span-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <img
                            src={profile.avatar_url || "https://github.com/marccarv.png"}
                            alt={profile.username}
                            className="w-32 h-32 rounded-full border-2 border-[#00ff9d] object-cover"
                        />
                        <span className={`absolute bottom-1 right-2 w-4 h-4 rounded-full border-2 border-black ${profile.is_online ? "bg-[#00ff9d]" : "bg-zinc-600"}`} />
                    </div>

                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">{profile.username}</h2>
                    <p className="text-zinc-500 text-sm mb-4">{profile.email}</p>

                    <div className="w-full border-t border-[#333] pt-4 mt-2 text-left space-y-2 text-sm text-zinc-400">
                        <div>Status: <span className={profile.is_online ? "text-[#00ff9d]" : "text-zinc-500"}>{profile.is_online ? "Online" : "Offline"}</span></div>
                        <div>Membro desde: <span className="text-white capitalize">{memberSince}</span></div>
                    </div>
                </div>

                {/* COLUNA DOS AMIGOS */}
                <div className="md:col-span-2">
                    <FriendsList />
                </div>

            </div>
        </div>
    );
}