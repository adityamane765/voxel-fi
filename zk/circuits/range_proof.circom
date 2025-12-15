pragma circom 2.0.0;

include "circomlib/circuits/bitify.circom";

template RangeProof(nBits) {
    signal input value;
    signal input min;
    signal input max;

    signal diffMin;
    diffMin <== value - min;

    component diffMinBits = Num2Bits(nBits);
    diffMinBits.in <== diffMin;

    signal diffMax;
    diffMax <== max - value;

    component diffMaxBits = Num2Bits(nBits);
    diffMaxBits.in <== diffMax;
}

component main = RangeProof(32);
