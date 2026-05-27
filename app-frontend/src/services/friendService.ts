import axios from 'axios';

// URL base da tua API no Backend
//const API_URL = 'http://localhost:3000';
const API_URL = '/api';
/**
 * Envia um pedido de amizade POST.
 * Utilizado quando o utilizador clica em "Adicionar Amigo".
 * @param senderId - O ID do utilizador que envia o pedido.
 * @param receiverId - O ID do utilizador que recebe o pedido.
 */
export const sendFriendRequest = (senderId: number, receiverId: number) => {
  return axios.post(`${API_URL}/friend-requests`, { senderId, receiverId });
};

/**
 * Busca todos os pedidos pendentes (GET) de um utilizador.
 * Utilizado para popular a lista de "Pedidos Pendentes" no Frontend.
 * @param userId - O ID do utilizador para verificar se tem pedidos.
 */
export const getPendingRequests = (userId: number) => {
  return axios.get(`${API_URL}/friend-requests/pending/${userId}`);
};

/**
 * Aceita um pedido de amizade (PATCH).
 * Altera o estado do pedido na base de dados de PENDING para ACCEPTED.
 * @param requestId - O ID do objeto de pedido de amizade.
 */
export const acceptFriendRequest = (requestId: number) => {
  return axios.patch(`${API_URL}/friend-requests/${requestId}/accept`);
};