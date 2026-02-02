/**
 * Core intent types - framework-agnostic
 * Used by UI, CLI, and MCP server
 */

export type IntentType = 'need' | 'offer' | 'query' | 'collaboration';
export type IntentStatus = 'open' | 'matched' | 'in-progress' | 'completed' | 'cancelled';

export type IntentDraft = {
  type: IntentType;
  title: string;
  description: string;
  skills: string[];
  agentId?: string;
  pricingModel?: string;
  amount?: number;
  currency?: string;
};

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

export type IntentPreview = {
  type: IntentType;
  title: string;
  description: string;
  skills: string[];
  pricingSummary?: string;
  validation: ValidationResult;
};

