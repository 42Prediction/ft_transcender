import { useEffect, useState } from "react";
import { user as userApi, type UserMe } from "@/api/user/user.api";
import { auth } from "@/api/auth/auth.api";
import { ChevronLeft, Loader2, LogOut, Search, Trash2 } from "lucide-react";
import { Link, useRevalidator, useRouteLoaderData } from "react-router-dom";

export default function UsersPage() {
    const [users, setUsers] = useState<UserMe[]>([]);
    const [filtered, setFiltered] = useState<UserMe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const data = useRouteLoaderData('admin-root') as any;
    const profile = data?.data;

    useEffect(() => {
        userApi.getAll()
            .then((res) => {
                const data = (res.data || []).filter((u: UserMe) => u.role !== "admin");
                setUsers(data);
                setFiltered(data);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(users.filter((u) => u.email.toLowerCase().includes(q)));
    }, [search, users]);

    const handleDelete = async (id: string) => {
        try {
            await userApi.deleteById(id);
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (err) {
        }
    };

    const handleLogout = async () => {
        await auth.signout();
        window.location.href = '/admin/login';
    };

    if (loading) return (
        <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-4">

            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <div>
                        <h1 className="text-lg font-medium text-foreground">Users</h1>
                        <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by email…"
                            className="pl-8 h-8 w-48 md:w-56 rounded-lg border border-border/60 bg-surface text-sm focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <div className="flex items-center gap-2 border-l border-border/60 pl-2">
                        <span className="hidden sm:block text-xs text-muted-foreground">
                            {profile?.email?.split('@')[0]}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* tabela */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-surface border-b border-border/60">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">State</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Created at</th>
                                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((u) => (
                                    <tr key={u.id} className="border-b border-border/40 hover:bg-surface/60 transition-colors">
                                        <td className="px-4 py-2.5 max-w-[180px] truncate" title={u.email}>{u.email}</td>
                                        <td className="px-4 py-2.5 hidden sm:table-cell">
                                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{u.role}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={`rounded-md px-2 py-0.5 text-xs ${u.state ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                                {u.state ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground">
                                            {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}