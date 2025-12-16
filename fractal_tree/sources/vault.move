module fractal_tree::vault {

    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;

    // Error codes
    const E_VAULT_ALREADY_INITIALIZED: u64 = 1;
    const E_VAULT_NOT_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 3;

    // The Vault resource
    struct Vault<phantom X, phantom Y> has key {
        reserve_x: Coin<X>,
        reserve_y: Coin<Y>,
        admin: address,
    }

    // Events
    #[event]
    struct DepositEvent has drop, store {
        admin: address,
        amount_x: u64,
        amount_y: u64,
    }

    #[event]
    struct WithdrawEvent has drop, store {
        admin: address,
        amount_x: u64,
        amount_y: u64,
    }

    // Initialize the vault - ENTRY FUNCTION
    public entry fun init<X, Y>(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        assert!(
            !exists<Vault<X, Y>>(admin_addr),
            error::invalid_state(E_VAULT_ALREADY_INITIALIZED)
        );

        move_to(admin, Vault<X, Y> {
            reserve_x: coin::zero<X>(),
            reserve_y: coin::zero<Y>(),
            admin: admin_addr,
        });
    }

    // Deposit from user's coin store - ENTRY FUNCTION
    public entry fun deposit_from_store<X, Y>(
        admin: &signer,
        amount_x: u64,
        amount_y: u64,
    ) acquires Vault {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Vault<X, Y>>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        // Withdraw from user's coin store
        let coins_x = coin::withdraw<X>(admin, amount_x);
        let coins_y = coin::withdraw<Y>(admin, amount_y);

        let vault = borrow_global_mut<Vault<X, Y>>(admin_addr);

        coin::merge(&mut vault.reserve_x, coins_x);
        coin::merge(&mut vault.reserve_y, coins_y);

        event::emit(DepositEvent {
            admin: admin_addr,
            amount_x,
            amount_y,
        });
    }

    // Deposit with coins (for module calls) - NOT ENTRY
    public fun deposit<X, Y>(
        admin: &signer,
        coins_x: Coin<X>,
        coins_y: Coin<Y>,
    ) acquires Vault {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Vault<X, Y>>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        let vault = borrow_global_mut<Vault<X, Y>>(admin_addr);

        let amount_x = coin::value(&coins_x);
        let amount_y = coin::value(&coins_y);

        coin::merge(&mut vault.reserve_x, coins_x);
        coin::merge(&mut vault.reserve_y, coins_y);

        event::emit(DepositEvent {
            admin: admin_addr,
            amount_x,
            amount_y,
        });
    }

    // Withdraw to user's account - ENTRY FUNCTION
    public entry fun withdraw_to_account<X, Y>(
        admin: &signer,
        amount_x: u64,
        amount_y: u64,
    ) acquires Vault {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Vault<X, Y>>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        let vault = borrow_global_mut<Vault<X, Y>>(admin_addr);

        assert!(
            coin::value(&vault.reserve_x) >= amount_x && coin::value(&vault.reserve_y) >= amount_y,
            error::invalid_argument(E_INSUFFICIENT_LIQUIDITY)
        );

        let withdrawn_x = coin::extract(&mut vault.reserve_x, amount_x);
        let withdrawn_y = coin::extract(&mut vault.reserve_y, amount_y);

        // Deposit to user's account
        coin::deposit(admin_addr, withdrawn_x);
        coin::deposit(admin_addr, withdrawn_y);

        event::emit(WithdrawEvent {
            admin: admin_addr,
            amount_x,
            amount_y,
        });
    }

    // Withdraw coins (for module calls) - NOT ENTRY
    public fun withdraw<X, Y>(
        admin: &signer,
        amount_x: u64,
        amount_y: u64,
    ): (Coin<X>, Coin<Y>) acquires Vault {
        let admin_addr = signer::address_of(admin);

        assert!(
            exists<Vault<X, Y>>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        let vault = borrow_global_mut<Vault<X, Y>>(admin_addr);

        assert!(
            coin::value(&vault.reserve_x) >= amount_x && coin::value(&vault.reserve_y) >= amount_y,
            error::invalid_argument(E_INSUFFICIENT_LIQUIDITY)
        );

        let withdrawn_x = coin::extract(&mut vault.reserve_x, amount_x);
        let withdrawn_y = coin::extract(&mut vault.reserve_y, amount_y);

        event::emit(WithdrawEvent {
            admin: admin_addr,
            amount_x,
            amount_y,
        });

        (withdrawn_x, withdrawn_y)
    }

    // Read-only view
    #[view]
    public fun get_reserves<X, Y>(admin_addr: address): (u64, u64) acquires Vault {
        let vault = borrow_global<Vault<X, Y>>(admin_addr);
        (coin::value(&vault.reserve_x), coin::value(&vault.reserve_y))
    }
}