import { useState } from "react";
import { Form, useActionData } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
    const actionData = useActionData() as { error?: string } | undefined;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <div className="p-4">
                <Button
                    variant="secondary"
                    onClick={() => (window.location.href = "/")}
                    className="h-auto gap-1 rounded-md px-4 py-2 text-sm font-semibold"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Go back
                </Button>
            </div>
        <div className="grid h-screen place-items-center overflow-hidden bg-background px-4 text-foreground">
            <Form method="post" className="w-full max-w-xs space-y-4">
                <h1 className="text-2xl font-bold">Admin Login</h1>

                {actionData?.error && (
                    <p className="rounded-md bg-red-500/10 p-2 text-sm text-red-500">
                        {actionData.error}
                    </p>
                )}

                <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full rounded-md py-2"
                />

                <div className="relative">
                    <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full rounded-md py-2 pr-10"
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

                <Button
                    type="submit"
                    className="h-auto w-full rounded-md px-4 py-2 text-sm font-semibold"
                >
                    Login
                </Button>
            </Form>


        </div>
        </>
    );
}