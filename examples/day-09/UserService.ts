// Mock service for testing
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export class UserService {
  private static instance: UserService;
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getAllUsers(): Promise<User[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.users];
  }

  async getUserById(id: number): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.users.find(user => user.id === id) || null;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newUser: User = {
      ...userData,
      id: Math.max(...this.users.map(u => u.id)) + 1,
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }

  // For testing purposes
  reset(): void {
    this.users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];
  }
}