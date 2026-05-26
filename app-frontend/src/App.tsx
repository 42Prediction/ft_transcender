import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';

export function App(){

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
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

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );

}
