import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    // logica de autenticação
    // enviar a requisição caso de erro redireciona
    return isAuthenticated ? <Outlet /> :  <Navigate to="/login" replace/>
}

export const authRouter = createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    }
])