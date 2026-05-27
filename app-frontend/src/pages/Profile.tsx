import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FriendsList from "../components/FriendsList.tsx";
import ProfileCard from "../components/ProfileCard.tsx";

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
        //fetch(`http://localhost:3000/users/${user}`)
        fetch(`/api/users/${user}`)
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
            <div className="flex h-screen bg-black items-center justify-center text-[#FF0000] italic">

                <h1 className="text-2xl font-black uppercase tracking-wider">
                    USUÁRIO NÃO ENCONTRADO
                </h1>

            </div>
        );
    }

    return (
        <div className="p-8 bg-[#121212] min-h-screen text-white flex justify-center items-start">

            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CARTÃO DE PERFIL: COMPONENTE QUE FALTAVA VISUALMENTE */}

                <ProfileCard profile={profile} />
                
                {/* COLUNA DOS AMIGOS */}
                <div className="md:col-span-2">
                    {/* Passamos o userId (número) em vez do username, 
                      para que o FriendsList consiga fazer as chamadas à API corretamente 
                      sem passar 'undefined' nos endpoints.
                    */}
                    <FriendsList userId={profile.id} />
                </div>

            </div>

        </div>
    );
}