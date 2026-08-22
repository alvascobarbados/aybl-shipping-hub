import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create an account — AYBL" },
      { name: "description", content: "Open an AYBL account to hold space on direct sailings from Yantian and Shanghai to Bridgetown." },
      { property: "og:title", content: "Create an AYBL account" },
      { property: "og:description", content: "Hold space on direct LCL sailings to Bridgetown." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, company_name: company },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) { navigate({ to: "/app/sailings" }); return; }
    setSent(true);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (result.redirected) { return; }
    navigate({ to: "/app/sailings" });
  }

  return (
    <PublicLayout liveBar={false}>
      <div className="wrap flex justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-card">
          {sent ? (
            <>
              <h1 className="text-2xl font-extrabold">Check your email</h1>
              <p className="mt-2 text-sm text-secondary-foreground">
                We sent a confirmation link to {email}. Click it to activate your account, then log in.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">Create your account</h1>
              <p className="mt-1 text-sm text-secondary-foreground">Hold space on the next sailing to Bridgetown.</p>
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
                <Link to="/login" className="font-semibold text-primary">
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
