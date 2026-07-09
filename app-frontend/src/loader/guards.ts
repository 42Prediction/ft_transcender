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

export async function adminProtectedLoader({ context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    const role = data?.data?.role;

    if (role !== 'admin' && role !== 'moderator') {
        return redirect('/admin/login');
    }
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

export async function adminPublicLoader({ context }: LoaderFunctionArgs): Promise<Response | null> {
    const data = context.get(dataContext);
    const role = data?.data?.role;

    if (data && (role === 'admin' || role === 'moderator')) {
        return redirect('/admin/users');
    }
    return null;
}