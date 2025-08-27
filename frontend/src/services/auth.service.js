// SBV Professional V2 - Authentication Service
export class AuthService {
    constructor() {
        this.baseUrl = '/api/auth';
        this.token = localStorage.getItem('sbv_token');
    }
    
    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            if (data.success && data.token) {
                this.token = data.token;
                localStorage.setItem('sbv_token', data.token);
            }
            
            return data;
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Validate existing token
    async validateToken(token = null) {
        try {
            const tokenToValidate = token || this.token;
            
            if (!tokenToValidate) {
                throw new Error('No token provided');
            }
            
            const response = await fetch(`${this.baseUrl}/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenToValidate}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // Token is invalid
                localStorage.removeItem('sbv_token');
                this.token = null;
                throw new Error(data.message || 'Token validation failed');
            }
            
            return data.user;
            
        } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('sbv_token');
            this.token = null;
            throw error;
        }
    }
    
    // Get current user info
    async getCurrentUser() {
        return await this.validateToken();
    }
    
    // Logout user
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('sbv_token');
            this.token = null;
        }
    }
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${this.baseUrl}/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Password change failed');
            }
            
            return data;
            
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
    
    // Get stored token
    getToken() {
        return this.token;
    }
}