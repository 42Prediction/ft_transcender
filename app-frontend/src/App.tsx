import { Navbar } from "./features/public/components/Navbar";
import { Footer } from "./features/public/components/Footer";
import { Outlet } from "react-router-dom";




export default function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet/>
      </main>
      <Footer />
    </div>
  );
}
