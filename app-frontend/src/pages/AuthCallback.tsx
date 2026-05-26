import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../services/api";

export function AuthCallback(){

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {login} = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token){
            navigate('/login?error=auth_failed');
            return;
        }

        localStorage.setItem('access_token', token);

        api.getProfile()
        .then((user) =>{
            login(token, user);
            navigate('/dashboard');
        })
        .catch(() => {
            navigate('/login?error=auth_failed');
        });

    }, []);

    return <p>A autenticar</p>

}