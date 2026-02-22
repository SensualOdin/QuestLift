import { createServerSupabaseClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { MainNav } from "@/components/dashboard/nav"
import { EmberBackground } from "@/components/ui/ember-background"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user || error) {
        redirect('/login')
    }

    return (
        <>
            <EmberBackground />
            <div className="w-full relative z-10 flex flex-col min-h-screen">
                <div className="mx-auto w-full max-w-6xl px-3 pt-3 sm:p-4 md:p-8 pb-0 shrink-0">
                    <Header />
                    <MainNav />
                </div>
                <main className="flex-1 pb-28 sm:pb-8">
                    {children}
                </main>
            </div>
        </>
    )
}
