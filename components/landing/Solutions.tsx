"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
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

// Nodes Creating Blocks Animation - Exploded Rubik's Cube built block by block
function BlockBuildingAnimation() {
  const [visibleBlocks, setVisibleBlocks] = useState<number[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [flyingBlock, setFlyingBlock] = useState<{ index: number; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  // Animation speed multiplier (lower = faster, higher = slower)
  // 1 = normal, 0.5 = 2x faster, 2 = 2x slower
  const speed = 0.5;

  const cubeSize = 18; // Size of each cube
  const gap = 8; // Gap between cubes (bigger gap)
  const centerX = 140;
  const centerY = 110;
  const totalBlocks = 27;

  // Cube dimensions for grid calculation
  const cubeW = cubeSize * 0.5; // half width
  const cubeH = cubeSize * 0.29; // half height of top diamond
  const cubeD = cubeSize * 0.5; // depth

  // Node positions (6 nodes total)
  const nodes = [
    { x: 22, y: 50 },
    { x: 22, y: 95 },
    { x: 22, y: 140 },
    { x: 258, y: 50 },
    { x: 258, y: 95 },
    { x: 258, y: 140 },
  ];

  // Create cube positions for exploded Rubik's cube (27 blocks total)
  const cubes: { x: number; y: number }[] = [];

  for (let layer = 0; layer < 3; layer++) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Isometric grid positioning with gap
        const stepX = cubeW * 2 + gap;
        const stepY = cubeH * 2 + gap * 0.5;
        const stepZ = cubeD + gap;

        const isoX = centerX + (col - row) * stepX * 0.5;
        const isoY = centerY + (col + row) * stepY * 0.5 - layer * stepZ;
        cubes.push({ x: isoX, y: isoY });
      }
    }
  }

  // Animation cycle
  useEffect(() => {
    let isMounted = true;
    let currentBlock = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const buildNextBlock = () => {
      if (!isMounted) return;

      if (currentBlock >= totalBlocks) {
        // All blocks built - hold, then reset
        setActiveNodeIndex(-1);
        setFlyingBlock(null);

        const resetTimeout = setTimeout(() => {
          if (!isMounted) return;
          setVisibleBlocks([]);
          setCycleKey(k => k + 1);
        }, 7000 * speed);
        timeouts.push(resetTimeout);
        return;
      }

      // Pick which node sends this block (cycle through all 6)
      const nodeIdx = currentBlock % 6;
      const node = nodes[nodeIdx];
      const targetCube = cubes[currentBlock];

      if (!node || !targetCube) {
        currentBlock++;
        buildNextBlock();
        return;
      }

      // Step 1: Activate the node (node lights up)
      setActiveNodeIndex(nodeIdx);

      // Timing values (adjusted by speed multiplier)
      const nodeActivateDelay = 400 * speed;
      const flightDuration = 1500 * speed;
      const deactivateDelay = 300 * speed;
      const pauseBeforeNext = 800 * speed;

      // Step 2: After a moment, start flying the block
      const flyTimeout = setTimeout(() => {
        if (!isMounted) return;
        setFlyingBlock({
          index: currentBlock,
          startX: node.x,
          startY: node.y,
          endX: targetCube.x,
          endY: targetCube.y,
        });
      }, nodeActivateDelay);
      timeouts.push(flyTimeout);

      // Step 3: After flight completes, land the block
      const landTimeout = setTimeout(() => {
        if (!isMounted) return;
        setFlyingBlock(null);
        setVisibleBlocks(prev => [...prev, currentBlock]);
      }, nodeActivateDelay + flightDuration);
      timeouts.push(landTimeout);

      // Step 4: Deactivate node after block lands
      const deactivateTimeout = setTimeout(() => {
        if (!isMounted) return;
        setActiveNodeIndex(-1);
      }, nodeActivateDelay + flightDuration + deactivateDelay);
      timeouts.push(deactivateTimeout);

      // Step 5: Wait, then start next block
      const nextBlockDelay = nodeActivateDelay + flightDuration + pauseBeforeNext;
      const nextTimeout = setTimeout(() => {
        if (!isMounted) return;
        currentBlock++;
        buildNextBlock();
      }, nextBlockDelay);
      timeouts.push(nextTimeout);
    };

    // Start the cycle
    const startTimer = setTimeout(buildNextBlock, 800 * speed);
    timeouts.push(startTimer);

    return () => {
      isMounted = false;
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [cycleKey]);


  // Static cube (already landed) - rendered at absolute position
  const Cube = ({ x, y, size = 18 }: { x: number; y: number; size?: number }) => {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <CubeAtOrigin size={size} />
      </g>
    );
  };

  // Cube shape drawn at origin (0, 0) - used by both static and flying cubes
  const CubeAtOrigin = ({ size = 18 }: { size?: number }) => {
    const w = size * 0.5;
    const h = size * 0.29;
    const d = size * 0.5;

    const points = {
      top: `0,${-d - h} ${w},${-d} 0,${-d + h} ${-w},${-d}`,
      left: `${-w},${-d} 0,${-d + h} 0,${h} ${-w},0`,
      right: `0,${-d + h} ${w},${-d} ${w},0 0,${h}`,
    };

    return (
      <>
        <polygon points={points.left} fill="#18181b" stroke="#0a0a0b" strokeWidth="1" />
        <polygon points={points.right} fill="#27272a" stroke="#0a0a0b" strokeWidth="1" />
        <polygon points={points.top} fill="#3f3f46" stroke="#0a0a0b" strokeWidth="1" />
        <line x1={0} y1={-d - h} x2={-w} y2={-d} stroke="#52525b" strokeWidth="1" />
        <line x1={0} y1={-d - h} x2={w} y2={-d} stroke="#52525b" strokeWidth="0.8" />
      </>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-4">
      <svg viewBox="0 0 280 220" className="w-full h-auto max-h-full">
        {/* Connection lines (subtle) */}
        <g opacity="0.1">
          <line x1="34" y1="50" x2="95" y2="95" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="95" x2="95" y2="105" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="140" x2="95" y2="120" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="50" x2="185" y2="95" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="95" x2="185" y2="105" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="140" x2="185" y2="120" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        {/* All nodes - subtle abstract */}
        {nodes.map((node, i) => {
          const isActive = activeNodeIndex === i;

          return (
            <motion.g key={`node-${i}`}>
              {/* Single subtle pulse when active */}
              {isActive && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="14"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="1"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}

              {/* Main circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="12"
                fill="white"
                stroke={isActive ? "#71717a" : "#e4e4e7"}
                strokeWidth="1.5"
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Inner dot */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill={isActive ? "#18181b" : "#d4d4d8"}
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.g>
          );
        })}

        {/* Rubik's cube container with floating animation */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Render completed cubelets */}
          {visibleBlocks.map((blockIndex) => {
            if (blockIndex >= cubes.length) return null;
            const cube = cubes[blockIndex];
            return (
              <Cube
                key={`cube-${cycleKey}-${blockIndex}`}
                x={cube.x}
                y={cube.y}
                size={cubeSize}
              />
            );
          })}

          {/* Flying cube - inside same wrapper for smooth landing */}
          {flyingBlock && cubes[flyingBlock.index] && (
            <motion.g
              key={`flying-${cycleKey}-${flyingBlock.index}`}
              initial={{
                x: flyingBlock.startX,
                y: flyingBlock.startY,
                scale: 0.2,
                opacity: 0
              }}
              animate={{
                x: cubes[flyingBlock.index].x,
                y: cubes[flyingBlock.index].y,
                scale: 1,
                opacity: 1
              }}
              transition={{
                duration: 1.5 * speed,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <CubeAtOrigin size={cubeSize} />
            </motion.g>
          )}
        </motion.g>
      </svg>
    </div>
  );
}

function EncryptedRelayersAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden px-2 sm:px-0">
      <div className="absolute left-[8%] sm:left-[12%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-zinc-100 rounded-lg sm:rounded-xl border-2 border-zinc-300 shadow-lg flex items-center justify-center"
        >
          <div className="w-4 h-6 sm:w-6 sm:h-8 bg-zinc-700 rounded-sm" />
        </motion.div>
        <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 font-medium">Client</span>
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
          <div className="w-6 h-3 sm:w-8 sm:h-4 bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-[6px] sm:text-[8px] text-zinc-300 font-mono">0x</span>
          </div>
        </motion.div>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <Shield className="w-6 h-6 sm:w-9 sm:h-9 text-white" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-2 border-zinc-500 rounded-xl sm:rounded-2xl"
          />
        </motion.div>
        <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 font-medium">Relayer</span>
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
          <div className="w-6 h-3 sm:w-8 sm:h-4 bg-zinc-600 rounded flex items-center justify-center">
            <span className="text-[6px] sm:text-[8px] text-zinc-200 font-mono">tx</span>
          </div>
        </motion.div>
      ))}
      <div className="absolute right-[8%] sm:right-[12%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-zinc-900 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center"
        >
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-zinc-600 rounded-md" />
        </motion.div>
        <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 font-medium">Validator</span>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <line x1="22%" y1="50%" x2="40%" y2="50%" stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="60%" y1="50%" x2="78%" y2="50%" stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

function ProverLayerAnimation() {
  const proverNodes = [
    { x: "18%", y: "25%" },
    { x: "82%", y: "25%" },
    { x: "18%", y: "75%" },
    { x: "82%", y: "75%" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center px-2 sm:px-0">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <FileCheck className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <motion.circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#a1a1aa"
              strokeWidth="3"
              strokeDasharray="276"
              animate={{ strokeDashoffset: [276, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </motion.div>
        <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 sm:mt-3 text-center font-medium">ZK Proof</p>
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
            className="w-9 h-9 sm:w-12 sm:h-12 bg-zinc-100 rounded-lg sm:rounded-xl border-2 border-zinc-300 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-zinc-600 border-t-transparent rounded-full"
            />
          </motion.div>
          <span className="text-[8px] sm:text-[10px] text-zinc-400 mt-1">P{i + 1}</span>
          <motion.div
            className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-zinc-700 rounded-sm"
            animate={{
              x: i % 2 === 0 ? [0, 40] : [0, -40],
              y: i < 2 ? [0, 35] : [0, -35],
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
        <line x1="18%" y1="25%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="82%" y1="25%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="18%" y1="75%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="82%" y1="75%" x2="50%" y2="50%" stroke="#71717a" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

function BridgeAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-2 sm:px-0">
      <div className="absolute left-[10%] sm:left-[15%] flex flex-col items-center gap-1 sm:gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-zinc-800 rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center"
          >
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-zinc-600 rounded-md" />
          </motion.div>
        ))}
        <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 font-medium">Solana</span>
      </div>
      <div className="relative">
        <motion.div className="w-24 sm:w-40 h-1.5 sm:h-2 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700 rounded-full" />
        <motion.div
          animate={{ x: [-40, 40, -40] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-zinc-900 rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowRightLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
        </motion.div>
      </div>
      <div className="absolute right-[10%] sm:right-[15%] flex flex-col items-center gap-1 sm:gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2 + 0.5, duration: 1, repeat: Infinity }}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-zinc-200 rounded-lg sm:rounded-xl shadow-lg border border-zinc-300 flex items-center justify-center"
          >
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-zinc-400 rounded-md" />
          </motion.div>
        ))}
        <span className="text-[10px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 font-medium">Zelana</span>
      </div>
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-20 sm:h-20 border-2 border-dashed border-zinc-400 rounded-full" />
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

// Individual solution content with scroll-linked opacity
function SolutionContent({
  index,
  scrollYProgress
}: {
  index: number;
  scrollYProgress: any;
}) {
  const solution = solutions[index];
  const total = solutions.length;

  // Each solution occupies 1/total of the scroll
  const start = index / total;
  const end = (index + 1) / total;

  // Tighter transitions - quick fade in/out at boundaries
  const opacity = useTransform(
    scrollYProgress,
    [
      Math.max(0, start - 0.02),
      start + 0.02,
      end - 0.02,
      Math.min(1, end + 0.02)
    ],
    index === 0
      ? [1, 1, 1, 0]  // First item starts visible
      : index === total - 1
        ? [0, 1, 1, 1]  // Last item stays visible
        : [0, 1, 1, 0]
  );

  // Subtle y movement
  const y = useTransform(
    scrollYProgress,
    [start, end],
    index === 0 ? [0, -20] : index === total - 1 ? [20, 0] : [20, -20]
  );

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, y }}
    >
      {/* Large number */}
      <span className="text-[80px] sm:text-[100px] md:text-[100px] lg:text-[160px] font-bold leading-none text-zinc-100 select-none">
        0{index + 1}
      </span>

      <div className="-mt-10 sm:-mt-12 md:-mt-12 lg:-mt-20">
        <h3 className="text-2xl sm:text-3xl md:text-2xl lg:text-5xl font-bold text-zinc-900 tracking-tight mb-2 sm:mb-3 lg:mb-4">
          {solution.title}
        </h3>
        <p className="text-zinc-500 leading-relaxed text-sm sm:text-base md:text-sm lg:text-xl max-w-md">
          {solution.text}
        </p>
      </div>
    </motion.div>
  );
}

// Individual animation with scroll-linked opacity
function SolutionAnimation({
  index,
  scrollYProgress
}: {
  index: number;
  scrollYProgress: any;
}) {
  const Animation = animations[index];
  const Icon = solutions[index].icon;
  const total = solutions.length;

  const start = index / total;
  const end = (index + 1) / total;

  // Tighter transitions
  const opacity = useTransform(
    scrollYProgress,
    [
      Math.max(0, start - 0.02),
      start + 0.02,
      end - 0.02,
      Math.min(1, end + 0.02)
    ],
    index === 0
      ? [1, 1, 1, 0]
      : index === total - 1
        ? [0, 1, 1, 1]
        : [0, 1, 1, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [start, end],
    index === 0 ? [1, 0.95] : index === total - 1 ? [0.95, 1] : [0.95, 0.95]
  );

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity }}
    >
      {/* Icon badge */}
      <motion.div
        className="absolute -left-2 md:-left-4 lg:-left-8 top-1/2 -translate-y-1/2 z-20"
        animate={{ y: ["-50%", "-45%", "-50%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-zinc-900/30 rounded-xl md:rounded-xl lg:rounded-2xl blur-xl scale-110" />
          <div className="relative flex h-12 w-12 md:h-14 md:w-14 lg:h-20 lg:w-20 items-center justify-center rounded-xl md:rounded-xl lg:rounded-2xl bg-zinc-900 text-white shadow-2xl">
            <Icon className="h-6 w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" />
          </div>
        </div>
      </motion.div>

      {/* Animation */}
      <motion.div
        className="absolute inset-3 md:inset-4 lg:inset-6 rounded-xl md:rounded-xl lg:rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border border-zinc-200/50"
        style={{ scale }}
      >
        <Animation />
      </motion.div>
    </motion.div>
  );
}

export default function Solutions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Track current index for progress dots
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const index = Math.min(
      solutions.length - 1,
      Math.floor(progress * solutions.length)
    );
    setCurrentIndex(index);
  });

  return (
    <section
      id="solutions"
      ref={containerRef}
      className="relative"
      style={{ height: `${solutions.length * 100}vh` }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center py-4 md:py-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-8 lg:gap-16 items-center">

            {/* Content - Left side */}
            <div className="md:col-span-5 order-1 w-full">
              {/* Section label */}
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-zinc-400 font-medium mb-3 sm:mb-6 lg:mb-8">
                Solutions
              </p>

              {/* Vertical progress */}
              <div className="flex gap-4 md:gap-6 lg:gap-10">
                {/* Progress dots */}
                <div className="hidden md:flex flex-col items-center gap-2 pt-2">
                  {solutions.map((_, i) => (
                    <motion.div
                      key={i}
                      className="relative"
                      animate={{ opacity: i === currentIndex ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full border-2 border-zinc-900"
                        animate={{
                          backgroundColor: i <= currentIndex ? "#18181b" : "transparent",
                          scale: i === currentIndex ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                      {i < solutions.length - 1 && (
                        <div className="w-0.5 h-10 lg:h-16 bg-zinc-200 mx-auto mt-2 overflow-hidden">
                          <motion.div
                            className="w-full bg-zinc-900"
                            style={{
                              height: useTransform(
                                scrollYProgress,
                                [i / solutions.length, (i + 1) / solutions.length],
                                ["0%", "100%"]
                              )
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Stacked content */}
                <div className="flex-1 relative h-[200px] sm:h-[240px] lg:h-[300px]">
                  {solutions.map((_, index) => (
                    <SolutionContent
                      key={index}
                      index={index}
                      scrollYProgress={scrollYProgress}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile progress dots */}
              <div className="flex md:hidden gap-2 mt-4">
                {solutions.map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    animate={{
                      backgroundColor: i <= currentIndex ? "#18181b" : "#e4e4e7",
                      scale: i === currentIndex ? 1.3 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            </div>

            {/* Animation - Right side */}
            <div className="md:col-span-7 order-2 w-full">
              <div className="relative aspect-[16/11] md:aspect-[4/3] lg:aspect-[16/10]">
                {/* Background shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-2xl md:rounded-2xl lg:rounded-[3rem] overflow-hidden">
                  <motion.div
                    className="absolute w-[300px] md:w-[300px] lg:w-[500px] h-[300px] md:h-[300px] lg:h-[500px] rounded-full opacity-30 blur-[60px] md:blur-[60px] lg:blur-[100px]"
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

                {/* Stacked animations */}
                {solutions.map((_, index) => (
                  <SolutionAnimation
                    key={index}
                    index={index}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
