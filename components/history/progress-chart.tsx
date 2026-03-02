"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dumbbell } from "lucide-react"
import { useUserStore } from "@/lib/store/user-store"
import { fetchProgressData } from "@/lib/supabase/data-hooks"
import { Skeleton } from "@/components/ui/skeleton"

export function ProgressChart() {
    const { user } = useUserStore()
    const [chartData, setChartData] = useState<{ date: string, weight: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            if (!user) return
            const data = await fetchProgressData(user.id)
            setChartData(data)
            setLoading(false)
        }
        loadData()
    }, [user])

    if (loading) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl h-fit">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-indigo-400" />
                        1RM Progression
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full bg-slate-800 rounded-lg" />
                </CardContent>
            </Card>
        )
    }

    if (chartData.length === 0) {
        return (
            <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl h-fit">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-indigo-400" />
                        1RM Progression
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                        <div className="text-center">
                            <Dumbbell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                            <p>Log some workouts to see your progression chart.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const currentMax = chartData[chartData.length - 1]?.weight || 0
    const firstWeight = chartData[0]?.weight || 0
    const growth = currentMax - firstWeight

    return (
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl h-fit">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-indigo-400" />
                        1RM Progression
                    </div>
                    <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                        Best Lifts
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={['dataMin - 10', 'dataMax + 10']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderColor: '#1e293b',
                                    borderRadius: '0.5rem',
                                    color: '#f8fafc'
                                }}
                                itemStyle={{ color: '#818cf8' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="#818cf8"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#0f172a', stroke: '#818cf8', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#818cf8' }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Current Best</p>
                        <p className="text-xl font-bold text-slate-200 mt-1">{currentMax} lbs</p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Total Growth</p>
                        <p className={`text-xl font-bold mt-1 ${growth > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {growth > 0 ? '+' : ''}{growth} lbs
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
