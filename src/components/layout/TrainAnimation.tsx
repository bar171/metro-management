import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

interface TrainAnimationProps {
    id: number;
    onComplete: (id: number) => void;
}

export function TrainAnimation({ id, onComplete }: TrainAnimationProps) {
    // Randomize speed/duration: 1.5x faster than before (6-10s -> 4-6.6s)
    const duration = useMemo(() => 4.0 + Math.random() * 2.6, []);
    const isFast = duration < 5.0; // Adjusted threshold for speed lines

    // Smoke particles state
    const [particles, setParticles] = useState<{ id: number; left: number; size: number }[]>([]);

    useEffect(() => {
        // More randomized particle emission
        const interval = setInterval(() => {
            setParticles(prev => [
                ...prev.slice(-25),
                {
                    id: Date.now() + Math.random(),
                    left: Math.random() * 20 - 10,
                    size: 25 + Math.random() * 50
                }
            ]);
        }, 100);

        const timer = setTimeout(() => {
            onComplete(id);
        }, duration * 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [id, duration, onComplete]);

    return (
        <>
            {/* Background Speed Lines - Only for "fastest" of the slow trains */}
            {isFast && (
                <div className="fixed inset-0 z-[590] pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: '110vw', opacity: 0 }}
                            animate={{ x: '-10vw', opacity: [0, 0.2, 0] }}
                            transition={{
                                duration: 0.4 + Math.random() * 0.4,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "linear"
                            }}
                            className="absolute bg-white/10 h-[1px] w-[150px]"
                            style={{ top: `${Math.random() * 100}%` }}
                        />
                    ))}
                </div>
            )}

            {/* Screen Shake Container */}
            <motion.div
                animate={isFast ? {
                    x: [-0.5, 0.5, -0.5, 0.5, 0],
                    y: [-0.5, 0.5, 0.5, -0.5, 0]
                } : {}}
                transition={{ repeat: Infinity, duration: 0.15 }}
                className="fixed inset-0 z-[600] pointer-events-none"
            >
                <motion.div
                    initial={{ x: '-40vw', y: '50vh', translateY: '-50%' }}
                    animate={{ x: '140vw', y: '50vh', translateY: '-50%' }}
                    transition={{ duration, ease: "linear" }}
                    className="absolute flex items-center"
                    style={{
                        height: '450px'
                    }}
                >
                    {/* Headlight Beam - Narrower initial height at origin */}
                    <motion.div
                        animate={{ opacity: [0.5, 0.9, 0.7, 0.9, 0.6] }}
                        transition={{ duration: 0.2, repeat: Infinity }}
                        className="absolute right-[-450px] top-[55%] w-[500px] h-[400px] bg-gradient-to-r from-yellow-100/30 to-transparent"
                        style={{
                            clipPath: 'polygon(0% 48%, 100% 0%, 100% 100%, 0% 52%)',
                            filter: 'blur(35px)',
                            zIndex: 1,
                            transform: 'translateY(-50%)'
                        }}
                    />

                    {/* Train Container */}
                    <div className="relative h-full flex items-center">
                        <img
                            src="/train.png"
                            alt="Metro Train"
                            className="h-full w-auto object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        />

                        {/* Window Glow */}
                        <div className="absolute inset-0 flex items-center justify-around px-[15%] opacity-30">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-10 h-8 bg-yellow-200/40 rounded-sm blur-[3px]" />
                            ))}
                        </div>

                        {/* Realistic Smoke Particles - Multi-layered puffs */}
                        <div className="absolute top-[18%] right-[32%] w-0 h-0">
                            <AnimatePresence>
                                {particles.map(p => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, scale: 0.1, x: 0, y: 0 }}
                                        animate={{
                                            opacity: [0, 0.4, 0.2, 0],
                                            scale: [0.5, 2.5, 4.5],
                                            x: [-10, -180 - Math.random() * 200],
                                            y: [-20, -120 - Math.random() * 150],
                                            rotate: [0, 90 + Math.random() * 90]
                                        }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 4, ease: "easeOut" }}
                                        className="absolute pointer-events-none"
                                        style={{ left: p.left }}
                                    >
                                        {/* Composite Puff - Multiple overlapping circles for realism */}
                                        <div
                                            className="absolute bg-white/20 rounded-full blur-[8px]"
                                            style={{ width: p.size, height: p.size }}
                                        />
                                        <div
                                            className="absolute bg-gray-400/10 rounded-full blur-[12px] translate-x-2 -translate-y-2"
                                            style={{ width: p.size * 0.8, height: p.size * 0.8 }}
                                        />
                                        <div
                                            className="absolute bg-white/10 rounded-full blur-[4px] -translate-x-1 translate-y-1"
                                            style={{ width: p.size * 0.6, height: p.size * 0.6 }}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
