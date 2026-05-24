export function LoginButton(){
    const handleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <button onClick={handleLogin}>
            Entrar com Google
        </button>
    );
}