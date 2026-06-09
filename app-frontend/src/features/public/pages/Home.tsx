import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Navbar } from "../components/Navbar";
import { Trending } from "../components/Trending";

export function Home(){
    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <Navbar />
            <Hero/>
            <Trending/>
            <Footer/>
        </div>
    );
}