import { Navigate, Outlet } from "react-router-dom";
import { publicRouter } from "../public/routes";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import { signinAction } from "./actions/signin.action";

const ProtectedRoute = () => {
    // logica de autenticação
    // enviar a requisição caso de erro redireciona
    return isAuthenticated ? <Outlet /> :  <Navigate to="/login" replace/>
}

export const authRouter = ([
    {
        path: '/signin',
        element: <Signin />,
        loader: publicRouter,
        action: signinAction,
    },
    {
        path: '/',
        element: <Signup/>,
        loader: publicRouter
    }
])