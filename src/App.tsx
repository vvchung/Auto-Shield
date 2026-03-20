import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Cpu, 
  Activity, 
  Terminal, 
  Bell, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Database,
  Lock,
  Eye,
  MessageSquare,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  INITIAL_PROGRAM_MD, 
  INITIAL_MONITOR_LOGIC, 
  TEST_CASES, 
  INITIAL_CONFIG 
} from './constants';
import { LogEntry, Experiment, DetectionLogic, EvaluationResult } from './types';

// --- Simulation Helpers ---
const runEvaluation = (logic: DetectionLogic, logs: LogEntry[]): EvaluationResult => {
  let tp = 0, fp = 0, fn = 0, tn = 0;

  logs.forEach(log => {
    // Simplified simulation of the logic
    let score = 0;
    
    // Frequency (mocked as IP repetition in the test set)
    const ipCount = logs.filter(l => l.ip === log.ip).length;
    score += Math.min(100, ipCount * 10) * (logic.weights.frequency / 100);

    // Payload Risk
    const hasPattern = logic.sensitive_patterns.some(p => 
      log.query_text.toLowerCase().includes(p.toLowerCase())
    );
    if (hasPattern) score += 100 * (logic.weights.payload_risk / 100);

    // Sensitive Target (mocked)
    const isSensitive = /salary|employee|personal|admin/i.test(log.query_text);
    if (isSensitive) score += 100 * (logic.weights.sensitive_target / 100);

    const isAnomaly = score >= logic.threshold;
    const actual = log.label === 1;

    if (isAnomaly && actual) tp++;
    else if (isAnomaly && !actual) fp++;
    else if (!isAnomaly && actual) fn++;
    else tn++;
  });

  const recall = tp / (tp + fn) || 0;
  const precision = tp / (tp + fp) || 0;
  const val_score = (recall * 0.7) + (precision * 0.3);

  return { recall, precision, val_score, is_anomaly: false, score: 0 }; // is_anomaly/score not used for global eval
};

// --- Components ---

const CodeBlock = ({ code, language }: { code: string, language: string }) => (
  <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto font-mono text-sm border border-zinc-800">
    <code>{code}</code>
  </pre>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
      active 
        ? 'bg-zinc-800 text-white shadow-lg' 
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
    }`}
  >
    <Icon size={18} />
    <span className="font-medium">{label}</span>
  </button>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'lab' | 'evolution' | 'dashboard'>('lab');
  const [config, setConfig] = useState<DetectionLogic>(INITIAL_CONFIG);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isEvolving, setIsEvolving] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>(TEST_CASES);
  
  const evolutionInterval = useRef<any>(null);

  // Initial Evaluation
  useEffect(() => {
    const res = runEvaluation(INITIAL_CONFIG, TEST_CASES);
    setBestScore(res.val_score);
  }, []);

  const startEvolution = () => {
    if (isEvolving) {
      clearInterval(evolutionInterval.current);
      setIsEvolving(false);
      return;
    }

    setIsEvolving(true);
    let currentRound = experiments.length + 1;
    let currentBest = bestScore;

    evolutionInterval.current = setInterval(() => {
      // Simulate an LLM strategy
      const strategies = [
        "增加未成年關鍵字權重",
        "優化跨區查詢偵測邏輯",
        "調整非辦案時間存取權重",
        "強化大量下載個資預警",
        "針對高風險個案存取建立門檻",
        "優化督導權限異常使用偵測"
      ];
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      
      // Randomly mutate config
      const newConfig = { ...config };
      const mutationType = Math.random();
      
      if (mutationType < 0.3) {
        newConfig.threshold += (Math.random() - 0.5) * 10;
      } else if (mutationType < 0.6) {
        const keys = Object.keys(newConfig.weights) as (keyof typeof newConfig.weights)[];
        const key = keys[Math.floor(Math.random() * keys.length)];
        newConfig.weights[key] += (Math.random() - 0.5) * 5;
      } else {
        const newPatterns = ["性侵害", "曝險少女", "自殘"];
        const pattern = newPatterns[Math.floor(Math.random() * newPatterns.length)];
        if (!newConfig.sensitive_patterns.includes(pattern)) {
          newConfig.sensitive_patterns = [...newConfig.sensitive_patterns, pattern];
        }
      }

      const evalRes = runEvaluation(newConfig, TEST_CASES);
      const isBetter = evalRes.val_score > currentBest;

      if (isBetter) {
        currentBest = evalRes.val_score;
        setConfig(newConfig);
        setBestScore(evalRes.val_score);
      }

      const newExp: Experiment = {
        round: currentRound++,
        strategy,
        val_score: evalRes.val_score,
        result: isBetter ? 'Keep' : 'Discard',
        timestamp: new Date().toLocaleTimeString()
      };

      setExperiments(prev => [newExp, ...prev].slice(0, 50));

      if (currentRound > experiments.length + 20) {
        clearInterval(evolutionInterval.current);
        setIsEvolving(false);
      }
    }, 1500);
  };

  const simulateAlert = () => {
    const randomLog = TEST_CASES[Math.floor(Math.random() * TEST_CASES.length)];
    const newAlert = {
      id: Date.now(),
      ip: randomLog.ip,
      query: randomLog.query_text,
      score: (Math.random() * 30 + 70).toFixed(2),
      timestamp: new Date().toLocaleTimeString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="text-zinc-950" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">高雄市社安網廉正監測哨兵</h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Integrity Sentinel Hub</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <TabButton 
              active={activeTab === 'lab'} 
              onClick={() => setActiveTab('lab')} 
              icon={Cpu} 
              label="監測實驗室" 
            />
            <TabButton 
              active={activeTab === 'evolution'} 
              onClick={() => setActiveTab('evolution')} 
              icon={Zap} 
              label="AI 進化週期" 
            />
            <TabButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={Activity} 
              label="哨兵監控中心" 
            />
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">最佳 val_score</span>
              <span className="text-emerald-400 font-mono font-bold">{bestScore.toFixed(4)}</span>
            </div>
            <button 
              onClick={simulateAlert}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'lab' && (
            <motion.div 
              key="lab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <section className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <Terminal size={20} />
                    <h2 className="font-bold uppercase tracking-tight">監測指令 (program.md)</h2>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-zinc-400 whitespace-pre-wrap">
                      {INITIAL_PROGRAM_MD}
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 text-blue-400">
                    <Database size={20} />
                    <h2 className="font-bold uppercase tracking-tight">測試數據集 (查詢日誌)</h2>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {TEST_CASES.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 font-mono">{log.timestamp}</span>
                          <code className="text-zinc-300">{log.query_text}</code>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.label === 1 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {log.label === 1 ? '異常行為' : '正常公務'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Cpu size={20} />
                      <h2 className="font-bold uppercase tracking-tight">偵測邏輯 (integrity_logic.py)</h2>
                    </div>
                    <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono">v2.1.0-社安網專用</span>
                  </div>
                  <CodeBlock code={INITIAL_MONITOR_LOGIC} language="python" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">當前權重配置</h3>
                    <div className="space-y-3">
                      {Object.entries(config.weights).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-[10px] mb-1 uppercase text-zinc-400">
                            <span>{key === 'frequency' ? '查詢頻率' : key === 'payload_risk' ? '敏感內容' : key === 'unusual_time' ? '異常時間' : '跨區查詢'}</span>
                            <span>{(val as number).toFixed(1)}%</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${val as number}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">警報觸發門檻</h3>
                    <div className="flex flex-col items-center justify-center h-full pb-6">
                      <span className="text-4xl font-mono font-bold text-emerald-400">{config.threshold.toFixed(1)}</span>
                      <span className="text-[10px] text-zinc-500 uppercase mt-2">靈敏度等級</span>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'evolution' && (
            <motion.div 
              key="evolution"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">自動化進化週期 (AI 研發)</h2>
                  <p className="text-zinc-500 text-sm">基於 Karpathy 的 AutoResearch 邏輯，由 AI 驅動偵測模型迭代。</p>
                </div>
                <button 
                  onClick={startEvolution}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    isEvolving 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 hover:scale-105'
                  }`}
                >
                  {isEvolving ? <RotateCcw size={20} className="animate-spin" /> : <Play size={20} />}
                  {isEvolving ? '停止進化' : '啟動 AI 進化週期'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">實驗日誌 (Experiment Log)</h3>
                    <span className="text-[10px] font-mono text-zinc-500">已完成 {experiments.length} 次迭代</span>
                  </div>
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                      <thead className="text-[10px] uppercase text-zinc-500 bg-zinc-950 sticky top-0">
                        <tr>
                          <th className="px-6 py-3">輪次</th>
                          <th className="px-6 py-3">優化策略</th>
                          <th className="px-6 py-3">val_score</th>
                          <th className="px-6 py-3">結果</th>
                          <th className="px-6 py-3">時間</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {experiments.map((exp, i) => (
                          <motion.tr 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-zinc-500">#{exp.round}</td>
                            <td className="px-6 py-4 font-medium">{exp.strategy}</td>
                            <td className="px-6 py-4 font-mono">
                              <span className={exp.result === 'Keep' ? 'text-emerald-400' : 'text-zinc-400'}>
                                {exp.val_score.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded w-fit ${
                                exp.result === 'Keep' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {exp.result === 'Keep' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {exp.result === 'Keep' ? '保留' : '捨棄'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-xs">{exp.timestamp}</td>
                          </motion.tr>
                        ))}
                        {experiments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-20 text-center text-zinc-600 italic">
                              尚無實驗記錄。請點擊「啟動 AI 進化週期」開始。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-4">進化進度趨勢</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">當前最佳得分</span>
                        <span className="text-2xl font-mono font-bold text-emerald-400">{bestScore.toFixed(4)}</span>
                      </div>
                      <div className="h-24 flex items-end gap-1 px-2">
                        {experiments.slice(0, 20).reverse().map((exp, i) => (
                          <div 
                            key={i} 
                            style={{ height: `${exp.val_score * 100}%` }}
                            className={`flex-1 rounded-t-sm transition-all ${exp.result === 'Keep' ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                          />
                        ))}
                      </div>
                      <div className="pt-4 border-t border-zinc-800 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>自動優化權重分配</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>精煉敏感關鍵字正則</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>啟發式動態門檻調整</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Zap size={18} />
                      <h3 className="font-bold uppercase text-sm">Vibe Coding 模式</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Agent 目前正使用「Vibe Coding」探索解空間。
                      它會優先考慮高影響力的變更，並立即捨棄導致性能下降的修改。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Sentinel Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-blue-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">社安網查詢即時監控</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">監控中</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 min-h-[400px]">
                    {logs.slice(0, 8).map((log, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all group">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${log.label === 1 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
                          {log.label === 1 ? <AlertTriangle size={20} /> : <Lock size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold font-mono">來源 IP: {log.ip}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono truncate max-w-md">{log.query_text}</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Telegram Alerts Simulation */}
              <div className="space-y-6">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-full">
                  <div className="p-4 bg-blue-600 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <MessageSquare size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">社安網廉正機器人</h3>
                      <p className="text-[10px] text-blue-100 uppercase font-bold">即時預警系統</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 space-y-4 bg-zinc-950/50 min-h-[500px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {alerts.map((alert) => (
                        <motion.div 
                          key={alert.id}
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-lg"
                        >
                          <div className="flex items-center gap-2 text-red-400 mb-3">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase">重大異常預警</span>
                          </div>
                          <div className="space-y-2 text-xs font-mono mb-4">
                            <p className="text-zinc-300">🚨 *偵測到社安網異常個資查詢!*</p>
                            <p className="text-zinc-500">━━━━━━━━━━━━━━━</p>
                            <p className="text-zinc-400">● 廉正評分: <span className="text-red-400">{alert.score}</span></p>
                            <p className="text-zinc-400">● 來源 IP: <span className="text-zinc-200">{alert.ip}</span></p>
                            <p className="text-zinc-400">● 查詢內容: <span className="text-zinc-200">{alert.query}</span></p>
                            <p className="text-zinc-300 italic">● 建議行動：立即暫停該帳號權限並啟動行政調查。</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button className="py-2 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all">
                              🚫 暫停帳號權限
                            </button>
                            <button className="py-2 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-700 transition-all">
                              🔍 調閱詳細日誌
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {alerts.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-6">
                        <Bell size={32} className="mb-4 opacity-20" />
                        <p className="text-xs italic">目前無異常警報。哨兵正在即時監控社安網查詢流。</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-zinc-500 text-xs">
          <div>
            <h4 className="font-bold text-zinc-400 mb-4 uppercase tracking-widest">核心設計理念</h4>
            <p className="leading-relaxed">
              本系統參考監察院對「何建忠案」之調查建議，以及中正大學許華孚教授之犯防觀點。
              透過「自動化科學實驗」不斷優化監測邏輯，旨在防範公職人員濫用職權，守護弱勢個資。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-400 mb-4 uppercase tracking-widest">系統運行狀態</h4>
            <ul className="space-y-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span>核心引擎：Gemini-3-Flash AI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span>進化速率：1.5s/週期</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span>監測對象：高雄市社安網個資日誌</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-end justify-end">
            <Shield size={32} className="text-zinc-800 mb-2" />
            <p className="font-mono uppercase tracking-tighter">© 2026 高雄市社安網 AI 哨兵研發組</p>
            <p className="text-[10px] text-zinc-600 mt-1">服務對象：社衛政體系</p>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
