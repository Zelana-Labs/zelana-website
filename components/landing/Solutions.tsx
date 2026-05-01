"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Blocks, Shield, FileCheck, ArrowRightLeft, Users } from "lucide-react";

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
  {
    icon: Users,
    title: "Multisigs",
    text: "Multi-signature wallets where every signature is hidden. No public signer graph, no exposed thresholds — just private, verifiable approval from users and institutions.",
  },
];

function BlockBuildingAnimation() {
  const [visibleBlocks, setVisibleBlocks] = useState<number[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(-1);
  const [flyingBlock, setFlyingBlock] = useState<{
    index: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [cycleKey, setCycleKey] = useState(0);

  const speed = 0.5;
  const cubeSize = 18;
  const gap = 8;
  const centerX = 140;
  const centerY = 110;
  const totalBlocks = 27;

  const cubeW = cubeSize * 0.5;
  const cubeH = cubeSize * 0.29;
  const cubeD = cubeSize * 0.5;

  const nodes = [
    { x: 22, y: 50 },
    { x: 22, y: 95 },
    { x: 22, y: 140 },
    { x: 258, y: 50 },
    { x: 258, y: 95 },
    { x: 258, y: 140 },
  ];

  const cubes: { x: number; y: number }[] = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const stepX = cubeW * 2 + gap;
        const stepY = cubeH * 2 + gap * 0.5;
        const stepZ = cubeD + gap;
        const isoX = centerX + (col - row) * stepX * 0.5;
        const isoY = centerY + (col + row) * stepY * 0.5 - layer * stepZ;
        cubes.push({ x: isoX, y: isoY });
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    let currentBlock = 0;
    const timeouts: NodeJS.Timeout[] = [];

    const buildNextBlock = () => {
      if (!isMounted) return;
      if (currentBlock >= totalBlocks) {
        setActiveNodeIndex(-1);
        setFlyingBlock(null);
        const resetTimeout = setTimeout(() => {
          if (!isMounted) return;
          setVisibleBlocks([]);
          setCycleKey((k) => k + 1);
        }, 7000 * speed);
        timeouts.push(resetTimeout);
        return;
      }

      const nodeIdx = currentBlock % 6;
      const node = nodes[nodeIdx];
      const targetCube = cubes[currentBlock];

      if (!node || !targetCube) {
        currentBlock++;
        buildNextBlock();
        return;
      }

      setActiveNodeIndex(nodeIdx);

      const nodeActivateDelay = 400 * speed;
      const flightDuration = 1500 * speed;
      const deactivateDelay = 300 * speed;
      const pauseBeforeNext = 800 * speed;

      timeouts.push(
        setTimeout(() => {
          if (!isMounted) return;
          setFlyingBlock({
            index: currentBlock,
            startX: node.x,
            startY: node.y,
            endX: targetCube.x,
            endY: targetCube.y,
          });
        }, nodeActivateDelay)
      );

      timeouts.push(
        setTimeout(() => {
          if (!isMounted) return;
          setFlyingBlock(null);
          setVisibleBlocks((prev) => [...prev, currentBlock]);
        }, nodeActivateDelay + flightDuration)
      );

      timeouts.push(
        setTimeout(() => {
          if (!isMounted) return;
          setActiveNodeIndex(-1);
        }, nodeActivateDelay + flightDuration + deactivateDelay)
      );

      timeouts.push(
        setTimeout(() => {
          if (!isMounted) return;
          currentBlock++;
          buildNextBlock();
        }, nodeActivateDelay + flightDuration + pauseBeforeNext)
      );
    };

    const startTimer = setTimeout(buildNextBlock, 800 * speed);
    timeouts.push(startTimer);

    return () => {
      isMounted = false;
      timeouts.forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleKey]);

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
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 280 220" className="w-full h-auto max-h-full">
        <g opacity="0.1">
          <line x1="34" y1="50" x2="95" y2="95" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="95" x2="95" y2="105" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="34" y1="140" x2="95" y2="120" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="50" x2="185" y2="95" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="95" x2="185" y2="105" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="246" y1="140" x2="185" y2="120" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
        </g>

        {nodes.map((node, i) => {
          const isActive = activeNodeIndex === i;
          return (
            <motion.g key={`node-${i}`}>
              {isActive && (
                <motion.circle
                  cx={node.x} cy={node.y} r="14"
                  fill="none" stroke="#a1a1aa" strokeWidth="1"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}
              <motion.circle
                cx={node.x} cy={node.y} r="12"
                fill="white"
                stroke={isActive ? "#71717a" : "#e4e4e7"}
                strokeWidth="1.5"
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.circle
                cx={node.x} cy={node.y} r="4"
                fill={isActive ? "#18181b" : "#d4d4d8"}
                animate={{ scale: isActive ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.g>
          );
        })}

        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {visibleBlocks.map((blockIndex) => {
            if (blockIndex >= cubes.length) return null;
            const cube = cubes[blockIndex];
            return (
              <g key={`cube-${cycleKey}-${blockIndex}`} transform={`translate(${cube.x}, ${cube.y})`}>
                <CubeAtOrigin size={cubeSize} />
              </g>
            );
          })}

          {flyingBlock && cubes[flyingBlock.index] && (
            <motion.g
              key={`flying-${cycleKey}-${flyingBlock.index}`}
              initial={{ x: flyingBlock.startX, y: flyingBlock.startY, scale: 0.2, opacity: 0 }}
              animate={{ x: cubes[flyingBlock.index].x, y: cubes[flyingBlock.index].y, scale: 1, opacity: 1 }}
              transition={{ duration: 1.5 * speed, ease: [0.16, 1, 0.3, 1] }}
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute left-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 bg-zinc-100 rounded-xl border-2 border-zinc-300 shadow-lg flex items-center justify-center"
        >
          <div className="w-4 h-6 bg-zinc-700 rounded-sm" />
        </motion.div>
        <span className="text-[10px] text-zinc-500 mt-2 font-medium">Client</span>
      </div>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={`to-relay-${i}`}
          className="absolute flex items-center"
          initial={{ left: "18%", opacity: 0 }}
          animate={{ left: "38%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.5, delay: i * 0.6, repeat: Infinity, repeatDelay: 0.5 }}
          style={{ top: `${45 + i * 5}%` }}
        >
          <div className="w-7 h-3 bg-zinc-800 rounded flex items-center justify-center">
            <span className="text-[7px] text-zinc-300 font-mono">0x</span>
          </div>
        </motion.div>
      ))}

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <Shield className="w-7 h-7 text-white" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-2 border-zinc-500 rounded-2xl"
          />
        </motion.div>
        <span className="text-[10px] text-zinc-500 mt-2 font-medium">Relayer</span>
      </div>

      {[0, 1, 2].map((i) => (
        <motion.div
          key={`to-val-${i}`}
          className="absolute flex items-center"
          initial={{ left: "55%", opacity: 0 }}
          animate={{ left: "75%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.5, delay: i * 0.6 + 0.8, repeat: Infinity, repeatDelay: 0.5 }}
          style={{ top: `${45 + i * 5}%` }}
        >
          <div className="w-7 h-3 bg-zinc-600 rounded flex items-center justify-center">
            <span className="text-[7px] text-zinc-200 font-mono">tx</span>
          </div>
        </motion.div>
      ))}

      <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
          className="w-10 h-10 bg-zinc-900 rounded-xl shadow-lg flex items-center justify-center"
        >
          <div className="w-5 h-5 bg-zinc-600 rounded-md" />
        </motion.div>
        <span className="text-[10px] text-zinc-500 mt-2 font-medium">Validator</span>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <FileCheck className="w-8 h-8 text-white" />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <motion.circle
              cx="50%" cy="50%" r="45%"
              fill="none" stroke="#a1a1aa" strokeWidth="3" strokeDasharray="276"
              animate={{ strokeDashoffset: [276, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </motion.div>
        <p className="text-[10px] text-zinc-500 mt-2 text-center font-medium">ZK Proof</p>
      </div>

      {proverNodes.map((pos, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            className="w-10 h-10 bg-zinc-100 rounded-xl border-2 border-zinc-300 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full"
            />
          </motion.div>
          <span className="text-[9px] text-zinc-400 mt-1">P{i + 1}</span>
          <motion.div
            className="absolute w-2 h-2 bg-zinc-700 rounded-sm"
            animate={{
              x: i % 2 === 0 ? [0, 40] : [0, -40],
              y: i < 2 ? [0, 35] : [0, -35],
              opacity: [1, 1, 0],
              scale: [1, 0.8, 0.5],
            }}
            transition={{ duration: 1.2, delay: i * 0.4, repeat: Infinity, repeatDelay: 0.3 }}
            style={{ left: "50%", top: i < 2 ? "100%" : "0%", marginLeft: "-6px", marginTop: i < 2 ? "8px" : "-14px" }}
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute left-[10%] flex flex-col items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }}
            className="w-10 h-10 bg-zinc-800 rounded-xl shadow-lg flex items-center justify-center"
          >
            <div className="w-5 h-5 bg-zinc-600 rounded-md" />
          </motion.div>
        ))}
        <span className="text-[10px] text-zinc-500 mt-1 font-medium">Solana</span>
      </div>

      <div className="relative">
        <motion.div className="w-32 h-2 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700 rounded-full" />
        <motion.div
          animate={{ x: [-44, 44, -44] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-6 h-6 bg-zinc-900 rounded-full shadow-lg flex items-center justify-center"
        >
          <ArrowRightLeft className="w-3 h-3 text-white" />
        </motion.div>
      </div>

      <div className="absolute right-[10%] flex flex-col items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: i * 0.2 + 0.5, duration: 1, repeat: Infinity }}
            className="w-10 h-10 bg-zinc-200 rounded-xl shadow-lg border border-zinc-300 flex items-center justify-center"
          >
            <div className="w-5 h-5 bg-zinc-400 rounded-md" />
          </motion.div>
        ))}
        <span className="text-[10px] text-zinc-500 mt-1 font-medium">Zelana</span>
      </div>

      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div className="w-16 h-16 border-2 border-dashed border-zinc-400 rounded-full" />
      </motion.div>
    </div>
  );
}

const MS_STYLES = `
  .ms-grid{stroke:#f0f0f2;stroke-width:1}
  .ms-sl{animation:ms-fl .5s cubic-bezier(.22,1,.36,1) forwards;opacity:0}
  .ms-sr{animation:ms-fr .5s cubic-bezier(.22,1,.36,1) forwards;opacity:0}
  @keyframes ms-fl{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
  @keyframes ms-fr{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
  .ms-conn{stroke:#d4d4d8;stroke-width:1;stroke-dasharray:3 3;opacity:0;animation:ms-fi .35s ease forwards}
  .ms-conn.solid{stroke:#18181b;stroke-dasharray:none}
  @keyframes ms-fi{to{opacity:1}}
  .ms-glow{animation:ms-p 2.8s ease-in-out infinite}
  @keyframes ms-p{0%,100%{opacity:.07}50%{opacity:.18}}
  .ms-badge{animation:ms-pop .35s cubic-bezier(.34,1.56,.64,1) forwards 1s;transform:scale(0);opacity:0}
  @keyframes ms-pop{to{transform:scale(1);opacity:1}}
  .ms-redact{animation:ms-fi .3s ease forwards 1.05s;opacity:0}
`;

function PrivateMultisigAnimation() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      {/* ── Narrow: half-width card (mobile / col-span-1) ── */}
      <svg
        viewBox="0 0 340 192"
        className="w-full h-full block sm:hidden"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <style>{MS_STYLES}</style>

        {/* Grid */}
        <line className="ms-grid" x1="0"   y1="48"  x2="340" y2="48" />
        <line className="ms-grid" x1="0"   y1="96"  x2="340" y2="96" />
        <line className="ms-grid" x1="0"   y1="144" x2="340" y2="144" />
        <line className="ms-grid" x1="113" y1="0"   x2="113" y2="192" />
        <line className="ms-grid" x1="226" y1="0"   x2="226" y2="192" />

        {/* PRIVATE pill */}
        <rect x="255" y="14" width="60" height="14" rx="4" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
        <text x="290" y="25" textAnchor="middle" fill="#a1a1aa" fontSize="5" fontWeight="600" fontFamily="system-ui,sans-serif" letterSpacing="1">PRIVATE</text>

        {/* Signer A — signed */}
        <g className="ms-sl" style={{ animationDelay: "0s" }}>
          <rect x="12" y="24" width="90" height="36" rx="7" fill="#18181b" />
          <circle cx="28" cy="42" r="8" fill="#3f3f46" />
          <circle cx="28" cy="39.5" r="2.5" fill="#a1a1aa" />
          <path d="M23,47 C23,44 33,44 33,47" fill="#a1a1aa" />
          <text x="41" y="39" fill="#e4e4e7" fontSize="7.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer A</text>
          <text x="41" y="49" fill="#71717a" fontSize="6" fontFamily="system-ui,sans-serif">0x3f...a2c1</text>
          <circle cx="97" cy="22" r="7" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          <polyline points="93.5,22 96,24.5 100.5,19.5" stroke="#a1a1aa" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>

        {/* Signer B — signed */}
        <g className="ms-sl" style={{ animationDelay: "0.12s" }}>
          <rect x="12" y="78" width="90" height="36" rx="7" fill="#18181b" />
          <circle cx="28" cy="96" r="8" fill="#3f3f46" />
          <circle cx="28" cy="93.5" r="2.5" fill="#a1a1aa" />
          <path d="M23,101 C23,98 33,98 33,101" fill="#a1a1aa" />
          <text x="41" y="93" fill="#e4e4e7" fontSize="7.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer B</text>
          <text x="41" y="103" fill="#71717a" fontSize="6" fontFamily="system-ui,sans-serif">0x9d...b88f</text>
          <circle cx="97" cy="76" r="7" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          <polyline points="93.5,76 96,78.5 100.5,73.5" stroke="#a1a1aa" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>

        {/* Signer C — pending/hidden */}
        <g className="ms-sl" style={{ animationDelay: "0.24s" }}>
          <rect x="12" y="132" width="90" height="36" rx="7" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />
          <circle cx="28" cy="150" r="8" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
          <circle cx="28" cy="147.5" r="2.5" fill="#d4d4d8" />
          <path d="M23,155 C23,152 33,152 33,155" fill="#d4d4d8" />
          <text x="41" y="147" fill="#a1a1aa" fontSize="7.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer C</text>
          <text x="41" y="157" fill="#d4d4d8" fontSize="6" fontFamily="system-ui,sans-serif">0x••••••••</text>
          <rect x="82" y="130" width="24" height="12" rx="6" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
          <text x="94" y="139" textAnchor="middle" fill="#a1a1aa" fontSize="5.5" fontFamily="system-ui,sans-serif">pend.</text>
        </g>

        {/* Connectors */}
        <line className="ms-conn solid" x1="102" y1="42"  x2="195" y2="90"  style={{ animationDelay: "0.48s" }} />
        <line className="ms-conn solid" x1="102" y1="96"  x2="195" y2="96"  style={{ animationDelay: "0.6s" }} />
        <line className="ms-conn"       x1="102" y1="150" x2="195" y2="106" style={{ animationDelay: "0.72s" }} />

        {/* Vault glow */}
        <circle className="ms-glow" cx="218" cy="96" r="40" fill="#18181b" style={{ transformOrigin: "218px 96px" }} />

        {/* Shield */}
        <path d="M218 64 C218 64 198 70 198 82 L198 101 C198 112 207 119 218 123 C229 119 238 112 238 101 L238 82 C238 70 218 64 218 64Z" fill="#18181b" />
        <rect x="210" y="89" width="16" height="12" rx="3" fill="#3f3f46" />
        <path d="M213 89 L213 86 C213 83 222 83 222 86 L222 89" fill="none" stroke="#71717a" strokeWidth="1.4" />
        <circle cx="218" cy="94" r="1.8" fill="#a1a1aa" />
        <line x1="218" y1="96" x2="218" y2="99" stroke="#a1a1aa" strokeWidth="1.1" />

        {/* Redacted threshold */}
        <g className="ms-redact">
          <rect x="198" y="46" width="40" height="10" rx="3" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.8" />
          <rect x="201" y="49" width="10" height="4" rx="1.5" fill="#d4d4d8" />
          <rect x="214" y="49" width="6"  height="4" rx="1.5" fill="#e4e4e7" />
          <rect x="223" y="49" width="9"  height="4" rx="1.5" fill="#d4d4d8" />
          <rect x="235" y="49" width="4"  height="4" rx="1.5" fill="#e4e4e7" />
        </g>

        {/* 2-of-3 badge */}
        <g className="ms-badge" style={{ transformOrigin: "218px 133px" }}>
          <rect x="200" y="128" width="36" height="16" rx="8" fill="#18181b" />
          <text x="218" y="139.5" textAnchor="middle" fill="#e4e4e7" fontSize="7.5" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.4">2 of 3</text>
        </g>

        {/* Vault → TX line */}
        <line className="ms-conn solid" x1="238" y1="96" x2="262" y2="96" style={{ animationDelay: "0.9s" }} />

        {/* TX output card */}
        <g className="ms-sr" style={{ animationDelay: "0.88s" }}>
          <rect x="262" y="70" width="64" height="52" rx="7" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />
          <rect x="270" y="80" width="20" height="11" rx="3" fill="#18181b" />
          <text x="280" y="89" textAnchor="middle" fill="#e4e4e7" fontSize="6" fontWeight="700" fontFamily="system-ui,sans-serif">TX</text>
          <rect x="268" y="97" width="50" height="13" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="0.8" />
          <text x="293" y="106.5" textAnchor="middle" fill="#15803d" fontSize="6.5" fontWeight="600" fontFamily="system-ui,sans-serif">Approved</text>
          <rect x="268" y="113" width="20" height="4" rx="1.5" fill="#f0f0f2" />
          <rect x="291" y="113" width="12" height="4" rx="1.5" fill="#f0f0f2" />
        </g>
      </svg>

      {/* ── Wide: full-width card (sm:col-span-2) ── */}
      <svg
        viewBox="0 0 700 224"
        className="w-full h-full hidden sm:block"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <style>{MS_STYLES}</style>

        {/* Grid */}
        <line className="ms-grid" x1="0"   y1="56"  x2="700" y2="56" />
        <line className="ms-grid" x1="0"   y1="112" x2="700" y2="112" />
        <line className="ms-grid" x1="0"   y1="168" x2="700" y2="168" />
        <line className="ms-grid" x1="175" y1="0"   x2="175" y2="224" />
        <line className="ms-grid" x1="350" y1="0"   x2="350" y2="224" />
        <line className="ms-grid" x1="525" y1="0"   x2="525" y2="224" />

        {/* PRIVATE pill */}
        <rect x="620" y="10" width="60" height="18" rx="5" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
        <text x="650" y="21" textAnchor="middle" fill="#a1a1aa" fontSize="6" fontWeight="600" fontFamily="system-ui,sans-serif" letterSpacing="1.2">PRIVATE</text>

        {/* Signer A — signed */}
        <g className="ms-sl" style={{ animationDelay: "0s" }}>
          <rect x="30" y="50" width="130" height="44" rx="8" fill="#18181b" />
          <circle cx="50" cy="72" r="10" fill="#3f3f46" />
          <circle cx="50" cy="69" r="3" fill="#a1a1aa" />
          <path d="M44,77 C44,73 56,73 56,77" fill="#a1a1aa" />
          <text x="66" y="68" fill="#e4e4e7" fontSize="8.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer A</text>
          <text x="66" y="79" fill="#71717a" fontSize="7" fontFamily="system-ui,sans-serif">0x3f...a2c1</text>
          <rect x="124" y="48" width="28" height="14" rx="7" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          <polyline points="129,55.5 132,58.5 137,52.5" stroke="#a1a1aa" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>

        {/* Signer B — signed */}
        <g className="ms-sl" style={{ animationDelay: "0.12s" }}>
          <rect x="30" y="112" width="130" height="44" rx="8" fill="#18181b" />
          <circle cx="50" cy="134" r="10" fill="#3f3f46" />
          <circle cx="50" cy="131" r="3" fill="#a1a1aa" />
          <path d="M44,139 C44,135 56,135 56,139" fill="#a1a1aa" />
          <text x="66" y="130" fill="#e4e4e7" fontSize="8.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer B</text>
          <text x="66" y="141" fill="#71717a" fontSize="7" fontFamily="system-ui,sans-serif">0x9d...b88f</text>
          <rect x="124" y="110" width="28" height="14" rx="7" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          <polyline points="129,117.5 132,120.5 137,114.5" stroke="#a1a1aa" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>

        {/* Signer C — pending/hidden */}
        <g className="ms-sl" style={{ animationDelay: "0.24s" }}>
          <rect x="30" y="168" width="130" height="44" rx="8" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />
          <circle cx="50" cy="190" r="10" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
          <circle cx="50" cy="187" r="3" fill="#d4d4d8" />
          <path d="M44,195 C44,191 56,191 56,195" fill="#d4d4d8" />
          <text x="66" y="186" fill="#a1a1aa" fontSize="8.5" fontWeight="600" fontFamily="system-ui,sans-serif">Signer C</text>
          <text x="66" y="197" fill="#d4d4d8" fontSize="7" fontFamily="system-ui,sans-serif">0x••••••••</text>
          <rect x="126" y="166" width="32" height="14" rx="7" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
          <text x="142" y="176" textAnchor="middle" fill="#a1a1aa" fontSize="6.5" fontFamily="system-ui,sans-serif">pending</text>
        </g>

        {/* Connectors */}
        <line className="ms-conn solid" x1="160" y1="72"  x2="316" y2="104" style={{ animationDelay: "0.48s" }} />
        <line className="ms-conn solid" x1="160" y1="134" x2="316" y2="112" style={{ animationDelay: "0.6s" }} />
        <line className="ms-conn"       x1="160" y1="190" x2="316" y2="124" style={{ animationDelay: "0.72s" }} />

        {/* Vault glow */}
        <circle className="ms-glow" cx="350" cy="112" r="44" fill="#18181b" style={{ transformOrigin: "350px 112px" }} />

        {/* Shield */}
        <path d="M350 72 C350 72 326 79 326 94 L326 118 C326 131 337 141 350 146 C363 141 374 131 374 118 L374 94 C374 79 350 72 350 72Z" fill="#18181b" />
        <rect x="341" y="103" width="18" height="14" rx="3" fill="#3f3f46" />
        <path d="M345 103 L345 99 C345 95 355 95 355 99 L355 103" fill="none" stroke="#71717a" strokeWidth="1.5" />
        <circle cx="350" cy="109" r="2" fill="#a1a1aa" />
        <line x1="350" y1="111" x2="350" y2="114" stroke="#a1a1aa" strokeWidth="1.2" />

        {/* Redacted threshold */}
        <g className="ms-redact">
          <rect x="318" y="54" width="64" height="11" rx="3" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.8" />
          <rect x="322" y="57" width="12" height="4" rx="1.5" fill="#d4d4d8" />
          <rect x="337" y="57" width="8"  height="4" rx="1.5" fill="#e4e4e7" />
          <rect x="348" y="57" width="11" height="4" rx="1.5" fill="#d4d4d8" />
          <rect x="362" y="57" width="5"  height="4" rx="1.5" fill="#e4e4e7" />
        </g>

        {/* 2-of-3 badge */}
        <g className="ms-badge" style={{ transformOrigin: "350px 156px" }}>
          <rect x="330" y="151" width="40" height="16" rx="8" fill="#18181b" />
          <text x="350" y="162.5" textAnchor="middle" fill="#e4e4e7" fontSize="8" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.4">2 of 3</text>
        </g>

        {/* Vault → TX line */}
        <line className="ms-conn solid" x1="374" y1="112" x2="404" y2="112" style={{ animationDelay: "0.9s" }} />

        {/* TX output card */}
        <g className="ms-sr" style={{ animationDelay: "0.88s" }}>
          <rect x="404" y="80" width="262" height="64" rx="8" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />
          <rect x="416" y="93" width="28" height="14" rx="4" fill="#18181b" />
          <text x="430" y="103.5" textAnchor="middle" fill="#e4e4e7" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif">TX</text>
          <text x="451" y="97" fill="#a1a1aa" fontSize="7" fontFamily="system-ui,sans-serif">Transaction</text>
          <rect x="451" y="103" width="42" height="5" rx="2" fill="#e4e4e7" />
          <rect x="496" y="103" width="22" height="5" rx="2" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.5" />
          <rect x="534" y="90" width="60" height="18" rx="9" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
          <text x="564" y="102" textAnchor="middle" fill="#15803d" fontSize="7.5" fontWeight="600" fontFamily="system-ui,sans-serif">Approved</text>
          <text x="416" y="131" fill="#d4d4d8" fontSize="7" fontFamily="system-ui,sans-serif">Signers: ●●● hidden</text>
          <rect x="480" y="126" width="32" height="5" rx="2" fill="#f4f4f5" />
          <rect x="515" y="126" width="16" height="5" rx="2" fill="#f4f4f5" />
        </g>
      </svg>
    </div>
  );
}

const animations = [
  BlockBuildingAnimation,
  EncryptedRelayersAnimation,
  ProverLayerAnimation,
  BridgeAnimation,
  PrivateMultisigAnimation,
];

export default function Solutions() {
  return (
    <section id="solutions" className="py-15 sm:py-28 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-medium mb-3">
            Solutions
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            const Animation = animations[index];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`group relative bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 transition-colors duration-300 ${
                  index === solutions.length - 1 ? "sm:col-span-2" : ""
                }`}
              >
                {/* Animation area */}
                <div className="relative h-56 sm:h-[22rem] bg-gradient-to-br from-white to-zinc-50 border-b border-zinc-200">
                  <Animation />
                </div>

                {/* Text */}
                <div className="p-5 sm:p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-zinc-900">{solution.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">{solution.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}