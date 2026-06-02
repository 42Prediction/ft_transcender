export function _42schoolLoginButton(){
    const handle42SchoolLogin = () => {
        window.location.href = 'http://localhost:3000/auth/school';
    }

    return (
        <button onClick={handle42SchoolLogin} className="flex justify-center items-center gap-1 w-full py-4 rounded-xl
                                cursor-pointer m-2 uppercase tracking-wide bg-[#00FF9D] text-black font-black
                                hover:scale-[1.03] transition-all duration-300">
            Entrar com 42 school
        </button>
    );
}