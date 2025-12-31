module fractal_tree::fractal_position {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::aptos_token::{Self, AptosToken};
    use fractal_tree::vault;
    use fractal_tree::spatial_octree;
    use fractal_tree::volatility_oracle;
    
    friend fractal_tree::fee_distributor;
    
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_COUNTER_NOT_INITIALIZED: u64 = 5;
    const E_DATA_STORE_NOT_INITIALIZED: u64 = 8;
    const E_POSITION_ALREADY_EXISTS: u64 = 9;
    const E_POSITION_NOT_FOUND: u64 = 10;
    const E_NOT_OWNER: u64 = 11;
    const E_NO_FEES_TO_CLAIM: u64 = 12;
    const E_INVALID_SPREAD: u64 = 13;
    const E_ZERO_LIQUIDITY: u64 = 14;
    const E_INVALID_PRICE: u64 = 15;
    
    const COLLECTION_NAME: vector<u8> = b"Voxel Positions";
    const FEE_PRECISION: u64 = 1000000000000; // 1e12 for better precision
    const LP_FEE_BPS: u64 = 25;  // 0.25%
    const PROTOCOL_FEE_BPS: u64 = 5;  // 0.05%
    
    struct FractalPositionData has store, drop, copy {
        id: u64,
        owner: address,
        token_name: String,
        amount_x: u64,
        amount_y: u64,
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
        volatility_bucket: u8,
        unclaimed_fees_x: u64,
        unclaimed_fees_y: u64,
        total_fees_earned_x: u64,
        total_fees_earned_y: u64,
        last_fee_checkpoint_x: u128,
        last_fee_checkpoint_y: u128,
    }
    
    struct FeeAccumulator has key {
        fees_per_liquidity_x: u128,
        fees_per_liquidity_y: u128,
        protocol_fees_x: u64,
        protocol_fees_y: u64,
        total_fees_collected_x: u64,
        total_fees_collected_y: u64,
    }
    
    struct PositionDataStore has key {
        positions: Table<address, FractalPositionData>,
    }
    
    struct PositionCounter has key {
        next_id: u64,
    }
    
    struct PositionRegistry has key {
        active_positions: vector<address>,
    }
    
    #[event]
    struct PositionMinted has drop, store {
        position_id: u64,
        token_addr: address,
        owner: address,
        amount_x: u64,
        amount_y: u64,
    }
    
    #[event]
    struct PositionBurned has drop, store {
        token_addr: address,
        owner: address,
        fees_claimed_x: u64,
        fees_claimed_y: u64,
    }
    
    #[event]
    struct FeesClaimed has drop, store {
        token_addr: address,
        owner: address,
        fees_x: u64,
        fees_y: u64,
    }
    
    #[event]
    struct FeesDistributed has drop, store {
        total_lp_fees_x: u64,
        total_lp_fees_y: u64,
        protocol_fees_x: u64,
        protocol_fees_y: u64,
        active_positions_count: u64,
    }
    
    // ===== INITIALIZATION =====
    
    public entry fun init_counter(deployer: &signer) {
        assert!(signer::address_of(deployer) == @fractal_tree, E_NOT_AUTHORIZED);
        if (!exists<PositionCounter>(@fractal_tree)) {
            move_to(deployer, PositionCounter { next_id: 0 });
        };
    }
    
    public entry fun init_data_store(deployer: &signer) {
        assert!(signer::address_of(deployer) == @fractal_tree, E_NOT_AUTHORIZED);
        if (!exists<PositionDataStore>(@fractal_tree)) {
            move_to(deployer, PositionDataStore { positions: table::new() });
        };
    }
    
    public entry fun init_registry(deployer: &signer) {
        assert!(signer::address_of(deployer) == @fractal_tree, E_NOT_AUTHORIZED);
        if (!exists<PositionRegistry>(@fractal_tree)) {
            move_to(deployer, PositionRegistry {
                active_positions: vector::empty()
            });
        };
    }
    
    public entry fun init_fee_accumulator(deployer: &signer) {
        assert!(signer::address_of(deployer) == @fractal_tree, E_NOT_AUTHORIZED);
        if (!exists<FeeAccumulator>(@fractal_tree)) {
            move_to(deployer, FeeAccumulator {
                fees_per_liquidity_x: 0,
                fees_per_liquidity_y: 0,
                protocol_fees_x: 0,
                protocol_fees_y: 0,
                total_fees_collected_x: 0,
                total_fees_collected_y: 0,
            });
        };
    }
    
    public entry fun init_collection(deployer: &signer) {
        aptos_token::create_collection(
            deployer,
            string::utf8(b"NFTs representing structured liquidity positions."),
            10000000,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"https://voxel-fi/collection"),
            false, false, false, false, true, false, false, false, false,
            0, 100
        );
    }
    
    // ===== FEE DISTRIBUTION =====
    
    /// Called by fee_distributor after each swap to distribute fees to LPs
    public(friend) fun distribute_fees<X, Y>(
        fees_x: u64,
        fees_y: u64,
        swap_price: u64,
    ) acquires FeeAccumulator, PositionDataStore, PositionRegistry {
        if (fees_x == 0 && fees_y == 0) return;
        
        let fee_accumulator = borrow_global_mut<FeeAccumulator>(@fractal_tree);
        
        // Split fees between LP and protocol
        let lp_fees_x = fees_x * LP_FEE_BPS / (LP_FEE_BPS + PROTOCOL_FEE_BPS);
        let lp_fees_y = fees_y * LP_FEE_BPS / (LP_FEE_BPS + PROTOCOL_FEE_BPS);
        let protocol_x = fees_x - lp_fees_x;
        let protocol_y = fees_y - lp_fees_y;
        
        // Add to protocol treasury
        fee_accumulator.protocol_fees_x = fee_accumulator.protocol_fees_x + protocol_x;
        fee_accumulator.protocol_fees_y = fee_accumulator.protocol_fees_y + protocol_y;
        fee_accumulator.total_fees_collected_x = fee_accumulator.total_fees_collected_x + fees_x;
        fee_accumulator.total_fees_collected_y = fee_accumulator.total_fees_collected_y + fees_y;
        
        // Calculate total active liquidity at swap price
        let total_active_liquidity = calculate_total_active_liquidity(swap_price);
        
        if (total_active_liquidity > 0) {
            // Update global fee per liquidity accumulators
            let fees_per_liq_x = ((lp_fees_x as u128) * (FEE_PRECISION as u128)) / (total_active_liquidity as u128);
            let fees_per_liq_y = ((lp_fees_y as u128) * (FEE_PRECISION as u128)) / (total_active_liquidity as u128);
            
            fee_accumulator.fees_per_liquidity_x = fee_accumulator.fees_per_liquidity_x + fees_per_liq_x;
            fee_accumulator.fees_per_liquidity_y = fee_accumulator.fees_per_liquidity_y + fees_per_liq_y;
        };
        
        let registry = borrow_global<PositionRegistry>(@fractal_tree);
        event::emit(FeesDistributed {
            total_lp_fees_x: lp_fees_x,
            total_lp_fees_y: lp_fees_y,
            protocol_fees_x: protocol_x,
            protocol_fees_y: protocol_y,
            active_positions_count: vector::length(&registry.active_positions),
        });
    }
    
    // ===== HELPER FUNCTIONS =====
    
    fun calculate_total_active_liquidity(price: u64): u64 acquires PositionDataStore, PositionRegistry {
        if (!exists<PositionRegistry>(@fractal_tree)) {
            return 0
        };
        
        let registry = borrow_global<PositionRegistry>(@fractal_tree);
        let data_store = borrow_global<PositionDataStore>(@fractal_tree);
        let total_liquidity = 0u64;
        let i = 0;
        let len = vector::length(&registry.active_positions);
        
        while (i < len) {
            let position_addr = *vector::borrow(&registry.active_positions, i);
            if (table::contains(&data_store.positions, position_addr)) {
                let position_data = table::borrow(&data_store.positions, position_addr);
                let active_liq = calculate_active_liquidity_for_position(position_data, price);
                total_liquidity = total_liquidity + active_liq;
            };
            i = i + 1;
        };
        
        total_liquidity
    }
    
    fun calculate_active_liquidity_for_position(
        position_data: &FractalPositionData,
        current_price: u64
    ): u64 {
        let distance = if (current_price > position_data.price_center) {
            current_price - position_data.price_center
        } else {
            position_data.price_center - current_price
        };
        
        if (distance > position_data.spread) { return 0 };
        
        let normalized = distance * 100 / position_data.spread;
        linear_decay(position_data.total_liquidity, normalized)
    }
    
    /// Calculate newly earned fees since last checkpoint
    fun calculate_newly_earned_fees(
        position_data: &FractalPositionData,
        current_market_price: u64,
    ): (u64, u64) acquires FeeAccumulator {
        let fee_accumulator = borrow_global<FeeAccumulator>(@fractal_tree);
        
        // Calculate growth since last checkpoint
        let fees_growth_x = fee_accumulator.fees_per_liquidity_x - position_data.last_fee_checkpoint_x;
        let fees_growth_y = fee_accumulator.fees_per_liquidity_y - position_data.last_fee_checkpoint_y;
        
        if (fees_growth_x == 0 && fees_growth_y == 0) {
            return (0, 0)
        };
        
        // Calculate active liquidity at current price
        let active_liquidity = calculate_active_liquidity_for_position(position_data, current_market_price);
        
        if (active_liquidity > 0) {
            let new_fees_x = ((active_liquidity as u128) * fees_growth_x / (FEE_PRECISION as u128)) as u64;
            let new_fees_y = ((active_liquidity as u128) * fees_growth_y / (FEE_PRECISION as u128)) as u64;
            (new_fees_x, new_fees_y)
        } else {
            (0, 0)
        }
    }
    
    /// Update position fees and checkpoint
    fun update_position_fees(
        position_data: &mut FractalPositionData,
        current_market_price: u64,
    ) acquires FeeAccumulator {
        let (new_fees_x, new_fees_y) = calculate_newly_earned_fees(position_data, current_market_price);
        
        if (new_fees_x > 0 || new_fees_y > 0) {
            position_data.unclaimed_fees_x = position_data.unclaimed_fees_x + new_fees_x;
            position_data.unclaimed_fees_y = position_data.unclaimed_fees_y + new_fees_y;
        };
        
        // Update checkpoints to current global accumulator values
        let fee_accumulator = borrow_global<FeeAccumulator>(@fractal_tree);
        position_data.last_fee_checkpoint_x = fee_accumulator.fees_per_liquidity_x;
        position_data.last_fee_checkpoint_y = fee_accumulator.fees_per_liquidity_y;
    }
    
    fun linear_decay(total: u64, normalized_distance: u64): u64 {
        if (normalized_distance >= 100) { 0 } else {
            total * (100 - normalized_distance) / 100
        }
    }

    /// Calculate square root using Newton's method (for geometric mean calculation)
    fun sqrt_u128(x: u128): u128 {
        if (x == 0) return 0;
        if (x <= 3) return 1;

        let z = x;
        let y = (x + 1) / 2;
        let iterations = 0;

        while (y < z && iterations < 20) {
            z = y;
            y = (x / y + y) / 2;
            iterations = iterations + 1;
        };

        z
    }
    
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };
        
        let buffer = vector::empty<u8>();
        let temp = value;
        while (temp > 0) {
            let digit = ((temp % 10) as u8) + 48;
            vector::push_back(&mut buffer, digit);
            temp = temp / 10;
        };
        vector::reverse(&mut buffer);
        string::utf8(buffer)
    }
    
    // ===== CORE FUNCTIONS =====
    
    public entry fun mint_position<X, Y>(
        owner: &signer,
        amount_x: u64,
        amount_y: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    ) acquires PositionCounter, PositionDataStore, FeeAccumulator, PositionRegistry {
        // Input validation
        assert!(amount_x > 0 || amount_y > 0, E_ZERO_LIQUIDITY);
        assert!(price_center > 0, E_INVALID_PRICE);
        assert!(spread > 0, E_INVALID_SPREAD);

        // Calculate total liquidity using geometric mean (like Uniswap V2)
        // This properly accounts for both tokens regardless of decimals or prices
        let total_liquidity = (sqrt_u128((amount_x as u128) * (amount_y as u128)) as u64);
        let owner_addr = signer::address_of(owner);
        
        let counter = borrow_global_mut<PositionCounter>(@fractal_tree);
        let position_id = counter.next_id;
        counter.next_id = counter.next_id + 1;
        
        // Deposit coins into vault
        vault::deposit<X, Y>(
            coin::withdraw<X>(owner, amount_x),
            coin::withdraw<Y>(owner, amount_y)
        );
        
        // Add to spatial index
        let price_bucket = (price_center / 10) as u16;
        let vol_bucket = volatility_oracle::get_current_volatility_bucket<X, Y>();
        let depth_bucket = if (depth > 3) { 3 } else { depth };
        spatial_octree::insert(price_bucket, vol_bucket, depth_bucket, total_liquidity);
        
        // Create NFT
        let token_name = string::utf8(b"Voxel position #");
        string::append(&mut token_name, u64_to_string(position_id));
        
        let token_obj: Object<AptosToken> = aptos_token::mint_token_object(
            owner,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"A Voxel Finance LP Position"),
            token_name,
            string::utf8(b"https://voxel.finance/token/"),
            vector[], vector[], vector[],
        );
        
        let token_addr = object::object_address(&token_obj);
        
        // Store position data with current checkpoint
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        let fee_accumulator = borrow_global<FeeAccumulator>(@fractal_tree);
        
        table::add(&mut data_store.positions, token_addr, FractalPositionData {
            id: position_id,
            owner: owner_addr,
            token_name,
            amount_x,
            amount_y,
            total_liquidity,
            price_center,
            spread,
            fractal_type,
            depth,
            volatility_bucket: vol_bucket,
            unclaimed_fees_x: 0,
            unclaimed_fees_y: 0,
            total_fees_earned_x: 0,
            total_fees_earned_y: 0,
            last_fee_checkpoint_x: fee_accumulator.fees_per_liquidity_x,
            last_fee_checkpoint_y: fee_accumulator.fees_per_liquidity_y,
        });
        
        // Add to registry
        let registry = borrow_global_mut<PositionRegistry>(@fractal_tree);
        vector::push_back(&mut registry.active_positions, token_addr);
        
        event::emit(PositionMinted {
            position_id,
            token_addr,
            owner: owner_addr,
            amount_x,
            amount_y,
        });
    }
    
    public entry fun claim_fees<X, Y>(
        owner: &signer,
        position_object: Object<AptosToken>,
        current_market_price: u64,
    ) acquires PositionDataStore, FeeAccumulator {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&position_object);
        
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        assert!(table::contains(&data_store.positions, token_addr), E_POSITION_NOT_FOUND);
        
        let position_data = table::borrow_mut(&mut data_store.positions, token_addr);
        assert!(position_data.owner == owner_addr, E_NOT_OWNER);
        
        // Update fees to current state
        update_position_fees(position_data, current_market_price);
        
        let fees_x = position_data.unclaimed_fees_x;
        let fees_y = position_data.unclaimed_fees_y;
        assert!(fees_x > 0 || fees_y > 0, E_NO_FEES_TO_CLAIM);
        
        // Withdraw fees from vault
        let (fee_coins_x, fee_coins_y) = vault::withdraw<X, Y>(fees_x, fees_y);
        coin::deposit(owner_addr, fee_coins_x);
        coin::deposit(owner_addr, fee_coins_y);
        
        // Update tracking
        position_data.total_fees_earned_x = position_data.total_fees_earned_x + fees_x;
        position_data.total_fees_earned_y = position_data.total_fees_earned_y + fees_y;
        position_data.unclaimed_fees_x = 0;
        position_data.unclaimed_fees_y = 0;
        
        event::emit(FeesClaimed {
            token_addr,
            owner: owner_addr,
            fees_x,
            fees_y,
        });
    }
    
    public entry fun burn_position<X, Y>(
        owner: &signer,
        position_object: Object<AptosToken>,
        current_market_price: u64,
    ) acquires PositionDataStore, FeeAccumulator, PositionRegistry {
        let owner_addr = signer::address_of(owner);
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        let token_addr = object::object_address(&position_object);
        
        assert!(table::contains(&data_store.positions, token_addr), E_POSITION_NOT_FOUND);
        
        let mut_position_data = table::borrow_mut(&mut data_store.positions, token_addr);
        assert!(mut_position_data.owner == owner_addr, E_NOT_OWNER);
        
        // Update fees before burning
        update_position_fees(mut_position_data, current_market_price);
        
        // Now remove the position
        let position_data = table::remove(&mut data_store.positions, token_addr);
        
        // Remove from registry
        let registry = borrow_global_mut<PositionRegistry>(@fractal_tree);
        let (found, idx) = vector::index_of(&registry.active_positions, &token_addr);
        if (found) {
            vector::remove(&mut registry.active_positions, idx);
        };
        
        // Remove from spatial index
        let price_bucket = (position_data.price_center / 10) as u16;
        let vol_bucket = position_data.volatility_bucket;
        let depth_bucket = if (position_data.depth > 3) { 3 } else { position_data.depth };
        spatial_octree::remove(price_bucket, vol_bucket, depth_bucket, position_data.total_liquidity);
        
        // Withdraw principal + fees
        let total_x = position_data.amount_x + position_data.unclaimed_fees_x;
        let total_y = position_data.amount_y + position_data.unclaimed_fees_y;
        let (coins_x, coins_y) = vault::withdraw<X, Y>(total_x, total_y);
        coin::deposit(owner_addr, coins_x);
        coin::deposit(owner_addr, coins_y);
        
        event::emit(PositionBurned {
            token_addr,
            owner: owner_addr,
            fees_claimed_x: position_data.unclaimed_fees_x,
            fees_claimed_y: position_data.unclaimed_fees_y,
        });
    }
    
    // ===== VIEW FUNCTIONS =====
    
    #[view]
    public fun get_position_data(token_addr: address): FractalPositionData acquires PositionDataStore {
        let data_store = borrow_global<PositionDataStore>(@fractal_tree);
        *table::borrow(&data_store.positions, token_addr)
    }
    
    #[view]
    public fun get_unclaimed_fees(token_addr: address, current_market_price: u64): (u64, u64) 
    acquires PositionDataStore, FeeAccumulator {
        let position_data = get_position_data(token_addr);
        let (new_fees_x, new_fees_y) = calculate_newly_earned_fees(&position_data, current_market_price);
        (position_data.unclaimed_fees_x + new_fees_x, position_data.unclaimed_fees_y + new_fees_y)
    }
    
    #[view]
    public fun get_total_fees_earned(token_addr: address): (u64, u64) acquires PositionDataStore {
        let position_data = get_position_data(token_addr);
        (position_data.total_fees_earned_x, position_data.total_fees_earned_y)
    }
    
    #[view]
    public fun get_global_fee_stats(): (u64, u64, u64, u64) acquires FeeAccumulator {
        let accumulator = borrow_global<FeeAccumulator>(@fractal_tree);
        (
            accumulator.total_fees_collected_x,
            accumulator.total_fees_collected_y,
            accumulator.protocol_fees_x,
            accumulator.protocol_fees_y,
        )
    }
    
    #[view]
    public fun liquidity_at_price(token_addr: address, price: u64): u64 acquires PositionDataStore {
        let position_data = get_position_data(token_addr);
        calculate_active_liquidity_for_position(&position_data, price)
    }
    
    // Individual field getters
    #[view]
    public fun get_position_field_id(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).id
    }
    
    #[view]
    public fun get_position_field_owner(token_addr: address): address acquires PositionDataStore {
        get_position_data(token_addr).owner
    }
    
    #[view]
    public fun get_position_field_amount_x(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).amount_x
    }
    
    #[view]
    public fun get_position_field_amount_y(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).amount_y
    }
    
    #[view]
    public fun get_position_field_total_liquidity(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).total_liquidity
    }
    
    #[view]
    public fun get_position_field_price_center(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).price_center
    }
    
    #[view]
    public fun get_position_field_spread(token_addr: address): u64 acquires PositionDataStore {
        get_position_data(token_addr).spread
    }
    
    #[view]
    public fun get_position_field_depth(token_addr: address): u8 acquires PositionDataStore {
        get_position_data(token_addr).depth
    }
    
    #[view]
    public fun get_position_field_volatility_bucket(token_addr: address): u8 acquires PositionDataStore {
        get_position_data(token_addr).volatility_bucket
    }
}