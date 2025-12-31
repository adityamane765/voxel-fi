module fractal_tree::vault {
    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    friend fractal_tree::fractal_position;
    friend fractal_tree::fee_distributor;

    // Error codes
    const E_VAULT_ALREADY_INITIALIZED: u64 =1;
    const E_VAULT_NOT_DEPLOYED: u64 =2;
    const E_INSUFFICIENT_LIQUIDITY: u64 =3;
    const E_INSUFFICIENT_OUTPUT_AMOUNT: u64 =4;
    const E_NOT_AUTHORIZED: u64 =5;

    // swap fese configuration -0.3%
    const SWAP_FEE_NUMERATOR: u64 =997;
    const SWAP_FEE_DENOMINATOR: u64 =1000;

    // global vault
    struct Vault<phantom X, phantom Y> has key {
        reserve_x: Coin<X>,
        reserve_y: Coin<Y>,
        pending_fees_x: u64,
        pending_fees_y: u64,
    }

    // Events
    #[event]
    struct DepositEvent has drop, store {
        amount_x: u64,
        amount_y: u64,
    }

    #[event]
    struct WithdrawEvent has drop, store {
        amount_x: u64,
        amount_y: u64,
    }

    #[event]
    struct SwapEvent has drop, store {
        sender: address,
        amount_in: u64,
        amount_out: u64,
        fees_collected: u64,
        swap_price: u64,
    }

    // Initialize vault
    public entry fun init<X, Y>(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(deployer_addr == @fractal_tree, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(!exists<Vault<X, Y>>(@fractal_tree), error::invalid_state(E_VAULT_ALREADY_INITIALIZED));
        move_to(deployer, Vault<X, Y> {
            reserve_x: coin::zero<X>(),
            reserve_y: coin::zero<Y>(),
            pending_fees_x: 0,
            pending_fees_y: 0,
        });
    }

    // swap X for Y
    public entry fun swap<X, Y>(
        user: &signer, 
        amount_in: u64, 
        min_amount_out: u64
    ) acquires Vault {
        let user_addr = signer::address_of(user);
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        
        let vault = borrow_global_mut<Vault<X, Y>>(@fractal_tree);
        let reserve_in = coin::value(&vault.reserve_x);
        let reserve_out = coin::value(&vault.reserve_y);

        // output with fee (0.3% fee)
        let amount_in_with_fee = amount_in * SWAP_FEE_NUMERATOR;
        let numerator = (amount_in_with_fee as u128) * (reserve_out as u128);
        let denominator = ((reserve_in * SWAP_FEE_DENOMINATOR) as u128) + (amount_in_with_fee as u128);
        let amount_out = (numerator / denominator) as u64;
        assert!(amount_out >= min_amount_out, error::invalid_argument(E_INSUFFICIENT_OUTPUT_AMOUNT));
        assert!(reserve_out >= amount_out, error::invalid_argument(E_INSUFFICIENT_LIQUIDITY));

        // calculate fees collected (stays in vault, distributed to lp later)
        let fees_collected = amount_in - (amount_in * SWAP_FEE_NUMERATOR / SWAP_FEE_DENOMINATOR);
        // Calculate approximate swap price (in terms of Y per X)
        let swap_price = if (amount_in > 0) {
            (amount_out * 1000000) / amount_in
        } else {0};

        // swap
        let coins_in = coin::withdraw<X>(user, amount_in);
        coin::merge(&mut vault.reserve_x, coins_in);
        let coins_out = coin::extract(&mut vault.reserve_y, amount_out);
        coin::deposit(user_addr, coins_out);

        // accumulate fees instead of distributing
        vault.pending_fees_x = vault.pending_fees_x + fees_collected;

        // update volatility oracle with new price
        fractal_tree::volatility_oracle::update_price<X, Y>(swap_price, amount_in);

        event::emit(SwapEvent {
            sender: user_addr,
            amount_in,
            amount_out,
            fees_collected,
            swap_price,
        });
    }

    // swap Y for X
    public entry fun swap_y_for_x<X, Y>(
        user: &signer,
        amount_in: u64,
        min_amount_out: u64
    ) acquires Vault {
        let user_addr = signer::address_of(user);
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault = borrow_global_mut<Vault<X, Y>>(@fractal_tree);
        let reserve_in = coin::value(&vault.reserve_y);
        let reserve_out = coin::value(&vault.reserve_x);

        // calculate output with fee
        let amount_in_with_fee = amount_in * SWAP_FEE_NUMERATOR;
        let numerator = (amount_in_with_fee as u128) * (reserve_out as u128);
        let denominator = ((reserve_in * SWAP_FEE_DENOMINATOR) as u128) + (amount_in_with_fee as u128);
        let amount_out = (numerator / denominator) as u64;
        assert!(amount_out >= min_amount_out, error::invalid_argument(E_INSUFFICIENT_OUTPUT_AMOUNT));
        assert!(reserve_out >= amount_out, error::invalid_argument(E_INSUFFICIENT_LIQUIDITY));

        let fees_collected = amount_in - (amount_in * SWAP_FEE_NUMERATOR / SWAP_FEE_DENOMINATOR);
        let swap_price = if (amount_out > 0) {
            (amount_in * 1000000) /amount_out
        } else {0};

        // swap
        let coins_in = coin::withdraw<Y>(user, amount_in);
        coin::merge(&mut vault.reserve_y, coins_in);
        let coins_out = coin::extract(&mut vault.reserve_x, amount_out);
        coin::deposit(user_addr, coins_out);

        // Accumulate fees instead of distributing
        vault.pending_fees_y = vault.pending_fees_y +fees_collected;

        // update volatility oracle
        fractal_tree::volatility_oracle::update_price<X, Y>(swap_price, amount_in);

        event::emit(SwapEvent {
            sender: user_addr,
            amount_in,
            amount_out,
            fees_collected,
            swap_price,
        });
    }

    // deposit coins (restricted to friend modules only)
    public(friend) fun deposit<X, Y>(
        coins_x: Coin<X>,
        coins_y: Coin<Y>,
    ) acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault = borrow_global_mut<Vault<X, Y>>(@fractal_tree);
        let amount_x = coin::value(&coins_x);
        let amount_y = coin::value(&coins_y);
        coin::merge(&mut vault.reserve_x, coins_x);
        coin::merge(&mut vault.reserve_y, coins_y);
        
        event::emit(DepositEvent { amount_x, amount_y });
    }

    // withdraw coins (restricted to friend modules only)
    public(friend) fun withdraw<X, Y>(
        amount_x: u64,
        amount_y: u64,
    ): (Coin<X>, Coin<Y>) acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault = borrow_global_mut<Vault<X, Y>>(@fractal_tree);
        
        assert!(
            coin::value(&vault.reserve_x) >=amount_x && coin::value(&vault.reserve_y) >=amount_y,
            error::invalid_argument(E_INSUFFICIENT_LIQUIDITY)
        );
        let withdrawn_x =coin::extract(&mut vault.reserve_x, amount_x);
        let withdrawn_y =coin::extract(&mut vault.reserve_y, amount_y);
        
        event::emit(WithdrawEvent { amount_x, amount_y });
        (withdrawn_x, withdrawn_y)
    }

    // view functions
    #[view]
    public fun get_reserves<X, Y>(): (u64, u64) acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault =borrow_global<Vault<X, Y>>(@fractal_tree);
        (coin::value(&vault.reserve_x), coin::value(&vault.reserve_y))
    }

    #[view]
    public fun calculate_swap_output<X, Y>(amount_in: u64): u64 acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree), error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault =borrow_global<Vault<X, Y>>(@fractal_tree);
        let reserve_in =coin::value(&vault.reserve_x);
        let reserve_out =coin::value(&vault.reserve_y);

        let amount_in_with_fee =amount_in *SWAP_FEE_NUMERATOR;
        let numerator =(amount_in_with_fee as u128) *(reserve_out as u128);
        let denominator =((reserve_in * SWAP_FEE_DENOMINATOR) as u128) +(amount_in_with_fee as u128);
        (numerator / denominator) as u64
    }

    // Get pending fees (view function)
    #[view]
    public fun get_pending_fees<X, Y>(): (u64, u64) acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree),
            error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault = borrow_global<Vault<X, Y>>(@fractal_tree);
        (vault.pending_fees_x, vault.pending_fees_y)
    }

    // Clear pending fees and return them (called by fee_distributor)
    public(friend) fun clear_pending_fees<X, Y>(): (u64, u64) acquires Vault {
        assert!(exists<Vault<X, Y>>(@fractal_tree),
            error::not_found(E_VAULT_NOT_DEPLOYED));
        let vault = borrow_global_mut<Vault<X, Y>>(@fractal_tree);
        let fees_x = vault.pending_fees_x;
        let fees_y = vault.pending_fees_y;
        vault.pending_fees_x = 0;
        vault.pending_fees_y = 0;
        (fees_x, fees_y)
}
}