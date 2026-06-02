import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile.tsx';
import Notfound from './components/NotFound';
import Footer from './components/Footer';
import { Outlet, useNavigation, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext.tsx';
import { publicProfileLoader, privateProfileLoader } from './pages/Profile.tsx';

function ProtectedLayout() {
  const navigation = useNavigation();

  return (
    <>
      <Navbar />
      {/* barra de loading no topo enquanto loader roda */}
      {navigation.state === 'loading' && (
        <div className="fixed top-0 left-0 h-0.5 w-full bg-[#00FF9D] z-50 animate-pulse" />
      )}
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  {path: 'login', element: <LoginPage />},
  { path: 'auth/callback', element: <AuthCallback />},
  {
    path: 'bettor/:@nick',
    element: <Profile />,
    loader: publicProfileLoader,
  },
  { path: '/', element: <Home /> },
  {
    element: (
      <PrivateRoute>
        <ProtectedLayout />
      </PrivateRoute>
    ),
    children:
      [
        { path: 'homepage', element: <HomePage /> },
        { path: '/dashboard',  element: <Dashboard /> },
        { path: 'bettor/me',
          element: <Profile />,
          loader: privateProfileLoader,
        },
      ]
  },
  { path: '*', element: <Notfound />}
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}