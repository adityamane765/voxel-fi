pragma circom 2.1.0;

include "circomlib/circuits/comparators.circom";

template RangeProof() {
    signal input value;
    signal input min;
    signal input max;

    component gte = GreaterEqThan(64);
    component lte = LessEqThan(64);

    gte.in[0] <== value;
    gte.in[1] <== min;

    lte.in[0] <== value;
    lte.in[1] <== max;

    gte.out === 1;
    lte.out === 1;
}

component main = RangeProof();
