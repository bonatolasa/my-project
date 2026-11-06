"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message ?? "Unable to create account");
      router.push("/dashboard"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? (reason.name === "TypeError" ? "Could not reach the sign-up service. Check that the API and database are running, then try again." : reason.message) : "Unable to create account"); }
    finally { setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-5 py-12 text-[#142033]">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-blue-700">
          Virtual Phone
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create an account to start managing virtual numbers.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" /></label>
          <label className="block text-sm font-medium">Password<input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-blue-600" /><span className="mt-1 block text-xs text-slate-500">Use at least 8 characters.</span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/>or sign up with<span className="h-px flex-1 bg-slate-200"/></div>
        <a href="/api/auth/google" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"><span className="font-bold text-lg text-blue-600">G</span>Continue with Google</a>
        <p className="mt-5 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-blue-700">Sign in</Link></p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          Return to home
        </Link>
      </section>
    </main>
  );
}
