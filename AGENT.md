# Skills & Architecture for Next-Gen Zelana UI

This document outlines the technical skills, design concepts, and libraries required to rewrite the Zelana UI from a standard dashboard into a high-performance, visually immersive ZK-Rollup interface.

## 1. Core Framework Architecture (Next.js 15)
To ensure the UI is fast and handles cryptographic loads without freezing.

* **Server vs. Client Composition:**
    * **Skill:** Strictly separating "view" logic (Server Components) from "interactive" logic (Client Components).
    * **Application:** Render the static shell and marketing content on the server. Push `ethers.js` / `ZelanaSDK` logic and Framer Motion animations to leaf client components (`'use client'`).
* **React 19 Hooks:**
    * **Skill:** Utilizing `useActionState` and `useOptimistic` for instant UI feedback.
    * **Application:** When a user clicks "Transfer", show the balance updating *immediately* (Optimistic UI) while the ZK proof generates in the background.

## 2. Advanced Visual Design (The "ZK Aesthetic")
Moving away from flat colors to a depth-based, modern crypto aesthetic.

* **Glassmorphism & Depth:**
    * **Technique:** Using multi-layered backdrops with `backdrop-filter: blur()`, semi-transparent borders, and noise textures.
    * **CSS:** `bg-white/5 border-white/10 backdrop-blur-md` (Tailwind).
* **Gradients & Glows:**
    * **Technique:** "Conic gradients" and "mesh gradients" that animate slowly to simulate network activity.
    * **Application:** A subtle, pulsing green glow behind the "Proving" terminal when active.
* **Monospace Typography:**
    * **Skill:** Pairing geometric sans-serif fonts (Inter/Geist) for UI text with high-readability monospace fonts (JetBrains Mono/Fira Code) for hashes and logs.

## 3. Motion & Animation (Framer Motion)
Crucial for the "Split Proving" demo video. Static UIs are boring; moving UIs tell a story.

* **Layout Animations:**
    * **Skill:** Using `<motion.div layout>` to automatically animate lists when items are added/removed (e.g., the transaction log).
* **Shared Element Transitions:**
    * **Skill:** `layoutId` prop in Framer Motion.
    * **Application:** When clicking a transaction row, it expands into a detailed view seamlessly.
* **Data Flow Visualization:**
    * **Skill:** SVG path animation (`strokeDasharray`, `strokeDashoffset`).
    * **Application:** Drawing a glowing line from the "User Wallet" icon to the "Sequencer" icon during the proof submission phase.

## 4. Component Library Strategy (Shadcn UI)
Don't reinvent the wheel for inputs and buttons.

* **Radix UI Primitives:**
    * **Skill:** Building accessible modals, popovers, and accordions that handle focus management automatically.
* **Shadcn/ui Customization:**
    * **Skill:** Taking the standard Shadcn components and overriding the `ring`, `border`, and `bg` classes to match the Zelana "Dark Mode" theme.

## 5. Web3 Specific UX Patterns
Handling the friction of blockchain interactions gracefully.

* **Hex Data Formatting:**
    * **Skill:** visual truncation of addresses (`0x1234...5678`) with "Click to Copy" and "View Explorer" hover states.
* **Async State Machines:**
    * **Skill:** distinct UI states for: `Idle` -> `Signing` -> `Proving (WASM)` -> `Submitting` -> `Settled`.
    * **Application:** Replacing the generic "Loading..." spinner with a specific "Generating ZK Proof..." progress bar.
* **Error Humanization:**
    * **Skill:** Parsing raw Rust/RPC errors (e.g., `Error: 0x1`) into human-readable suggestions (e.g., "Insufficient funds for gas").

## 6. Recommended Tech Stack for Rewrite

| Category | Tool / Library | Reason |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router)** | Performance & React Server Components. |
| **Styling** | **Tailwind CSS v3/v4** | Rapid styling, standard in Web3. |
| **Components** | **Shadcn UI** | High-quality, accessible, copy-paste components. |
| **Animation** | **Framer Motion** | Best-in-class React animation library. |
| **Icons** | **Lucide React** | Clean, consistent SVG icons. |
| **Fonts** | **Geist Sans / Mono** | Vercel's new font family, perfect for dashboards. |
| **Notifications** | **Sonner** | Much better looking toasts than `react-toastify`. |

## 7. Action Plan for "Demo Ready" UI

1.  **Install Shadcn:** Set up the base component library to replace raw HTML inputs.
2.  **The "Split" Stage:** Create a dedicated component that visualizes the User Device (Left) and Swarm (Right) using Framer Motion.
3.  **Terminal Overlay:** Build a "Matrix-style" log viewer that overlays on the screen when `Generating Proof` starts, showing real logs from the WASM worker.
4.  **Polish:** Apply a global dark theme with distinct primary colors (Zelana Green/Purple) for actions.