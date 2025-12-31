### Movement doesn’t yet expose pairing precompiles, so native SNARK verification in Move isn’t possible, hence I have used a ZK-assisted architecture: 
    1. LPs generate Groth16 proofs off-chain
    2. Our Move contracts enforce commitments, nullifiers, and verification results on-chain
    This gives us real privacy today and upgrades cleanly when native ZK arrives
---
```
┌──────────────────────────────┐
│ Circom ZK Circuits           │
│  - ownership.circom          │
│  - range_proof.circom        │
└─────────────┬────────────────┘
              │  (snarkjs)
              ▼
┌──────────────────────────────┐
│ Off-chain Proof Generation   │
│  - Groth16 proofs            │
│  - Real cryptographic ZK     │
└─────────────┬────────────────┘
              │  (verified off-chain)
              ▼
┌──────────────────────────────┐
│ zk_verifier.move (on-chain)  │
│  - commitment storage        │
│  - proof result enforcement  │
│  - nullifier / replay guard  │
└──────────────────────────────┘
```
We use a ZK-assisted architecture: proofs are generated and verified off-chain using Groth16, while on-chain Move contracts enforce commitments, nullifiers, and proof results

## Upgrade Plans

The ZK system is designed to be verifier-agnostic.
If Movement exposes native zkSNARK verification in the future:
Off-chain verification can be replaced
On-chain logic remains unchanged
Proof format remains compatible
Only the verification step changes.

## Stack
```
Circom – for circuits
Groth16 – proving system
snarkjs – for proof generation & verification mechanism
TypeScript – orchestration and chain interaction
```
## Verified End-to-End Flow
This flow has been tested successfully on Movement Testnet.
Script - submit_ownership.ts has end to end integration test for ZK part and was run and following log obtained:
```
adityamane@Adityas-MacBook-Air-2 zk % npx ts-node scripts/submit_ownership_proof.ts

Note: using CUSTOM network will require queries to lookup ChainId
Using address: 0xc41f971065f3552a51c964ad09c06c040f92785f6106884494eab450b9138a81
Checking for existing commitment...
No commitment found
Creating commitment...
Tx hash: 0x20f9bb4c28ec16aca8b7825385c20a31490106b0895dfac14484e82cc5181501
Commitment created ✅

Generating ZK proof...
ZK proof verified ✅

Submitting on-chain verification...
Tx hash: 0x29cf77f055e7787479fac20a62dec1e6bb4621926fecef0efed50c1495696f41

Result: SUCCESS ✅
```