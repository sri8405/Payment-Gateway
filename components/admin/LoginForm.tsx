"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false
      });

      console.log("[login] signIn result:", result);

      if (!result) {
        console.warn("[login] signIn returned no result");
        setError("Sign in failed. Please try again.");
        setLoading(false);
        return;
      }

      if (result.error) {
        console.warn("[login] signIn error:", result.error);
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      // Treat any non-error response as successful authentication.
      console.log("[login] authentication successful, redirecting to dashboard");
      // Use replace so history doesn't keep the login page, and refresh to update server-side state.
      await router.replace("/admin/dashboard");
      try {
        router.refresh();
      } finally {
        // Clear loading in case navigation doesn't unmount this component immediately.
        setLoading(false);
      }
    } catch (err) {
      console.error("[login] exception:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
    </form>
  );
}
