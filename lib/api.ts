const API_URL = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('shield_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('shield_token', token);
      } else {
        localStorage.removeItem('shield_token');
      }
    }
  }

  getToken() {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('shield_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `API error: ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(phone: string, password: string) {
    return this.request<{ token: string; rider: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  async register(data: any) {
    return this.request<{ token: string; rider: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<{ rider: any }>('/auth/me');
  }

  // Policy
  async getActivePolicy() {
    return this.request<{ policy: any }>('/policy/active');
  }

  async activatePolicy() {
    return this.request<{ policy: any }>('/policy/activate', { method: 'POST' });
  }

  async getPolicyHistory() {
    return this.request<{ policies: any[] }>('/policy/history');
  }

  // Claims
  async getClaims(status?: string, page = 1) {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    return this.request<{ claims: any[]; total: number }>(`/claims?${params}`);
  }

  async getClaimDetail(id: string) {
    return this.request<{ claim: any }>(`/claims/${id}`);
  }

  async createAutoClaim(data: any) {
    return this.request<{ claim: any }>('/claims/auto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSemiAutoClaim(data: any) {
    return this.request<{ claim: any }>('/claims/semi-auto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createManualClaim(data: any) {
    return this.request<{ claim: any }>('/claims/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmClaim(id: string) {
    return this.request<{ claim: any }>(`/claims/${id}/confirm`, { method: 'PUT' });
  }

  // Wallet
  async getWallet() {
    return this.request<{ balance: number; transactions: any[] }>('/wallet');
  }

  async topupWallet(amount: number) {
    return this.request<{ balance: number; upiRef: string }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ notification: any }>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' });
  }

  // Earnings
  async getEarningsSummary() {
    return this.request<any>('/earnings/summary');
  }

  async getEarningsBaseline() {
    return this.request<any>('/earnings/baseline');
  }

  // Disruptions
  async getActiveDisruptions() {
    return this.request<{ active: boolean; disruption: any }>('/disruptions/active');
  }

  // Payouts
  async processPayouts() {
    return this.request<{ processed: number; message: string }>('/payouts/process', { method: 'POST' });
  }
}

export const api = new ApiClient();
