import api from "../api";

export interface User {
  id: string;
  email: string;
  role: string;
}

export const auth = {
	signin: async (credential: Record<string, string>): Promise<User> => {
		const res = await api.post('/auth/signin', credential);
		return res.data;
	},

	signup: async (credential: Record<string, string>): Promise<User> => {
		const res = await api.post('/auth/signup', credential);
		return res.data;
	},

	getMe: async (): Promise<User | null> => {
		try {
			const res = await api.get('/users/me');
			return res.data;
		} catch {
			return null;
		}
	},

	logout: async (): Promise<{ message: string }> => {
		const res = await api.post('/auth/logout');
		return res.data;
	}
};
