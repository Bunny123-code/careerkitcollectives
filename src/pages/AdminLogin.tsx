import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { LockKeyhole, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Admin Sign In – CareerKit Collectives";
    setMeta("robots", "noindex, nofollow");
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setCheckingSession(false);
      if (currentSession) navigate("/admin", { replace: true });
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("The email or password is incorrect.");
      setSubmitting(false);
      return;
    }

    navigate("/admin", { replace: true });
  };

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Checking access…</div>;
  }

  if (session) return <Navigate to="/admin" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/50 px-4 py-12">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elevated sm:p-8" aria-labelledby="admin-login-title">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 id="admin-login-title" className="text-2xl font-bold text-primary">Admin Sign In</h1>
            <p className="mt-1 text-sm text-muted-foreground">CareerKit Collectives product management</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Sign In
          </Button>
        </form>
      </section>
    </main>
  );
};

export default AdminLogin;
