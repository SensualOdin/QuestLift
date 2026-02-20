import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy, Skull, Crown } from "lucide-react"

export function RoastReport() {
    return (
        <Card className="border-orange-500/30 bg-orange-950/20 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500" />
            <CardHeader className="pb-4 border-b border-orange-500/20">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-orange-400">
                    <Flame className="w-5 h-5" />
                    The Roast Report
                </CardTitle>
                <p className="text-xs text-orange-500/70 font-medium">Week of Feb 9 - 15</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* MVP */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-yellow-500/30 relative">
                    <Crown className="w-6 h-6 text-yellow-500 absolute -top-3 -right-2 transform rotate-12" />
                    <h4 className="text-xs uppercase tracking-widest font-bold text-yellow-500 mb-2">The MVP (Highest XP)</h4>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">Sam</span>
                        <span className="font-mono text-yellow-400">1,450 XP</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">Carrying the party on their shoulders. Again.</p>
                </div>

                {/* PR Alert */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/30">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-indigo-400 mb-2 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Notable Feats
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="font-bold text-slate-200 block">Alex</span>
                                <span className="text-xs text-slate-400">Bench Press PR</span>
                            </div>
                            <span className="font-mono text-indigo-300 font-bold px-2 py-0.5 bg-indigo-500/20 rounded border border-indigo-500/30">
                                225 lbs
                            </span>
                        </div>
                    </div>
                </div>

                {/* The Slacker */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-red-500/30 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <Skull className="w-24 h-24 text-red-500" />
                    </div>
                    <h4 className="text-xs uppercase tracking-widest font-bold text-red-400 mb-2">Resting at the Inn</h4>
                    <div className="flex justify-between items-center relative z-10">
                        <span className="font-bold text-slate-200">Jordan</span>
                        <span className="font-mono text-red-400">1 Workout</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic relative z-10">The iron is getting cold, Jordan.</p>
                </div>
            </CardContent>
        </Card>
    )
}
