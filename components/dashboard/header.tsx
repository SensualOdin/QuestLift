"use client"
import { useState } from "react"
import { Bell, Flame, Settings, LogOut, User, Activity, Trophy, X, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserStore } from "@/lib/store/user-store"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Header() {
    const { user, refreshProfile } = useUserStore()
    const router = useRouter()
    const supabase = createClient()

    const [hasNotifications, setHasNotifications] = useState(true)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

    // Profile Edit State
    const [editName, setEditName] = useState(user?.display_name || "")
    const [isSaving, setIsSaving] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const clearNotifications = () => {
        setHasNotifications(false)
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setIsSaving(true)
        const { error } = await supabase
            .from('users')
            .update({ display_name: editName })
            .eq('id', user.id)

        if (!error) {
            await refreshProfile()
            setIsProfileOpen(false)
        }
        setIsSaving(false)
    }

    return (
        <>
            <header className="flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-800/60 gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
                        <span className="sm:hidden">QuestLift</span>
                        <span className="hidden sm:inline">Inn / <span className="text-indigo-400">Dashboard</span></span>
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-base truncate">Welcome back, {user?.display_name || 'Adventurer'}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 bg-slate-900/50 p-1.5 sm:p-2 rounded-2xl border border-slate-800/80 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-amber-500/10 text-amber-400 rounded-xl font-medium text-xs sm:text-sm border border-amber-500/20">
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{user?.iron_scraps || 0}</span>
                    </div>

                    {/* Notifications Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl relative">
                                <Bell className="w-5 h-5" />
                                {hasNotifications && <span className="absolute top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-slate-950 border-slate-800 p-0 mr-4 mt-2" align="end">
                            <div className="p-4 border-b border-slate-800/60 pb-3 relative overflow-hidden flex justify-between items-center">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none" />
                                <h4 className="font-semibold text-white relative z-10 flex items-center gap-2">
                                    Notifications {hasNotifications && <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">New</span>}
                                </h4>
                                {hasNotifications && (
                                    <Button variant="ghost" size="sm" onClick={clearNotifications} className="h-6 px-2 text-xs text-slate-400 hover:text-white relative z-10">
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {hasNotifications ? (
                                    <>
                                        <div className="p-4 border-b border-slate-800/40 hover:bg-slate-900/50 transition-colors flex gap-3 cursor-pointer">
                                            <div className="mt-1 p-2 h-fit bg-indigo-500/20 rounded-full text-indigo-400 border border-indigo-500/30">
                                                <Trophy className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">Welcome to QuestLift</p>
                                                <p className="text-xs text-slate-400 mt-1">Visit your workout logger to start gaining XP.</p>
                                                <p className="text-[10px] text-slate-500 mt-2">Just now</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <Bell className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                        <p className="text-sm">You are all caught up.</p>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Settings Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-slate-950 border-slate-800 text-slate-300" align="end" sideOffset={12}>
                            <DropdownMenuLabel className="font-bold text-white uppercase tracking-wider text-xs">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-800/60" />
                            <DropdownMenuItem className="focus:bg-slate-900 focus:text-white cursor-pointer" onSelect={() => setIsProfileOpen(true)}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Edit Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-slate-900 focus:text-white cursor-pointer" onSelect={() => setIsPreferencesOpen(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Preferences</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-800/60" />
                            <DropdownMenuItem className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Disconnect</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Edit Profile Modal */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-400">Display Name</Label>
                            <Input
                                id="name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-slate-900 border-slate-800 focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                        <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preferences Modal */}
            <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
                <DialogContent className="bg-slate-950 border-slate-800 text-slate-200">
                    <DialogHeader>
                        <DialogTitle>Preferences</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Push Notifications</h4>
                                <p className="text-xs text-slate-500">Receive alerts when Raid Bosses spawn.</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-400 hover:text-white pointer-events-none">
                                Enabled
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Theme</h4>
                                <p className="text-xs text-slate-500">The iron is always dark.</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-slate-900 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 pointer-events-none">
                                Dark Mode
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsPreferencesOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
