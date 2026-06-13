import { useAuthModalRoute } from "@/features/auth/hooks/AuthHook";
import { Hero } from "../components/Hero";
import { Trending } from "../components/Trending";
import { AuthModal } from "@/features/auth/components/AuthModal";

export function Home(){
    const {
        authTab,
        closeModal,
      } = useAuthModalRoute();
    return (
        <div>
            <Hero/>
            <Trending/>
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