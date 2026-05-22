
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile.tsx';
import Notfound from './components/NotFound';
import Footer from './components/Footer';
import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';


export default function App() {
  
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users/:user" element={<Profile />} />
          <Route path="*" element={<Notfound />} />
        </Routes>
      </div>

      <Footer />

          
          <Route path="/" element={<HomePage/>}/>
          <Route path="/login" element={<LoginPage/>} />
          <Route path="/auth/callback" element={<AuthCallback/>} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard/>
            </PrivateRoute>
          } />

          <Route path="/" element={
            <PrivateRoute>
              <Dashboard/>
            </PrivateRoute>
          } />

        </div>
    
  );

}
