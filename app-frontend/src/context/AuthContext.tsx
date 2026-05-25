import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

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
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const storedProfile = localStorage.getItem("profile");

    return storedProfile ? JSON.parse(storedProfile) : null;
  });

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [loading] = useState(false);

  function login(newToken: string, userData: UserProfile) {
    localStorage.setItem("access_token", newToken);

    localStorage.setItem(
      "profile",
      JSON.stringify(userData)
    );

    setToken(newToken);
    setProfile(userData);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("profile");

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve estar dentro do AuthProvider"
    );
  }

  return context;
}