import { useEffect, useState } from "react";
import { Navbar } from "./features/public/components/Navbar";
import { useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AuthModal } from "./features/auth/components/AuthModal";
import { Footer } from "./features/public/components/Footer";



export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const isAuthRoute = location.pathname === "/signin" || location.pathname === "/signup";

  const [backgroundOutlet, setBackgroundOutlet] = useState(outlet);

  useEffect(() => {
    if (!isAuthRoute) {
      setBackgroundOutlet(outlet);
    }
  }, [isAuthRoute, outlet]);

  const handleModalOpenChange = (open: boolean) => {
    if (open) return;

    const from = (location.state as { from?: string } | null)?.from;
    navigate(from || "/", { replace: true });
  };

  const authTab = location.pathname === "/signin"
    ? "signin"
    : location.pathname === "/signup"
      ? "signup"
      : null;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {isAuthRoute ? (backgroundOutlet ?? outlet) : outlet}
      </main>
      {authTab && (
        <AuthModal
          open={true}
          onOpenChange={handleModalOpenChange}
          defaultTab={authTab}
        />
      )}
      <Footer />
    </div>
  );
}
