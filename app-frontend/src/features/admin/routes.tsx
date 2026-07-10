import { adminProtectedLoader, adminPublicLoader } from '@/loader/guards';
import { adminSigninAction } from './actions/singnin';
import AdminLogin from './pages/Login';
import UsersPage from './pages/Users';
import AnalyticsPage from './pages/Analytics';
import { redirect } from 'react-router-dom';


export const adminDashboardRoute = [
    {
    index: true,
    loader: () => redirect("/admin/login"),
    },
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
    },
    {
        path: 'analytics',
        loader: adminProtectedLoader,
        Component: AnalyticsPage,
    }
];