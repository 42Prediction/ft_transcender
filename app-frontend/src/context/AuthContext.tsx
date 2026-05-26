import { createContext, useContext, useState} from "react";
import type { ReactNode } from "react";

interface User{
    email:string;
    name:string;
}

interface AuthContextType{
    user: User | null;
    token: string | null;
    login: (token: string, user:User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({children}:{children: ReactNode}){
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('access_token')
    );

    const [user, setUser] = useState<User | null>(null);

    function login(newToken:string, userData:User){
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        setUser(userData);
    }

    function logout(){
        
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(){
    return useContext(AuthContext);
}