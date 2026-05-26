import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile.tsx';
import Notfound from './components/NotFound';
import Footer from './components/Footer';
import { Routes, Route, Outlet } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';

function ProtectedLayout () {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}


    export default function App() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1">
        <Routes>

          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protegidas */}
          <Route
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/users/:user" element={<Profile />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/private" element={<Dashboard />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Notfound />} />
        </Routes>
      </div>

    
    </div>

  );
}