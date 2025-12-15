pragma circom 2.1.0;

template OwnershipProof() {
    signal input secret;
    signal input commitment;

    // commitment = Poseidon(secret)
    signal computed;

    computed <== Poseidon([secret]);

    commitment === computed;
}

component main = OwnershipProof();
