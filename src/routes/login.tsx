import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { num, parseBookNext } from "@/lib/reserve";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? (s["next"] as string) : undefined,
    cbm: num(s["cbm"]),
    kg: num(s["kg"]),
  }),
  head: () => ({
    meta: [
      { title: "Log in — ABL Shipping" },
      { name: "description", content: "Sign in to manage your ABL Shipping bookings, sailings and documents." },
      { property: "og:title", content: "Log in to ABL Shipping" },
      { property: "og:description", content: "Manage your bookings and sailings." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const sailingId = parseBookNext(search.next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function onward() {
    if (sailingId) {
      navigate({
        to: "/app/book/$sailingId",
        params: { sailingId },
        search: { ...(search.cbm ? { cbm: search.cbm } : {}), ...(search.kg ? { kg: search.kg } : {}) },
      });
      return;
    }
    navigate({ to: "/app/sailings" });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onward();
  }

  async function magicLink() {
    if (!email) { toast.error("Enter your email first"); return; }
    const target = sailingId ? `/app/book/${sailingId}` : "/app/sailings";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${target}` },
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Magic link sent — check your inbox");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (result.redirected) { return; }
    onward();
  }

  return (
    <PublicLayout>
      <div className="wrap flex justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-extrabold">Log in</h1>
          <p className="mt-1 text-sm text-secondary-foreground">
            {sailingId ? "Your sailing and volume are saved — log in and carry on." : "Book space and track cargo to Bridgetown."}
          </p>

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
            <Link
              to="/signup"
              search={{
                ...(search.next ? { next: search.next } : {}),
                ...(search.cbm ? { cbm: search.cbm } : {}),
                ...(search.kg ? { kg: search.kg } : {}),
              }}
              className="font-semibold text-primary"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
