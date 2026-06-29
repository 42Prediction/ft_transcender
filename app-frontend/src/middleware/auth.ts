import { auth } from "@/api/auth/auth.api";
import { dataContext } from "@/routes";
import type { LoaderFunctionArgs } from "react-router-dom";


export async function authMiddleware({ context }: LoaderFunctionArgs) {
    
    try {
        const data = await auth.getMe();
        if (data) {
            context.set(dataContext, { statusCode: 200, data });
            return;
        }
    } catch (error) {
        console.error('bettor/me failed:', error);
    }

    context.set(dataContext, null);
}

export async function adminAuthMiddleware({ context, request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    if (url.pathname === '/admin/login') {
        context.set(dataContext, null);
        return;
    }
    try {
        const userData = await auth.getMeAdmin();
        if (userData) {
            context.set(dataContext, { statusCode: 200, data: userData });
            return;
        }
    } catch {
        // silencioso
    }
    context.set(dataContext, null);
}