import { useEffect, useState } from "react";
import { useParams} from "react-router-dom";

interface UserProfile {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    is_online: boolean;
    created_at: string;
}

export default function Profile () {
    const { user } = useParams();
    const [profile, setProfile] = useState<UserProfile | null> (null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3000/users/${user}`)
        .then((res) => {
            if (!res.ok)
                throw new Error ("user Não encontrado")
           return res.json()
            }
        )
        .then((data) => {
            setProfile(data);
        })
        .catch((err) => {
            console.log(err);
            setIsLoading(false);
        })   
            .finally(() => {
                setIsLoading(false);
        });
            
    }, [user]);
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 uppercase">
                Carregando Daidos do servidor....
            </div>
        ) 
    }
    if (!profile) {
        return (
            <div className="flex h-screen items-center justify-center text-[#ff0000] italic">
                <h1 className="text-2xl font-black">USUÁRIO NÃO ENCONTRADO</h1>
            </div>
        )
    }
    const nemberSince = new Date(profile.created_at).toLocaleDateString("pt-PT",
        {
            month: "long",
            year: "numeric",
        }
    )
    return ();
}