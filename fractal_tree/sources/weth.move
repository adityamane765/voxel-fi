module fractal_tree::weth {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    /// The type that uniquely identifies the WETH coin.
    struct WETH has drop {}

    /// Initialize the WETH coin.
    public entry fun init(deployer: &signer) {
        managed_coin::initialize<WETH>(
            deployer,
            b"WETH", // Coin name
            b"WETH", // Coin symbol
            8,        // Decimals
            false     // Monitor supply
        );
    }

    /// Mint `amount` of WETH to `recipient`.
    public entry fun mint(minter: &signer, recipient: address, amount: u64) {
        // Only the minter/deployer can mint
        assert!(signer::address_of(minter) == @fractal_tree, 0); // E_NOT_AUTHORIZED
        managed_coin::mint<WETH>(minter, recipient, amount);
    }

    /// Burn `amount` of WETH from `signer`.
    public entry fun burn(burner: &signer, amount: u64) {
        managed_coin::burn<WETH>(burner, amount);
    }

    // --- Coin operations ---
    public fun transfer(signer: &signer, to: address, amount: u64) {
        coin::transfer<WETH>(signer, to, amount);
    }

    public entry fun register(signer: &signer) {
        coin::register<WETH>(signer);
    }

    public fun balance(owner: address): u64 {
        coin::balance<WETH>(owner)
    }

    public fun withdraw(signer: &signer, amount: u64): coin::Coin<WETH> {
        coin::withdraw<WETH>(signer, amount)
    }

    public fun deposit(to: address, coin: coin::Coin<WETH>) {
        coin::deposit<WETH>(to, coin)
    }
}