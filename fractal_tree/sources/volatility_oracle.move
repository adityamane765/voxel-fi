module fractal_tree::volatility_oracle {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    friend fractal_tree::vault;

    /// error codes
    const E_NOT_AUTHORIZED: u64 =1;
    const E_ORACLE_NOT_INITIALIZED: u64 =2;
    const E_INSUFFICIENT_DATA: u64 =3;
    const E_INVALID_TIMEFRAME: u64 =4;

    /// maximum number of samples to keep
    const MAX_PRICE_SAMPLES: u64 = 288; // 24 hours at 5 min interval so 24*12
    const SAMPLE_INTERVAL_SECONDS: u64 = 300;

    /// vol bucket classificn
    const VOL_BUCKET_0_MAX: u64 = 100; // 0-1% daily vol
    const VOL_BUCKET_1_MAX: u64 = 300; // 1-3% daily vol
    const VOL_BUCKET_2_MAX: u64 = 500; // 3-5% daily vol
    // VOL_BUCKET_3: >5% daily vol

    /// price sample for TWAP and volatility calculation
    struct PriceSample has store, drop, copy{
        price: u64,
        timestamp: u64,
        volume: u64, // Volume at this sample
    }

    /// Volatility metrics
    struct VolatilityMetrics has store, drop, copy{
        realized_volatility: u64,    // annualized volatility 
        volatility_bucket: u8,       // 0/1/2/3
        last_price: u64,             // most recent price
        twap_1h: u64,
        twap_24h: u64,
        price_change_24h: u64,      // 24h price change
        last_update: u64,           // last calculation timestamp
    }

    /// Price oracle state
    struct PriceOracle<phantom X, phantom Y> has key{
        samples: vector<PriceSample>,
        current_metrics: VolatilityMetrics,
        cumulative_volume: u64,
        sample_count: u64,
    }

    // Events
    #[event]
    struct PriceUpdated has drop, store{
        price: u64,
        volume: u64,
        timestamp: u64,
    }

    #[event]
    struct VolatilityCalculated has drop, store {
        realized_vol: u64,
        vol_bucket: u8,
        price_change_24h: u64,
    }

    /// init the oracle
    public entry fun init<X, Y>(deployer: &signer) {
        assert!(signer::address_of(deployer) == @fractal_tree, E_NOT_AUTHORIZED);
        assert!(!exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        move_to(deployer, PriceOracle<X, Y> {
            samples: vector::empty<PriceSample>(),
            current_metrics: VolatilityMetrics {
                realized_volatility:0,
                volatility_bucket:0,
                last_price:0,
                twap_1h:0,
                twap_24h:0,
                price_change_24h:0,
                last_update:0,
            },
            cumulative_volume:0,
            sample_count:0,
        });
    }

    /// update price sample - to be called by vault after each swap (restricted to friend modules only)
    public(friend) fun update_price<X, Y>(
        price: u64,
        volume: u64,
    ) acquires PriceOracle {
        assert!(exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        
        let oracle = borrow_global_mut<PriceOracle<X, Y>>(@fractal_tree);
        let now = timestamp::now_seconds();
        // check if enough time has passed since last sample
        let should_sample = if (vector::is_empty(&oracle.samples)) {
            true
        } else {
            let last_sample = vector::borrow(&oracle.samples, vector::length(&oracle.samples) - 1);
            now - last_sample.timestamp >= SAMPLE_INTERVAL_SECONDS
        };

        if (should_sample) {
            // add new sample
            let sample = PriceSample {
                price,
                timestamp: now,
                volume,
            };
            vector::push_back(&mut oracle.samples, sample);
            oracle.sample_count = oracle.sample_count + 1;

            // keep only recent samples
            let samples_len = vector::length(&oracle.samples);
            if (samples_len > MAX_PRICE_SAMPLES) {
                vector::remove(&mut oracle.samples, 0);
            };
            oracle.cumulative_volume = oracle.cumulative_volume + volume;
            recalculate_metrics<X, Y>(oracle, now);
            event::emit(PriceUpdated { price, volume, timestamp: now });
        };
    }

    /// recalculate volatility metrics from price samples
    fun recalculate_metrics<X, Y>(
        oracle: &mut PriceOracle<X, Y>,
        now: u64,
    ) {
        let samples_len = vector::length(&oracle.samples);
        if (samples_len <2) {   // at least 2 samples req 
            return
        };
        let latest_sample = vector::borrow(&oracle.samples, samples_len -1);
        let latest_price = latest_sample.price;
        let twap_1h = calculate_twap(&oracle.samples, now, 3600);
        let twap_24h = calculate_twap(&oracle.samples, now, 86400);

        // 24h price change calc
        let price_24h_ago = get_price_at_time(&oracle.samples, now -86400);
        let price_change_24h = if (price_24h_ago > 0 && latest_price >0) {
            if (latest_price > price_24h_ago) {
                ((latest_price - price_24h_ago) *10000) /price_24h_ago
            } else {
                ((price_24h_ago - latest_price) *10000) /price_24h_ago
            }
        } else {0};

        // calculate realized volatility (std devn of returns)
        let realized_vol = calculate_realized_volatility(&oracle.samples);
        let vol_bucket = classify_volatility_bucket(realized_vol);
        // update metrics
        oracle.current_metrics = VolatilityMetrics {
            realized_volatility: realized_vol,
            volatility_bucket: vol_bucket,
            last_price: latest_price,
            twap_1h,
            twap_24h,
            price_change_24h,
            last_update: now,
        };

        event::emit(VolatilityCalculated {
            realized_vol,
            vol_bucket,
            price_change_24h,
        });
    }

    /// TWAP
    fun calculate_twap(
        samples: &vector<PriceSample>,
        now: u64,
        window_seconds: u64,
    ): u64 {
        let samples_len =vector::length(samples);
        if (samples_len ==0) return 0;

        let cutoff_time =if (now > window_seconds) {
            now -window_seconds
        } else {0};

        let total_weighted_price = 0u128;
        let total_time = 0u64;
        let i = samples_len;
        // iterate backwards from most recent
        while (i > 0) {
            i = i - 1;
            let sample = vector::borrow(samples, i);
            if (sample.timestamp < cutoff_time) {
                break
            };
            let time_weight = if (i == samples_len - 1) {
                // most recent sample: weight to current time
                now - sample.timestamp
            } else {
                // weight is time until next sample
                let next_sample = vector::borrow(samples, i + 1);
                next_sample.timestamp - sample.timestamp
            };

            total_weighted_price = total_weighted_price + ((sample.price as u128) * (time_weight as u128));
            total_time = total_time + time_weight;
        };
        if (total_time > 0) {
            (total_weighted_price / (total_time as u128)) as u64
        } else {
            let latest = vector::borrow(samples, samples_len - 1);
            latest.price
        }
    }

    /// interpolate to get price at a specific time
    fun get_price_at_time(
        samples: &vector<PriceSample>,
        target_time: u64,
    ): u64 {
        let samples_len = vector::length(samples);
        if (samples_len == 0) return 0;
        let first_sample = vector::borrow(samples, 0);
        if (target_time <= first_sample.timestamp) {
            return first_sample.price
        };
        let last_sample = vector::borrow(samples, samples_len -1);
        if (target_time >= last_sample.timestamp) {
            return last_sample.price
        };
        // find the two samples that bracket the target time
        let i = 0;
        while (i < samples_len -1) {
            let sample = vector::borrow(samples, i);
            let next_sample = vector::borrow(samples, i +1);

            if (sample.timestamp <= target_time && target_time <next_sample.timestamp) {
                // lin interpolation
                let time_diff = next_sample.timestamp -sample.timestamp;
                let price_diff = if (next_sample.price >sample.price) {
                    next_sample.price -sample.price
                } else {
                    sample.price -next_sample.price
                };

                let time_elapsed = target_time -sample.timestamp;
                let interpolated_change = (price_diff * time_elapsed) / time_diff;

                return if (next_sample.price > sample.price) {
                    sample.price +interpolated_change
                } else {
                    sample.price -interpolated_change
                }
            };
            i = i+1;
        };
        last_sample.price
    }

    /// calculate realized volatility - annualized standard deviation
    fun calculate_realized_volatility(samples: &vector<PriceSample>): u64 {
        let samples_len = vector::length(samples);
        if (samples_len < 2) return 0;

        // Calculate returns and track sum
        let returns_squared_sum = 0u128;
        let returns_count = 0u64;
        let sum_positive = 0u128;
        let sum_negative = 0u128;
        
        let i = 1;
        while (i < samples_len) {
            let prev_sample = vector::borrow(samples, i - 1);
            let curr_sample = vector::borrow(samples, i);
            
            if (prev_sample.price > 0 && curr_sample.price > 0) {
                // Calculate return as percentage change (scaled by 10000)
                if (curr_sample.price > prev_sample.price) {
                    let return_val = ((curr_sample.price - prev_sample.price) * 10000) / prev_sample.price;
                    sum_positive = sum_positive + (return_val as u128);
                    returns_squared_sum = returns_squared_sum + ((return_val as u128) * (return_val as u128));
                } else {
                    let return_val = ((prev_sample.price - curr_sample.price) * 10000) / prev_sample.price;
                    sum_negative = sum_negative + (return_val as u128);
                    returns_squared_sum = returns_squared_sum + ((return_val as u128) * (return_val as u128));
                };
                returns_count = returns_count + 1;
            };
            
            i = i + 1;
        };

        if (returns_count < 2) return 0;

        // Calculate mean (accounting for positive and negative)
        let mean_squared = if (sum_positive > sum_negative) {
            let net_sum = sum_positive - sum_negative;
            let mean = net_sum / (returns_count as u128);
            mean * mean
        } else {
            let net_sum = sum_negative - sum_positive;
            let mean = net_sum / (returns_count as u128);
            mean * mean
        };

        // Calculate variance
        let mean_of_squares = returns_squared_sum / (returns_count as u128);
        let variance = if (mean_of_squares > mean_squared) {
            mean_of_squares - mean_squared
        } else {
            0u128
        };

        // Approximate square root
        let std_dev = approximate_sqrt(variance);

        // Annualize: multiply by sqrt(periods per year)
        // Assuming 5-minute intervals: 12 per hour * 24 hours * 365 days = 105,120 periods
        // sqrt(105120) ≈ 324
        let annualized_vol = (std_dev * 324) / 100;

        (annualized_vol as u64)
    }

    fun approximate_sqrt(x: u128): u128 { //newtons method, thank you eso208
        if (x == 0) return 0;
        if (x == 1) return 1;
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

    /// classify volatility into buckets
    fun classify_volatility_bucket(realized_vol: u64): u8 {
        if (realized_vol <= VOL_BUCKET_0_MAX) {
            0
        } else if (realized_vol <= VOL_BUCKET_1_MAX) {
            1
        } else if (realized_vol <= VOL_BUCKET_2_MAX) {
            2
        } else {
            3
        }
    }

    // get current volatility metrics
    #[view]
    public fun get_volatility_metrics<X, Y>(): VolatilityMetrics acquires PriceOracle {
        assert!(exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        let oracle = borrow_global<PriceOracle<X, Y>>(@fractal_tree);
        oracle.current_metrics
    }

    // get current volatility bucket
    #[view]
    public fun get_current_volatility_bucket<X, Y>(): u8 acquires PriceOracle {
        assert!(exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        let oracle = borrow_global<PriceOracle<X, Y>>(@fractal_tree);
        oracle.current_metrics.volatility_bucket
    }

    // get historical price data
    #[view]
    public fun get_price_history<X, Y>(count: u64): vector<PriceSample> acquires PriceOracle {
        assert!(exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        let oracle = borrow_global<PriceOracle<X, Y>>(@fractal_tree);
        let samples_len = vector::length(&oracle.samples);
        let return_count = if (count > samples_len) { samples_len } else { count };
        let result = vector::empty<PriceSample>();
        let i = samples_len - return_count;
        
        while (i < samples_len) {
            let sample = *vector::borrow(&oracle.samples, i);
            vector::push_back(&mut result, sample);
            i = i +1;
        };
        result
    }

    // calc volatility adjusted spread recommendation, this is kinda vague refine later
    #[view]
    public fun calculate_recommended_spread<X, Y>(base_spread: u64): u64 acquires PriceOracle {
        assert!(exists<PriceOracle<X, Y>>(@fractal_tree), E_ORACLE_NOT_INITIALIZED);
        let oracle = borrow_global<PriceOracle<X, Y>>(@fractal_tree);
        let vol_bucket = oracle.current_metrics.volatility_bucket;
        
        // adjust spread based on volatility
        let multiplier = if (vol_bucket == 0) {
            100 // 1.0x low vol
        } else if (vol_bucket == 1) {
            150 // 1.5x medium vol
        } else if (vol_bucket == 2) {
            200 // 2.0x high vol
        } else {
            300 // 3.0x very high vol
        };
        (base_spread * multiplier) /100
    }
}