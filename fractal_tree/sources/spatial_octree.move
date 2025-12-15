module fractal_tree::spatial_octree {

    use std::error;
    use aptos_framework::table;

    /// Error codes
    const E_INVALID_BUCKET: u64 = 1;

    /// Spatial index storing aggregated liquidity per Morton cell
    struct Octree has key {
        cells: table::Table<u64, u64>, // morton_key -> total liquidity
    }

    /// Initialize the spatial index (call once)
    public fun init(admin: &signer) {
        move_to(admin, Octree {
            cells: table::new<u64, u64>(),
        });
    }

    /// Insert liquidity into a spatial cell
    public fun insert(
        admin_addr: address,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(admin_addr);

        if (table::contains(&octree.cells, morton)) {
            let current = table::borrow_mut(&mut octree.cells, morton);
            *current = *current + liquidity;
        } else {
            table::add(&mut octree.cells, morton, liquidity);
        }
    }

    /// Remove liquidity from a spatial cell
    public fun remove(
        admin_addr: address,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
        liquidity: u64,
    ) acquires Octree {

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global_mut<Octree>(admin_addr);

        let current = table::borrow_mut(&mut octree.cells, morton);
        assert!(*current >= liquidity, error::invalid_argument(E_INVALID_BUCKET));
        *current = *current - liquidity;
    }

    /// Query total liquidity at a spatial point
    public fun query(
        admin_addr: address,
        price_bucket: u16,
        vol_bucket: u8,
        depth: u8,
    ): u64 acquires Octree {

        let morton = morton_encode(price_bucket, vol_bucket, depth);
        let octree = borrow_global<Octree>(admin_addr);

        if (table::contains(&octree.cells, morton)) {
            *table::borrow(&octree.cells, morton)
        } else {
            0
        }
    }

    /// Morton encode (Z-order–style packing)
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
