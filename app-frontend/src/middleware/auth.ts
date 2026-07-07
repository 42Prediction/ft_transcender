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
        // A rejection here means the request itself failed (network hiccup, backend
        // restart, transient 5xx) — auth.getMeAdmin() already resolves genuine 401s to
        // null instead of throwing. Retry once before giving up, and never treat this
        // as "not authenticated": doing so was booting still-logged-in admins to the
        // login screen on every transient error.
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


// response{
//     success: boolean;
//     data: any;
//     statusCode: number;
//     error: string | null;
// }