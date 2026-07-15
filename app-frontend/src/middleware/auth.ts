import { auth } from "@/api/auth/auth.api";
import { dataContext } from "@/routes";
import type { LoaderFunctionArgs } from "react-router-dom";


export async function authMiddleware({ context }: LoaderFunctionArgs) {
    
    try {
        const data = await auth.getMe();
        if (data) {
            context.set(dataContext, { ...data });
            return;
        }
    } catch (error) {
    }

    context.set(dataContext, null);
}

async function fetchAdminProfile(retried = false): Promise<any> {
    try {
        return await auth.getMeAdmin();
    } catch (error) {
        if (!retried) {
            return fetchAdminProfile(true);
        }
        throw error;
    }
}

export async function adminAuthMiddleware({ context }: LoaderFunctionArgs) {
    const data = await fetchAdminProfile();
    context.set(dataContext, data ? { ...data } : null);
}


