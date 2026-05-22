import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useParams } from "react-router-dom";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  is_online: boolean;
}

interface AuthContextType {
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useParams();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`http://localhost:3000/users/${user}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  function login(newToken: string, userData: UserProfile) {
    localStorage.setItem("access_token", newToken);

    setToken(newToken);
    setProfile(userData);
  }

  function logout() {
    localStorage.removeItem("access_token");

    setToken(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        profile,
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

// Hook customizado
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve estar dentro do AuthProvider");
  }

  return context;
}