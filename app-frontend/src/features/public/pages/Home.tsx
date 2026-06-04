import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { bettor } from "../../../api/bettor/bettor.api";

export function Home(){
    const {user, logout } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        bettor.getMe().then(({ data }) => setProfile(data));
    },[]);

    return (
    <div>
        <h1>Olá, {user?.email}</h1>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
        <button onClick={logout}>Sair</button>
    </div>
    );
}
