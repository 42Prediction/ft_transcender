import { Outlet } from "react-router-dom";
import { Navbar } from "./features/public/components/Navbar";
import { Footer } from "./features/public/components/Footer";


export default function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer/>
    </div>
  );
}