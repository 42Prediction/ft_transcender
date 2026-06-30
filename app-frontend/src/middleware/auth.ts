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

export async function adminAuthMiddleware({ context }: LoaderFunctionArgs) {

    try {
        const data = await auth.getMeAdmin();
        if (data) {
            context.set(dataContext,  { ...data});
            return;
        }
    } catch {
        context.set(dataContext, null);
    }
}


// response{
//     success: boolean;
//     data: any;
//     statusCode: number;
//     error: string | null;
// }