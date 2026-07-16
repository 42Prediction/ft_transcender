import { auth } from "@/api/auth/auth.api";
import { redirect } from "react-router-dom";

export async function adminSigninAction({ request }: { request: Request }) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Please fill in all fields.' };
    }

    try {
        const res = await auth.signin({ email, password });
        const role = res?.data?.user.role ?? res.data?.role;
        if (role !== 'admin' && role !== 'moderator') {
            return { error: 'Access denied.' };
        }

        return redirect('/admin/users');
    } catch (err: any) {
        return {
            error: err.response?.data?.message || 'Invalid credentials.'
        };
    }
}