module fractal_tree::usdc {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::managed_coin;

    /// type to uniquely identify coin is usdc
    struct USDC has drop {}

    public entry fun init(deployer: &signer) {
        managed_coin::initialize<USDC>(
            deployer,
            b"USDC", // name
            b"USDC", // symbol
            6,       
            false
        );
    }

    /// mint
    public entry fun mint(minter: &signer, recipient: address, amount: u64) {
        assert!(signer::address_of(minter) == @fractal_tree, 0); //only the deployer can mint
        managed_coin::mint<USDC>(minter, recipient, amount);
    }

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

    #[view]
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