"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Blocks, Shield, FileCheck, ArrowRightLeft } from "lucide-react";

const solutions = [
  {
    icon: Blocks,
    title: "Unbiased Block Building",
    text: "Decentralized block construction that prevents censorship and ensures fair transaction inclusion across all participants.",
  },
  {
    icon: Shield,
    title: "Encrypted Relayers",
    text: "VPN-like encrypted communication channels for secure and private transaction relaying between networks.",
  },
  {
    icon: FileCheck,
    title: "Prover Layer",
    text: "Zero-knowledge proof generation layer that enables verifiable computations without revealing underlying data.",
  },
  {
    icon: ArrowRightLeft,
    title: "Privacy-Focused Bridge",
    text: "Secure cross-chain bridges that maintain privacy while enabling seamless asset transfers between blockchains.",
  },
];

// Nodes Creating Blocks Animation - Exploded Rubik's Cube
function BlockBuildingAnimation() {
  // Single small isometric cubelet
  const Cube = ({ x, y, size = 12, delay = 0 }: { x: number; y: number; size?: number; delay?: number; floatDelay?: number }) => {
    const s = size;
    const halfW = s * 0.866;
    const halfH = s * 0.5;
    const height = s;

    const points = {
      top: `${x},${y - height} ${x + halfW},${y - height + halfH} ${x},${y - height + halfH * 2} ${x - halfW},${y - height + halfH}`,
      left: `${x - halfW},${y - height + halfH} ${x},${y - height + halfH * 2} ${x},${y + halfH} ${x - halfW},${y}`,
      right: `${x},${y - height + halfH * 2} ${x + halfW},${y - height + halfH} ${x + halfW},${y} ${x},${y + halfH}`,
    };

    return (
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.3 }}
      >
        <polygon points={points.left} fill="#27272a" stroke="#1a1a1d" strokeWidth="0.8" />
        <polygon points={points.right} fill="#3f3f46" stroke="#1a1a1d" strokeWidth="0.8" />
        <polygon points={points.top} fill="#52525b" stroke="#1a1a1d" strokeWidth="0.8" />
        {/* Highlight */}
        <line x1={x} y1={y - height} x2={x - halfW} y2={y - height + halfH} stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1={x} y1={y - height} x2={x + halfW} y2={y - height + halfH} stroke="white" strokeWidth="0.3" opacity="0.2" />
      </motion.g>
    );
  };

  // Single Rubik's cube with 3x3x3 cubelets with spacing
  const cubeSize = 12;
  const spacing = 5; // Gap between cubelets
  const gridOffset = cubeSize + spacing;
  const centerX = 140;
  const centerY = 110;

  // Create cube positions for exploded Rubik's cube
  const cubes: { x: number; y: number; delay: number; floatDelay: number }[] = [];

  for (let layer = 0; layer < 3; layer++) { // vertical layers (bottom to top)
    for (let row = 0; row < 3; row++) { // depth
      for (let col = 0; col < 3; col++) { // width
        // Isometric positioning with spacing
        const isoX = centerX + (col - row) * gridOffset * 0.866;
        const isoY = centerY + (col + row) * gridOffset * 0.5 - layer * (cubeSize + spacing * 0.8);
        cubes.push({
          x: isoX,
          y: isoY,
          delay: 0.03 * (layer * 9 + row * 3 + col),
          floatDelay: 0.1 * (layer * 3 + row + col), // Synchronized floating
        });
      }
    }
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <svg viewBox="0 0 280 220" className="w-full h-full max-w-[380px]">
        {/* Floating wrapper for entire Rubik's cube */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Render all 27 cubelets */}
          {cubes.map((cube, i) => (
            <Cube
              key={i}
              x={cube.x}
              y={cube.y}
              size={cubeSize}
              delay={cube.delay}
            />
          ))}
        </motion.g>

        {/* Transaction particles from left nodes */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`left-${i}`}
            r="3"
            fill="#18181b"
            initial={{ opacity: 0 }}
            animate={{
              cx: [25, 140],
              cy: [50 + i * 40, 100],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Transaction particles from right nodes */}
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`right-${i}`}
            r="3"
            fill="#18181b"
            initial={{ opacity: 0 }}
            animate={{
              cx: [255, 140],
              cy: [50 + i * 40, 100],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.5 + 0.25,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Left nodes */}
        {[
          { x: 22, y: 45 },
          { x: 22, y: 90 },
          { x: 22, y: 135 },
        ].map((pos, i) => (
          <motion.g key={`ln-${i}`}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r="12"
              fill="white"
              stroke="#d4d4d8"
              strokeWidth="2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            />
            <circle cx={pos.x} cy={pos.y} r="4" fill="#18181b" />
          </motion.g>
        ))}

        {/* Right nodes */}
        {[
          { x: 258, y: 45 },
          { x: 258, y: 90 },
          { x: 258, y: 135 },
        ].map((pos, i) => (
          <motion.g key={`rn-${i}`}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r="12"
              fill="white"
              stroke="#d4d4d8"
              strokeWidth="2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, delay: i * 0.3 + 0.15, repeat: Infinity }}
            />
            <circle cx={pos.x} cy={pos.y} r="4" fill="#18181b" />
          </motion.g>
        ))}

        {/* Connection lines (subtle) */}
        <g opacity="0.1">
          <line x1="34" y1="45" x2="100" y2="90" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="90" x2="100" y2="100" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="135" x2="100" y2="115" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="45" x2="180" y2="90" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="90" x2="180" y2="100" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="135" x2="180" y2="115" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      </svg>
    </div>
  );
}

function EncryptedRelayersAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute left-[12%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-14 h-14 bg-zinc-100 rounded-xl border-2 border-zinc-300 shadow-lg flex items-center justify-center"
        >
          <div className="w-6 h-8 bg-zinc-700 rounded-sm" />
        </motion.div>
        <span className="text-xs text-zinc-500 mt-2 font-medium">Client</span>
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`to-relay-${i}`}
          className="absolute flex items-center gap-1"
          initial={{ left: "18%", opacity: 0 }}
          animate={{ left: "38%", opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.5,
            delay: i * 0.6,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          style={{ top: `${45 + i * 5}%` }}
        >
          <div className="w-8 h-4 bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-[8px] text-zinc-300 font-mono">0x</span>
          </div>
        </motion.div>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <Shield className="w-9 h-9 text-white" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-2 border-zinc-500 rounded-2xl"
          />
        </motion.div>
        <span className="text-xs text-zinc-500 mt-2 font-medium">Relayer</span>
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`to-val-${i}`}
          className="absolute flex items-center gap-1"
          initial={{ left: "55%", opacity: 0 }}
          animate={{ left: "75%", opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.5,
            delay: i * 0.6 + 0.8,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          style={{ top: `${45 + i * 5}%` }}
        >
          <div className="w-8 h-4 bg-zinc-600 rounded flex items-center justify-center">
            <span className="text-[8px] text-zinc-200 font-mono">tx</span>
          </div>
        </motion.div>
      ))}
      <div className="absolute right-[12%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
          className="w-14 h-14 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center"
        >
          <div className="w-6 h-6 bg-zinc-600 rounded-md" />
        </motion.div>
        <span className="text-xs text-zinc-500 mt-2 font-medium">Validator</span>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <line x1="22%" y1="50%" x2="40%" y2="50%" stroke="#d4d4d8" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="60%" y1="50%" x2="78%" y2="50%" stroke="#d4d4d8" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

function ProverLayerAnimation() {
  const proverNodes = [
    { x: "20%", y: "25%" },
    { x: "80%", y: "25%" },
    { x: "20%", y: "75%" },
    { x: "80%", y: "75%" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <FileCheck className="w-10 h-10 text-white" />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <motion.circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="3"
              strokeDasharray="276"
              animate={{ strokeDashoffset: [276, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </motion.div>
        <p className="text-xs text-zinc-500 mt-3 text-center font-medium">ZK Proof</p>
      </div>
      {proverNodes.map((pos, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: [
                "0 4px 15px rgba(0,0,0,0.1)",
                "0 8px 25px rgba(0,0,0,0.2)",
                "0 4px 15px rgba(0,0,0,0.1)",
              ],
            }}
            transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            className="w-12 h-12 bg-zinc-100 rounded-xl border-2 border-zinc-300 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full"
            />
          </motion.div>
          <span className="text-[10px] text-zinc-400 mt-1">Prover {i + 1}</span>
          <motion.div
            className="absolute w-3 h-3 bg-zinc-700 rounded-sm"
            animate={{
              x: i % 2 === 0 ? [0, 60] : [0, -60],
              y: i < 2 ? [0, 50] : [0, -50],
              opacity: [1, 1, 0],
              scale: [1, 0.8, 0.5],
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.4,
              repeat: Infinity,
              repeatDelay: 0.3,
            }}
            style={{
              left: "50%",
              top: i < 2 ? "100%" : "0%",
              marginLeft: "-6px",
              marginTop: i < 2 ? "8px" : "-14px",
            }}
          />
        </div>
      ))}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <line x1="20%" y1="25%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20%" y1="75%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="80%" y1="75%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

function BridgeAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute left-[15%] flex flex-col items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }}
            className="w-12 h-12 bg-zinc-800 rounded-xl shadow-lg flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-zinc-600 rounded-md" />
          </motion.div>
        ))}
        <span className="text-xs text-zinc-500 mt-2 font-medium">Solana</span>
      </div>
      <div className="relative">
        <motion.div className="w-40 h-2 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700 rounded-full" />
        <motion.div
          animate={{ x: [-60, 60, -60] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-6 bg-zinc-900 rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowRightLeft className="w-3 h-3 text-white" />
        </motion.div>
      </div>
      <div className="absolute right-[15%] flex flex-col items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2 + 0.5, duration: 1, repeat: Infinity }}
            className="w-12 h-12 bg-zinc-200 rounded-xl shadow-lg border border-zinc-300 flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-zinc-400 rounded-md" />
          </motion.div>
        ))}
        <span className="text-xs text-zinc-500 mt-2 font-medium">Zelana</span>
      </div>
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-dashed border-zinc-400 rounded-full" />
      </motion.div>
    </div>
  );
}

const animations = [
  BlockBuildingAnimation,
  EncryptedRelayersAnimation,
  ProverLayerAnimation,
  BridgeAnimation,
];

export default function Solutions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Update current index based on scroll progress
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const index = Math.min(
      solutions.length - 1,
      Math.floor(progress * solutions.length)
    );
    setCurrentIndex(index);
  });

  const currentSolution = solutions[currentIndex];
  const Animation = animations[currentIndex];
  const Icon = currentSolution.icon;

  return (
    <section
      id="solutions"
      ref={containerRef}
      className="relative"
      style={{ height: `${solutions.length * 100}vh` }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">

            {/* Left side - Content */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              {/* Section label */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-medium mb-8"
              >
                Solutions
              </motion.p>

              {/* Vertical progress */}
              <div className="flex gap-8 lg:gap-10">
                <div className="hidden md:flex flex-col items-center gap-2 pt-2">
                  {solutions.map((_, i) => (
                    <motion.div
                      key={i}
                      className="relative"
                      animate={{ opacity: i === currentIndex ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="w-3 h-3 rounded-full border-2 border-zinc-900"
                        animate={{
                          backgroundColor: i <= currentIndex ? "#18181b" : "transparent",
                          scale: i === currentIndex ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      {i < solutions.length - 1 && (
                        <motion.div
                          className="w-0.5 h-16 bg-zinc-200 mx-auto mt-2"
                          style={{ originY: 0 }}
                        >
                          <motion.div
                            className="w-full bg-zinc-900"
                            animate={{ height: i < currentIndex ? "100%" : "0%" }}
                            transition={{ duration: 0.4 }}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      {/* Large number */}
                      <span className="text-[120px] md:text-[160px] font-bold leading-none text-zinc-100 select-none">
                        0{currentIndex + 1}
                      </span>

                      <div className="-mt-16 md:-mt-20">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight mb-4">
                          {currentSolution.title}
                        </h3>
                        <p className="text-zinc-500 leading-relaxed text-lg md:text-xl max-w-md">
                          {currentSolution.text}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right side - Animation */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="relative aspect-[4/3] lg:aspect-[16/10]">
                {/* Background shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-[3rem] overflow-hidden">
                  {/* Animated gradient orbs */}
                  <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
                    animate={{
                      background: [
                        "radial-gradient(circle, #e4e4e7 0%, transparent 70%)",
                        "radial-gradient(circle, #d4d4d8 0%, transparent 70%)",
                        "radial-gradient(circle, #e4e4e7 0%, transparent 70%)",
                      ],
                      x: ["-20%", "20%", "-20%"],
                      y: ["-20%", "30%", "-20%"],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                {/* Icon badge */}
                <motion.div
                  className="absolute -left-4 lg:-left-8 top-1/2 -translate-y-1/2 z-20"
                  animate={{ y: ["-50%", "-45%", "-50%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-zinc-900/30 rounded-2xl blur-xl scale-110" />
                    <div className="relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-2xl">
                      <Icon className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                  </div>
                </motion.div>

                {/* Animation container */}
                <div className="absolute inset-4 md:inset-6 rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border border-zinc-200/50">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-full h-full"
                    >
                      <Animation />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
