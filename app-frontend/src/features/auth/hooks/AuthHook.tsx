// app/hooks/useAuthModalRoute.ts

import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutlet,
} from "react-router-dom";
import { getAuthTab } from "../utils/getAuthTab";
import type { Tab } from "../components/AuthModal";

export function useAuthModalRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();

  const authTab: Tab | null = getAuthTab(location.pathname);

  const isAuthRoute = authTab !== null;

  const [backgroundOutlet, setBackgroundOutlet] =
    useState(outlet);

  useEffect(() => {
    if (!isAuthRoute) {
      setBackgroundOutlet(outlet);
    }
  }, [isAuthRoute, outlet]);

  const closeModal = () => {
    const from = (
      location.state as { from?: string } | null
    )?.from;

    navigate(from || "/", {
      replace: true,
    });
  };

  return {
    authTab,
    isAuthRoute,
    outlet,
    backgroundOutlet,
    closeModal,
  };
}
