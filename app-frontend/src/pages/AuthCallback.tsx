import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { bettor } from "../api/bettor/bettor.api";

export function AuthCallback(){

    const navigate = useNavigate();
    const {login} = useAuth();

    useEffect(() => {
        bettor.getMe()
        .then(({ data }) =>{
            login({
                sub: data.user.id,
                email: data.user.email,
                role: data.user.role,
            });
            navigate('/dashboard');
        })
        .catch(() => {
            navigate('/login?error=auth_failed');
        });

    }, [login, navigate]);

    return <p>A autenticar</p>

}