import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
}

const COLORS = [
  '#f43f5e', // rose-500
  '#ec4899', // pink-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
];

export default function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const tempParticles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 250;
      
      tempParticles.push({
        id: i,
        // Start from center of screen
        x: 0,
        y: 0,
        size: 6 + Math.random() * 12,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.2,
        duration: 1.5 + Math.random() * 1.5,
        angle,
        distance,
      });
    }
    setParticles(tempParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => {
        const destX = Math.cos(p.angle) * p.distance;
        const destY = Math.sin(p.angle) * p.distance + 150; // Gravity pull down

        return (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{
              x: 0,
              y: -50,
              scale: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: destX,
              y: destY,
              scale: [0, 1, 1, 0.5, 0],
              opacity: [1, 1, 0.8, 0.4, 0],
              rotate: Math.random() * 720 - 360,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}
