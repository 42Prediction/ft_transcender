import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function Dashboard(){
    const {user, logout } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        api.getProfile().then(setProfile);
    }, []);

    return (
    <div>
        <h1>Olá, {user?.name}</h1>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
        <button onClick={logout}>Sair</button>
    </div>
    );
}
