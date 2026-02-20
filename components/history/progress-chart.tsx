"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dumbbell } from "lucide-react"

// Mock progression data for Bench Press 1RM
const CHART_DATA = [
    { date: 'Jan 1', weight: 205 },
    { date: 'Jan 8', weight: 210 },
    { date: 'Jan 15', weight: 210 },
    { date: 'Jan 22', weight: 215 },
    { date: 'Jan 29', weight: 220 },
    { date: 'Feb 5', weight: 225 },
    { date: 'Feb 12', weight: 225 },
    { date: 'Feb 18', weight: 230 },
]

export function ProgressChart() {
    return (
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl h-fit">
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-indigo-400" />
                        1RM Progression
                    </div>
                    <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                        Bench Press
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Current 1RM</p>
                        <p className="text-xl font-bold text-slate-200 mt-1">230 lbs</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">30-Day Growth</p>
                        <p className="text-xl font-bold text-emerald-400 mt-1">+15 lbs</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
