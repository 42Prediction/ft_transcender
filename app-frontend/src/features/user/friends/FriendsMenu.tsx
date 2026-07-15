import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, Loader2, Search, UserMinus, UserPlus, Users, X } from "lucide-react";
import { friendApi, type BettorSearchResult } from "@/api/bettor/friend.api";

type FriendStatus = "accepted" | "received_request" | "sent_request";

interface FriendData {
    id: string;
    nick: string;
    avatar?: string | null;
    status: FriendStatus;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

function buildFriendMap(friends: FriendData[]): Map<string, FriendStatus> {
    const map = new Map<string, FriendStatus>();
    friends.forEach(f => map.set(f.id, f.status));
    return map;
}

function Avatar({ nick, avatar }: { nick: string; avatar?: string | null }) {
    if (avatar) {
        return <img src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
    }
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand font-medium text-white shadow-glow">
            {nick.charAt(0).toUpperCase()}
        </div>
    );
}

export function FriendsMenu() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    const [friends, setFriends] = useState<FriendData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [platformResults, setPlatformResults] = useState<BettorSearchResult[]>([]);
    const [searching, setSearching] = useState(false);

    const fetchFriendsData = useCallback(async (): Promise<Map<string, FriendStatus>> => {
        const [friendsRes, receivedRes, sentRes] = await Promise.all([
            friendApi.getFriends(),
            friendApi.getReceivedRequests(),
            friendApi.getSentRequests(),
        ]);

        const friendsArray = friendsRes.data?.data || [];
        const receivedArray = receivedRes.data?.data || [];
        const sentArray = sentRes.data?.data || [];

        const merged: FriendData[] = [
            ...friendsArray.map((f: any) => ({
                id: f.id, nick: f.nick, avatar: f.avatar, status: "accepted" as FriendStatus,
            })),
            ...receivedArray.map((req: any) => ({
                id: req.sender.id, nick: req.sender.nick, avatar: req.sender.avatar,
                status: "received_request" as FriendStatus,
            })),
            ...sentArray.map((req: any) => ({
                id: req.receiver.id, nick: req.receiver.nick, avatar: req.receiver.avatar,
                status: "sent_request" as FriendStatus,
            })),
        ];
        setFriends(merged);
        return buildFriendMap(merged);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchFriendsData()
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [fetchFriendsData]);

    const silentRefresh = useCallback(async (): Promise<Map<string, FriendStatus>> => {
        try {
            return await fetchFriendsData();
        } catch {
            return new Map();
        }
    }, [fetchFriendsData]);

    useEffect(() => {
        if (open) void silentRefresh();
        else {
            setQuery("");
            setPlatformResults([]);
            setMessage(null);
        }
    }, [open, silentRefresh]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const q = query.trim();
        if (q.length < MIN_QUERY_LENGTH) {
            setPlatformResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const res = await friendApi.searchBettors(q);
                if (!cancelled) setPlatformResults(res.data?.data || []);
            } catch {
                if (!cancelled) setPlatformResults([]);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, DEBOUNCE_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const pendingReceived = useMemo(
        () => friends.filter(f => f.status === "received_request").length,
        [friends],
    );

    const filteredFriends = useMemo(() => {
        const q = query.trim().toLowerCase();
        const result = q ? friends.filter(f => f.nick.toLowerCase().includes(q)) : [...friends];
        result.sort((a, b) => {
            const aIsPending = a.status !== "accepted";
            const bIsPending = b.status !== "accepted";
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;
            return a.nick.localeCompare(b.nick);
        });
        return result;
    }, [friends, query]);

    const addableResults = useMemo(() => {
        const known = new Set(friends.map(f => f.nick.toLowerCase()));
        return platformResults.filter(b => !known.has(b.nick.toLowerCase()));
    }, [platformResults, friends]);

    const handleInvite = async (nick: string) => {
        setActionLoadingId(nick);
        try {
            await friendApi.sendRequest(nick);
            await silentRefresh();
        } catch (error: any) {
            await silentRefresh();
            if (error?.response?.status === 409) {
                setMessage("There is already a pending friend request with this user.");
            } else {
                setMessage("Could not send the friend request. Try again.");
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const doAction = async (
        id: string,
        expected: FriendStatus,
        action: (id: string) => Promise<unknown>,
        onSuccess: () => void,
    ) => {
        setActionLoadingId(id);
        try {
            const freshMap = await silentRefresh();
            if (freshMap.get(id) !== expected) return;
            await action(id);
            onSuccess();
        } catch (error: any) {
            if (error?.response?.status === 404 || error?.response?.status === 409) {
                await silentRefresh();
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleAccept = (id: string) =>
        doAction(id, "received_request", friendApi.acceptRequest, () =>
            setFriends(prev => prev.map(f => (f.id === id ? { ...f, status: "accepted" } : f))));
    const handleReject = (id: string) =>
        doAction(id, "received_request", friendApi.rejectRequest, () =>
            setFriends(prev => prev.filter(f => f.id !== id)));
    const handleCancel = (id: string) =>
        doAction(id, "sent_request", friendApi.cancelRequest, () =>
            setFriends(prev => prev.filter(f => f.id !== id)));
    const handleRemove = (id: string) =>
        doAction(id, "accepted", friendApi.removeFriend, () =>
            setFriends(prev => prev.filter(f => f.id !== id)));

    const showPlatformSection = query.trim().length >= MIN_QUERY_LENGTH;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen(!open)}
                aria-label="Friends"
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-surface text-muted-foreground transition hover:text-foreground"
            >
                <Users className="h-4 w-4" />
                {pendingReceived > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground shadow-glow">
                        {pendingReceived}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-x-3 top-20 z-50 origin-top-right rounded-xl border border-border/60 bg-background p-3 shadow-xl backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[380px]">
                    <div className="mb-3 flex items-center justify-between px-1">
                        <h3 className="font-display text-sm font-semibold">Friends</h3>
                        {pendingReceived > 0 && (
                            <span className="font-mono text-[11px] text-primary">
                                {pendingReceived} pending request{pendingReceived > 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search or add friends…"
                            autoComplete="off"
                            className="h-10 w-full rounded-xl border border-border/60 bg-surface pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                        />
                    </div>

                    {message && (
                        <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
                            <span>{message}</span>
                            <button onClick={() => setMessage(null)} aria-label="Dismiss" className="shrink-0 text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {filteredFriends.length === 0 && !showPlatformSection && (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No friends yet. Search a nick to add one.
                                    </div>
                                )}

                                {filteredFriends.map(friend => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center justify-between rounded-xl border border-transparent bg-surface/40 px-3 py-2 transition-colors hover:border-border/60"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar nick={friend.nick} avatar={friend.avatar} />
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/user/${friend.nick}`}
                                                    onClick={() => setOpen(false)}
                                                    className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                                >
                                                    {friend.nick}
                                                </Link>
                                                {friend.status === "received_request" && (
                                                    <p className="mt-0.5 text-xs text-primary">Request received</p>
                                                )}
                                                {friend.status === "sent_request" && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" /> Pending
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-1.5">
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
                                                                title="Accept Request"
                                                                className="grid h-8 w-8 place-items-center rounded-lg bg-green-500/10 text-green-500 transition-colors hover:bg-green-500/20"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(friend.id)}
                                                                title="Reject Request"
                                                                className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {friend.status === "sent_request" && (
                                                        <button
                                                            onClick={() => handleCancel(friend.id)}
                                                            title="Cancel Request"
                                                            className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {friend.status === "accepted" && (
                                                        <button
                                                            onClick={() => handleRemove(friend.id)}
                                                            title="Remove Friend"
                                                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-red-400"
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {showPlatformSection && (
                                    <>
                                        <div className="px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                            On platform
                                        </div>
                                        {searching && addableResults.length === 0 ? (
                                            <div className="px-3 py-3 text-center text-xs text-muted-foreground">Searching…</div>
                                        ) : addableResults.length === 0 ? (
                                            <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                                                No other bettors found.
                                            </div>
                                        ) : (
                                            addableResults.map(bettor => (
                                                <div
                                                    key={bettor.id}
                                                    className="flex items-center justify-between rounded-xl border border-transparent bg-surface/40 px-3 py-2 transition-colors hover:border-border/60"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar nick={bettor.nick} avatar={bettor.avatar} />
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/user/${bettor.nick}`}
                                                                onClick={() => setOpen(false)}
                                                                className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary hover:underline"
                                                            >
                                                                {bettor.nick}
                                                            </Link>
                                                            {bettor.campus && (
                                                                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                                                    {bettor.campus}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0">
                                                        {actionLoadingId === bettor.nick ? (
                                                            <div className="grid h-8 w-8 place-items-center text-muted-foreground">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleInvite(bettor.nick)}
                                                                title="Send Friend Request"
                                                                className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
