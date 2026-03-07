"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

export type WodTimerMode = 'amrap' | 'for_time' | 'emom' | 'tabata'

interface WodTimerState {
    isRunning: boolean
    isPaused: boolean
    elapsedMs: number
    remainingMs: number
    currentRound: number
    currentInterval: number
    isWorkPhase: boolean
}

interface UseWodTimerOptions {
    mode: WodTimerMode
    timeCapMs: number
    emomIntervalMs?: number
    tabataWorkMs?: number
    tabataRestMs?: number
    tabataRounds?: number
    onComplete?: () => void
    onIntervalChange?: (interval: number) => void
}

export function useWodTimer(options: UseWodTimerOptions) {
    const {
        mode,
        timeCapMs,
        emomIntervalMs = 60000,
        tabataWorkMs = 20000,
        tabataRestMs = 10000,
        tabataRounds = 8,
        onComplete,
        onIntervalChange,
    } = options

    const [state, setState] = useState<WodTimerState>({
        isRunning: false,
        isPaused: false,
        elapsedMs: 0,
        remainingMs: mode === 'for_time' ? 0 : timeCapMs,
        currentRound: 0,
        currentInterval: 1,
        isWorkPhase: true,
    })

    const startTimeRef = useRef<number>(0)
    const pausedElapsedRef = useRef<number>(0)
    const rafRef = useRef<number>(0)
    const completedRef = useRef(false)

    const tick = useCallback(() => {
        const now = Date.now()
        const elapsed = pausedElapsedRef.current + (now - startTimeRef.current)

        if (mode === 'amrap' || mode === 'emom') {
            const remaining = Math.max(0, timeCapMs - elapsed)
            const currentInterval = Math.floor(elapsed / emomIntervalMs) + 1

            setState(prev => {
                if (mode === 'emom' && currentInterval !== prev.currentInterval) {
                    onIntervalChange?.(currentInterval)
                }
                return {
                    ...prev,
                    elapsedMs: elapsed,
                    remainingMs: remaining,
                    currentInterval,
                }
            })

            if (remaining <= 0 && !completedRef.current) {
                completedRef.current = true
                onComplete?.()
                return
            }
        } else if (mode === 'for_time') {
            const remaining = Math.max(0, timeCapMs - elapsed)
            setState(prev => ({
                ...prev,
                elapsedMs: elapsed,
                remainingMs: remaining,
            }))

            if (remaining <= 0 && !completedRef.current) {
                completedRef.current = true
                onComplete?.()
                return
            }
        } else if (mode === 'tabata') {
            const intervalDuration = tabataWorkMs + tabataRestMs
            const totalDuration = intervalDuration * tabataRounds
            const remaining = Math.max(0, totalDuration - elapsed)
            const currentInterval = Math.min(Math.floor(elapsed / intervalDuration) + 1, tabataRounds)
            const withinInterval = elapsed % intervalDuration
            const isWork = withinInterval < tabataWorkMs

            setState(prev => ({
                ...prev,
                elapsedMs: elapsed,
                remainingMs: remaining,
                currentInterval,
                isWorkPhase: isWork,
            }))

            if (remaining <= 0 && !completedRef.current) {
                completedRef.current = true
                onComplete?.()
                return
            }
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [mode, timeCapMs, emomIntervalMs, tabataWorkMs, tabataRestMs, tabataRounds, onComplete, onIntervalChange])

    const start = useCallback(() => {
        completedRef.current = false
        startTimeRef.current = Date.now()
        pausedElapsedRef.current = 0
        setState(prev => ({ ...prev, isRunning: true, isPaused: false }))
        rafRef.current = requestAnimationFrame(tick)
    }, [tick])

    const pause = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        pausedElapsedRef.current += Date.now() - startTimeRef.current
        setState(prev => ({ ...prev, isPaused: true }))
    }, [])

    const resume = useCallback(() => {
        startTimeRef.current = Date.now()
        setState(prev => ({ ...prev, isPaused: false }))
        rafRef.current = requestAnimationFrame(tick)
    }, [tick])

    const stop = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        setState(prev => ({ ...prev, isRunning: false, isPaused: false }))
    }, [])

    const addRound = useCallback(() => {
        setState(prev => ({ ...prev, currentRound: prev.currentRound + 1 }))
    }, [])

    const subtractRound = useCallback(() => {
        setState(prev => ({ ...prev, currentRound: Math.max(0, prev.currentRound - 1) }))
    }, [])

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    return {
        ...state,
        start,
        pause,
        resume,
        stop,
        addRound,
        subtractRound,
    }
}
