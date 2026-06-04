import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function LoginButton({
    text,
    redirectUrl,
    icon,
    className = "",
}) {
    const handleLogin = () => {
        window.location.href = redirectUrl;
    };

    return (
        <button
            onClick={handleLogin}
            className={`flex justify-center items-center gap-2 w-full py-4 rounded-xl
                        cursor-pointer m-2 uppercase tracking-wide font-black
                        hover:scale-[1.03] transition-all duration-300 ${className}`}
        >
            {icon && <FontAwesomeIcon icon={icon} />}
            {text}
        </button>
    );
}