"use client";

import { motion } from "framer-motion";

interface SplashScreenProps {
  finishLoading: () => void;
}

export const SplashScreen = ({ finishLoading }: SplashScreenProps) => {
  return (
    <motion.div 
      className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden z-50 fixed top-0 left-0 bg-black"
      exit={{ 
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" }
      }}
    >
      {/* Logo and text container - centered */}
      <div className="relative flex items-center justify-center">
        {/* The Big Z - draws itself then moves left */}
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            x: -10
          }} 
          transition={{ 
            scale: { duration: 0.6, ease: "easeOut" },
            opacity: { duration: 0.6, ease: "easeOut" },
            x: { delay: 1.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }}
          className="z-10"
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main Z shape with draw animation */}
            <motion.path
              d="M20 20 L80 20 L20 80 L80 80"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                pathLength: { duration: 1.2, ease: "easeInOut", delay: 0.3 },
                opacity: { duration: 0.3, delay: 0.3 }
              }}
            />
          </svg>
        </motion.div>

        {/* The "elana" Text - slides out from behind Z */}
        <motion.div
          initial={{ opacity: 0, x: -30, width: 0 }}
          animate={{ opacity: 1, x: -10, width: "auto" }}
          transition={{ 
            delay: 1.8,
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1]
          }}
          className="flex items-center"
        >
          <span className="text-7xl font-bold text-white tracking-tight ml-[-5px]">
            elana
          </span>
        </motion.div>
      </div>

      {/* Bottom section - tagline and loading bar centered together */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.5 }}
          className="text-sm text-zinc-500 tracking-widest uppercase"
        >
          Privacy-focused ZK Rollup
        </motion.p>

        {/* Loading Progress Bar */}
        <div className="w-48 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2.8, 
              ease: "easeInOut",
              delay: 0.2
            }}
            onAnimationComplete={finishLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};
