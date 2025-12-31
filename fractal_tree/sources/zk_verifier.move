module fractal_tree::zk_verifier {

    use std::signer;
    use std::error;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::event;

    /// Error codes
    const E_ALREADY_COMMITTED: u64 =1;
    const E_INVALID_PROOF: u64 =2;
    const E_NULLIFIER_USED: u64 =3;
    const E_COMMITMENT_NOT_FOUND: u64 =4;

    /// store to allow multiple commitments per user
    struct Commitment has store {
        owner: address,
        commitment_hash: vector<u8>,
        position_id: u64,
    }

    /// store multiple commitments in a table
    struct Commitments has key {
        commitments: Table<u64, Commitment>, // position_id -> commitment
        owner: address,
    }

    /// track nullifiers per position instead of globally
    struct Nullifier has store {
        position_id: u64,
        used: bool,
    }
    struct Nullifiers has key {
        nullifiers: Table<u64, Nullifier>, // position_id -> nullifier
        owner: address,
    }

    // Events
    #[event]
    struct CommitmentCreated has drop, store {
        owner: address,
        position_id: u64,
        commitment_hash: vector<u8>,
    }
    #[event]
    struct ProofVerified has drop, store {
        user: address,
        owner: address,
        position_id: u64,
    }

    /// init commitments storage for a user
    fun init_commitments_if_needed(owner: &signer) {
        let owner_addr = signer::address_of(owner);
        if (!exists<Commitments>(owner_addr)) {
            move_to(owner, Commitments {
                commitments: table::new<u64, Commitment>(),
                owner: owner_addr,
            });
        };
    }

    /// init nullifiers storage for a user
    fun init_nullifiers_if_needed(user: &signer) {
        let user_addr = signer::address_of(user);
        if (!exists<Nullifiers>(user_addr)) {
            move_to(user, Nullifiers {
                nullifiers: table::new<u64, Nullifier>(),
                owner: user_addr,
            });
        };
    }

    /// store a ZK commitment for a position, multiple commitments supproted
    public entry fun commit_position(
        owner: &signer,
        position_id: u64,
        commitment_hash: vector<u8>,
    ) acquires Commitments {
        let owner_addr = signer::address_of(owner);
        init_commitments_if_needed(owner);
        let commitments = borrow_global_mut<Commitments>(owner_addr);
        assert!(
            !table::contains(&commitments.commitments, position_id),
            error::invalid_state(E_ALREADY_COMMITTED)
        );

        table::add(&mut commitments.commitments, position_id, Commitment {
            owner: owner_addr,
            commitment_hash,
            position_id,
        });
        event::emit(CommitmentCreated {
            owner: owner_addr,
            position_id,
            commitment_hash,
        });
    }

    /// ZK verification hook - verifies per position, snark verificn on chain not supported yet on movement
    public entry fun verify_proof(
        user: &signer,
        owner_addr: address,
        position_id: u64,
        proof_verified: bool,
    ) acquires Commitments, Nullifiers {
        assert!(
            exists<Commitments>(owner_addr),
            error::not_found(E_COMMITMENT_NOT_FOUND)
        );
        let commitments =borrow_global<Commitments>(owner_addr);
        assert!(
            table::contains(&commitments.commitments, position_id),
            error::not_found(E_COMMITMENT_NOT_FOUND)
        );
        let _commitment =table::borrow(&commitments.commitments, position_id);

        assert!(proof_verified, error::invalid_argument(E_INVALID_PROOF));
        let user_addr = signer::address_of(user);
        init_nullifiers_if_needed(user);
        let nullifiers = borrow_global_mut<Nullifiers>(user_addr);
        
        // Check if this position has already been proven by this user
        assert!(
            !table::contains(&nullifiers.nullifiers, position_id),
            error::invalid_state(E_NULLIFIER_USED)
        );

        table::add(&mut nullifiers.nullifiers, position_id, Nullifier {
            position_id,
            used: true,
        });

        event::emit(ProofVerified {
            user: user_addr,
            owner: owner_addr,
            position_id,
        });
    }

    // Check if a proof has been verified for a position
    #[view]
    public fun is_proof_verified(
        user_addr: address,
        position_id: u64,
    ): bool acquires Nullifiers {
        if (!exists<Nullifiers>(user_addr)) {
            return false
        };

        let nullifiers = borrow_global<Nullifiers>(user_addr);
        table::contains(&nullifiers.nullifiers, position_id)
    }

    // Get commitment for a position
    #[view]
    public fun get_commitment(
        owner_addr: address,
        position_id: u64,
    ): vector<u8> acquires Commitments {
        let commitments = borrow_global<Commitments>(owner_addr);
        let commitment = table::borrow(&commitments.commitments, position_id);
        commitment.commitment_hash
    }
}