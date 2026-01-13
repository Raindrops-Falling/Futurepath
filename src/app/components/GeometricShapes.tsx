import { motion } from 'motion/react';

export function GeometricShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* Kept minimal: only two subtle shapes to reduce visual noise */}
      <motion.div
        className="absolute top-[18%] left-[12%] w-20 h-20 border-2 border-[#D4AF37] rounded-full opacity-18"
        animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[18%] right-[14%] w-24 h-24 border-2 border-[#D4AF37] rounded-full opacity-14"
        animate={{ scale: [1, 1.2, 1], x: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export function ParticleEffect() {
  const particles = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#D4AF37] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
