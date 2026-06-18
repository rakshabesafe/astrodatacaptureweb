import Dexie, { type EntityTable } from 'dexie';

export interface Tool {
  id?: number;
  name: string;
  description: string;
  parametersSchema: string; // JSON string
  requiredFields: string; // Comma separated string or JSON string array
  returnType: string;
}

export interface PromptMapping {
  id?: number;
  promptText: string;
  toolName: string;
  toolArgs: string; // JSON string
  intentCategory: string;
}

const db = new Dexie('LLMTrainingDataManagerDB') as Dexie & {
  tools: EntityTable<Tool, 'id'>;
  promptMappings: EntityTable<PromptMapping, 'id'>;
};

db.version(1).stores({
  tools: '++id, name, description, returnType',
  promptMappings: '++id, promptText, toolName, intentCategory'
});

export { db };
