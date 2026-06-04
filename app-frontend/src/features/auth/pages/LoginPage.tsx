import {LoginButton } from "../../../components/LoginButton";
import { useAuth } from "../../../context/AuthContext";
import { Navigate } from 'react-router-dom';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faSchool } from "@fortawesome/free-solid-svg-icons";



export function LoginPage() {

    const { isAuthenticated, loading } = useAuth();
    const handleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };
    if (loading) {
        return <p className="min-h-screen flex items-center justify-center text-[#00FF9D]">A verificar sessão...</p>
    }
    if (isAuthenticated) {
        return <Navigate to='/' replace />
    }

    return (

        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                <header className="mb-10 text-center">
                    <h1 className="text-5xl italic font-black uppercase text-[#00FF9D] tracking-tighter">
                        Exam Bet
                    </h1>
                    <p className="font-bold tracking-widest text-zinc-500 text-xs mt-3 uppercase">
                        Bem Vindos ao Exam Bet
                    </p>
                </header>
                <div className="bg-surface-elevated border border-zinc-800 rounded-2xl p-8 hover:border-[#00FF9D] transition-all duration-300">
                    <h2 className="text-2xl font-black italic mb-2 uppercase">
                        Login
                    </h2>
                    <p className="text-zinc-500 text-sm" >Autenque-se para entrar</p>
                    <LoginButton
                        text="Entrar com Google"
                        redirectUrl="http://localhost:3000/auth/google"
                        icon={faGoogle}
                        className="bg-gradient-brand text-black"
                    />
                   <LoginButton
                        text="Entrar com 42 School"
                        redirectUrl="http://localhost:3000/auth/school"
                        icon={faSchool}
                        className="bg-gradient-brand text-black"
                    />
                </div>
            </div>
        </main>
    );

}