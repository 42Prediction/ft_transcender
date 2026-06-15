import { auth } from "@/api/auth/auth.api";
import { dataContext } from "@/routes";
import type { LoaderFunctionArgs } from "react-router-dom";


export async function authMiddleware({context}: LoaderFunctionArgs) {
	try {
		const data = await auth.getMe();
		context.set(dataContext, data);
	} catch (error) {
		context.set(dataContext, null);
	}
}
