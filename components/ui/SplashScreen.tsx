"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
interface SplashScreenProps {
  finishLoading: () => void;
}

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};


const letter: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.6,
        ease: [0.42, 0, 0.58, 1],
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
};

export const SplashScreen = ({ finishLoading }: SplashScreenProps) => {
  return (
    <motion.div
      className="flex h-screen w-screen flex-col items-center justify-center overflow-hidden z-50 fixed top-0 left-0 bg-black"
      exit={{
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" }
      }}
    >
      <div className="relative flex items-baseline justify-center">
          <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      style={{
        background: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <motion.svg
        width={286}
        height={37}
        viewBox="0 0 286 37"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Z */}
        <motion.path
          variants={letter}
          d="M41.9928 5.19065L8.61687 31.1439H41.9928V36.3346H0.000386539V31.1439L33.5839 5.19065H0.000386539V0H41.9928V5.19065Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />

        {/* E */}
        <motion.path
          variants={letter}
          d="M88.636 36.3346H51.0557V0H88.636V5.19065H56.2464V31.1439H88.636V36.3346ZM84.224 20.7626H58.8417V15.572H84.224V20.7626Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />

        {/* L */}
        <motion.path
          variants={letter}
          d="M132.375 36.3346H97.6499V0H102.841V31.1439H132.375V36.3346Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />

        {/* A */}
        <motion.path
          variants={letter}
          d="M181.152 36.3346H175.961V25.9533H146.945V20.7626H175.961V5.19065H157.327C154.974 5.19065 152.811 5.77892 150.838 6.95547C148.866 8.09741 147.291 9.65461 146.115 11.6271C144.973 13.5995 144.402 15.7796 144.402 18.1673V36.3346H139.211V18.1673C139.211 15.6758 139.678 13.34 140.613 11.1599C141.547 8.94522 142.845 7.00738 144.506 5.34637C146.167 3.65076 148.087 2.33579 150.267 1.40147C152.482 0.467156 154.835 0 157.327 0H181.152V36.3346Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />

        {/* N */}
        <motion.path
          variants={letter}
          d="M197.651 36.3346H192.46V0H195.056C197.582 0 200.316 0.484458 203.257 1.45338C206.233 2.4223 209.209 3.78917 212.185 5.55399C215.161 7.31882 217.964 9.42968 220.594 11.8866C223.258 14.3089 225.542 17.008 227.445 19.984V0H232.636V36.3346H227.445C227.445 33.151 226.788 30.1058 225.473 27.199C224.193 24.2576 222.48 21.5585 220.334 19.1016C218.189 16.6101 215.801 14.4127 213.171 12.5095C210.576 10.5716 207.929 8.99713 205.229 7.78598C202.53 6.54022 200.004 5.74432 197.651 5.39828V36.3346Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />

        {/* A */}
        <motion.path
          variants={letter}
          d="M285.289 36.3346H280.099V25.9533H251.083V20.7626H280.099V5.19065H261.464C259.111 5.19065 256.948 5.77892 254.976 6.95547C253.003 8.09741 251.429 9.65461 250.252 11.6271C249.11 13.5995 248.539 15.7796 248.539 18.1673V36.3346H243.349V18.1673C243.349 15.6758 243.816 13.34 244.75 11.1599C245.684 8.94522 246.982 7.00738 248.643 5.34637C250.304 3.65076 252.225 2.33579 254.405 1.40147C256.619 0.467156 258.973 0 261.464 0H285.289V36.3346Z"
          stroke="white"
          fill="white"
          strokeWidth={0.8}
        />
      </motion.svg>
    </motion.div>


      </div>

      {/* Bottom section - tagline and loading bar centered together */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
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
              duration: 2.4,
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
