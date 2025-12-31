module fractal_tree::fee_distributor {
    use fractal_tree::fractal_position;
    use fractal_tree::vault;

    public entry fun distribute_accumulated_fees<X, Y>(
        _anyone: &signer,
        current_price: u64,
    ) {
        let (fees_x, fees_y) = vault::clear_pending_fees<X, Y>();
        if (fees_x > 0 || fees_y > 0) {
            fractal_position::distribute_fees<X, Y>(fees_x, fees_y, current_price);
        }
    }
    
    public fun get_pending_fees<X, Y>(): (u64, u64) {
        vault::get_pending_fees<X, Y>()
    }
}