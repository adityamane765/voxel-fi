module fractal_tree::usdc {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    /// The type that uniquely identifies the USDC coin.
    struct USDC has drop {}

    /// Initialize the USDC coin.
    public entry fun init(deployer: &signer) {
        managed_coin::initialize<USDC>(
            deployer,
            b"USDC", // Coin name
            b"USDC", // Coin symbol
            6,        // Decimals (USDC typically has 6 decimals)
            false     // Monitor supply
        );
    }

    /// Mint `amount` of USDC to `recipient`.
    public entry fun mint(minter: &signer, recipient: address, amount: u64) {
        // Only the minter/deployer can mint
        assert!(signer::address_of(minter) == @fractal_tree, 0); // E_NOT_AUTHORIZED
        managed_coin::mint<USDC>(minter, recipient, amount);
    }

    /// Burn `amount` of USDC from `signer`.
    public entry fun burn(burner: &signer, amount: u64) {
        managed_coin::burn<USDC>(burner, amount);
    }

    // --- Coin operations ---
    public fun transfer(signer: &signer, to: address, amount: u64) {
        coin::transfer<USDC>(signer, to, amount);
    }

    public entry fun register(signer: &signer) {
        coin::register<USDC>(signer);
    }

    public fun balance(owner: address): u64 {
        coin::balance<USDC>(owner)
    }

    public fun withdraw(signer: &signer, amount: u64): coin::Coin<USDC> {
        coin::withdraw<USDC>(signer, amount)
    }

    public fun deposit(to: address, coin: coin::Coin<USDC>) {
        coin::deposit<USDC>(to, coin)
    }
}