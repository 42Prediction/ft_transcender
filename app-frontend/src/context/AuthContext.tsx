import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface User{
    sub: string;
    email: string;
    role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user:User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}:{children: ReactNode}){


  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);

  function login(newToken: string, userData:User) {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("profile");

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve estar dentro do AuthProvider"
    );
  }

  return context;
}