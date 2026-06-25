import { dataContext } from "@/routes";
import { redirect, type LoaderFunctionArgs } from "react-router-dom";

export async function protectedLoader({ request, context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    if (data?.statusCode !== 200){
        const url = new URL(request.url);
        return redirect(`/signin?redirectTo=${encodeURIComponent(url.pathname)}`)
    }
    return null;
}

export async function adminProtectedLoader({ request, context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    if (!data) {
        const url = new URL(request.url);
        return redirect(`/signin?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    if (data?.role !== 'admin')
        return redirect('/');
    return null;
}

export async function publicLoader({ request, context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    if (data?.statusCode === 200){
        const url = new URL(request.url);
        return redirect(url.searchParams.get('redirectTo') || '/')
    }
    return null;
}
