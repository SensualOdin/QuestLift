"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Users, ShoppingBag, Package, GitBranch, Swords, Flame } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/lib/utils/motion"

export function MainNav() {
    const pathname = usePathname()
    const reducedMotion = useReducedMotion()

    const navItems = [
        { href: "/dashboard", label: "Inn", icon: Home },
        { href: "/dashboard/workout", label: "Workout", icon: Dumbbell },
        { href: "/dashboard/wod", label: "WOD", icon: Flame },
        { href: "/dashboard/inventory", label: "Gear", icon: Package },
        { href: "/dashboard/skills", label: "Skills", icon: GitBranch },
        { href: "/dashboard/shop", label: "Shop", icon: ShoppingBag },
        { href: "/dashboard/raid", label: "Raid", icon: Swords },
        { href: "/dashboard/party", label: "Party", icon: Users },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 sm:relative sm:border-t-0 sm:border-b sm:bg-transparent sm:backdrop-blur-none sm:mb-8">
            <div className="max-w-6xl mx-auto px-2 sm:px-4">
                <div className="flex justify-around sm:justify-start sm:gap-6 pt-2 pb-safe sm:py-0">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 sm:py-4 px-1.5 sm:px-4 py-2.5 min-w-[44px] min-h-[44px] transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 active:text-slate-300'}`}
                            >
                                <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="text-[11px] sm:text-xs font-semibold tracking-wide">{item.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId={reducedMotion ? undefined : "nav-indicator"}
                                        className="absolute -top-2 sm:-bottom-[1px] sm:top-auto left-1/2 sm:left-0 -translate-x-1/2 sm:translate-x-0 w-6 sm:w-full h-0.5 sm:h-[2px] bg-indigo-500 rounded-full"
                                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
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
