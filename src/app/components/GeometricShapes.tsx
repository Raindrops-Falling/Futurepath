import { motion } from 'motion/react';

export function GeometricShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
      {/* Left side - 3 shapes (circles, squares only) */}
      
      {/* Circle - left top */}
      <motion.div
        className="absolute top-[15%] left-[12%] w-20 h-20 border-2 border-[#D4AF37] rounded-full opacity-20"
        animate={{
          scale: [1, 1.25, 1],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Square - left middle */}
      <motion.div
        className="absolute top-[45%] left-[8%] w-16 h-16 border-2 border-[#D4AF37] opacity-18"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Circle - left bottom */}
      <motion.div
        className="absolute bottom-[25%] left-[10%] w-18 h-18 border-2 border-[#D4AF37] rounded-full opacity-17"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Right side - 5 shapes (down from 7, ~30% reduction) - circles and squares only */}
      
      {/* Circle - right top */}
      <motion.div
        className="absolute top-[20%] right-[15%] w-24 h-24 border-2 border-[#D4AF37] rounded-full opacity-15"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Square - right top-middle */}
      <motion.div
        className="absolute top-[15%] right-[8%] w-16 h-16 border-2 border-[#D4AF37] opacity-20"
        animate={{
          rotate: [360, 270, 180, 90, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Circle - right middle */}
      <motion.div
        className="absolute top-[45%] right-[25%] w-20 h-20 border-2 border-[#D4AF37] rounded-full opacity-18"
        animate={{
          scale: [1, 1.15, 1],
          y: [0, 25, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Square - right bottom-middle */}
      <motion.div
        className="absolute bottom-[30%] right-[12%] w-14 h-14 border-2 border-[#D4AF37] opacity-19"
        animate={{
          rotate: [0, 90, 180, 270, 360],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Circle - right bottom */}
      <motion.div
        className="absolute bottom-[15%] right-[20%] w-16 h-16 border-2 border-[#D4AF37] rounded-full opacity-16"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -25, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

export function ParticleEffect() {
  const particles = Array.from({ length: 20 }, (_, i) => i);

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
