import Navbar from './features/public/components/Navbar.tsx';
import { Home } from './features/public/pages/Home.tsx';
import Notfound from './components/NotFound';
import Footer from './components/Footer';
import { Outlet, useNavigation, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { LoginPage } from './features/public/pages/LoginPage.tsx';
import { AuthCallback } from './features/public/pages/AuthCallback.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { profileRoute, protectedProfileRoute } from './features/profile/route.tsx';

function ProtectedLayout() {
  const navigation = useNavigation();

  return (
    <>
      <Navbar />
      {/* barra de loading no topo enquanto loader roda */}
      {navigation.state === 'loading' && (
        <div className="fixed top-0 left-0 h-0.5 w-full bg-primary z-50 animate-pulse" />
      )}
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  {path: 'login', element: <LoginPage />},
  { path: 'auth/callback', element: <AuthCallback />},
  ...profileRoute,
  // { path: '/', element: <Home /> },
  {
    element: (
      <PrivateRoute>
        <ProtectedLayout />
      </PrivateRoute>
    ),
    children:
      [
        { path: '/', element: <Home /> },
        ...protectedProfileRoute
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