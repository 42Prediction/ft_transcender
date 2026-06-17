import { Navbar } from "./features/public/components/Navbar";
import { Footer } from "./features/public/components/Footer";
import { useAuthModalRoute } from "./features/auth/hooks/AuthHook";
import { AuthModal } from "./features/auth/components/AuthModal";


export default function App() {
  const {
          closeModal,
          authTab,
          savedOutlet,
          outlet,
  } = useAuthModalRoute();
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        {authTab ? savedOutlet : outlet}
      </main>
      <Footer />
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
    </div>
  );
}
