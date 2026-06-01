import api from "../api";

export const auth = {
	logout() {
		return api.post('/auth/logout');
	},
};
