module fractal_tree::spatial_octree {

    use std::signer;
    use std::error;
    use aptos_framework::table;
    use aptos_framework::event;

    /// Error codes
    const E_INVALID_BUCKET: u64 = 1;
    const E_OCTREE_NOT_INITIALIZED: u64 = 2;

    /// Precision limits (documented)
    /// - Price buckets: 0-4095 (12 bits)
    /// - Volatility buckets: 0-3 (2 bits)
    /// - Depth buckets: 0-3 (2 bits)
    const MAX_PRICE_BUCKET: u16 = 4095;
    const MAX_VOL_BUCKET: u8 = 3;
    const MAX_DEPTH_BUCKET: u8 = 3;

    /// Spatial index storing aggregated liquidity per Morton cell
    struct Octree has key {
        cells: table::Table<u64, u64>, // morton_key -> total liquidity
        admin: address,
    }

    // Events
    #[event]
    struct LiquidityInserted has drop, store {
        admin: address,
        morton_key: u64,
        liquidity: u64,
        price_bucket: u16,
        vol_bucket: u8,
        depth_bucket: u8,
    }

    #[event]
    struct LiquidityRemoved has drop, store {
        admin: address,
        morton_key: u64,
        liquidity: u64,
    }

    // Initialize the spatial index (call once per admin)
    public entry fun init(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        move_to(admin, Octree {
            cells: table::new<u64, u64>(),
            admin: admin_addr,
        });
    }

    /// Insert liquidity into a spatial cell
    public fun insert(
        admin: &signer,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Octree>(admin_addr),
            error::not_found(E_OCTREE_NOT_INITIALIZED)
        );

        // Validate buckets are within limits
        assert!(price_bucket <= MAX_PRICE_BUCKET, error::invalid_argument(E_INVALID_BUCKET));
        assert!(vol_bucket <= MAX_VOL_BUCKET, error::invalid_argument(E_INVALID_BUCKET));
        assert!(depth <= MAX_DEPTH_BUCKET, error::invalid_argument(E_INVALID_BUCKET));

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(admin_addr);

        if (table::contains(&octree.cells, morton)) {
            let current = table::borrow_mut(&mut octree.cells, morton);
            *current = *current + liquidity;
        } else {
            table::add(&mut octree.cells, morton, liquidity);
        };

        event::emit(LiquidityInserted {
            admin: admin_addr,
            morton_key: morton,
            liquidity,
            price_bucket,
            vol_bucket,
            depth_bucket: depth,
        });
    }

    /// Remove liquidity from a spatial cell
    public fun remove(
        admin: &signer,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Octree>(admin_addr),
            error::not_found(E_OCTREE_NOT_INITIALIZED)
        );

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(admin_addr);

        assert!(
            table::contains(&octree.cells, morton),
            error::invalid_argument(E_INVALID_BUCKET)
        );

        let current = table::borrow_mut(&mut octree.cells, morton);
        assert!(*current >= liquidity, error::invalid_argument(E_INVALID_BUCKET));
        *current = *current - liquidity;

        event::emit(LiquidityRemoved {
            admin: admin_addr,
            morton_key: morton,
            liquidity,
        });
    }

    // Query total liquidity at a spatial point (read-only, no signer needed)
    #[view]
    public fun query(
        admin_addr: address,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
    ): u64 acquires Octree {
        if (!exists<Octree>(admin_addr)) {
            return 0
        };

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global<Octree>(admin_addr);

        if (table::contains(&octree.cells, morton)) {
            *table::borrow(&octree.cells, morton)
        } else {
            0
        }
    }

    /// Morton encode (Z-order–style packing)
    /// Packs 3 dimensions into a single u64:
    /// - 12 bits for price (0-4095)
    /// - 2 bits for volatility (0-3)
    /// - 2 bits for depth (0-3)
    fun morton_encode(
        price: u16,
        vol: u8,
        depth: u8,
    ): u64 {
        let p = price & 0x0FFF; // 12 bits
        let v = vol & 0x03;     // 2 bits
        let d = depth & 0x03;   // 2 bits

        (p as u64)
            | ((v as u64) << 12)
            | ((d as u64) << 14)
    }
}