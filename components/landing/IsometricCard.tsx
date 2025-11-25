"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Lock, Wifi } from "lucide-react";

type Node = {
    id: string;
    label: string;
    role: string;
    x: number;
    y: number;
};

type TrafficProps = {
    from: Node;
    to: Node;
    delay?: number;
    label?: string;
};
function Traffic({ from, to, delay = 0, label }: TrafficProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      className="absolute"
      style={{
        left: from.x + 60,
        top: from.y + 120,
        width: length,
        transform: `rotate(${angleDeg}deg)`,
        transformOrigin: "0 50%",
      }}
    >
      {/* CABLE */}
      <div className="relative h-[2px] bg-white/15 rounded-full overflow-visible">
        {/* subtle inner "core" line */}
        <div className="absolute inset-y-0 left-0 right-0 mx-auto h-[1px] bg-white/25 rounded-full" />

        {/* PACKETS (small encrypted blocks) */}
        {[0, 0.25, 0.5, 0.75].map((offset, i) => (
          <motion.div
            key={i}
            className="absolute -top-[5px]"
            initial={{ x: 0, opacity: 0, scale: 0.8 }}
            animate={{
              x: length,
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1, 0.8],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.8,
              delay: delay + offset,
              ease: "easeInOut",
            }}
          >
            {/* packet block */}
            <div className="flex items-center gap-[3px]">
              <div className="w-5 h-3 rounded-[4px] border border-white/40 bg-black/70 shadow-[0_0_6px_rgba(255,255,255,0.35)] flex items-center justify-center">
                {/* little keyhole-ish dot */}
                <div className="w-[4px] h-[4px] rounded-full bg-white/80" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* OCCASIONAL LOCK PACKET (bigger, stands out) */}
        <motion.div
          className="absolute -top-[9px]"
          initial={{ x: 0, opacity: 0, scale: 0.6 }}
          animate={{
            x: length,
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1, 1, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 3.4,
            delay,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-[4px]">
            <div className="w-6 h-4 rounded-[6px] border border-white/60 bg-black flex items-center justify-center">
              <Lock className="w-3 h-3 text-white/80" strokeWidth={2} />
            </div>
          </div>
        </motion.div>

        {/* OPTIONAL LABEL NEAR CABLE */}
        {label && (
          <div className="absolute -bottom-5 left-0 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}


function MobileDevice({ node, delay }: { node: Node; delay: number }) {
    const [isSending, setIsSending] = useState(false);

    const handleSend = () => {
        setIsSending(true);
        // Reset after animation cycle
        setTimeout(() => {
            setIsSending(false);
        }, 5000);
    };

    return (
        <motion.div
            className="absolute"
            style={{ left: node.x, top: node.y }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
            whileHover={{ y: -4, scale: 1.02 }}
        >
            <div className="relative" style={{ width: 130, height: 260 }}>
                {/* iPhone body */}
                <div className="absolute inset-0 rounded-[38px] bg-zinc-950 border-[5px] border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                    {/* Volume buttons */}
                    <div className="absolute left-[-5px] top-16 w-[3px] h-8 bg-zinc-700 rounded-r" />
                    <div className="absolute left-[-5px] top-28 w-[3px] h-5 bg-zinc-700 rounded-r" />
                    <div className="absolute left-[-5px] top-36 w-[3px] h-5 bg-zinc-700 rounded-r" />

                    {/* Power button */}
                    <div className="absolute right-[-5px] top-20 w-[3px] h-12 bg-zinc-700 rounded-l" />

                    {/* Dynamic Island */}
                    {/* <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-24 h-3 bg-black rounded-[18px] z-20 border border-zinc-900" /> */}

                    {/* Screen */}
                    <div className="absolute inset-[5px] rounded-[33px] bg-black overflow-hidden">
                        {/* Wallpaper gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950" />

                        {/* Status bar */}
                        <div className="absolute top-1 left-4 right-6 flex justify-between items-center z-10">
                            <span className="text-[8px] text-white/90 font-semibold">9:41</span>
                            <div className="flex items-center gap-1.5">
                                <Wifi className="w-2 h-2 text-white/90" strokeWidth={2.5} />
                                <div className="flex gap-[0.5px] items-end">
                                    {[...Array(4)]
                                        .map((_, i) => i)      // [0,1,2,3]
                                        .reverse()             // [3,2,1,0]
                                        .map((i) => (
                                            <div
                                                key={i}
                                                className="w-[3px] bg-white/90 rounded-full"
                                                style={{ height: `${(i + 1) * 1.5}px` }}
                                            />
                                        ))}
                                </div>

                                <div className="w-4 h-2 border-[1.5px] border-white/90 rounded-sm relative">
                                    <div className="absolute inset-[1px] bg-white/90 rounded-[1px]" />
                                    <div className="absolute right-[-2px] top-1/2 -translate-y-1/2 w-[3px] h-[2px] bg-white/90 rounded-r-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Status - Only appears when sending */}
                        {isSending && (
                            <motion.div
                                className="mt-5 flex items-center justify-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-white/15 backdrop-blur-sm"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-white"
                                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <span className="text-[9px] text-white/70 font-medium tracking-wide">Sending  0.5 SOL</span>
                            </motion.div>
                        )}

                        {/* Wallet App Card */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-20px)] h-10">
                            <motion.div
                                className="relative rounded-[20px] border-2 border-white/25 bg-black/80 backdrop-blur-xl p-4 overflow-hidden"
                                animate={{
                                    borderColor: ["rgba(255,255,255,0.25)", "rgba(255,255,255,0.45)", "rgba(255,255,255,0.25)"]
                                }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: ["-200%", "200%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />

                                <div className="relative">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[10px] text-white/50 uppercase tracking-wide font-medium">Wallet</div>
                                        <Lock className="w-2.5 h-2.5 text-white/60" strokeWidth={2} />
                                    </div>

                                    {/* Amount */}
                                    <div className="mb-1">
                                        <div className="text-[12px] text-white font-bold tracking-tight leading-none">0.5 SOL</div>
                                        <div className="text-[8px] text-white/40 mt-1">≈ $847.50 USD</div>
                                    </div>

                                    {/* Recipient */}
                                    <div className="mb-1 pb-1 border-b border-white/10">
                                        <div className="text-[8px] text-white/40 mb-1 uppercase tracking-wide">Recipient</div>
                                        <div className="text-[8px] text-white/80 font-mono">0x74..4f2</div>
                                    </div>

                                    {/* Send button */}
                                    <motion.div
                                        className="flex items-center justify-center gap-2 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm cursor-pointer"
                                        whileHover={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSend}
                                    >
                                        <Lock className="w-2 h-2 text-white" strokeWidth={2.5} />
                                        <span className="text-[8px] text-white font-semibold tracking-wide">SEND</span>
                                    </motion.div>
                                </div>
                            </motion.div>

                        </div>
                        {/* Home indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/60" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ServerRack({ node, delay, processing }: { node: Node; delay: number; processing: boolean }) {
    return (
        <motion.div
            className="absolute"
            style={{ left: node.x, top: node.y }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
            whileHover={{ y: -4, scale: 1.02 }}
        >
            <div className="relative" style={{ width: 220, height: 280 }}>
                {/* Server chassis */}
                <div className="absolute inset-0 rounded-lg border-2 border-white/30 bg-gradient-to-b from-zinc-900/90 to-black/90 backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                    {/* Front panel */}
                    <div className="absolute inset-[8px] rounded border border-white/15 bg-black/50">
                        {/* Top header */}
                        <div className="absolute top-3 left-4 right-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">
                                        {node.role}
                                    </div>
                                    <div className="text-sm text-white font-semibold">{node.label}</div>
                                </div>
                                <motion.div
                                    className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                    animate={{ opacity: processing ? [1, 0.3, 1] : 0.3 }}
                                    transition={{ duration: 1, repeat: processing ? Infinity : 0 }}
                                />
                            </div>
                        </div>

                        {/* Server drive bays */}
                        <div className="absolute top-16 left-4 right-4 bottom-11 overflow-hidden">
                            <div className="space-y-1.5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="relative h-5 rounded border border-white/20 bg-gradient-to-r from-zinc-950 to-black overflow-hidden"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: delay + i * 0.03 }}
                                    >
                                        {/* Processing wave */}
                                        {processing && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                animate={{ x: ["-100%", "200%"] }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                    ease: "linear",
                                                }}
                                            />
                                        )}

                                        {/* Drive LEDs */}
                                        <div className="relative flex items-center h-full px-2 gap-2">
                                            <motion.div
                                                className="w-1 h-1 rounded-full bg-white/70"
                                                animate={{
                                                    opacity: processing ? [0.3, 1, 0.3] : 0.3,
                                                    boxShadow: processing ? ["0 0 0px rgba(255,255,255,0.5)", "0 0 8px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0.5)"] : "0 0 0px rgba(255,255,255,0.5)"
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: processing ? Infinity : 0,
                                                    delay: i * 0.08,
                                                }}
                                            />
                                            <div className="flex-1 h-[1px] bg-white/10" />
                                            <motion.div
                                                className="w-1 h-1 rounded-full bg-white/50"
                                                animate={{ opacity: processing ? [0.2, 0.7, 0.2] : 0.2 }}
                                                transition={{
                                                    duration: 1.2,
                                                    repeat: processing ? Infinity : 0,
                                                    delay: i * 0.1,
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Status bar - fixed position */}
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[9px] text-white/40">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {[...Array(4)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-0.5 bg-white/40 rounded-full"
                                            style={{ height: `${(i + 1) * 3}px` }}
                                            animate={{ opacity: processing ? [0.3, 1, 0.3] : 0.3 }}
                                            transition={{
                                                duration: 1,
                                                repeat: processing ? Infinity : 0,
                                                delay: i * 0.15,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="font-mono text-white/50">CPU {processing ? "98%" : "12%"}</span>
                            </div>
                            <span className="font-mono text-white/50">{processing ? "PROCESSING" : "IDLE"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function Database({ node, delay, storing }: { node: Node; delay: number; storing: boolean }) {
    return (
        <motion.div
            className="absolute"
            style={{ left: node.x, top: node.y }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
            whileHover={{ y: -4, scale: 1.02 }}
        >
            <div className="relative" style={{ width: 200, height: 260 }}>
                {/* Database cylinder top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-10">
                    <div className="absolute inset-0 rounded-[50%] border-2 border-white/30 bg-gradient-to-b from-zinc-900 to-black shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
                    <div className="absolute inset-[3px] rounded-[50%] border border-white/10 bg-black/50" />
                </div>

                {/* Database cylinder body */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-40 h-[190px]">
                    <div className="absolute inset-0 border-l-2 border-r-2 border-white/30 bg-gradient-to-b from-zinc-900 to-black" />
                    <div className="absolute inset-x-[3px] inset-y-0 border-l border-r border-white/10 bg-black/50" />

                    {/* Encrypted data visualization */}
                    <div className="absolute inset-4 overflow-hidden rounded">
                        {/* Matrix-style encrypted data */}
                        <div className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="relative h-4 flex items-center gap-1 overflow-hidden"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: delay + i * 0.1 }}
                                >
                                    {storing && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                delay: i * 0.2,
                                                ease: "linear",
                                            }}
                                        />
                                    )}

                                    {/* Binary/hex data simulation */}
                                    <div className="relative flex items-center gap-0.5 flex-1">
                                        <Lock className="w-2.5 h-2.5 text-white/40" />
                                        {Array.from({ length: 12 }).map((_, j) => (
                                            <motion.span
                                                key={j}
                                                className="text-[8px] font-mono text-white/30"
                                                animate={{
                                                    opacity: storing ? [0.2, 0.6, 0.2] : 0.2,
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: storing ? Infinity : 0,
                                                    delay: (i * 0.1 + j * 0.05),
                                                }}
                                            >
                                                {Math.random() > 0.5 ? "1" : "0"}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Encryption particles */}
                        {storing && Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-white/60"
                                initial={{ x: Math.random() * 120, y: 0, opacity: 0 }}
                                animate={{
                                    y: 160,
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: "linear",
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Database cylinder bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-10">
                    <div className="absolute inset-0 rounded-[50%] border-2 border-white/30 bg-gradient-to-t from-zinc-900 to-black shadow-[0_-4px_20px_rgba(0,0,0,0.5)]" />
                    <div className="absolute inset-[3px] rounded-[50%] border border-white/10 bg-black/50" />
                </div>

                {/* Label */}
                <div className="absolute -bottom-12 left-0 right-0 text-center">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">
                        {node.role}
                    </div>
                    <div className="text-xs text-white font-semibold">{node.label}</div>
                </div>
            </div>
        </motion.div>
    );
}

export default function UprightServerNetwork() {
    const [processing, setProcessing] = useState(false);
    const [storing, setStoring] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProcessing(true);
            setTimeout(() => {
                setStoring(true);
                setTimeout(() => {
                    setProcessing(false);
                    setStoring(false);
                }, 2500);
            }, 2500);
        }, 7000);

        // Start immediately
        setTimeout(() => setProcessing(true), 1000);

        return () => clearInterval(interval);
    }, []);

    const nodes: Node[] = [
        { id: "mobile", label: "User Wallet", role: "MOBILE", x: 40, y: 50 },
        { id: "sequencer", label: "ZK Sequencer", role: "SEQUENCER", x: 280, y: 30 },
        { id: "database", label: "State DB", role: "DATABASE", x: 580, y: 50 },
    ];

    const get = (id: string) => nodes.find((n) => n.id === id)!;

    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent">
            <div className="relative" style={{ width: 900, height: 500 }}>
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.015]">
                    <div
                        className="w-full h-full"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />
                </div>

                {/* Traffic lines */}
                <Traffic
                    from={get("mobile")}
                    to={get("sequencer")}
                    delay={0}
                    label="TX_ENCRYPTED"
                />
                <Traffic
                    from={get("sequencer")}
                    to={get("database")}
                    delay={2.5}
                    label="PROOF_BATCH"
                />

                {/* Nodes */}
                <MobileDevice node={get("mobile")} delay={0} />
                <ServerRack node={get("sequencer")} delay={0.2} processing={processing} />
                <Database node={get("database")} delay={0.4} storing={storing} />

                {/* Info label */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/15"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                >
                    <span className="text-xs text-white/60 font-mono">
                        L2 ZK-Rollup Sequencer · <span className="text-white/80">Zero-Knowledge Proof System</span>
                    </span>
                </motion.div>
            </div>
        </div>
    );
}