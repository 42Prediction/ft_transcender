import api from "../api";

export interface User {
  id: string;
  email: string;
  password: string;
}

export const auth = {
	login: async (credential: Record<string, string>): Promise<User> => {
		return api.post('/auth/signin', credential);
	},

	getMe: async (): Promise<User | null> => {
		try {
			const res = await api.get('users/me');
			return res.data;
		} catch {
			return null;
		}
	},

	logout: async (): Promise<User> => {
		return api.post('/auth/logout');
	}
};
