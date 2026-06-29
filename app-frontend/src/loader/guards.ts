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
        return redirect('/admin/login');
    }
    if (data?.data?.role !== 'admin') {
        return redirect('/'); 
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
    if (data?.data?.role === 'admin') {
        return redirect('/admin/users');
    }
    return null;
}