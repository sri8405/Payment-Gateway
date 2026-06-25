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
      // Attempt client helper first, but fall back to a manual credentials POST
      let result: any = null;
      try {
        result = await Promise.race([
          signIn("credentials", {
            username: String(formData.get("username") ?? ""),
            password: String(formData.get("password") ?? ""),
            redirect: false
          }),
          // timeout after 3s so we can fallback to manual POST if signIn hangs
          new Promise((res) => setTimeout(() => res(null), 3000))
        ]);
      } catch (e) {
        console.warn("[login] signIn threw:", e);
      }

      console.log("[login] signIn result:", result);

      if (!result) {
        // signIn helper didn't respond; try manual CSRF + credentials POST
        try {
          const csrfResp = await fetch("/api/auth/csrf");
          const csrfJson = await csrfResp.json();
          const csrfToken = csrfJson?.csrfToken;

          const body = new URLSearchParams();
          body.set("csrfToken", csrfToken ?? "");
          body.set("username", String(formData.get("username") ?? ""));
          body.set("password", String(formData.get("password") ?? ""));

          const resp = await fetch("/api/auth/callback/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString()
          });

          // If the credentials flow returns a redirect, follow it via location
          if (resp.redirected) {
            console.log("[login] manual POST redirected to", resp.url);
          }

          const text = await resp.text();
          console.log("[login] manual POST response status", resp.status);
          // treat 200 as success
          if (resp.status === 200) {
            result = { ok: true };
          } else {
            result = { error: "invalid" };
          }
        } catch (err) {
          console.error("[login] manual sign-in failed:", err);
          result = { error: "exception" };
        }
      }

      if (result?.error) {
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
