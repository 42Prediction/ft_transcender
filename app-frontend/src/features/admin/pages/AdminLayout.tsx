import { Outlet } from "react-router-dom";

export default function AdminLayout() {
    return (
        <div className="dark min-h-screen bg-background text-foreground">
            <main className="mx-auto max-w-[1400px] px-6 py-8">
                <Outlet />
            </main>
        </div>
    );
}