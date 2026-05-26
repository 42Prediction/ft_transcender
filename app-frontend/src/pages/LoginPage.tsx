import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { _42schoolLoginButton } from "../components/_42schoolLoginButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../context/AuthContext";
import {Navigate} from 'react-router-dom';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";


export function LoginPage(){

const {isAuthenticated} = useAuth();
const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
};
if (isAuthenticated){
    return <Navigate to='/dashboard' replace/>
}

return (

<main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
    <div className="w-full max-w-md">
        <header className="mb-10 text-center">
            <h1 className="text-5xl italic font-black uppercase text-[#00FF9D] tracking-tighter">
                Exam Bet
            </h1>
            <p className="font-bold tracking-widest text-zinc-500 text-xs mt-3 uppercase">
                Bem Vindos ao Exam Bet
            </p>
        </header>
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 hover:border-[#00FF9D] transition-all duration-300">
            <h2 className="text-2xl font-black italic mb-2 uppercase">
                Login
            </h2>
            <p className="text-zinc-500 text-sm" >Autenque-se para entrar</p>
            <button onClick={handleLogin} className="flex justify-center items-center gap-1 w-full py-4 rounded-xl
                                cursor-pointer m-2 uppercase tracking-wide bg-[#00FF9D] text-black font-black
                                hover:scale-[1.03] transition-all duration-300" >
                <FontAwesomeIcon icon={faGoogle} />
                Entrar com Google
            </button>
            <GoogleLoginButton/>
            <_42schoolLoginButton/>
        </div>
    </div>
</main>
);

}