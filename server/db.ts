import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { CONFIG } from './config.js';

// Define the database schema interface
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'employee' | 'admin';
  department: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketId: string; // E.g., TICK-1001
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  employeeId: string;
  employeeName: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  ticketCreated?: boolean;
  ticketId?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface DatabaseSchema {
  users: User[];
  tickets: Ticket[];
  chats: ChatSession[];
  logs: ActivityLog[];
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    tickets: [],
    chats: [],
    logs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(CONFIG.DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(CONFIG.DB_FILE)) {
        const fileContent = fs.readFileSync(CONFIG.DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
      }
    } catch (error) {
      console.error('Database initialization failed, using transient memory storage:', error);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(CONFIG.BCRYPT_SALT_ROUNDS);

    // Initial Users
    const users: User[] = [
      {
        id: 'user_admin',
        name: 'Alex Sterling',
        email: 'admin@aex.com',
        passwordHash: bcrypt.hashSync('admin123', salt),
        role: 'admin',
        department: 'Information Technology',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_emp1',
        name: 'Sarah Connor',
        email: 'sarah.c@aex.com',
        passwordHash: bcrypt.hashSync('employee123', salt),
        role: 'employee',
        department: 'Operations',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_emp2',
        name: 'John Doe',
        email: 'john.doe@aex.com',
        passwordHash: bcrypt.hashSync('employee123', salt),
        role: 'employee',
        department: 'Finance',
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial Tickets
    const tickets: Ticket[] = [
      {
        id: 'tick_1',
        ticketId: 'TICK-1001',
        title: 'Global VPN Connection Timeout',
        description: 'Unable to connect to the US West VPN gateway, receiving TLS handshake failure.',
        category: 'VPN',
        priority: 'high',
        status: 'assigned',
        employeeId: 'user_emp1',
        employeeName: 'Sarah Connor',
        assignedTo: 'Alex Sterling',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tick_2',
        ticketId: 'TICK-1002',
        title: 'Printer Offline in Floor 3 Hallway',
        description: 'The physical printer is showing error 0x44 and does not register on the network queue.',
        category: 'Printer',
        priority: 'low',
        status: 'open',
        employeeId: 'user_emp2',
        employeeName: 'John Doe',
        assignedTo: null,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hrs ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tick_3',
        ticketId: 'TICK-1003',
        title: 'AD Account Lockout Recovery',
        description: 'Active Directory account locked out after multiple password attempts from expired mobile session.',
        category: 'Password Reset',
        priority: 'medium',
        status: 'resolved',
        employeeId: 'user_emp1',
        employeeName: 'Sarah Connor',
        assignedTo: 'Alex Sterling',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tick_4',
        ticketId: 'TICK-1004',
        title: 'License Activation: Adobe Creative Suite',
        description: 'Need Adobe Creative Cloud enterprise license key for designing the winter Q4 assets.',
        category: 'License',
        priority: 'low',
        status: 'closed',
        employeeId: 'user_emp2',
        employeeName: 'John Doe',
        assignedTo: 'Alex Sterling',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Initial Logs
    const logs: ActivityLog[] = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        userId: 'user_admin',
        userEmail: 'admin@aex.com',
        action: 'System Seed',
        details: 'Initial database collections and admin accounts seeded successfully.',
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        userId: 'user_emp1',
        userEmail: 'sarah.c@aex.com',
        action: 'Ticket Created',
        details: 'Sarah Connor created Ticket TICK-1003 for category Password Reset.',
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
        userId: 'user_admin',
        userEmail: 'admin@aex.com',
        action: 'Ticket Resolved',
        details: 'Admin resolved Ticket TICK-1003 (AD Account Lockout).',
      },
    ];

    this.data = { users, tickets, chats: [], logs };
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(CONFIG.DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to write database to disk:', error);
    }
  }

  // Collection getter mock helper
  public collection<K extends keyof DatabaseSchema>(name: K) {
    return {
      find: (filter?: (item: DatabaseSchema[K][number]) => boolean): DatabaseSchema[K] => {
        if (!filter) return this.data[name];
        return (this.data[name] as any[]).filter(filter) as DatabaseSchema[K];
      },
      findOne: (filter: (item: DatabaseSchema[K][number]) => boolean): DatabaseSchema[K][number] | null => {
        return (this.data[name] as any[]).find(filter) || null;
      },
      insertOne: (item: any): any => {
        this.data[name].push(item as any);
        this.save();
        return item;
      },
      updateOne: (
        filter: (item: DatabaseSchema[K][number]) => boolean,
        update: Partial<DatabaseSchema[K][number]> | ((item: DatabaseSchema[K][number]) => void)
      ): boolean => {
        const index = (this.data[name] as any[]).findIndex(filter);
        if (index === -1) return false;
        
        if (typeof update === 'function') {
          update(this.data[name][index]);
        } else {
          this.data[name][index] = { ...this.data[name][index], ...update };
        }
        this.save();
        return true;
      },
      deleteOne: (filter: (item: DatabaseSchema[K][number]) => boolean): boolean => {
        const index = (this.data[name] as any[]).findIndex(filter);
        if (index === -1) return false;
        this.data[name].splice(index, 1);
        this.save();
        return true;
      },
    };
  }
}

export const db = new Database();
