"use client"

export function EmberBackground() {
    const particles = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${(i * 4.3 + 7) % 100}%`,
        size: i % 3 === 0 ? 3 : 2,
        delay: `${(i * 1.7) % 12}s`,
        duration: `${8 + (i % 5) * 2}s`,
        alt: i % 2 === 0,
        color: i % 4 === 0 ? 'bg-orange-400' : i % 4 === 1 ? 'bg-amber-500' : i % 4 === 2 ? 'bg-yellow-500' : 'bg-red-400',
    }))

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Ambient vignette gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(2,6,23,0.4)_50%,_rgba(2,6,23,0.8)_100%)]" />

            {/* Subtle warm underglow at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-amber-950/10 to-transparent" />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '256px 256px',
            }} />

            {/* Ember particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`absolute rounded-full ${p.color}`}
                    style={{
                        left: p.left,
                        bottom: '-8px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animation: `${p.alt ? 'ember-float-alt' : 'ember-float'} ${p.duration} ${p.delay} infinite ease-out, ember-glow 3s ${p.delay} infinite ease-in-out`,
                        opacity: 0,
                    }}
                />
            ))}
        </div>
    )
}
