import { Footer } from '@/features/public/components/Footer';
import { Navbar } from '@/features/public/components/Navbar';
import { Outlet } from 'react-router-dom';


export function Root() {
  return (
    <>
      <Navbar />
      <main className="flex-1"> {/* Dica: use flexbox para empurrar o footer para baixo */}
        <Outlet /> {/* Aqui serão renderizadas as páginas que usam esse layout */}
      </main>
      <Footer />
    </>
  );
}