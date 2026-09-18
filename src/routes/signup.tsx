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

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? (s["next"] as string) : undefined,
    cbm: num(s["cbm"]),
    kg: num(s["kg"]),
  }),
  head: () => ({
    meta: [
      { title: "Create an account — ABL Shipping" },
      { name: "description", content: "Open an ABL Shipping account to hold space on direct sailings from Yantian and Shanghai to Bridgetown." },
      { property: "og:title", content: "Create an ABL Shipping account" },
      { property: "og:description", content: "Hold space on direct LCL sailings to Bridgetown." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const sailingId = parseBookNext(search.next);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("Barbados");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function onward() {
    if (sailingId) {
      navigate({
        to: "/app/book/$sailingId",
        params: { sailingId },
        search: { cbm: search.cbm, kg: search.kg },
      });
      return;
    }
    navigate({ to: "/app/sailings" });
  }

  const redirectTo = () => {
    const url = new URL(window.location.href);
    return `${url.origin}${sailingId ? `/app/book/${sailingId}${url.search.replace(/(^|[?&])next=[^&]*/, "").replace(/^&/, "?")}` : "/app/sailings"}`;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo(),
        data: { name, company_name: company, country },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) { onward(); return; }
    setSent(true);
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
          {sent ? (
            <>
              <h1 className="text-2xl font-extrabold">Check your email</h1>
              <p className="mt-2 text-sm text-secondary-foreground">
                We sent a confirmation link to {email}. Click it and you'll land back on your sailing with your volume
                still selected.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">Create your account</h1>
              <p className="mt-1 text-sm text-secondary-foreground">
                {sailingId ? "Your sailing and volume are saved — finish this and pick up where you left off." : "Reserve space on the next sailing to Bridgetown."}
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" required className="mt-2" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" required className="mt-2" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required className="mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={8} className="mt-2" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
              <Button variant="outline" className="mt-3 w-full" onClick={google}>
                Continue with Google
              </Button>
              <p className="mt-6 text-center text-sm text-secondary-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  search={{ next: search.next, cbm: search.cbm, kg: search.kg }}
                  className="font-semibold text-primary"
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
