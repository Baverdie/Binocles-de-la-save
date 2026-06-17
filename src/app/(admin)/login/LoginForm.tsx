"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-xs text-brown/50 mb-1.5 ml-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-beige/30 border border-brown/10 rounded-xl px-4 py-3 text-sm text-brown placeholder:text-brown/30 focus:outline-none focus:border-brown/30 transition-colors"
          placeholder="admin@binoclesdelasave.fr"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs text-brown/50 mb-1.5 ml-1"
        >
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-beige/30 border border-brown/10 rounded-xl px-4 py-3 text-sm text-brown placeholder:text-brown/30 focus:outline-none focus:border-brown/30 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-600/80 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brown text-beige py-3 rounded-xl text-sm font-medium hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
