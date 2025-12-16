module fractal_tree::fractal_position {

    use std::signer;
    use std::error;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::event;
    use aptos_framework::coin;
    use fractal_tree::vault;
    use fractal_tree::spatial_octree;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_INVALID_PARAMS: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_POSITION_NOT_FOUND: u64 = 4;
    const E_COUNTER_NOT_INITIALIZED: u64 = 5;

    /// Supported fractal types (MVP)
    const FRACTAL_BINARY: u8 = 0;
    const FRACTAL_FIBONACCI: u8 = 1;
    const FRACTAL_LINEAR: u8 = 2;
    const FRACTAL_EXPONENTIAL: u8 = 3;
    const FRACTAL_CANTOR: u8 = 4;

    /// A single fractal LP position
    struct FractalPosition has store {
        id: u64,
        owner: address,
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    }

    /// Multiple positions per user using Table
    struct Positions has key {
        positions: Table<u64, FractalPosition>,
        owner: address,
    }

    /// Global position counter stored at module address
    struct PositionCounter has key {
        next_id: u64,
    }

    // Events
    #[event]
    struct PositionMinted has drop, store {
        position_id: u64,
        owner: address,
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    }

    #[event]
    struct PositionBurned has drop, store {
        position_id: u64,
        owner: address,
    }

    /// Initialize position counter (call once by module deployer)
    public entry fun init_counter(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Only module deployer can initialize
        assert!(
            admin_addr == @fractal_tree,
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        move_to(admin, PositionCounter { next_id: 0 });
    }

    /// Initialize positions storage for a user
    fun init_positions_if_needed(owner: &signer) {
        let owner_addr = signer::address_of(owner);
        if (!exists<Positions>(owner_addr)) {
            move_to(owner, Positions {
                positions: table::new<u64, FractalPosition>(),
                owner: owner_addr,
            });
        };
    }

    /// Mint a new fractal LP position - ENTRY FUNCTION
    /// Withdraws coins from user's account and deposits into vault
    public entry fun mint_position<X, Y>(
        owner: &signer,
        amount_x: u64,
        amount_y: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    ) acquires PositionCounter, Positions {
        let vault_admin = owner;
        let total_liquidity = amount_x; // Using X token amount as liquidity

        // Basic sanity checks
        assert!(total_liquidity > 0, error::invalid_argument(E_INVALID_PARAMS));
        assert!(spread > 0, error::invalid_argument(E_INVALID_PARAMS));
        assert!(depth > 0 && depth <= 8, error::invalid_argument(E_INVALID_PARAMS));
        assert!(
            fractal_type <= FRACTAL_CANTOR,
            error::invalid_argument(E_INVALID_PARAMS)
        );

        // Use global counter at module address
        assert!(
            exists<PositionCounter>(@fractal_tree),
            error::not_found(E_COUNTER_NOT_INITIALIZED)
        );

        let counter = borrow_global_mut<PositionCounter>(@fractal_tree);
        let position_id = counter.next_id;
        counter.next_id = counter.next_id + 1;

        // Withdraw coins from owner's account
        let coins_x = coin::withdraw<X>(owner, amount_x);
        let coins_y = coin::withdraw<Y>(owner, amount_y);

        // Deposit liquidity into the vault
        vault::deposit<X, Y>(vault_admin, coins_x, coins_y);

        // Spatial octree wiring
        let price_bucket = (price_center / 10) as u16;
        let vol_bucket = if (depth > 3) { 3 } else { depth };
        let depth_bucket = if (depth > 3) { 3 } else { depth };

        spatial_octree::insert(
            vault_admin,
            price_bucket,
            vol_bucket,
            depth_bucket,
            total_liquidity
        );

        let owner_addr = signer::address_of(owner);

        // Initialize positions storage if needed
        init_positions_if_needed(owner);

        // Store position in table
        let positions = borrow_global_mut<Positions>(owner_addr);
        table::add(&mut positions.positions, position_id, FractalPosition {
            id: position_id,
            owner: owner_addr,
            total_liquidity,
            price_center,
            spread,
            fractal_type,
            depth,
        });

        event::emit(PositionMinted {
            position_id,
            owner: owner_addr,
            total_liquidity,
            price_center,
            spread,
            fractal_type,
            depth,
        });
    }

    /// Burn a position and withdraw liquidity - ENTRY FUNCTION
    public entry fun burn_position<X, Y>(
        owner: &signer,
        position_id: u64,
    ) acquires Positions {
        let vault_admin = owner;
        let owner_addr = signer::address_of(owner);

        assert!(
            exists<Positions>(owner_addr),
            error::not_found(E_POSITION_NOT_FOUND)
        );

        let positions = borrow_global_mut<Positions>(owner_addr);
        
        assert!(
            table::contains(&positions.positions, position_id),
            error::not_found(E_POSITION_NOT_FOUND)
        );

        // Destructure the position to consume it (no drop ability)
        let FractalPosition {
            id: _,
            owner: position_owner,
            total_liquidity,
            price_center,
            spread: _,
            fractal_type: _,
            depth,
        } = table::remove(&mut positions.positions, position_id);

        assert!(
            position_owner == owner_addr,
            error::permission_denied(E_NOT_OWNER)
        );

        // Remove from spatial octree
        let price_bucket = (price_center / 10) as u16;
        let vol_bucket = if (depth > 3) { 3 } else { depth };
        let depth_bucket = if (depth > 3) { 3 } else { depth };

        spatial_octree::remove(
            vault_admin,
            price_bucket,
            vol_bucket,
            depth_bucket,
            total_liquidity
        );

        // Withdraw liquidity from vault
        let (coins_x, coins_y) = vault::withdraw<X, Y>(
            vault_admin,
            total_liquidity,
            0
        );

        // Transfer coins back to owner
        coin::deposit(owner_addr, coins_x);
        coin::deposit(owner_addr, coins_y);

        event::emit(PositionBurned {
            position_id,
            owner: owner_addr,
        });
    }

    // Compute how much liquidity is active at a given price
    // This is PURE computation — no state changes
    #[view]
    public fun liquidity_at_price(
        position_owner: address,
        position_id: u64,
        price: u64,
    ): u64 acquires Positions {
        if (!exists<Positions>(position_owner)) {
            return 0
        };

        let positions = borrow_global<Positions>(position_owner);
        
        if (!table::contains(&positions.positions, position_id)) {
            return 0
        };

        let position = table::borrow(&positions.positions, position_id);

        let distance = if (price > position.price_center) {
            price - position.price_center
        } else {
            position.price_center - price
        };

        // Outside spread → zero liquidity
        if (distance > position.spread) {
            return 0
        };

        let normalized = distance * 100 / position.spread;

        // Apply fractal decay
        if (position.fractal_type == FRACTAL_BINARY) {
            binary_decay(position.total_liquidity, normalized, position.depth)
        } else if (position.fractal_type == FRACTAL_FIBONACCI) {
            fibonacci_decay(position.total_liquidity, normalized, position.depth)
        } else if (position.fractal_type == FRACTAL_LINEAR) {
            linear_decay(position.total_liquidity, normalized)
        } else if (position.fractal_type == FRACTAL_EXPONENTIAL) {
            exponential_decay(position.total_liquidity, normalized)
        } else {
            cantor_decay(position.total_liquidity, normalized, position.depth)
        }
    }

    // Get a position by ID
    #[view]
    public fun get_position(
        position_owner: address,
        position_id: u64,
    ): (u64, address, u64, u64, u64, u8, u8) acquires Positions {
        let positions = borrow_global<Positions>(position_owner);
        let position = table::borrow(&positions.positions, position_id);
        
        (
            position.id,
            position.owner,
            position.total_liquidity,
            position.price_center,
            position.spread,
            position.fractal_type,
            position.depth,
        )
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

    /// Linear decay: liquidity decreases uniformly with distance
    fun linear_decay(
        total: u64,
        normalized_distance: u64,
    ): u64 {
        if (normalized_distance >= 100) {
            0
        } else {
            total * (100 - normalized_distance) / 100
        }
    }

    /// Exponential decay: fast drop-off for tail hedging
    fun exponential_decay(
        total: u64,
        normalized_distance: u64,
    ): u64 {
        if (normalized_distance >= 100) {
            0
        } else {
            // approximate exp decay: (0.9 ^ distance)
            let factor = 100 - (normalized_distance * 9 / 10);
            total * factor / 100
        }
    }

    /// Cantor-like decay: liquidity only at discrete bands
    fun cantor_decay(
        total: u64,
        normalized_distance: u64,
        depth: u8,
    ): u64 {
        let band = normalized_distance / (100 / (depth as u64));
        if (band % 2 == 0) {
            total / (band + 1)
        } else {
            0
        }
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