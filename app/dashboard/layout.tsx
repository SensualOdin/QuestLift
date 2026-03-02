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
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
            >
                Skip to main content
            </a>
            <EmberBackground />
            <div className="w-full relative z-10 flex flex-col min-h-screen">
                <div className="mx-auto w-full max-w-6xl px-3 pt-3 sm:p-4 md:p-8 pb-0 shrink-0">
                    <Header />
                    <MainNav />
                </div>
                <main id="main-content" className="flex-1 pb-28 sm:pb-8">
                    {children}
                </main>
            </div>
        </>
    )
}
