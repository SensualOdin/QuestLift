"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, BookOpen, Clock, Users, ShieldAlert, Trophy } from "lucide-react"
import { motion } from "framer-motion"

export function MainNav() {
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", label: "Inn", icon: Home },
        { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
        { href: "/dashboard/exercises", label: "Library", icon: BookOpen },
        { href: "/dashboard/history", label: "History", icon: Clock },
        { href: "/dashboard/achievements", label: "Trophies", icon: Trophy },
        { href: "/dashboard/party", label: "Party", icon: Users },
        { href: "/dashboard/raid", label: "Raid", icon: ShieldAlert },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/60 pb-safe sm:relative sm:border-t-0 sm:border-b sm:bg-transparent sm:backdrop-blur-none sm:pb-0 sm:mb-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex justify-around sm:justify-start sm:gap-6 py-3 sm:py-0">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 sm:py-4 px-2 sm:px-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{item.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -top-3 sm:-bottom-[1px] sm:top-auto left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 w-1 sm:w-full h-1 sm:h-[2px] bg-indigo-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
