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


	getMe: async (): Promise<any> => {
		try {
			const res = await api.get('/bettor/me');
			if (res.data?.statusCode === 401 || !res.data?.success) return null;
			return res.data;
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

	twoFactor: {
		generate: async (): Promise<{ qrCode: string }> => {
			const res = await api.post('/auth/2fa/generate');
			return res.data;
		},

		turnOn: async (code: string): Promise<void> => {
			await api.post('/auth/2fa/turn-on', { code });
		},

		turnOff: async (): Promise<void> => {
			await api.post('/auth/2fa/turn-off');
		},

		authenticate: async (code: string): Promise<void> => {
			await api.post('/auth/2fa/authenticate', { code });
		},
	},
};
