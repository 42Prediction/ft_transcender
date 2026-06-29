import { useState } from "react";
import { Form, useActionData } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
    const actionData = useActionData() as { error?: string } | undefined;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
        
             <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center fo rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground"
            >
                <ChevronLeft className="h-4 w-4" />
                Go back
            </button>
        <div className="grid h-screen place-items-center overflow-hidden bg-background text-foreground">
            <Form method="post" className="w-80 space-y-4">
                <h1 className="text-2xl font-bold">Admin Login</h1>

                {actionData?.error && (
                    <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-500">
                        {actionData.error}
                    </p>
                )}

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full rounded-md border border-border/60 bg-surface px-3 py-2 text-sm"
                />

                <div className="relative">
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full rounded-md border border-border/60 bg-surface px-3 py-2 pr-10 text-sm"
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <button
                    type="submit"
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                    Login
                </button>
            </Form>

           
        </div>
        </>
    );
}