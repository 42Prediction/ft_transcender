import { Navbar } from "./features/public/components/Navbar";
import { AuthModal } from "./features/auth/components/AuthModal";
import { Footer } from "./features/public/components/Footer";
import { useAuthModalRoute } from "./features/auth/hooks/AuthHook";




export default function App() {
  const {
    authTab,
    isAuthRoute,
    outlet,
    backgroundOutlet,
    closeModal,
  } = useAuthModalRoute();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {isAuthRoute ? (backgroundOutlet ?? outlet) : outlet}
      </main>
      {authTab && (
        <AuthModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              closeModal();
            }
          }}
          defaultTab={authTab}
        />
      )}
      <Footer />
    </div>
  );
}
