import api from "../api";

export interface User {
	id: string;
	email: string;
	role: string;
}

export const auth = {
	signin: async (credential: Record<string, string>) => {
		const res = await api.post('/auth/signin', credential);
		return res.data;
	},

	signup: async (credential: Record<string, string>): Promise<User> => {
		const res = await api.post('/auth/signup', credential);
		return res.data;
	},

	// src/api/auth/auth.api.ts
	getMe: async (): Promise<any> => {
		try {
			const res = await api.get('/bettor/me');
			if (res.data?.statusCode === 401 || !res.data?.success) return null;
			return res.data?.data ?? res.data;
		} catch (err: any) {
			if (err.response?.status === 401) return null;
			throw err;
		}
	},

	getMeAdmin: async (): Promise<any> => {
		try {
			const res = await api.get('/users/me');
			if (!res.data || res.data?.statusCode === 401) return null;
			return res.data;
		} catch (err: any) {
			if (err.response?.status === 401) return null;
			throw err;
		}
	},

	signout: async (): Promise<{ message: string }> => {
		const res = await api.post('/auth/signout');
		return res.data;
	},
};
