import { auth, type User } from "@/api/auth/auth.api";
import { redirect } from "react-router-dom";

export async function protectedLoader({ request }: { request: Request}): Promise<User | Response> {
    const user: User | null = await auth.getMe();

    if (!user){
        const url = new URL(request.url);
        return redirect(`/login?redirectT0=${encodeURIComponent(url.pathname)}`)
    }
    return user;
}

export async function publicLoader(): Promise<Response | null> {
    const user : User | null = await auth.getMe();

    if (user){
        return redirect('/')
    }
    return null;
}