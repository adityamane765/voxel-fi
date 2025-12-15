```text
Architecture:
┌──────────────────────────────┐
│        Frontend (React)      │
│  - LP Dashboard              │
│  - 3D Visualizer (Three.js)  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Privy                        │
│ - Auth (Google / Email)      │
│ - Embedded Wallet            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Shinami                      │
│ - RPC / Indexing             │
│ - Tx relay (optional gasless)│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│           Movement M1 (MoveVM)           │
│                                          │
│  vault.move                              │
│  fractal_position.move                   │
│  spatial_octree.move                     │
│  zk_verifier.move                        │
└──────────────────────────────────────────┘
```
