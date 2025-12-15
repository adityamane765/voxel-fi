module fractal_tree::vault {

    use std::signer;
    use std::error;

    /// Error codes
    const E_VAULT_ALREADY_INITIALIZED: u64 = 1;
    const E_VAULT_NOT_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 3;
    const E_NOT_AUTHORIZED: u64 = 4;

    /// The Vault resource
    struct Vault has key {
        reserve_x: u64,
        reserve_y: u64,
        admin: address,
    }

    /// Initialize the vault (call once)
    public fun init(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        assert!(
            !exists<Vault>(admin_addr),
            error::invalid_state(E_VAULT_ALREADY_INITIALIZED)
        );

        move_to(admin, Vault {
            reserve_x: 0,
            reserve_y: 0,
            admin: admin_addr,
        });
    }

    /// Deposit liquidity into the vault (protocol-only)
    public fun deposit(
        admin_addr: address,
        amount_x: u64,
        amount_y: u64,
        caller: &signer,
    ) acquires Vault {

        assert!(
            exists<Vault>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        let vault = borrow_global_mut<Vault>(admin_addr);

        assert!(
            signer::address_of(caller) == vault.admin,
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        vault.reserve_x = vault.reserve_x + amount_x;
        vault.reserve_y = vault.reserve_y + amount_y;
    }

    /// Withdraw liquidity from the vault (protocol-only)
    public fun withdraw(
        admin_addr: address,
        amount_x: u64,
        amount_y: u64,
        caller: &signer,
    ) acquires Vault {

        assert!(
            exists<Vault>(admin_addr),
            error::not_found(E_VAULT_NOT_INITIALIZED)
        );

        let vault = borrow_global_mut<Vault>(admin_addr);

        assert!(
            signer::address_of(caller) == vault.admin,
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        assert!(
            vault.reserve_x >= amount_x && vault.reserve_y >= amount_y,
            error::invalid_argument(E_INSUFFICIENT_LIQUIDITY)
        );

        vault.reserve_x = vault.reserve_x - amount_x;
        vault.reserve_y = vault.reserve_y - amount_y;
    }

    /// Read-only view
    public fun get_reserves(admin_addr: address): (u64, u64) acquires Vault {
        let vault = borrow_global<Vault>(admin_addr);
        (vault.reserve_x, vault.reserve_y)
    }
}
