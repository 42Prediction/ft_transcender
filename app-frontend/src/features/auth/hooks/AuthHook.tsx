// app/hooks/useAuthModalRoute.ts
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { getAuthTab } from "../utils/getAuthTab";
import type { Tab } from "../components/AuthModal";
import { useEffect, useState } from "react";

export function useAuthModalRoute() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigate = useNavigate();

  const authTab: Tab | null = getAuthTab(location.pathname);
  const bg = location.state?.backgroundLocation;

  const [savedOutlet, setSavedOutlet] = useState(outlet);

  useEffect(() => {
    if (!authTab) {
      setSavedOutlet(outlet);
    }
  }, [outlet, authTab]);

  const closeModal = () => {
    const isAuthRoute = bg && !getAuthTab(bg.pathname);
    navigate(isAuthRoute ? bg : "/", { replace: true });
  };

  return {
    bg,
    authTab,
    closeModal,
    savedOutlet,
    outlet
  };
}
