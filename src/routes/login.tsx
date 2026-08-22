import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — AYBL" },
      { name: "description", content: "Sign in to manage your AYBL bookings, sailings and documents." },
      { property: "og:title", content: "Log in to AYBL" },
      { property: "og:description", content: "Manage your bookings and sailings." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/app/sailings" });
  }

  async function magicLink() {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app/sailings` },
    });
    if (error) return toast.error(error.message);
    toast.success("Magic link sent — check your inbox");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed");
    if (result.redirected) return;
    navigate({ to: "/app/sailings" });
  }

  return (
    <PublicLayout liveBar={false}>
      <div className="wrap flex justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-extrabold">Log in</h1>
          <p className="mt-1 text-sm text-secondary-foreground">Book space and track cargo to Bridgetown.</p>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="mt-2" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Log in"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={magicLink}>
              Email me a magic link
            </Button>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-secondary-foreground">
            No account?{" "}
            <Link to="/signup" className="font-semibold text-primary">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
