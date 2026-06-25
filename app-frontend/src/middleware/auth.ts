import { auth } from "@/api/auth/auth.api";
import { dataContext } from "@/routes";
import type { LoaderFunctionArgs } from "react-router-dom";


// src/middleware/auth.ts
export async function authMiddleware({ context }: LoaderFunctionArgs) {
    try {
        const data = await auth.getMe(); // bettor/me
        if (data) {
            context.set(dataContext, { statusCode: 200, data });
            return;
        }
        // se não tem bettor tenta como user
        const userData = await auth.getMeAdmin(); // users/me
        if (userData) {
            context.set(dataContext, { statusCode: 200, data: userData });
            return;
        }
        context.set(dataContext, null);
    } catch (error) {
        context.set(dataContext, null);
    }
}
