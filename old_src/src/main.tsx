import React from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "wallet"],
        
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },

        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
        },
      }}
    >
      <AptosWalletAdapterProvider autoConnect={true}>
        <App />
      </AptosWalletAdapterProvider>
    </PrivyProvider>
  </React.StrictMode>
);