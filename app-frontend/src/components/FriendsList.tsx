import { useState, useEffect, useCallback } from "react";
import { getPendingRequests, acceptFriendRequest, sendFriendRequest } from "../services/friendService";

// Definimos a interface para garantir o tipo dos dados
interface Friend {
  id: number;
  username: string;
  is_online: boolean;
}

// Interface para os pedidos de amizade
interface FriendRequest {
  id: number;
  sender: { username: string };
}

interface FriendsListProps {
  userId: number; // Alterado para receber o ID do utilizador logado
}

export default function FriendsList({ userId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]); // Estado para pedidos
  const [newFriendId, setNewFriendId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verificação de segurança: Não renderiza o componente se não houver um ID válido
  if (!userId) {
    return <div className="text-white p-4">A carregar utilizador...</div>;
  }

  /**
   * Função para carregar a lista de amigos do backend.
   * Utiliza useCallback para evitar que a função seja recriada em cada renderização.
   */
  const loadFriends = useCallback(() => {
    // Mantemos este fetch, pois é específico de listar amigos de um user
    fetch(`http://localhost:3000/users/${userId}/friends`)
      .then((res) => res.json())
      .then((data) => {
        // Garantimos que recebemos um array antes de atualizar o estado
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao carregar amigos:", err));
  }, [userId]);

  /**
   * Função para carregar os pedidos de amizade pendentes.
   */
  const loadPendingRequests = useCallback(async () => {
    try {
      const response = await getPendingRequests(userId);
      setPendingRequests(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    }
  }, [userId]);

  // Efeito para carregar os amigos e pedidos ao montar o componente
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  /**
   * Envia uma requisição POST para criar um pedido de amizade.
   */
  const handleAddFriend = async () => {
    if (!newFriendId) return;

    setIsLoading(true);
    try {
      // Usamos o serviço de envio e convertemos o input para Number
      await sendFriendRequest(userId, Number(newFriendId));
      
      setNewFriendId("");
      alert("Pedido de amizade enviado!");
      loadPendingRequests(); // Atualiza a lista após sucesso
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Aceita um pedido de amizade.
   */
  const handleAcceptRequest = async (requestId: number) => {
    setIsLoading(true);
    try {
      await acceptFriendRequest(requestId);
      
      loadFriends(); // Atualiza lista de amigos
      loadPendingRequests(); // Atualiza lista de pedidos
    } catch (err) {
      console.error(err);
      alert("Erro ao aceitar pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Recusa um pedido de amizade.
   */
  const handleRejectRequest = async (requestId: number) => {
    setIsLoading(true);
    try {
      // Endpoint para recusar (DELETE)
      const res = await fetch(`http://localhost:3000/friend-requests/${requestId}/reject`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadPendingRequests(); // Atualiza a lista de pedidos pendentes
      } else {
        alert("Erro ao recusar pedido.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove um amigo através de uma requisição DELETE.
   */
  const removeFriend = async (friendUsername: string) => {
    // Validação de segurança
    if (!window.confirm(`Tens a certeza que queres remover ${friendUsername} da tua lista?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/users/${userId}/friends/${friendUsername}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadFriends(); // Atualiza a lista após sucesso
      } else {
        alert("Erro ao remover amigo.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Container principal do componente com estilos de borda e padding
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg w-full">
      
      {/* Título da secção */}
      <h3 className="text-[#00ff9d] mb-4 uppercase font-bold tracking-widest">
        Friends List
      </h3>

      {/* Lista renderizada dinamicamente baseada no estado 'friends' */}
      <div className="space-y-3">
        {Array.isArray(friends) && friends.map((friend) => (
          <div key={friend.id} className="flex justify-between items-center bg-black p-3 rounded border border-[#333]">
            
            {/* Informação do utilizador e estado online */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${friend.is_online ? "bg-[#00ff9d]" : "bg-gray-600"}`} />
              <span className="text-white text-sm">{friend.username}</span>
            </div>

            {/* Botão de remoção (ativo apenas quando não está a carregar) */}
            <button
              onClick={() => removeFriend(friend.username)}
              disabled={isLoading}
              className={`text-red-500 hover:text-red-400 text-xs uppercase ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? "..." : "Remover"}
            </button>
          </div>
        ))}
      </div>

      {/* Nova Secção: Pedidos Pendentes */}
      {Array.isArray(pendingRequests) && pendingRequests.length > 0 && (
        <div className="mt-6 border-t border-[#333] pt-4">
          <h4 className="text-white text-xs uppercase mb-2">Pedidos Pendentes</h4>
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex justify-between items-center bg-[#222] p-2 rounded mb-2">
              <span className="text-white text-sm">{req.sender.username}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAcceptRequest(req.id)}
                  className="text-[#00ff9d] text-xs uppercase font-bold"
                >
                  Aceitar
                </button>
                <button 
                  onClick={() => handleRejectRequest(req.id)}
                  className="text-red-500 text-xs uppercase font-bold"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Área para introduzir novo amigo */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={newFriendId}
          onChange={(e) => setNewFriendId(e.target.value)}
          placeholder="ID do amigo"
          className="bg-black border border-[#333] text-white p-2 rounded text-sm w-full"
          disabled={isLoading} // Desativar durante loading para evitar envios duplicados
        />

        {/* Botão de envio (Add) */}
        <button
          onClick={handleAddFriend}
          disabled={isLoading}
          className={`bg-[#00ff9d] text-black font-bold p-2 rounded text-xs uppercase hover:bg-green-400 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? "Adicionando..." : "Add"}
        </button>
      </div>
    </div>
  );
}