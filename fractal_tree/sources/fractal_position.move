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

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_COUNTER_NOT_INITIALIZED: u64 = 5;
    const E_DATA_STORE_NOT_INITIALIZED: u64 = 8;
    const E_POSITION_ALREADY_EXISTS: u64 = 9;
    const E_POSITION_NOT_FOUND: u64 = 10;
    const E_NOT_OWNER: u64 = 11;
    const E_NO_FEES_TO_CLAIM: u64 = 12;
    
    const COLLECTION_NAME: vector<u8> = b"Voxel Finance Positions";
    
    /// Fee precision (basis points: 1 = 0.01%)
    const FEE_PRECISION: u64 = 10000;
    const LP_FEE_BPS: u64 = 25;        // 0.25%
    const PROTOCOL_FEE_BPS: u64 = 5;   // 0.05%

    /// Enhanced position data with fee tracking
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
        volatility_bucket: u8,      // Captured at mint time
        
        // Fee tracking fields
        unclaimed_fees_x: u64,      // Accumulated fees in X
        unclaimed_fees_y: u64,      // Accumulated fees in Y
        total_fees_earned_x: u64,   // Lifetime fees in X
        total_fees_earned_y: u64,   // Lifetime fees in Y
        last_fee_checkpoint: u64,   // Timestamp of last fee update
    }

    /// Global fee accumulator for efficient distribution
    struct FeeAccumulator has key {
        // Global fee per liquidity unit (scaled by FEE_PRECISION)
        fees_per_liquidity_x: u128,
        fees_per_liquidity_y: u128,
        
        // Protocol treasury
        protocol_fees_x: u64,
        protocol_fees_y: u64,
        
        // Total fees ever collected
        total_fees_collected_x: u64,
        total_fees_collected_y: u64,
    }

    struct PositionDataStore has key {
        positions: Table<address, FractalPositionData>,
    }

    struct PositionCounter has key {
        next_id: u64,
    }

    // --- Events ---
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

    // --- Initialization ---
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
            string::utf8(b"https://voxel.finance/collection"),
            false, false, false, false, true, false, false, false, false,
            0, 100
        );
    }

    // --- Fee Distribution (called by vault after each swap) ---
    
    /// Distribute swap fees to active positions
    /// This is called by the vault module after processing a swap
    public fun distribute_fees<X, Y>(
        fees_x: u64,
        fees_y: u64,
        swap_price: u64,  // Price at which swap occurred
    ) acquires FeeAccumulator, PositionDataStore {
        if (fees_x == 0 && fees_y == 0) return;

        let fee_accumulator = borrow_global_mut<FeeAccumulator>(@fractal_tree);
        let data_store = borrow_global<PositionDataStore>(@fractal_tree);

        // Split fees between LP and protocol
        let lp_fees_x = fees_x * LP_FEE_BPS / (LP_FEE_BPS + PROTOCOL_FEE_BPS);
        let lp_fees_y = fees_y * LP_FEE_BPS / (LP_FEE_BPS + PROTOCOL_FEE_BPS);
        let protocol_x = fees_x - lp_fees_x;
        let protocol_y = fees_y - lp_fees_y;

        // Add to protocol treasury
        fee_accumulator.protocol_fees_x = fee_accumulator.protocol_fees_x + protocol_x;
        fee_accumulator.protocol_fees_y = fee_accumulator.protocol_fees_y + protocol_y;
        
        // Track total fees
        fee_accumulator.total_fees_collected_x = fee_accumulator.total_fees_collected_x + fees_x;
        fee_accumulator.total_fees_collected_y = fee_accumulator.total_fees_collected_y + fees_y;

        // Calculate total active liquidity at swap price
        let total_active_liquidity = calculate_total_active_liquidity(swap_price);
        
        if (total_active_liquidity > 0) {
            // Update global fee per liquidity (scaled by FEE_PRECISION for precision)
            let fees_per_liq_x = ((lp_fees_x as u128) * (FEE_PRECISION as u128)) / (total_active_liquidity as u128);
            let fees_per_liq_y = ((lp_fees_y as u128) * (FEE_PRECISION as u128)) / (total_active_liquidity as u128);
            
            fee_accumulator.fees_per_liquidity_x = fee_accumulator.fees_per_liquidity_x + fees_per_liq_x;
            fee_accumulator.fees_per_liquidity_y = fee_accumulator.fees_per_liquidity_y + fees_per_liq_y;
        };

        event::emit(FeesDistributed {
            total_lp_fees_x: lp_fees_x,
            total_lp_fees_y: lp_fees_y,
            protocol_fees_x: protocol_x,
            protocol_fees_y: protocol_y,
            active_positions_count: total_active_liquidity / 1000, // Rough estimate
        });
    }

    /// Calculate total active liquidity at a given price across all positions
    fun calculate_total_active_liquidity(price: u64): u64 acquires PositionDataStore {
        let data_store = borrow_global<PositionDataStore>(@fractal_tree);
        let total_liquidity = 0u64;
        
        // Iterate through all positions (in production, you'd use the octree for efficiency)
        // This is a simplified version - you'd want to query the spatial_octree
        // for positions near the swap price
        
        // For now, we'll need to track position addresses separately
        // or iterate through a known set of positions
        
        total_liquidity
    }

    /// Update fees for a specific position (called before mint/burn/claim)
    fun update_position_fees(
        position_data: &mut FractalPositionData,
        swap_price: u64,
    ) acquires FeeAccumulator {
        let fee_accumulator = borrow_global<FeeAccumulator>(@fractal_tree);
        
        // Calculate position's active liquidity at current price
        let active_liquidity = calculate_active_liquidity_for_position(
            position_data.total_liquidity,
            position_data.price_center,
            position_data.spread,
            swap_price
        );

        if (active_liquidity > 0) {
            // Calculate fees earned since last checkpoint
            let fees_x = ((active_liquidity as u128) * fee_accumulator.fees_per_liquidity_x / (FEE_PRECISION as u128)) as u64;
            let fees_y = ((active_liquidity as u128) * fee_accumulator.fees_per_liquidity_y / (FEE_PRECISION as u128)) as u64;
            
            position_data.unclaimed_fees_x = position_data.unclaimed_fees_x + fees_x;
            position_data.unclaimed_fees_y = position_data.unclaimed_fees_y + fees_y;
        };
    }

    fun calculate_active_liquidity_for_position(
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        current_price: u64
    ): u64 {
        let distance = if (current_price > price_center) {
            current_price - price_center
        } else {
            price_center - current_price
        };
        
        if (distance > spread) { return 0 };
        
        let normalized = distance * 100 / spread;
        linear_decay(total_liquidity, normalized)
    }

    // --- Core Functions ---
    
    public entry fun mint_position<X, Y>(
        owner: &signer,
        amount_x: u64,
        amount_y: u64,
        price_center: u64,
        spread: u64,
        fractal_type: u8,
        depth: u8,
    ) acquires PositionCounter, PositionDataStore, FeeAccumulator {
        let total_liquidity = amount_x + amount_y;
        let owner_addr = signer::address_of(owner);
        
        let counter = borrow_global_mut<PositionCounter>(@fractal_tree);
        let position_id = counter.next_id;
        counter.next_id = counter.next_id + 1;

        vault::deposit<X, Y>(
            coin::withdraw<X>(owner, amount_x),
            coin::withdraw<Y>(owner, amount_y)
        );

        let price_bucket = (price_center / 10) as u16;
        // Get actual volatility bucket from oracle
        let vol_bucket = fractal_tree::volatility_oracle::get_current_volatility_bucket<X, Y>();
        let depth_bucket = if (depth > 3) { 3 } else { depth };
        spatial_octree::insert(price_bucket, vol_bucket, depth_bucket, total_liquidity);

        let token_name = string::utf8(b"Voxel Position #");
        string::append(&mut token_name, u64_to_string(position_id));
        
        let token_obj: Object<AptosToken> = aptos_token::mint_token_object(
            owner,
            string::utf8(COLLECTION_NAME),
            string::utf8(b"A Voxel Finance LP Position"),
            token_name,
            string::utf8(b"https://voxel.finance/token/"),
            vector[],
            vector[],
            vector[],
        );

        let token_addr = object::object_address(&token_obj);
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        
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
            volatility_bucket: vol_bucket,  // Store captured volatility bucket
            unclaimed_fees_x: 0,
            unclaimed_fees_y: 0,
            total_fees_earned_x: 0,
            total_fees_earned_y: 0,
            last_fee_checkpoint: 0, // Could use timestamp
        });

        event::emit(PositionMinted { 
            position_id, 
            token_addr, 
            owner: owner_addr,
            amount_x,
            amount_y,
        });
    }

    /// Claim fees without burning the position
    public entry fun claim_fees<X, Y>(
        owner: &signer,
        position_object: Object<AptosToken>,
    ) acquires PositionDataStore, FeeAccumulator {
        let owner_addr = signer::address_of(owner);
        let token_addr = object::object_address(&position_object);
        
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        assert!(table::contains(&data_store.positions, token_addr), E_POSITION_NOT_FOUND);
        
        let position_data = table::borrow_mut(&mut data_store.positions, token_addr);
        assert!(position_data.owner == owner_addr, E_NOT_OWNER);
        
        let fees_x = position_data.unclaimed_fees_x;
        let fees_y = position_data.unclaimed_fees_y;
        
        assert!(fees_x > 0 || fees_y > 0, E_NO_FEES_TO_CLAIM);

        // Withdraw fees from vault
        let (fee_coins_x, fee_coins_y) = vault::withdraw<X, Y>(fees_x, fees_y);
        coin::deposit(owner_addr, fee_coins_x);
        coin::deposit(owner_addr, fee_coins_y);

        // Update position tracking
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
    ) acquires PositionDataStore, FeeAccumulator {
        let owner_addr = signer::address_of(owner);
        let data_store = borrow_global_mut<PositionDataStore>(@fractal_tree);
        let token_addr = object::object_address(&position_object);

        assert!(table::contains(&data_store.positions, token_addr), E_POSITION_NOT_FOUND);
        
        let position_data = table::remove(&mut data_store.positions, token_addr);
        assert!(position_data.owner == owner_addr, E_NOT_OWNER);

        // Remove from spatial index
        let price_bucket = (position_data.price_center / 10) as u16;
        let vol_bucket = if (position_data.depth > 3) { 3 } else { position_data.depth };
        let depth_bucket = if (position_data.depth > 3) { 3 } else { position_data.depth };
        spatial_octree::remove(price_bucket, vol_bucket, depth_bucket, position_data.total_liquidity);

        // Withdraw principal + accumulated fees
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

    // --- View Functions ---
    
    #[view]
    public fun get_position_data(token_addr: address): FractalPositionData acquires PositionDataStore {
        let data_store = borrow_global<PositionDataStore>(@fractal_tree);
        *table::borrow(&data_store.positions, token_addr)
    }

    #[view]
    public fun get_unclaimed_fees(token_addr: address): (u64, u64) acquires PositionDataStore {
        let position_data = get_position_data(token_addr);
        (position_data.unclaimed_fees_x, position_data.unclaimed_fees_y)
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
        calculate_active_liquidity_for_position(
            position_data.total_liquidity,
            position_data.price_center,
            position_data.spread,
            price
        )
    }

    // --- Helper Functions ---
    
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

    fun linear_decay(total: u64, normalized_distance: u64): u64 {
        if (normalized_distance >= 100) {
            0
        } else {
            total * (100 - normalized_distance) / 100
        }
    }
}