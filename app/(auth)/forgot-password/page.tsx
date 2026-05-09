"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { requestPasswordReset, resetPasswordWithCode, validateResetCode } from "@/app/actions/auth-security"
import { ArrowLeft, Loader2, Mail, Lock, KeyRound, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const router = useRouter()

    // States: 'request' | 'verify' | 'reset' | 'success'
    const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request')

    // Form data
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // UI states
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Step 1: Request Password Reset
    async function handleRequestReset(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await requestPasswordReset(email)

            if (result.success) {
                setStep('verify')
            } else {
                setError(result.message || "Error al solicitar el código")
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Validate Code
    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault()
        if (code.length < 6) {
            setError("El código debe tener 6 dígitos")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await validateResetCode(email, code)

            if (result.success) {
                setStep('reset')
            } else {
                setError(result.error || "Código inválido o expirado")
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Reset Password
    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden")
            return
        }

        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await resetPasswordWithCode(email, code, newPassword)

            if (result.success) {
                setStep('success')
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            } else {
                setError(result.error || "Error al restablecer la contraseña")
            }
        } catch (err) {
            setError("Ocurrió un error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xl p-8 space-y-6 relative overflow-hidden">

                    {/* Back Button */}
                    {step !== 'success' && (
                        <Link
                            href="/login"
                            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}

                    {/* Header */}
                    <div className="text-center space-y-3 pt-4">
                        <div className="flex justify-center">
                            <div className={`p-3 rounded-full ${step === 'success' ? 'bg-green-100' : 'bg-blue-50'}`}>
                                {step === 'request' && <KeyRound className="w-8 h-8 text-blue-600" />}
                                {step === 'verify' && <Lock className="w-8 h-8 text-blue-600" />}
                                {step === 'reset' && <Lock className="w-8 h-8 text-blue-600" />}
                                {step === 'success' && <CheckCircle2 className="w-8 h-8 text-green-600" />}
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800">
                            {step === 'request' && "¿Olvidaste tu contraseña?"}
                            {step === 'verify' && "Verifica tu código"}
                            {step === 'reset' && "Nueva contraseña"}
                            {step === 'success' && "¡Contraseña actualizada!"}
                        </h1>

                        <p className="text-gray-600 text-sm px-4">
                            {step === 'request' && "Ingresa tu correo electrónico y te enviaremos un código para restablecerla."}
                            {step === 'verify' && `Hemos enviado un código a ${email}. Introdúcelo para continuar.`}
                            {step === 'reset' && "Ingresa tu nueva contraseña para acceder a tu cuenta."}
                            {step === 'success' && "Tu contraseña ha sido modificada exitosamente. Redirigiendo al login..."}
                        </p>
                    </div>



                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {/* STEP 1: Request Form */}
                    {step === 'request' && (
                        <form onSubmit={handleRequestReset} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="email">
                                    <Mail className="w-4 h-4" />
                                    Correo electrónico
                                </label>
                                <div className="relative group">
                                    <input
                                        id="email"
                                        type="email"
                                        className="peer w-full rounded-xl border-2 border-gray-300 px-4 py-3 pl-12 text-sm transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-400 placeholder:text-gray-400"
                                        placeholder="tu@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 py-3 font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar código"}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: Verify Code Form */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyCode} className="space-y-5">
                            {/* Code Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Código de verificación</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    className="w-full text-center text-2xl tracking-widest font-mono rounded-xl border-2 border-gray-300 px-4 py-3 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Only numbers
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 py-3 font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar código"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('request')}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2"
                                disabled={loading}
                            >
                                ¿No recibiste el código? Intentar de nuevo
                            </button>
                        </form>
                    )}

                    {/* STEP 3: Reset Password Form */}
                    {step === 'reset' && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Nueva contraseña</label>
                                <input
                                    type="password"
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                    placeholder="Repite la contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 py-3 font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Restablecer contraseña"}
                            </button>
                        </form>
                    )}

                    {/* Footer for Success Step (or hidden) */}
                    {step === 'success' && (
                        <div className="text-center pt-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 text-blue-600 font-medium hover:underline"
                            >
                                Ir al inicio de sesión ahora
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
