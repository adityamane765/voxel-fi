## Recommended Backend Testing Flow

This flow simulates a full user lifecycle, from protocol setup to exiting a position, while generating market data and verifying fee mechanisms

**Prerequisites:**
1.  **Deploy your contracts** (e.g., using `movement move publish --profile <profile_name >`).
2.  **Update `fractal_tree/scripts/common_config.sh`** with your deployed `MODULE_ADDRESS` and desired `PROFILE`.

---

**Step 1: Protocol Initialization**

*   **Objective**: Set up all the on-chain components of the Voxel Finance protocol.
*   **Command**:
    ```bash
    ./fractal_tree/scripts/init_backend.sh
    ```
---

**Step 2: Create a Liquidity Position**

*   **Objective**: Mint a position NFT.
*   **Command**:
    ```bash
    ./fractal_tree/scripts/test_mint_position.sh
    ```
    Obtain and save the NFT address using the tx hash from transaction explorer
---

**Step 3: Generate Market Activity and Accumulate Fees**

*   **Objective**: Simulate trading volume in the vault to generate fees and populate the volatility oracle with price data
*   **Command**:
    ```bash
    ./fractal_tree/scripts/market_maker.sh 30 1
    ```
    This will run 30 swaps with a 1 sec delay between each.

---

**Step 4: Distribute Accumulated Fees**

*   **Objective**: Process the fees accumulated in the vault and distribute them to active LP positions.
*   **Command**:
    ```bash
    ./fractal_tree/scripts/run_fee_distribution.sh 3000
    ```
    The 3000 is a placeholder for the current_price

---

**Step 5: Verify Position and Market State**

*   **Objective**: Inspect the state of your LP position and the overall market data after the fee distribution
*   **Commands**:
    *   **Position Dashboard**:
        ```bash
        ./fractal_tree/scripts/test_dash_stats.sh <NFT_ADDRESS>
        ```
        *(You should observe non-zero "Unclaimed Fees" and updated "Total Lifetime Earnings" for your position.)*
    *   **Volatility Dashboard**:
        ```bash
        ./fractal_tree/scripts/vol_dash.sh
        ```
        Observe how the simulated swaps have affected the volatility metrics and market insights

---

**Step 6: Claim Fees (Without Exiting Position)**

*   **Objective**: Test withdrawing only the accrued fees, leaving the principal liquidity in the position.
*   **Command**:
    ```bash
    ./fractal_tree/scripts/fee_claim_test.sh $LP_NFT_ADDRESS
    ```
    The script will confirm that your WETH/USDC balances increase and unclaimed fees for the position reset to zero.

---

**Step 7: Exit Position (Burn)**

*   **Objective**: Fully withdraw your principal liquidity and any remaining fees by burning the Position NFT
*   **Command**:
    ```bash
    ./fractal_tree/scripts/test_burn_position.sh $LP_NFT_ADDRESS
    ```
    The script will confirm that your WETH/USDC balances increase, and the position is effectively removed from the protocol.

---

**Step 8: Test ZK Flow (Optional but Recommended)**

*   **Objective**: Verify the on-chain components of the ZK proof system.
*   **Command**:
    ```bash
    # You might need to mint a new position here if you burned the first one in Step 7
    # Or, if you minted a second position in Step 2, use that NFT_ADDRESS
    ./fractal_tree/scripts/test_zk_flow.sh <AN_ACTIVE_LP_NFT_ADDRESS>
    ```
    The script tests commitment, verification, and nullifier (replay protection).
---