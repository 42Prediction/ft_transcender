// Ajusta o caminho de importação conforme necessário para chegar ao teu ficheiro api.ts principal
import { api } from '../api';

export const friendApi = {
  getFriends: () => api.get('/bettor/me/friends'),
  getReceivedRequests: () => api.get('/bettor/me/friend-requests/received'),
  getSentRequests: () => api.get('/bettor/me/friend-requests/sent'),
  
  sendRequest: (nick: string) => api.post(`/bettor/me/friend-requests/${nick}/send`),
  acceptRequest: (nick: string) => api.patch(`/bettor/me/friend-requests/${nick}/accept`),
  rejectRequest: (nick: string) => api.delete(`/bettor/me/friend-requests/${nick}/reject`),
  cancelRequest: (nick: string) => api.delete(`/bettor/me/friend-requests/${nick}/cancel`),
  removeFriend: (nick: string) => api.delete(`/bettor/me/friends/${nick}`),
};