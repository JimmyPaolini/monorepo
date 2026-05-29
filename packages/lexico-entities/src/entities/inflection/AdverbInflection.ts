export type AdverbType = string;
export type AdverbDegree = 'positive' | 'comparative' | 'superlative';

export class AdverbInflection {
  type: AdverbType = '';
  degree: AdverbDegree = 'positive';
}
