import { DetectionLogic, LogEntry } from "./types";

export const INITIAL_PROGRAM_MD = `# 高雄市社安網：個資查詢行為自動化監控
## 研究目標
自動化優化「廉正監測邏輯 (integrity_logic.py)」，旨在從海量社安網個資查詢日誌中，精準識別出潛在的「狼社工」異常行為（如：頻繁查詢未成年個資、非辦案時間存取、跨區查詢等），並極小化對正常公務查詢的干擾。

## 實驗規則
- Agent 僅能修改「偵測邏輯函數」。
- 迭代週期：每輪實驗 5 分鐘。
- 運算邏輯：修改代碼 -> 測試 -> 比較 -> 留優汰劣。

## 衡量指標
- val_score = (召回率 * 0.7) + (精準度 * 0.3)
- 召回率 (Recall)：必須抓出已知的惡意存取樣本（如：何建忠案之行為特徵）。
- 誤報率 (FPR)：必須極低，避免影響正常社安網運作。
`;

export const INITIAL_MONITOR_LOGIC = `import re

def analyze_query_behavior(logs, config):
    threshold = config.threshold
    weights = config.weights
    
    # 特徵 1：查詢頻率 (異常大量查詢)
    query_count = len(logs)
    freq_score = min(100, query_count * 5)
    
    # 特徵 2：敏感關鍵字 (如：未成年、自殺、弱勢)
    payload_score = 0
    sensitive_patterns = config.sensitive_patterns
    
    for log in logs:
        query_str = log.get("query_text", "")
        if any(re.search(p, query_str, re.I) for p in sensitive_patterns):
            payload_score = 100
            break
            
    final_score = (
        (freq_score * weights["frequency"] / 100) +
        (payload_score * weights["payload_risk"] / 100)
    )
    
    return final_score >= threshold, final_score
`;

export const TEST_CASES: LogEntry[] = [
  { label: 1, timestamp: "2024-05-20 03:00:00", query_text: "查詢：未成年少女/自殺通報個案/詳細住址", ip: "10.20.30.40" },
  { label: 1, timestamp: "2024-05-20 03:05:00", query_text: "存取：高風險曝險少女/個資/聯絡電話", ip: "10.20.30.40" },
  { label: 0, timestamp: "2024-05-20 09:10:00", query_text: "例行查詢：個案進度追蹤/苓雅區", ip: "192.168.1.1" },
  { label: 0, timestamp: "2024-05-20 10:15:00", query_text: "系統登入：公務帳號驗證", ip: "127.0.0.1" },
  // 模擬何建忠案特徵
  { label: 1, timestamp: "2024-05-20 01:00:00", query_text: "跨區查詢：非轄區弱勢少女資料", ip: "10.20.30.40" },
  { label: 1, timestamp: "2024-05-20 02:00:00", query_text: "大量下載：自殺防治系統個案名單", ip: "10.20.30.40" },
  { label: 1, timestamp: "2024-05-20 03:00:00", query_text: "查詢：個案身分證字號/家庭背景", ip: "10.20.30.40" },
  { label: 1, timestamp: "2024-05-20 04:00:00", query_text: "異常存取：利用職務取得少女聯絡方式", ip: "10.20.30.40" },
  { label: 0, timestamp: "2024-05-20 15:00:00", query_text: "會議記錄存檔：社安網績優督導評選", ip: "192.168.1.100" },
];

export const INITIAL_CONFIG: DetectionLogic = {
  threshold: 70.0,
  weights: {
    frequency: 25.0,
    payload_risk: 40.0,
    unusual_time: 15.0,
    sensitive_target: 20.0
  },
  sensitive_patterns: ["未成年", "少女", "自殺", "誘騙", "個資"]
};
