import { auth } from "@/api/auth/auth.api";
import { redirect } from "react-router-dom";

export async function signupAction({ request }: { request: Request }) {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password){
        return{
            error: 'Please fill in all fields.'
        };
    }

    try {
        await auth.signup({email, password});
        return redirect('/');
    } catch (err: any) {
        return {
            error: err.response?.data?.message || 'Invalid credentials.'
        }
    }
}