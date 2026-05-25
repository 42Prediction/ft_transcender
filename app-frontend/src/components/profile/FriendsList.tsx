import { useState } from "react";

// Definimos o que é um Amigo
interface Friend {
  id: number;
  username: string;
  isOnline: boolean;
}

export default function FriendsList() {
  // Simulando uma lista inicial de amigos
  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, username: "Code_Hunter", isOnline: true },
    { id: 2, username: "Byte_Knight", isOnline: false },
  ]);

  const removeFriend = (id: number) => {
    setFriends(friends.filter((f) => f.id !== id));
  };

  return (
    <div className="md:col-span-1">
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg w-full">
      <h3 className="text-[#00ff9d] mb-4 uppercase font-bold tracking-widest">
        Friends List
      </h3>
      
      <div className="space-y-3">
        {friends.map((friend) => (
          <div key={friend.id} className="flex justify-between items-center bg-black p-3 rounded border border-[#333]">
            <div className="flex items-center gap-2">
              {/* Indicador de Online */}
              <div className={`w-2 h-2 rounded-full ${friend.isOnline ? "bg-[#00ff9d]" : "bg-gray-600"}`} />
              <span className="text-white text-sm">{friend.username}</span>
            </div>
            
            <button 
              onClick={() => removeFriend(friend.id)}
              className="text-red-500 hover:text-red-400 text-xs uppercase"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      {/* Input simples para adicionar (estudo) */}
      <div className="mt-6">
        <input 
          type="text" 
          placeholder="Adicionar amigo..." 
          className="w-full bg-black border border-[#333] p-2 text-white text-sm"
        />
      </div>
    </div>
    </div >
  );
}