// Ajusta o caminho de importação conforme necessário para chegar ao teu ficheiro api.ts principal
import { api } from '../api';

export const friendApi = {
  getFriends: () => api.get('/bettor/me/friends'),
  getReceivedRequests: () => api.get('/bettor/me/friend-requests/received'),
  getSentRequests: () => api.get('/bettor/me/friend-requests/sent'),
  checkNickExists: (nick: string) => api.get<{ exists: boolean }>(`/bettor/@${nick}/exists`),
  sendRequest: (nick: string) => api.post(`/bettor/me/friend-requests/${nick}/send`),
  acceptRequest: (id: string) => api.patch(`/bettor/me/friend-requests/${id}/accept`),
  rejectRequest: (id: string) => api.delete(`/bettor/me/friend-requests/${id}/reject`),
  cancelRequest: (id: string) => api.delete(`/bettor/me/friend-requests/${id}/cancel`),
  removeFriend: (id: string) => api.delete(`/bettor/me/friends/${id}`),
};