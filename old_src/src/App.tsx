import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAptosWallet } from "./auth/useAptosWallet";
import { mintPosition, burnPosition } from "./blockchain/aptos";
import "./App.css";

function App() {
  const { login, logout } = usePrivy();
  const {
    isAuthenticated,
    privyUser,
    aptosWallet,
    isAptosConnected,
    isAptosWalletAvailable,
    connectAptosWallet,
    disconnectAptosWallet,
    walletName,
    signAndSubmitTransaction,
  } = useAptosWallet();

  const [txStatus, setTxStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state for mint position
  const [mintParams, setMintParams] = useState({
    amountX: "1000000",
    amountY: "1000000",
    priceCenter: "100000000",
    spread: "10000000",
    fractalType: "0",
    depth: "3",
  });

  const handleMintPosition = async () => {
    if (!signAndSubmitTransaction) {
      alert("Please connect your Aptos wallet first");
      return;
    }

    try {
      setIsProcessing(true);
      setTxStatus("Submitting transaction...");

      const response = await mintPosition(signAndSubmitTransaction, {
        amountX: Number(mintParams.amountX),
        amountY: Number(mintParams.amountY),
        priceCenter: Number(mintParams.priceCenter),
        spread: Number(mintParams.spread),
        fractalType: Number(mintParams.fractalType),
        depth: Number(mintParams.depth),
      });

      setTxStatus(`✅ Transaction submitted! Hash: ${response.hash}`);
      console.log("Transaction response:", response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setTxStatus(`❌ Error: ${errorMsg}`);
      console.error("Transaction error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBurnPosition = async () => {
    if (!signAndSubmitTransaction) {
      alert("Please connect your Aptos wallet first");
      return;
    }

    const positionId = prompt("Enter position ID to burn:");
    if (!positionId) return;

    try {
      setIsProcessing(true);
      setTxStatus("Burning position...");

      const response = await burnPosition(signAndSubmitTransaction, Number(positionId));

      setTxStatus(`✅ Position burned! Hash: ${response.hash}`);
      console.log("Burn response:", response);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setTxStatus(`❌ Error: ${errorMsg}`);
      console.error("Burn error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>🌀 Fractal Position Manager</h1>
        <p>Aptos Blockchain Integration with Privy Auth</p>
      </header>

      <main>
        {/* Step 1: Privy Authentication */}
        <section className="card">
          <h2>Step 1: Authentication</h2>
          {!isAuthenticated ? (
            <div>
              <p>Login to get started</p>
              <button onClick={login} className="btn btn-primary">
                🔐 Login with Privy
              </button>
            </div>
          ) : (
            <div>
              <p className="success">
                ✅ Authenticated as{" "}
                {privyUser?.email?.address ||
                  privyUser?.wallet?.address ||
                  "User"}
              </p>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Aptos Wallet Connection */}
        <section className="card">
          <h2>Step 2: Connect Aptos Wallet</h2>

          {!isAptosWalletAvailable ? (
            <div className="warning">
              ⚠️ Please install{" "}
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Petra Wallet
              </a>{" "}
              extension
            </div>
          ) : !isAptosConnected ? (
            <div>
              <p>Connect your Aptos wallet to interact with the blockchain</p>
              <button
                onClick={connectAptosWallet}
                disabled={!isAuthenticated}
                className="btn btn-primary"
              >
                🦊 Connect {walletName}
              </button>
              {!isAuthenticated && (
                <p className="info">
                  💡 Please authenticate with Privy first
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="success">
                ✅ Connected to {walletName}:{" "}
                <code>
                  {aptosWallet?.address.slice(0, 6)}...
                  {aptosWallet?.address.slice(-4)}
                </code>
              </p>
              <button
                onClick={disconnectAptosWallet}
                className="btn btn-secondary"
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </section>

        {/* Step 3: Blockchain Interactions */}
        {isAptosConnected && (
          <section className="card">
            <h2>Step 3: Blockchain Interactions</h2>

            {/* Mint Position Form */}
            <div className="form-section">
              <h3>Mint Fractal Position</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>Amount X:</label>
                  <input
                    type="text"
                    value={mintParams.amountX}
                    onChange={(e) =>
                      setMintParams({ ...mintParams, amountX: e.target.value })
                    }
                    placeholder="1000000"
                  />
                </div>

                <div className="form-group">
                  <label>Amount Y:</label>
                  <input
                    type="text"
                    value={mintParams.amountY}
                    onChange={(e) =>
                      setMintParams({ ...mintParams, amountY: e.target.value })
                    }
                    placeholder="1000000"
                  />
                </div>

                <div className="form-group">
                  <label>Price Center:</label>
                  <input
                    type="text"
                    value={mintParams.priceCenter}
                    onChange={(e) =>
                      setMintParams({
                        ...mintParams,
                        priceCenter: e.target.value,
                      })
                    }
                    placeholder="100000000"
                  />
                </div>

                <div className="form-group">
                  <label>Spread:</label>
                  <input
                    type="text"
                    value={mintParams.spread}
                    onChange={(e) =>
                      setMintParams({ ...mintParams, spread: e.target.value })
                    }
                    placeholder="10000000"
                  />
                </div>

                <div className="form-group">
                  <label>Fractal Type:</label>
                  <input
                    type="text"
                    value={mintParams.fractalType}
                    onChange={(e) =>
                      setMintParams({
                        ...mintParams,
                        fractalType: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Depth:</label>
                  <input
                    type="text"
                    value={mintParams.depth}
                    onChange={(e) =>
                      setMintParams({ ...mintParams, depth: e.target.value })
                    }
                    placeholder="3"
                  />
                </div>
              </div>

              <button
                onClick={handleMintPosition}
                disabled={isProcessing}
                className="btn btn-primary"
              >
                {isProcessing ? "Processing..." : "🚀 Mint Position"}
              </button>
            </div>

            {/* Burn Position */}
            <div className="form-section">
              <h3>Burn Position</h3>
              <button
                onClick={handleBurnPosition}
                disabled={isProcessing}
                className="btn btn-danger"
              >
                {isProcessing ? "Processing..." : "🔥 Burn Position"}
              </button>
            </div>

            {/* Transaction Status */}
            {txStatus && (
              <div className="tx-status">
                <h4>Transaction Status:</h4>
                <p>{txStatus}</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>
          Built with Privy Auth + Aptos Blockchain |{" "}
          <a
            href="https://docs.petra.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Petra Docs
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;