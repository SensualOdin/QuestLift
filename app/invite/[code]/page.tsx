"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { joinPartyByCode } from "@/lib/supabase/data-hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Loader2, CheckCircle2, XCircle, Sword } from "lucide-react"
import { motion } from "framer-motion"

export default function InvitePage() {
    const params = useParams()
    const router = useRouter()
    const joinCode = params.code as string

    const [status, setStatus] = useState<"loading" | "joining" | "success" | "error" | "redirect">("loading")
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        const handleInvite = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Save invite code and redirect to login
                localStorage.setItem("pendingInvite", joinCode)
                setStatus("redirect")
                router.push(`/login?next=/invite/${joinCode}`)
                return
            }

            // User is logged in — attempt to join
            setStatus("joining")
            const result = await joinPartyByCode(session.user.id, joinCode)

            if (result.success) {
                setStatus("success")
                setTimeout(() => router.push("/dashboard/party"), 2000)
            } else {
                setStatus("error")
                setErrorMsg(result.error || "Failed to join party.")
            }
        }

        handleInvite()
    }, [joinCode, router])

    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm relative z-10"
            >
                <Card className="border-slate-800/60 bg-slate-900/80 backdrop-blur-xl">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
                            <Sword className="w-8 h-8 text-indigo-400 relative z-10" />
                        </div>

                        <h1 className="text-2xl font-black text-white tracking-tight">QuestLift</h1>

                        {status === "loading" || status === "redirect" ? (
                            <>
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                <p className="text-slate-400 text-sm">
                                    {status === "redirect" ? "Redirecting to login..." : "Processing invite..."}
                                </p>
                            </>
                        ) : status === "joining" ? (
                            <>
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                <p className="text-slate-400 text-sm">Joining party...</p>
                            </>
                        ) : status === "success" ? (
                            <>
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                <h2 className="text-lg font-bold text-white">You joined the party!</h2>
                                <p className="text-slate-400 text-sm">Redirecting to your party page...</p>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-10 h-10 text-red-400" />
                                <h2 className="text-lg font-bold text-white">Could not join</h2>
                                <p className="text-slate-400 text-sm">{errorMsg}</p>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="secondary"
                                        className="bg-slate-800 text-white hover:bg-slate-700"
                                        onClick={() => router.push("/dashboard/party")}
                                    >
                                        <Users className="w-4 h-4 mr-2" /> Go to Party
                                    </Button>
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => {
                                            setStatus("loading")
                                            setErrorMsg("")
                                            router.refresh()
                                        }}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
