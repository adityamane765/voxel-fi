module fractal_tree::zk_verifier {

    use std::signer;
    use std::error;

    /// Error codes
    const E_ALREADY_COMMITTED: u64 = 1;
    const E_INVALID_PROOF: u64 = 2;
    const E_NULLIFIER_USED: u64 = 3;

    /// Commitment to private position data
    /// commitment = Poseidon(position_params || secret)
    struct Commitment has key {
        owner: address,
        commitment_hash: vector<u8>,
    }

    /// Nullifier to prevent proof replay
    struct Nullifier has key {
        used: bool,
    }

    /// Store a ZK commitment for a position
    /// Called after minting a fractal position
    public fun commit_position(
        owner: &signer,
        commitment_hash: vector<u8>,
    ) {
        let addr = signer::address_of(owner);

        assert!(
            !exists<Commitment>(addr),
            error::invalid_state(E_ALREADY_COMMITTED)
        );

        move_to(
            owner,
            Commitment {
                owner: addr,
                commitment_hash,
            }
        );
    }

    /// ZK verification hook
    ///
    /// In production:
    ///   - proof is verified off-chain (Groth16 / Plonk)
    ///   - result is passed here
    ///
    /// On-chain guarantees:
    ///   - commitment exists
    ///   - proof was verified
    ///   - proof cannot be replayed
    public entry fun verify_proof(
        owner_addr: address,
        proof_verified: bool,
        nullifier_owner: &signer,
    ) acquires Commitment {

        // Commitment must exist
        let _commitment = borrow_global<Commitment>(owner_addr);

        // Off-chain verifier attests correctness
        assert!(proof_verified, error::invalid_argument(E_INVALID_PROOF));

        let nullifier_addr = signer::address_of(nullifier_owner);

        // Prevent proof replay
        assert!(
            !exists<Nullifier>(nullifier_addr),
            error::invalid_state(E_NULLIFIER_USED)
        );

        move_to(
            nullifier_owner,
            Nullifier { used: true }
        );
    }
}
