import { useState, useEffect, useCallback } from "react";
import { getPendingRequests, acceptFriendRequest, sendFriendRequest } from "../services/friendService";

interface Friend {
  id: number;
  username: string;
  is_online: boolean;
}

interface FriendRequest {
  id: number;
  sender: { username: string };
}

interface FriendsListProps {
  userId: number;
}

export default function FriendsList({ userId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [newFriendInput, setNewFriendInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Função para carregar a lista de amigos do backend usando o Proxy /api
   */
  const loadFriends = useCallback(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}/friends`)
      .then((res) => res.json())
      .then((data) => {
        setFriends(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erro ao carregar amigos:", err));
  }, [userId]);

  /**
   * Função para carregar os pedidos de amizade pendentes.
   */
  const loadPendingRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getPendingRequests(userId);
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    }
  }, [userId]);

  // Efeito inicial para carregar dados
  useEffect(() => {
    if (userId) {
      loadFriends();
      loadPendingRequests();
    }
  }, [userId, loadFriends, loadPendingRequests]);

  /**
   * Envia uma requisição para criar um pedido de amizade (aceita texto ou número)
   */
  const handleAddFriend = async () => {
    if (!newFriendInput.trim()) return;

    setIsLoading(true);
    try {
      // Enviamos o valor bruto do input (pode ser "teste" ou "2")
      await sendFriendRequest(userId, newFriendInput.trim());
      
      setNewFriendInput("");
      alert("Pedido de amizade enviado com sucesso!");
      loadPendingRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao enviar pedido de amizade.");
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
      alert("Pedido aceite!");
      loadFriends();
      loadPendingRequests();
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
      const res = await fetch(`/api/friend-requests/${requestId}/reject`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadPendingRequests();
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
   * Remove um amigo da lista
   */
  const removeFriend = async (friendUsername: string) => {
    if (!window.confirm(`Tens a certeza que queres remover ${friendUsername} da tua lista?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/friends/${friendUsername}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadFriends();
      } else {
        alert("Erro ao remover amigo.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return <div className="text-white p-4">A carregar utilizador...</div>;
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg w-full">
      <h3 className="text-[#00ff9d] mb-4 uppercase font-bold tracking-widest">
        Friends List
      </h3>

      {/* Lista de Amigos Atuais */}
      <div className="space-y-3">
        {friends.length === 0 ? (
          <p className="text-zinc-500 text-xs italic">Nenhum amigo adicionado ainda.</p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="flex justify-between items-center bg-black p-3 rounded border border-[#333]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${friend.is_online ? "bg-[#00ff9d]" : "bg-gray-600"}`} />
                <span className="text-white text-sm">{friend.username}</span>
              </div>
              <button
                onClick={() => removeFriend(friend.username)}
                disabled={isLoading}
                className="text-red-500 hover:text-red-400 text-xs uppercase"
              >
                {isLoading ? "..." : "Remover"}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Secção: Pedidos Pendentes */}
      {pendingRequests.length > 0 && (
        <div className="mt-6 border-t border-[#333] pt-4">
          <h4 className="text-zinc-400 text-xs uppercase mb-2 tracking-wider">Pedidos Pendentes</h4>
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex justify-between items-center bg-[#222] p-2 rounded mb-2 border border-[#444]">
              <span className="text-white text-sm font-semibold">{req.sender.username}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAcceptRequest(req.id)}
                  className="text-[#00ff9d] hover:text-green-400 text-xs uppercase font-bold bg-black px-2 py-1 rounded"
                >
                  Aceitar
                </button>
                <button 
                  onClick={() => handleRejectRequest(req.id)}
                  className="text-red-500 hover:text-red-400 text-xs uppercase font-bold bg-black px-2 py-1 rounded"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input para Adicionar por ID ou Username */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={newFriendInput}
          onChange={(e) => setNewFriendInput(e.target.value)}
          placeholder="ID ou Username do amigo"
          className="bg-black border border-[#333] text-white p-2 rounded text-sm w-full focus:outline-none focus:border-[#00ff9d]"
          disabled={isLoading}
        />
        <button
          onClick={handleAddFriend}
          disabled={isLoading}
          className="bg-[#00ff9d] text-black font-bold p-2 rounded text-xs uppercase hover:bg-green-400 disabled:opacity-50"
        >
          {isLoading ? "..." : "Add"}
        </button>
      </div>
    </div>
  );
}