module fractal_tree::dashboard_stats {
    use fractal_tree::fractal_position;
    use fractal_tree::vault;
    use std::vector;
    
    struct PositionStats has drop, copy {
        token_addr: address,
        position_id: u64,
        owner: address,
        amount_x: u64,
        amount_y: u64,
        total_liquidity: u64,
        price_center: u64,
        spread: u64,
        depth: u8,
        volatility_bucket: u8,
        unclaimed_fees_x: u64,
        unclaimed_fees_y: u64,
        total_fees_earned_x: u64,
        total_fees_earned_y: u64,
        current_value_x: u64,
        current_value_y: u64,
    }
    
    struct ProtocolStats has drop, copy {
        total_reserve_x: u64,
        total_reserve_y: u64,
        total_fees_collected_x: u64,
        total_fees_collected_y: u64,
        protocol_treasury_x: u64,
        protocol_treasury_y: u64,
        total_value_locked: u64,
        protocol_fee_percentage: u64,
    }
    
    #[view]
    public fun get_position_stats<X, Y>(
        token_addr: address,
        current_market_price: u64
    ): PositionStats {
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(
            token_addr,
            current_market_price
        );
        let (total_earned_x, total_earned_y) = fractal_position::get_total_fees_earned(token_addr);
        let amount_x = fractal_position::get_position_field_amount_x(token_addr);
        let amount_y = fractal_position::get_position_field_amount_y(token_addr);
        
        PositionStats {
            token_addr,
            position_id: fractal_position::get_position_field_id(token_addr),
            owner: fractal_position::get_position_field_owner(token_addr),
            amount_x,
            amount_y,
            total_liquidity: fractal_position::get_position_field_total_liquidity(token_addr),
            price_center: fractal_position::get_position_field_price_center(token_addr),
            spread: fractal_position::get_position_field_spread(token_addr),
            depth: fractal_position::get_position_field_depth(token_addr),
            volatility_bucket: fractal_position::get_position_field_volatility_bucket(token_addr),
            unclaimed_fees_x: unclaimed_x,
            unclaimed_fees_y: unclaimed_y,
            total_fees_earned_x: total_earned_x,
            total_fees_earned_y: total_earned_y,
            current_value_x: amount_x + unclaimed_x,
            current_value_y: amount_y + unclaimed_y,
        }
    }
    
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
            total_value_locked: reserve_x + reserve_y,
            protocol_fee_percentage: 5,
        }
    }
    
    #[view]
    public fun estimate_position_apr<X, Y>(
        token_addr: address,
        current_market_price: u64,
        time_period_days: u64,
    ): u64 {
        if (time_period_days == 0) {
            return 0
        };
        
        let (fees_x, fees_y) = fractal_position::get_unclaimed_fees(
            token_addr,
            current_market_price
        );
        let total_principal = fractal_position::get_position_field_amount_x(token_addr) + 
                            fractal_position::get_position_field_amount_y(token_addr);
        let total_fees = fees_x + fees_y;
        
        if (total_principal == 0) {
            return 0
        };
        
        let daily_return = (total_fees * 10000) / total_principal;
        let annual_return = (daily_return * 365) / time_period_days;
        annual_return
    }
    
    #[view]
    public fun get_liquidity_depth<X, Y>(
        token_addr: address,
        current_price: u64,
    ): u64 {
        fractal_position::liquidity_at_price(token_addr, current_price)
    }
    
    #[view]
    public fun calculate_position_health<X, Y>(
        token_addr: address,
        current_market_price: u64,
    ): u8 {
        let total_liquidity = fractal_position::get_position_field_total_liquidity(token_addr);
        let price_center = fractal_position::get_position_field_price_center(token_addr);
        let spread = fractal_position::get_position_field_spread(token_addr);
        let active_liquidity = fractal_position::liquidity_at_price(token_addr, current_market_price);
        
        let score = 0u8;
        
        // Active liquidity ratio (max 40 points)
        let liquidity_ratio = if (total_liquidity > 0) {
            (active_liquidity * 100) / total_liquidity
        } else {
            0
        };
        score = score + ((liquidity_ratio * 40 / 100) as u8);
        
        // Fee generation (max 30 points)
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(
            token_addr,
            current_market_price
        );
        let fees_ratio = if (total_liquidity > 0) {
            ((unclaimed_x + unclaimed_y) * 100) / total_liquidity
        } else {
            0
        };
        score = score + (if (fees_ratio > 30) { 30 } else { fees_ratio as u8 });
        
        // Price proximity (max 30 points)
        let price_distance = if (current_market_price > price_center) {
            current_market_price - price_center
        } else {
            price_center - current_market_price
        };
        let proximity_score = if (price_distance <= spread) {
            30 - ((price_distance * 30) / spread)
        } else {
            0
        };
        score = score + (proximity_score as u8);
        
        score
    }
    
    #[view]
    public fun estimate_impermanent_loss<X, Y>(
        _token_addr: address,
        initial_price: u64,
        current_price: u64,
    ): u64 {
        if (initial_price == 0) {
            return 0
        };
        
        let price_ratio = (current_price * 1000) / initial_price;
        if (price_ratio == 1000) {
            return 0
        };
        
        let il_percent = if (price_ratio > 1000) {
            ((price_ratio - 1000) * (price_ratio - 1000)) / (4 * 1000)
        } else {
            ((1000 - price_ratio) * (1000 - price_ratio)) / (4 * 1000)
        };
        
        il_percent
    }
    
    #[view]
    public fun get_position_recommendations<X, Y>(
        token_addr: address,
        current_market_price: u64,
    ): vector<u8> {
        let total_liquidity = fractal_position::get_position_field_total_liquidity(token_addr);
        let active_liq = fractal_position::liquidity_at_price(token_addr, current_market_price);
        let (unclaimed_x, unclaimed_y) = fractal_position::get_unclaimed_fees(
            token_addr,
            current_market_price
        );
        
        let recommendations = vector::empty<u8>();
        
        // Recommendation 1: Claim fees if high unclaimed (>5% of principal)
        let fee_threshold = total_liquidity / 20;
        if (unclaimed_x + unclaimed_y > fee_threshold) {
            vector::push_back(&mut recommendations, 1);
        };
        
        // Recommendation 2: Rebalance if low activity (<10% active)
        let activity_threshold = total_liquidity / 10;
        if (active_liq < activity_threshold) {
            vector::push_back(&mut recommendations, 2);
        };
        
        // Recommendation 3: Consider closing if very inactive
        if (active_liq == 0 && unclaimed_x + unclaimed_y < total_liquidity / 100) {
            vector::push_back(&mut recommendations, 3);
        };
        
        // No recommendations = all good
        if (vector::is_empty(&recommendations)) {
            vector::push_back(&mut recommendations, 0);
        };
        
        recommendations
    }
}