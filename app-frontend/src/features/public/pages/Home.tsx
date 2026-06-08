import { Hero } from "../components/Hero";
import { Navbar } from "../components/Navbar";

export function Home(){
    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <Navbar />
            <Hero/>
        </div>
    );
}