export interface LogEntry {
  timestamp: string;
  query_text: string;
  ip: string;
  label?: number; // 1 for malicious, 0 for normal (Ground Truth)
}

export interface EvaluationResult {
  recall: number;
  precision: number;
  val_score: number;
  is_anomaly: boolean;
  score: number;
}

export interface Experiment {
  round: number;
  strategy: string;
  val_score: number;
  result: 'Keep' | 'Discard';
  timestamp: string;
}

export interface DetectionLogic {
  threshold: number;
  weights: {
    frequency: number;
    payload_risk: number;
    unusual_time: number;
    sensitive_target: number;
  };
  sensitive_patterns: string[];
}
