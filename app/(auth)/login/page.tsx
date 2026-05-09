"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Shield,
  User
} from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/"
    })
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/" })
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-50 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido de nuevo</h1>
            <p className="text-gray-600 text-sm">
              Inicia sesión para acceder a tu cuenta
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="group relative w-full inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-gray-300 hover:border-red-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-white text-gray-700 hover:bg-gray-50 h-12 px-6 py-3"
          >
            <div className="absolute left-4">
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
            </div>
            <span className="font-semibold">
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
              O continúa con email
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="email">
                <Mail className="w-4 h-4" />
                Correo electrónico
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="peer w-full rounded-xl border-2 border-gray-300 px-4 py-3 pl-12 text-sm transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 placeholder:text-gray-400"
                  placeholder="tu@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="password">
                  <Lock className="w-4 h-4" />
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="peer w-full rounded-xl border-2 border-gray-300 px-4 py-3 pl-12 text-sm transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Recordarme en este dispositivo
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] h-12 px-6 py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-3">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Tus datos están protegidos</span>
            </div>
            <p className="text-center text-xs text-gray-500">
              ¿No tienes una cuenta?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}