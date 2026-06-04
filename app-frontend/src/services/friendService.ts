import axios from 'axios';

const API_URL = '/api';

/**
 * Envia um pedido de amizade POST.
 * @param senderId - O ID do utilizador que envia o pedido (number).
 * @param receiverIdOrUsername - Pode ser o ID (number) ou o Username (string).
 */
export const sendFriendRequest = (senderId: number, receiverIdOrUsername: string | number) => {
  return axios.post(`${API_URL}/friend-requests`, { senderId, receiverId: receiverIdOrUsername });
};

/**
 * Busca todos os pedidos pendentes (GET) de um utilizador.
 */
export const getPendingRequests = (userId: number) => {
  return axios.get(`${API_URL}/friend-requests/pending/${userId}`).then(res => res.data);
};

/**
 * Aceita um pedido de amizade (PATCH).
 */
export const acceptFriendRequest = (requestId: number) => {
  return axios.patch(`${API_URL}/friend-requests/${requestId}/accept`);
};