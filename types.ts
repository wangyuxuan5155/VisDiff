
export interface Discrepancy {
  category: 'color' | 'typography' | 'spacing' | 'alignment' | 'layout' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  expected: string;
  actual: string;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisReport {
  summary: string;
  score: number;
  discrepancies: Discrepancy[];
  colorPalette: {
    design: string[];
    implementation: string[];
  };
}

export interface ComparisonResult {
  id: string;
  timestamp: number;
  report: AnalysisReport;
  designImage: string;
  implementationImage: string;
}
