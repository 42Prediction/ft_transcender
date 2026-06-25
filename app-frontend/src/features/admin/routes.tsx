import { authMiddleware } from "@/middleware/auth";
import { Admin } from "./pages/Admin";
import { adminProtectedLoader } from "@/loader/guards";

export const adminDashboardRoute = [
    {
        id: 'admin',
        path: 'admin',
        component: Admin,
        loader: adminProtectedLoader,
        middleware: [authMiddleware],
    }
];