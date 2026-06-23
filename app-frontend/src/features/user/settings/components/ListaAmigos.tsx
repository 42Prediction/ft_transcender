import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Check, X, UserMinus, Clock, Loader2 } from "lucide-react";
// Importa o teu hook/API de amizades aqui quando estiver pronto no front
import { friendApi } from "../../../../api/bettor/friend.api";

type FriendStatus = "accepted" | "received_request" | "sent_request";

interface FriendData {
    id: string;
    nick: string;
    status: FriendStatus;
}

export function ListaAmigos({ bettor }: { bettor?: any }) {
    const [friends, setFriends] = useState<FriendData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [inviteNick, setInviteNick] = useState("");

    // Estados de Loading
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [actionLoadingNick, setActionLoadingNick] = useState<string | null>(null);

    // Carregar dados reais do backend ao montar o componente
    useEffect(() => {
        const fetchFriendsData = async () => {
            try {
                setIsLoading(true);
                // Executa as 3 chamadas HTTP em simultâneo
                const [friendsRes, receivedRes, sentRes] = await Promise.all([
                    friendApi.getFriends(),
                    friendApi.getReceivedRequests(),
                    friendApi.getSentRequests()
                ]);

                // 1. Amigos confirmados (o array vem diretamente com Bettors)
                const acceptedFriends: FriendData[] = friendsRes.data.map((f: any) => ({
                    id: f.id,
                    nick: f.nick,
                    status: "accepted"
                }));

                // 2. Pedidos recebidos (a informação do utilizador está no "sender")
                const receivedRequests: FriendData[] = receivedRes.data.map((req: any) => ({
                    id: req.sender.id,
                    nick: req.sender.nick,
                    status: "received_request"
                }));

                // 3. Pedidos enviados (a informação do utilizador está no "receiver")
                const sentRequests: FriendData[] = sentRes.data.map((req: any) => ({
                    id: req.receiver.id,
                    nick: req.receiver.nick,
                    status: "sent_request"
                }));

                // Unificar as 3 listas
                setFriends([...acceptedFriends, ...receivedRequests, ...sentRequests]);
            } catch (error) {
                console.error("Erro ao carregar dados de amizades:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriendsData();
    }, []);

    // Lógica de Ordenação e Filtragem
    const filteredAndSortedFriends = useMemo(() => {
        const result = friends.filter((f) =>
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

    // --- Ações de Comunicação com a API ---
    const handleSendInvite = async () => {
        if (!inviteNick.trim()) return;
        try {
            setIsInviting(true);
            await friendApi.sendRequest(inviteNick);

            // Atualiza a UI sem recarregar
            setFriends(prev => [
                ...prev,
                { id: `temp-${Date.now()}`, nick: inviteNick, status: "sent_request" }
            ]);
            setInviteNick("");
        } catch (error) {
            console.error("Erro ao enviar convite:", error);
        } finally {
            setIsInviting(false);
        }
    };

    const handleAccept = async (nick: string) => {
        try {
            setActionLoadingNick(nick);
            await friendApi.acceptRequest(nick);

            // Altera o status para 'accepted' localmente
            setFriends(prev => prev.map(f =>
                f.nick === nick ? { ...f, status: "accepted" } : f
            ));
        } catch (error) {
            console.error("Erro ao aceitar pedido:", error);
        } finally {
            setActionLoadingNick(null);
        }
    };

    const handleReject = async (nick: string) => {
        try {
            setActionLoadingNick(nick);
            await friendApi.rejectRequest(nick);

            // Remove da lista
            setFriends(prev => prev.filter(f => f.nick !== nick));
        } catch (error) {
            console.error("Erro ao rejeitar pedido:", error);
        } finally {
            setActionLoadingNick(null);
        }
    };

    const handleCancel = async (nick: string) => {
        try {
            setActionLoadingNick(nick);
            await friendApi.cancelRequest(nick);

            setFriends(prev => prev.filter(f => f.nick !== nick));
        } catch (error) {
            console.error("Erro ao cancelar pedido:", error);
        } finally {
            setActionLoadingNick(null);
        }
    };

    const handleRemove = async (nick: string) => {
        try {
            setActionLoadingNick(nick);
            await friendApi.removeFriend(nick);

            setFriends(prev => prev.filter(f => f.nick !== nick));
        } catch (error) {
            console.error("Erro ao remover amigo:", error);
        } finally {
            setActionLoadingNick(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Amigos
            </h1>

            {/* Controlos do Topo: Pesquisa e Convite */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Barra de Pesquisa */}
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

                {/* Enviar Convite */}
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <input
                        type="text"
                        placeholder="Nick do utilizador"
                        value={inviteNick}
                        onChange={(e) => setInviteNick(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                        className="w-full rounded-xl border border-border/60 bg-surface/40 py-2 px-3 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background/60 sm:w-48"
                    />
                    <button
                        onClick={handleSendInvite}
                        disabled={isInviting || !inviteNick.trim()}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        <span className="hidden sm:inline">Convidar</span>
                    </button>
                </div>
            </div>

            {/* Lista com Scroll */}
            <div className="rounded-2xl border border-border/60 bg-surface/20 p-2">
                <div className="max-h-[500px] space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredAndSortedFriends.length === 0 ? (
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
                                        {/* Link para o perfil */}
                                        <Link
                                            to={`/profile/${friend.nick}`}
                                            className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors block"
                                        >
                                            {friend.nick}
                                        </Link>

                                        {/* Legendas e status */}
                                        {friend.status === "received_request" && (
                                            <p className="text-xs text-primary mt-0.5">Pedido recebido</p>
                                        )}
                                        {friend.status === "sent_request" && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                <Clock className="h-3 w-3" /> Aguardando
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ações baseadas no estado */}
                                <div className="flex gap-2">
                                    {actionLoadingNick === friend.nick ? (
                                        <div className="grid h-8 w-8 place-items-center text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : (
                                        <>
                                            {friend.status === "received_request" && (
                                                <>
                                                    <button
                                                        onClick={() => handleAccept(friend.nick)}
                                                        title="Aceitar Pedido"
                                                        className="grid h-8 w-8 place-items-center rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(friend.nick)}
                                                        title="Rejeitar Pedido"
                                                        className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}

                                            {friend.status === "sent_request" && (
                                                <button
                                                    onClick={() => handleCancel(friend.nick)}
                                                    title="Cancelar Pedido"
                                                    className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}

                                            {friend.status === "accepted" && (
                                                <button
                                                    onClick={() => handleRemove(friend.nick)}
                                                    title="Remover Amigo"
                                                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-red-400 transition-colors"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </>
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