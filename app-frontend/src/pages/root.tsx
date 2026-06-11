import { Footer } from '@/features/public/components/Footer';
import { Navbar } from '@/features/public/components/Navbar';
import { Outlet } from 'react-router-dom';

export function Root() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}