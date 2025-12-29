module fractal_tree::spatial_octree {
    use std::signer;
    use std::error;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::event;

    /// Error codes
    const E_INVALID_BUCKET: u64 = 1;
    const E_OCTREE_NOT_DEPLOYED: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_INSUFFICIENT_LIQUIDITY_IN_CELL: u64 = 4;
    const E_OCTREE_ALREADY_DEPLOYED: u64 = 5;  // Added

    /// Precision limits (documented)
    const MAX_PRICE_BUCKET: u16 = 4095;
    const MAX_VOL_BUCKET: u8 = 3;
    const MAX_DEPTH_BUCKET: u8 = 3;

    /// The single global spatial index, stored at the module's address
    struct Octree has key {
        cells: Table<u64, u64>, // morton_key -> total liquidity
    }

    // Events
    #[event]
    struct LiquidityInserted has drop, store {
        morton_key: u64,
        liquidity: u64,
        price_bucket: u16,
        vol_bucket: u8,
        depth_bucket: u8,
    }

    #[event]
    struct LiquidityRemoved has drop, store {
        morton_key: u64,
        liquidity: u64,
    }

    // Initialize the spatial index once by the deployer
    // FIXED: Corrected the assertion logic
    public entry fun init(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(deployer_addr == @fractal_tree, error::permission_denied(E_NOT_AUTHORIZED));
        
        // FIXED: Check that octree does NOT exist yet (was checking that it DID exist)
        assert!(!exists<Octree>(@fractal_tree), error::already_exists(E_OCTREE_ALREADY_DEPLOYED));
        
        move_to(deployer, Octree {
            cells: table::new<u64, u64>(),
        });
    }

    /// Insert liquidity into a spatial cell (for internal module calls)
    public fun insert(
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {
        assert!(exists<Octree>(@fractal_tree), error::not_found(E_OCTREE_NOT_DEPLOYED));

        // Validate buckets are within limits
        assert!(price_bucket <= MAX_PRICE_BUCKET, error::invalid_argument(E_INVALID_BUCKET));
        assert!(vol_bucket <= MAX_VOL_BUCKET, error::invalid_argument(E_INVALID_BUCKET));
        assert!(depth <= MAX_DEPTH_BUCKET, error::invalid_argument(E_INVALID_BUCKET));

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(@fractal_tree);

        if (table::contains(&octree.cells, morton)) {
            let current = table::borrow_mut(&mut octree.cells, morton);
            *current = *current + liquidity;
        } else {
            table::add(&mut octree.cells, morton, liquidity);
        };

        event::emit(LiquidityInserted {
            morton_key: morton,
            liquidity,
            price_bucket,
            vol_bucket,
            depth_bucket: depth,
        });
    }

    /// Remove liquidity from a spatial cell (for internal module calls)
    public fun remove(
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {
        assert!(exists<Octree>(@fractal_tree), error::not_found(E_OCTREE_NOT_DEPLOYED));

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(@fractal_tree);

        assert!(table::contains(&octree.cells, morton), error::invalid_argument(E_INVALID_BUCKET));

        let current = table::borrow_mut(&mut octree.cells, morton);
        assert!(*current >= liquidity, error::invalid_argument(E_INSUFFICIENT_LIQUIDITY_IN_CELL));

        *current = *current - liquidity;

        event::emit(LiquidityRemoved {
            morton_key: morton,
            liquidity,
        });
    }

    // Query total liquidity at a spatial point (read-only)
    #[view]
    public fun query(
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
    ): u64 acquires Octree {
        assert!(exists<Octree>(@fractal_tree), error::not_found(E_OCTREE_NOT_DEPLOYED));

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global<Octree>(@fractal_tree);

        if (table::contains(&octree.cells, morton)) {
            *table::borrow(&octree.cells, morton)
        } else {
            0
        }
    }

    /// Morton encode (Z-order–style packing)
    /// Encodes 3D coordinates into a single u64 using bit interleaving
    fun morton_encode(
        price: u16,
        vol: u8,
        depth: u8,
    ): u64 {
        let p = price & 0x0FFF;  // 12 bits
        let v = vol & 0x03;      // 2 bits
        let d = depth & 0x03;    // 2 bits

        (p as u64)
        | ((v as u64) << 12)
        | ((d as u64) << 14)
    }
}