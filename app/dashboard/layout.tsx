import { createServerSupabaseClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { MainNav } from "@/components/dashboard/nav"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (!session || error) {
        redirect('/login')
    }

    return (
        <div className="w-full relative z-10 flex flex-col min-h-screen">
            <div className="mx-auto w-full max-w-6xl p-4 md:p-8 pb-0 shrink-0">
                <Header />
                <MainNav />
            </div>
            <main className="flex-1 pb-24 sm:pb-8">
                {children}
            </main>
        </div>
    )
}
