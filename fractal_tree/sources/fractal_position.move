module fractal_tree::fractal_position {

    use std::signer;
    use std::error;

    use fractal_tree::vault;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_INVALID_PARAMS: u64 = 2;

    /// Supported fractal types (MVP)
    /// 0 = Binary decay
    /// 1 = Fibonacci-like decay
    const FRACTAL_BINARY: u8 = 0;
    const FRACTAL_FIBONACCI: u8 = 1;

    /// A single fractal LP position
    /// This does NOT store ranges — only rules
    struct FractalPosition has key {
        id: u64,
        owner: address,
        total_liquidity: u64,

        price_center: u64,
        spread: u64,

        fractal_type: u8,
        depth: u8,
    }

    /// Global position counter
    struct PositionCounter has key {
        next_id: u64,
    }

    /// Initialize position counter (call once)
    public fun init_counter(admin: &signer) {
        move_to(admin, PositionCounter { next_id: 0 });
    }

    /// Mint a new fractal LP position
    /// Liquidity is deposited into the Vault
    public fun mint_position(
        owner: &signer,
        vault_admin: address,
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    ) acquires PositionCounter {

        // Basic sanity checks
        assert!(total_liquidity > 0, error::invalid_argument(E_INVALID_PARAMS));
        assert!(spread > 0, error::invalid_argument(E_INVALID_PARAMS));
        assert!(depth > 0 && depth <= 8, error::invalid_argument(E_INVALID_PARAMS));
        assert!(
            fractal_type == FRACTAL_BINARY || fractal_type == FRACTAL_FIBONACCI,
            error::invalid_argument(E_INVALID_PARAMS)
        );

        let counter = borrow_global_mut<PositionCounter>(
            signer::address_of(owner)
        );

        let position_id = counter.next_id;
        counter.next_id = counter.next_id + 1;

        // Deposit liquidity into the vault
        // (modeled as X-only for MVP)
        vault::deposit(
            vault_admin,
            total_liquidity,
            0,
            owner
        );

        move_to(
            owner,
            FractalPosition {
                id: position_id,
                owner: signer::address_of(owner),
                total_liquidity: total_liquidity,
                price_center: price_center,
                spread: spread,
                fractal_type: fractal_type,
                depth: depth,
            }
        );
    }

    /// Compute how much liquidity is active at a given price
    /// This is PURE computation — no state changes
    public fun liquidity_at_price(
        position_owner: address,
        price: u64,
    ): u64 acquires FractalPosition {

        let position = borrow_global<FractalPosition>(position_owner);

        let distance = if (price > position.price_center) {
            price - position.price_center
        } else {
            position.price_center - price
        };

        // Outside spread → zero liquidity
        if (distance > position.spread) {
            return 0;
        };

        let normalized = distance * 100 / position.spread;

        // Apply fractal decay
        if (position.fractal_type == FRACTAL_BINARY) {
            binary_decay(position.total_liquidity, normalized, position.depth)
        } else {
            fibonacci_decay(position.total_liquidity, normalized, position.depth)
        }
    }

    /// Binary decay: liquidity halves each level
    fun binary_decay(
        total: u64,
        normalized_distance: u64,
        depth: u8,
    ): u64 {
        let depth_u64 = depth as u64;
        let level_u64 = normalized_distance * depth_u64 / 100;

        let capped_u64 = if (level_u64 >= depth_u64) {
            depth_u64
        } else {
            level_u64
        };

        total >> (capped_u64 as u8)
    }

    /// Fibonacci-like decay (approximate golden ratio decay)
    fun fibonacci_decay(
        total: u64,
        normalized_distance: u64,
        depth: u8,
    ): u64 {
        let depth_u64 = depth as u64;
        let level_u64 = normalized_distance * depth_u64 / 100;

        let capped_u8 = if (level_u64 >= depth_u64) {
            depth
        } else {
            level_u64 as u8
        };

        let liquidity = total;
        let i = 0;

        while (i < capped_u8) {
            liquidity = liquidity * 618 / 1000; // ~0.618
            i = i + 1;
        };

        liquidity
    }
}