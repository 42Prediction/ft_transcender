import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Check, X, UserMinus, Clock, Loader2 } from "lucide-react";
import { friendApi } from "../../../../api/bettor/friend.api";
import { InfoModal } from "./InfoModal";

type FriendStatus = "accepted" | "received_request" | "sent_request";

interface FriendData {
    id: string;
    nick: string;
    status: FriendStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Constrói o mapa de estado mais recente a partir das três listas do backend. */
function buildFriendMap(
    friends: FriendData[],
    received: FriendData[],
    sent: FriendData[]
): Map<string, FriendStatus> {
    const map = new Map<string, FriendStatus>();
    friends.forEach(f => map.set(f.id, "accepted"));
    received.forEach(f => map.set(f.id, "received_request"));
    sent.forEach(f => map.set(f.id, "sent_request"));
    return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FriendList({ bettor }: { bettor?: any }) {
    const [friends, setFriends] = useState<FriendData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [inviteNick, setInviteNick] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Estado do modal — null significa "fechado"
    const [modalMessage, setModalMessage] = useState<string | null>(null);

    // -----------------------------------------------------------------------
    // Fetch
    // -----------------------------------------------------------------------

    const fetchFriendsData = useCallback(async (): Promise<Map<string, FriendStatus>> => {
        const [friendsRes, receivedRes, sentRes] = await Promise.all([
            friendApi.getFriends(),
            friendApi.getReceivedRequests(),
            friendApi.getSentRequests(),
        ]);

        const acceptedFriends: FriendData[] = friendsRes.data.map((f: any) => ({
            id: f.id,
            nick: f.nick,
            status: "accepted" as FriendStatus,
        }));
        const receivedRequests: FriendData[] = receivedRes.data.map((req: any) => ({
            id: req.sender.id,
            nick: req.sender.nick,
            status: "received_request" as FriendStatus,
        }));
        const sentRequests: FriendData[] = sentRes.data.map((req: any) => ({
            id: req.receiver.id,
            nick: req.receiver.nick,
            status: "sent_request" as FriendStatus,
        }));

        const merged = [...acceptedFriends, ...receivedRequests, ...sentRequests];
        setFriends(merged);

        return buildFriendMap(acceptedFriends, receivedRequests, sentRequests);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchFriendsData().finally(() => setIsLoading(false));
    }, [fetchFriendsData]);

    // -----------------------------------------------------------------------
    // Silent refresh
    // -----------------------------------------------------------------------

    const silentRefresh = useCallback(async (): Promise<Map<string, FriendStatus>> => {
        try {
            return await fetchFriendsData();
        } catch {
            return new Map();
        }
    }, [fetchFriendsData]);

    // -----------------------------------------------------------------------
    // Ordenação e filtragem
    // -----------------------------------------------------------------------

    const filteredAndSortedFriends = useMemo(() => {
        const result = friends.filter(f =>
            f.nick.toLowerCase().includes(searchQuery.toLowerCase())
        );
        result.sort((a, b) => {
            const aIsPending = a.status !== "accepted";
            const bIsPending = b.status !== "accepted";
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;
            return a.nick.localeCompare(b.nick);
        });
        return result;
    }, [friends, searchQuery]);

    // -----------------------------------------------------------------------
    // Ações
    // -----------------------------------------------------------------------

    /**
     * Enviar convite.
     *
     * Fluxo (sem erros de rede na consola):
     *
     *   1. Validação local — verificar em memória se já existe relação com
     *      este nick. Se existir → modal, return. Zero pedidos à rede.
     *
     *   2. Verificação de existência do nick via GET sempre-200:
     *      GET /bettor/@:nick/exists → { exists: boolean }
     *      Este endpoint NUNCA devolve 4xx, logo NUNCA gera erros de rede
     *      na consola do browser.
     *      Se exists === false → modal "não encontrado", return.
     *
     *   3. Só chega aqui se o nick existe e não há relação prévia.
     *      Enviar o pedido via POST.
     *
     *   4. No catch do POST: apenas race conditions residuais (409).
     *      O 404 do POST nunca deve acontecer porque o passo 2 garantiu
     *      que o nick existe. Se acontecer por alguma razão extrema
     *      (nick apagado entre o GET e o POST), tratar silenciosamente.
     */
    const handleSendInvite = async () => {
        const nick = inviteNick.trim();
        if (!nick) return;

        // Passo 1 — validação local (sem custo de rede)
        const existingRelation = friends.find(
            f => f.nick.toLowerCase() === nick.toLowerCase()
        );
        if (existingRelation) {
            const message =
                existingRelation.status === "accepted"
                    ? "Este utilizador já é teu amigo."
                    : "Já existe um pedido de amizade pendente com este utilizador.";
            setModalMessage(message);
            return;
        }

        setIsInviting(true);
        try {
            // Passo 2 — verificar existência do nick (sempre HTTP 200)
            const existsRes = await friendApi.checkNickExists(nick);
            if (!existsRes.data.exists) {
                setModalMessage("Não foi encontrado nenhum utilizador com esse nickname.");
                return;
            }

            // Passo 3 — nick existe e não há relação: enviar pedido
            await friendApi.sendRequest(nick);
            await silentRefresh();
            setInviteNick("");

        } catch (error: any) {
            // Passo 4 — tratamento de race conditions residuais.
            // Neste ponto o único erro esperado é 409 (pedido já existente
            // criado por outro cliente entre o passo 2 e o passo 3).
            // Um 404 aqui seria uma situação extrema (nick apagado em ms),
            // tratada silenciosamente para não quebrar o UX.
            const status = error?.response?.status;
            if (status === 409) {
                await silentRefresh();
                setModalMessage("Já existe um pedido de amizade pendente com este utilizador.");
            } else {
                // Erro de rede ou outro inesperado — refresh silencioso
                await silentRefresh();
            }
            // Nenhum caminho chega a console.error
        } finally {
            setIsInviting(false);
        }
    };

    /**
     * Aceitar pedido.
     * Padrão: fetch fresco → verificar → executar.
     */
    const handleAccept = async (id: string) => {
        setActionLoadingId(id);
        try {
            const freshMap = await silentRefresh();
            if (freshMap.get(id) !== "received_request") return;
            await friendApi.acceptRequest(id);
            setFriends(prev =>
                prev.map(f => f.id === id ? { ...f, status: "accepted" } : f)
            );
        } catch (error: any) {
            if (
                error?.response?.status === 404 ||
                error?.response?.status === 409
            ) {
                await silentRefresh();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    /**
     * Rejeitar pedido.
     * Padrão: fetch fresco → verificar → executar.
     */
    const handleReject = async (id: string) => {
        setActionLoadingId(id);
        try {
            const freshMap = await silentRefresh();
            if (freshMap.get(id) !== "received_request") return;
            await friendApi.rejectRequest(id);
            setFriends(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
            if (
                error?.response?.status === 404 ||
                error?.response?.status === 409
            ) {
                await silentRefresh();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    /**
     * Cancelar pedido enviado.
     * Padrão: fetch fresco → verificar → executar.
     */
    const handleCancel = async (id: string) => {
        setActionLoadingId(id);
        try {
            const freshMap = await silentRefresh();
            if (freshMap.get(id) !== "sent_request") return;
            await friendApi.cancelRequest(id);
            setFriends(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
            if (
                error?.response?.status === 404 ||
                error?.response?.status === 409
            ) {
                await silentRefresh();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    /**
     * Remover amigo.
     * Padrão: fetch fresco → verificar → executar.
     */
    const handleRemove = async (id: string) => {
        setActionLoadingId(id);
        try {
            const freshMap = await silentRefresh();
            if (freshMap.get(id) !== "accepted") return;
            await friendApi.removeFriend(id);
            setFriends(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
            if (
                error?.response?.status === 404 ||
                error?.response?.status === 409
            ) {
                await silentRefresh();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <>
            {modalMessage !== null && (
                <InfoModal
                    message={modalMessage}
                    onClose={() => setModalMessage(null)}
                />
            )}

            <div className="space-y-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    FriendList
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
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-surface/40 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background/60"
                        />
                    </div>

                    {/* Enviar Convite */}
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <input
                            type="text"
                            placeholder="Nick do utilizador"
                            value={inviteNick}
                            onChange={e => setInviteNick(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSendInvite()}
                            className="w-full rounded-xl border border-border/60 bg-surface/40 py-2 px-3 text-sm outline-none transition-colors focus:border-primary/50 focus:bg-background/60 sm:w-48"
                        />
                        <button
                            onClick={handleSendInvite}
                            disabled={isInviting || !inviteNick.trim()}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {isInviting
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <UserPlus className="h-4 w-4" />
                            }
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
                            filteredAndSortedFriends.map(friend => (
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
                                                to={`/user/${friend.nick}`}
                                                className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors block"
                                            >
                                                {friend.nick}
                                            </Link>

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
                                        {actionLoadingId === friend.id ? (
                                            <div className="grid h-8 w-8 place-items-center text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
