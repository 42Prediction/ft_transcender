import { adminProtectedLoader, adminPublicLoader } from '@/loader/guards';
import { adminSigninAction } from './actions/singnin';
import AdminLogin from './pages/Login';
import UsersPage from './pages/Users';


export const adminDashboardRoute = [
    {
        path: 'login',
        loader: adminPublicLoader,
        action: adminSigninAction,
        Component: AdminLogin,
    },
    {
        path: 'users',
        loader: adminProtectedLoader,
        Component: UsersPage,
    }
];