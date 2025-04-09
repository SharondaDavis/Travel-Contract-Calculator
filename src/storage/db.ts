import Dexie, { Table } from 'dexie';
import { Assignment } from '../App';

interface Settings {
  key: string;
  value: string;
  updatedAt: Date;
}

interface ChatMessage {
  id?: number;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
}

interface StoredContract extends Assignment {
  data: any;
}

export class ContractDatabase extends Dexie {
  contracts!: Table<StoredContract>;
  settings!: Table<Settings>;
  chat_messages!: Table<ChatMessage>;

  constructor() {
    super('ContractDatabase');
    this.version(3).stores({
      contracts: 'id, facilityName, location, specialty, startDate, endDate',
      settings: 'key, updatedAt',
      chat_messages: '++id, timestamp'
    });
  }
}

export const db = new ContractDatabase(); 