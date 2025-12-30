
export interface CarSpec {
  label: string;
  value: string;
  category: 'performance' | 'safety' | 'luxury' | 'general';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string;
  groundingLinks?: { title: string; uri: string }[];
}

export interface ComparisonData {
  features: string[];
  car1: {
    name: string;
    specs: Record<string, string>;
  };
  car2: {
    name: string;
    specs: Record<string, string>;
  };
}
