# ZK-system of Voxel

This directory contains the zero-knowledge (ZK) proof system used by VoxelFi / FractalTree to enable privacy-preserving and compliant interactions with on-chain liquidity positions.

The system uses Groth16 zkSNARKs, generated and verified off-chain, with results enforced on-chain via Move smart contracts.

## Main tasks for which ZK is used:
1. To prove ownership of commitments
2. For LPs to prove their liquidity range to outsiders without exposing exact value, i.e. my liquidity amount lies between this bound [Min_value, Max_value]

## 🎯 Design Goals
Prove sensitive facts without revealing data
Prevent replay and double-use of proofs
Integrate cleanly with Movement Move contracts
Remain upgrade-ready for native on-chain verification

## 🔐 On-Chain Enforcement

The Move module zk_verifier.move enforces ZK constraints by:
Storing cryptographic commitments
Accepting proof verification attestations
Preventing replay using nullifiers
Gating protocol actions behind verified proofs

## 🕸️ Architectural Overview
User
 ├─ Generates ZK proof (Groth16)
 ├─ Off-chain verifier checks proof validity
 ├─ Submits proof result to Movement
 └─ On-chain contract enforces rules

## Reason for using Off-Chain Verification

Movement currently does not have pairing precompiles (BN254 or BLS12-381), native Groth16/Plonk verifier syscalls so not possible to verify zkSNARK on-chain.

Voxel therefore uses:
Off-chain cryptographic verification
On-chain enforcement with commitments and nullifiers
This is a standard and secure design pattern I have used similar to privacy-preserving protocols on chains without native verifier support.

## 🔄 Upgrade Path

The ZK system is designed to be verifier-agnostic.
If Movement exposes native zkSNARK verification in the future:
Off-chain verification can be replaced
On-chain logic remains unchanged
Proof format remains compatible
Only the verification step changes.

## 🛠 Stack

Circom – for circuits
Groth16 – proving system
snarkjs – for proof generation & verification mechanism
TypeScript – orchestration and chain interaction

## Verified End-to-End Flow
This flow has been tested successfully on Movement Testnet.
Script - submit_ownership.ts has end to end integration test for ZK part and was run and following log obtained:
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
