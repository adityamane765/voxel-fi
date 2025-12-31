module fractal_tree::weth {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    struct WETH has drop {}
    public entry fun init(deployer: &signer) {
        managed_coin::initialize<WETH>(
            deployer,
            b"WETH", // name
            b"WETH", // symbol
            8,
            false
        );
    }

    /// mint fn
    public entry fun mint(minter: &signer, recipient: address, amount: u64) {
        // Only the minter/deployer can mint
        assert!(signer::address_of(minter) == @fractal_tree, 0); // E_NOT_AUTHORIZED
        managed_coin::mint<WETH>(minter, recipient, amount);
    }

    /// burnnn
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

    #[view]
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