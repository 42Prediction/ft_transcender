export function GoogleLoginButton(){
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <button onClick={handleGoogleLogin}>
            Entrar com Google
        </button>
    );
}