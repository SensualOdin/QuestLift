"use client"
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sword } from 'lucide-react'

function LoginContent() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isClient, setIsClient] = useState(false)
    const [origin, setOrigin] = useState('')

    const nextPath = searchParams.get('next') || '/dashboard'

    useEffect(() => {
        setIsClient(true)
        setOrigin(window.location.origin)

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.push(nextPath)
            }
        }

        checkUser()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                router.push(nextPath)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    if (!isClient) return null

    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm border border-slate-800/60 bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
                        <Sword className="w-8 h-8 text-indigo-400 relative z-10" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">QuestLift</h1>
                    <p className="text-slate-400 text-sm mt-1 text-center">Your Adventure Awaits</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#6366f1', // Indigo 500
                                    brandAccent: '#4f46e5', // Indigo 600
                                    inputText: 'white',
                                    inputBackground: '#0f172a', // Slate 900
                                    inputBorder: '#1e293b', // Slate 800
                                    defaultButtonBackground: '#1e293b',
                                    defaultButtonBackgroundHover: '#334155'
                                }
                            }
                        },
                        className: {
                            button: 'rounded-xl font-medium tracking-wide',
                            input: 'rounded-xl',
                            label: 'text-slate-400 font-medium text-xs uppercase tracking-wider',
                        }
                    }}
                    theme="dark"
                    providers={['google']}
                    redirectTo={`${origin}/auth/callback${nextPath !== '/dashboard' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                />
            </motion.div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    )
}
