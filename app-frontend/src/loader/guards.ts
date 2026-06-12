import { auth } from "@/api/auth/auth.api";
import { redirect } from "react-router-dom";

export async function protectedLoader({ request }: { request: Request}): Promise<Response | null> {
    const user = await auth.getMe();

    if (!user){
        const url = new URL(request.url);
        return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`)
    }
    return null;
}

export async function publicLoader({ request }: { request: Request }): Promise<Response | null> {
    const user = await auth.getMe();
    if (user){
        const url = new URL(request.url);
        return redirect(url.searchParams.get('redirectTo') || '/')
    }
    return null;
}
