import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Notfound from './components/NotFound';
import Footer from './components/Footer';

export default function App() {
  return (
    <BrowserRouter>
      {/* O container principal sempre preto */}
      <div className="min-h-screen bg-black flex flex-col">
        
        {/* A Navbar aparece em todas as páginas */}
        <Navbar />

        {/* O conteúdo das páginas muda aqui dentro */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users/:user" element={<Profile />} />
            
            {/* Rota Fallback */}
            <Route path="*" element={ <Notfound/> } />
          </Routes>
        </div>

        {/* Footer Opcional sutil */}
        <Footer/>

      </div>
    </BrowserRouter>
  );
}
