import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Check, X, UserMinus, Clock } from "lucide-react";
// Importa o teu hook/API de amizades aqui quando estiver pronto no front
// import { friendService } from "../../../../services/friendService";

type FriendStatus = "accepted" | "received_request" | "sent_request";

interface FriendMock {
    id: string;
    nick: string;
    status: FriendStatus;
}

// Mock de dados para testares a UI imediatamente
const MOCK_FRIENDS: FriendMock[] = [
    { id: "1", nick: "Alexandre", status: "received_request" },
    { id: "2", nick: "Bruno", status: "sent_request" },
    { id: "3", nick: "Carlos", status: "accepted" },
    { id: "4", nick: "Daniel", status: "accepted" },
    { id: "5", nick: "Edmilson", status: "accepted" },
    { id: "6", nick: "Gildo", status: "accepted" },
    { id: "7", nick: "Zacarias", status: "accepted" },
];

export function ListaAmigos({ bettor }: { bettor?: any }) {
    const [friends, setFriends] = useState<FriendMock[]>(MOCK_FRIENDS);
    const [searchQuery, setSearchQuery] = useState("");
    const [inviteNick, setInviteNick] = useState("");

    // Lógica de Ordenação e Filtragem
    const filteredAndSortedFriends = useMemo(() => {
        let result = friends.filter((f) =>
            f.nick.toLowerCase().includes(searchQuery.toLowerCase())
        );

        result.sort((a, b) => {
            // 1. Pendentes (recebidos e enviados) no topo
            const aIsPending = a.status !== "accepted";
            const bIsPending = b.status !== "accepted";

            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;

            // 2. Ordem Alfabética
            return a.nick.localeCompare(b.nick);
        });

        return result;
    }, [friends, searchQuery]);

    // Ações
    const handleSendInvite = () => {
        if (!inviteNick.trim()) return;
        // Aqui entra a tua chamada real à API
        console.log("Enviando convite para:", inviteNick);
        setInviteNick("");
    };

    const handleAccept = (id: string) => console.log("Aceitar", id);
    const handleReject = (id: string) => console.log("Rejeitar", id);
    const handleCancel = (id: string) => console.log("Cancelar", id);
    const handleRemove = (id: string) => console.log("Remover", id);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Amigos
            </h1>

            {/* Controlos do Topo: Pesquisa e Convite */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Barra de Pesquisa (Esquerda) */}
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Procurar amigos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-surface/40 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background/60"
                    />
                </div>

                {/* Enviar Convite (Direita) */}
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                        type="text"
                        placeholder="Nick do utilizador"
                        value={inviteNick}
                        onChange={(e) => setInviteNick(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-surface/40 py-2 px-3 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background/60 sm:w-48"
                    />
                    <button
                        onClick={handleSendInvite}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Convidar</span>
                    </button>
                </div>
            </div>

            {/* Lista com Scroll */}
            <div className="rounded-2xl border border-border/60 bg-surface/20 p-2">
                <div className="max-h-[500px] space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredAndSortedFriends.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Nenhum utilizador encontrado.
                        </div>
                    ) : (
                        filteredAndSortedFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center justify-between rounded-xl bg-surface/40 px-4 py-3 border border-transparent hover:border-border/60 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-brand shadow-glow flex items-center justify-center text-white font-medium">
                                        {friend.nick.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <Link
                                            to={`/user/${friend.nick}`} // Ou /profile/${friend.nick}
                                            className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                                        >
                                            {friend.nick}
                                        </Link>
                                        {friend.status === "received_request" && (
                                            <p className="text-xs text-primary">Pedido recebido</p>
                                        )}
                                        {friend.status === "sent_request" && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" /> Aguardando
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ações baseadas no estado */}
                                <div className="flex gap-2">
                                    {friend.status === "received_request" && (
                                        <>
                                            <button
                                                onClick={() => handleAccept(friend.id)}
                                                title="Aceitar Pedido"
                                                className="grid h-8 w-8 place-items-center rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(friend.id)}
                                                title="Rejeitar Pedido"
                                                className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}

                                    {friend.status === "sent_request" && (
                                        <button
                                            onClick={() => handleCancel(friend.id)}
                                            title="Cancelar Pedido"
                                            className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}

                                    {friend.status === "accepted" && (
                                        <button
                                            onClick={() => handleRemove(friend.id)}
                                            title="Remover Amigo"
                                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-red-400 transition-colors"
                                        >
                                            <UserMinus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}