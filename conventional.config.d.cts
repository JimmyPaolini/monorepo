export interface Type {
  emoji: string;
  code: string;
  name: string;
  description: string;
}

export interface Scope {
  name: string;
  description: string;
}

export const types: readonly Type[];
export const scopes: readonly Scope[];
