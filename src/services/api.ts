import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Unknown error';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export interface Position {
  id: number;
  owner: string;
  liquidity: number;
  priceCenter: number;
  spread: number;
  fractalType: number;
  depth: number;
}

export interface ZKProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

export interface ZKProveInput {
  secret: string;
  commitment: string;
  nullifier?: string;
}

export const positionService = {
  async getPosition(owner: string, positionId: number): Promise<Position> {
    try {
      const response = await api.get('/position', {
        params: { owner, positionId },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch position from API:', error);
      throw error;
    }
  },
};

export const liquidityService = {
  async getLiquidityAtPrice(owner: string, positionId: number, price: number): Promise<number> {
    try {
      const response = await api.get('/liquidity', {
        params: { owner, positionId, price },
      });
      return response.data.liquidity;
    } catch (error) {
      console.error('Failed to fetch liquidity from API:', error);
      throw error;
    }
  },
};

export const zkService = {
  async generateProof(input: ZKProveInput): Promise<ZKProof> {
    try {
      const response = await api.post('/zk/prove', input);
      return response.data;
    } catch (error) {
      console.error('Failed to generate ZK proof:', error);
      throw error;
    }
  },

  async verifyProof(proof: ZKProof['proof'], publicSignals: string[]): Promise<boolean> {
    try {
      const response = await api.post('/zk/verify', { proof, publicSignals });
      return response.data.verified;
    } catch (error) {
      console.error('Failed to verify ZK proof:', error);
      throw error;
    }
  },
};

export default api;
