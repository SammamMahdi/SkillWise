import axios from 'axios';

const API_URL = '/api/payments';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    throw new Error(message);
  }
);

const paymentService = {
  // Get wallet information
  getWallet: async () => {
    return await api.get('/wallet');
  },

  // Activate wallet
  activateWallet: async () => {
    return await api.post('/wallet/activate');
  },

  // Redeem payment code
  redeemCode: async (code) => {
    return await api.post('/redeem', { code });
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);

    const url = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await api.get(url);
  },

  // Get wallet stats (derived from wallet data)
  getWalletStats: async () => {
    const wallet = await api.get('/wallet');
    return {
      ...wallet,
      data: {
        ...wallet.data,
        stats: {
          totalEarned: wallet.data.wallet?.totalEarned || 0,
          totalSpent: wallet.data.wallet?.totalSpent || 0,
          netGain: (wallet.data.wallet?.totalEarned || 0) - (wallet.data.wallet?.totalSpent || 0),
          isActive: wallet.data.wallet?.isActivated || false
        }
      }
    };
  }
};

export default paymentService;
