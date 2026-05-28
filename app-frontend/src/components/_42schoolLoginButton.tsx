export function _42schoolLoginButton(){
    const handle42SchoolLogin = () => {
        window.location.href = 'http://localhost:3000/auth/school';
    }

    return (
        <button onClick={handle42SchoolLogin}>
            Entrar com 42 school
        </button>
    );
}