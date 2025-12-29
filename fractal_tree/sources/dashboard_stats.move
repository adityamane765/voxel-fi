module fractal_tree::dashboard_stats {
    use fractal_tree::fractal_position;
    use fractal_tree::vault;
    use std::vector;

    /// Complete position stats for dashboard
    struct PositionStats has drop, copy {
        token_addr: address,
        position_id: u64,
        owner: address,

        // Liquidity info
        amount_x: u64,
        amount_y: u64,
        total_liquidity: u64,
        
        // Position parameters
        price_center: u64,
        spread: u64,
        depth: u8,
        volatility_bucket: u8,
        
        // Fee earnings
        unclaimed_fees_x: u64,
        unclaimed_fees_y: u64,
        total_fees_earned_x: u64,
        total_fees_earned_y: u64,
        
        // Current value (principal + unclaimed fees)
        current_value_x: u64,
        current_value_y: u64,
    }

    /// Global protocol statistics
    struct ProtocolStats has drop, copy {
        // Vault reserves
        total_reserve_x: u64,
        total_reserve_y: u64,
        
        // Fee statistics
        total_fees_collected_x: u64,
        total_fees_collected_y: u64,
        protocol_treasury_x: u64,
        protocol_treasury_y: u64,
        
        // Derived metrics
        total_value_locked: u64,  // Combined TVL
        protocol_fee_percentage: u64, // Basis points
    }

    /// User portfolio summary
    struct UserPortfolio has drop, copy {
        total_positions: u64,
        total_liquidity_provided: u64,
        total_fees_earned_x: u64,
        total_fees_earned_y: u64,
        unclaimed_fees_x: u64,
        unclaimed_fees_y: u64,
    }

    // --- View Functions for Dashboard ---
    /// Get complete statistics for a single position
    #[view]
    public fun get_position_stats<X, Y>(token_addr: address): PositionStats {
        let position_data = fractal_position::get_position_data(token_addr);
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(token_addr);
        let (total_earned_x, total_earned_y) = fractal_position::get_total_fees_earned(token_addr);

        PositionStats {
            token_addr,
            position_id: position_data.id,
            owner: position_data.owner,
            amount_x: position_data.amount_x,
            amount_y: position_data.amount_y,
            total_liquidity: position_data.total_liquidity,
            price_center: position_data.price_center,
            spread: position_data.spread,
            depth: position_data.depth,
            volatility_bucket: position_data.volatility_bucket,
            unclaimed_fees_x: unclaimed_x,
            unclaimed_fees_y: unclaimed_y,
            total_fees_earned_x: total_earned_x,
            total_fees_earned_y: total_earned_y,
            current_value_x: position_data.amount_x + unclaimed_x,
            current_value_y: position_data.amount_y + unclaimed_y,
        }
    }
    /// Get protocol-wide statistics
    #[view]
    public fun get_protocol_stats<X, Y>(): ProtocolStats {
        let (reserve_x, reserve_y) = vault::get_reserves<X, Y>();
        let (total_fees_x, total_fees_y, protocol_x, protocol_y) = 
            fractal_position::get_global_fee_stats();
        ProtocolStats {
            total_reserve_x: reserve_x,
            total_reserve_y: reserve_y,
            total_fees_collected_x: total_fees_x,
            total_fees_collected_y: total_fees_y,
            protocol_treasury_x: protocol_x,
            protocol_treasury_y: protocol_y,
            total_value_locked: reserve_x + reserve_y, // Simplified TVL
            protocol_fee_percentage: 5, // 0.05% = 5 basis points
        }
    }

    /// Calculate APR for a position based on recent fees
    /// Returns APR in basis points (e.g., 1500 = 15%)
    #[view]
    public fun estimate_position_apr<X, Y>(
        token_addr: address,
        time_period_days: u64,  // Period over which fees were earned
    ): u64 {
        let position_data = fractal_position::get_position_data(token_addr);
        let (fees_x, fees_y) = fractal_position::get_unclaimed_fees(token_addr);
        
        if (time_period_days == 0) {
            return 0
        };
        // Calculate total fees as percentage of principal
        let total_principal = position_data.amount_x + position_data.amount_y;
        let total_fees = fees_x + fees_y;
        if (total_principal == 0) {
            return 0
        };
        // Annualize: (fees / principal) * (365 / days) * 10000 (for basis points)
        let daily_return = (total_fees * 10000) / total_principal;
        let annual_return = (daily_return * 365) / time_period_days;       
        annual_return
    }

    /// Get liquidity depth at current price
    #[view]
    public fun get_liquidity_depth<X, Y>(
        token_addr: address,
        current_price: u64,
    ): u64 {
        fractal_position::liquidity_at_price(token_addr, current_price)
    }

    /// Calculate position health score (0-100)
    /// Based on: fee earnings, liquidity utilization, price proximity
    #[view]
    public fun calculate_position_health<X, Y>(
        token_addr: address,
        current_market_price: u64,
    ): u8 {
        let position_data = fractal_position::get_position_data(token_addr);
        let active_liquidity = fractal_position::liquidity_at_price(
            token_addr, 
            current_market_price
        );
        // Score components
        let mut score = 0u8;
        // 1. Active liquidity (40 points max)
        let liquidity_ratio = if (position_data.total_liquidity > 0) {
            (active_liquidity * 100) / position_data.total_liquidity
        } else {
            0
        };
        score = score + ((liquidity_ratio * 40 / 100) as u8);
        // 2. Fee generation (30 points max)
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(token_addr);
        let fees_ratio = if (position_data.total_liquidity > 0) {
            ((unclaimed_x + unclaimed_y) * 100) / position_data.total_liquidity
        } else {
            0
        };
        score = score + (if (fees_ratio > 30) { 30 } else { fees_ratio as u8 });

        // 3. Price proximity (30 points max)
        let price_distance = if (current_market_price > position_data.price_center) {
            current_market_price - position_data.price_center
        } else {
            position_data.price_center - current_market_price
        };
        let proximity_score = if (price_distance <= position_data.spread) {
            30 - ((price_distance * 30) / position_data.spread)
        } else {
            0
        };
        score = score + (proximity_score as u8);
        score
    }

    /// Get impermanent loss estimate
    /// Returns percentage loss in basis points (e.g., 150 = 1.5%)
    #[view]
    public fun estimate_impermanent_loss<X, Y>(
        token_addr: address,
        initial_price: u64,
        current_price: u64,
    ): u64 {
        if (initial_price == 0) {
            return 0
        };
        // Simplified IL calculation: sqrt(price_ratio) * 2 / (1 + price_ratio) - 1
        // This is an approximation suitable for on-chain calculation
        let price_ratio = (current_price * 1000) / initial_price;
        
        if (price_ratio == 1000) { // No price change
            return 0
        };
        // For significant price changes, IL can be substantial
        // Approximate formula for IL percentage
        let il_percent = if (price_ratio > 1000) {
            // Price increased
            ((price_ratio - 1000) * (price_ratio - 1000)) / (4 * 1000)
        } else {
            // Price decreased
            ((1000 - price_ratio) * (1000 - price_ratio)) / (4 * 1000)
        };
        il_percent
    }

    /// Get recommended actions for a position
    #[view]
    public fun get_position_recommendations<X, Y>(
        token_addr: address,
        current_market_price: u64,
    ): vector<u8> {
        let position_data = fractal_position::get_position_data(token_addr);
        let active_liq = fractal_position::liquidity_at_price(token_addr, current_market_price);
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(token_addr);

        // Simple recommendation encoding:
        // 0 = All good, no action needed
        // 1 = Claim fees (high unclaimed)
        // 2 = Rebalance position (price out of range)
        // 3 = Consider closing (very low activity)

        let recommendations = vector::empty<u8>();
        // Check if fees should be claimed (>5% of principal)
        let fee_threshold = position_data.total_liquidity / 20; // 5%
        if (unclaimed_x + unclaimed_y > fee_threshold) {
            vector::push_back(&mut recommendations, 1);
        };
        // Check if position is out of range (low active liquidity)
        let activity_threshold = position_data.total_liquidity / 10; // 10%
        if (active_liq < activity_threshold) {
            vector::push_back(&mut recommendations, 2);
        };
        // Check if position is inactive (very low fees + out of range)
        if (active_liq == 0 && unclaimed_x + unclaimed_y < position_data.total_liquidity / 100) {
            vector::push_back(&mut recommendations, 3);
        };
        // If no recommendations, everything is good
        if (vector::is_empty(&recommendations)) {
            vector::push_back(&mut recommendations, 0);
        };
        recommendations
    }
}