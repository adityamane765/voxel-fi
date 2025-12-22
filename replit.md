# VoxelFi - Private Fractal Liquidity

## Overview

VoxelFi is a frontend application for a DeFi protocol focused on privacy-preserving liquidity provision using fractal mathematics and zero-knowledge proofs. The application features an ultra-minimalist design with full backend integration capabilities for managing liquidity positions on the Movement Network.

The frontend is designed to work standalone with demo data, but can be connected to the Express API backend and Move smart contracts for full functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 with hot module replacement
- **Styling**: Tailwind CSS 4 with custom CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Wallet**: Privy for embedded wallet authentication (email/social login)
- **Blockchain**: Aptos SDK for Movement Network interactions

### Application Structure
- **Single Page Application**: Client-side routing via React state (`currentPage`)
- **Component-Based Architecture**: Modular components in `src/components/`
- **Service Layer**: API and blockchain services in `src/services/`
- **Configuration**: Centralized config in `src/config/`
- **Custom Hooks**: Wallet and integration hooks in `src/hooks/`

### Key Pages
1. **Landing Page** - Ultra-minimalist marketing page with animated typography
2. **Dashboard** - Portfolio overview with real-time position data
3. **Position Creator** - Interactive form with ZK proof generation and deployment
4. **Analytics** - Performance charts and metrics display

### Design System
- **Dark Theme**: Pure black background (#000) with white/gray text hierarchy
- **Typography-First**: Large-scale headings (6xl-8xl) inspired by Siphon
- **Gradient Accents**: Cyan to purple gradients for interactive elements
- **Font**: Inter font family with light weights

### Backend Integration

#### Configuration (Environment Variables)
- `VITE_PRIVY_APP_ID` - Privy application ID for wallet authentication
- `VITE_API_URL` - Express API backend URL (default: http://localhost:8080)
- `VITE_MOVEMENT_RPC_URL` - Movement Network RPC endpoint
- `VITE_MOVEMENT_CHAIN_ID` - Movement Network chain ID
- `VITE_MODULE_ADDRESS` - Move module address for smart contracts

#### Services
- **API Service** (`src/services/api.ts`): Express backend communication
- **Aptos Service** (`src/services/aptos.ts`): Move contract interactions
- **Wallet Hook** (`src/hooks/useWallet.ts`): Privy wallet integration

#### Graceful Degradation
All services fall back to demo/simulated data when:
- Backend API is unavailable
- Wallet is not connected
- Environment variables not configured

## External Dependencies

### Production Dependencies
- `react` / `react-dom` - Core UI framework
- `framer-motion` - Animation library
- `lucide-react` - Icon components
- `recharts` - Charting library
- `@privy-io/react-auth` - Embedded wallet authentication
- `@aptos-labs/ts-sdk` - Movement Network blockchain SDK
- `axios` - HTTP client for API calls

### Development Dependencies
- `vite` - Build tooling and dev server
- `typescript` - Type checking
- `tailwindcss` - Utility CSS framework
- `eslint` - Code linting

## Recent Changes

- December 2024: Added full backend integration architecture
- December 2024: Integrated Privy embedded wallet authentication
- December 2024: Created API service layer for Express backend
- December 2024: Added Aptos SDK for Move contract interactions
- December 2024: Updated Dashboard and PositionCreator with real transaction flows
