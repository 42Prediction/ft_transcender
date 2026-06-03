export function GoogleLoginButton(){
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <button onClick={handleGoogleLogin} className="flex justify-center items-center gap-1 w-full py-4 rounded-xl
                                cursor-pointer m-2 uppercase tracking-wide bg-gradient-brand text-black font-black
                                hover:scale-[1.03] transition-all duration-300">
            Entrar com Google
        </button>
    );
}