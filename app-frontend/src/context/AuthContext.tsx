import {
  createContext,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { bettor } from "../api/bettor/bettor.api";
import { auth } from "../api/auth/auth.api";

interface User{
    sub: string;
    email: string;
    role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}:{children: ReactNode}){

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bettor.getMe()
      .then(({ data }) => {
        setUser({
          sub: data.user.id,
          email: data.user.email,
          role: data.user.role,
        });
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function login(userData: User) {
    setUser(userData);
  }

  async function logout() {
    try {
      await auth.signout();
    } finally {
    setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
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
