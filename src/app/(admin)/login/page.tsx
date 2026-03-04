import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-brown mb-2">
            Binocles de la Save
          </h1>
          <p className="text-brown/50 text-sm">Espace administrateur</p>
        </div>

        {/* Login Form */}
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
              <div className="h-10 bg-beige/50 rounded-xl" />
              <div className="h-10 bg-beige/50 rounded-xl" />
              <div className="h-12 bg-brown/20 rounded-xl" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="text-center text-brown/30 text-xs mt-6">
          Accès réservé aux administrateurs
        </p>
      </div>
    </div>
  );
}
