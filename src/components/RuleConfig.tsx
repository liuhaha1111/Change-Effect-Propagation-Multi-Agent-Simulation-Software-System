import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Folder, ChevronRight, Plus, Trash2, AlertTriangle, Play, Settings } from 'lucide-react';

export function RuleConfig() {
  const { agents, setAgents, components } = useAppContext();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [conflictResult, setConflictResult] = useState<string[] | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testJson, setTestJson] = useState('{"type":"parameter_change","field":"强度","operator":">","value":"0.7"}');

  let selectedAgent = null;
  let selectedCategory = null;
  for (const cat of Object.values(agents) as any[]) {
    for (const agent of Object.values(cat.children) as any[]) {
      if (agent.id === selectedAgentId) {
        selectedAgent = agent;
        selectedCategory = cat.name;
        break;
      }
    }
  }

  const handleAddRule = () => {
    if (!selectedAgentId) return;
    setAgents(prev => {
      const next = { ...prev };
      for (const cat of Object.values(next) as any[]) {
        if (cat.children[selectedAgentId]) {
          cat.children[selectedAgentId].rules.push({
            id: Math.random().toString(36).substr(2, 9),
            condition: { type: "parameter_change", field: "新参数", operator: ">", value: "0" },
            actions: []
          });
        }
      }
      return next;
    });
  };

  const updateRule = (ruleId: string, updater: (rule: any) => void) => {
    if (!selectedAgentId) return;
    setAgents(prev => {
      const next = JSON.parse(JSON.stringify(prev)); // Deep copy for simplicity
      for (const cat of Object.values(next) as any[]) {
        const agent = (cat as any).children[selectedAgentId];
        if (agent) {
          const rule = agent.rules.find((r: any) => r.id === ruleId);
          if (rule) updater(rule);
        }
      }
      return next;
    });
  };

  const deleteRule = (ruleId: string) => {
    if (!selectedAgentId) return;
    setAgents(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      for (const cat of Object.values(next) as any[]) {
        const agent = (cat as any).children[selectedAgentId];
        if (agent) {
          agent.rules = agent.rules.filter((r: any) => r.id !== ruleId);
        }
      }
      return next;
    });
  };

  const detectConflicts = () => {
    if (!selectedAgent) return;
    const rules = selectedAgent.rules;
    const conflicts = [];
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        if (JSON.stringify(rules[i].condition) === JSON.stringify(rules[j].condition)) {
          conflicts.push(`规则 ${i + 1} 与 规则 ${j + 1} 具有完全相同的触发条件，可能导致执行冲突。`);
        }
      }
    }
    setConflictResult(conflicts);
  };

  const runTest = () => {
    if (!selectedAgent) return;
    try {
      const testCond = JSON.parse(testJson);
      const matched = selectedAgent.rules.filter(r => 
        r.condition.type === testCond.type &&
        r.condition.field === testCond.field &&
        r.condition.operator === testCond.operator &&
        r.condition.value == testCond.value // loose equality for string/number
      );
      setTestResult(matched);
    } catch (e) {
      setTestResult('error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar Tree */}
      <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-500" />
            智能体类及对象树
          </h3>
        </div>
        <div className="p-3 overflow-y-auto flex-1">
          {Object.entries(agents).map(([catName, cat]) => (
            <div key={catName} className="mb-4">
              <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1 px-2">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                {catName}
              </div>
              <div className="space-y-1 pl-6">
                {Object.values((cat as any).children).map((agent: any) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setConflictResult(null);
                      setTestResult(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      selectedAgentId === agent.id 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedAgentId === agent.id ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedAgent ? (
          <>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-500 mt-1">所属分类: {selectedCategory}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={detectConflicts} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors">
                  <AlertTriangle className="w-4 h-4" /> 冲突检测
                </button>
                <button onClick={handleAddRule} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" /> 新增规则
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {conflictResult && (
                <div className={`p-4 rounded-lg border ${conflictResult.length > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 
                    {conflictResult.length > 0 ? '检测到冲突' : '未检测到明显冲突'}
                  </h4>
                  {conflictResult.length > 0 && (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {conflictResult.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {selectedAgent.rules.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                  暂无规则，请点击右上角新增规则
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedAgent.rules.map((rule, idx) => (
                    <div key={rule.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <span className="font-semibold text-slate-700">规则 {idx + 1}</span>
                        <button onClick={() => deleteRule(rule.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Condition */}
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">IF</span> 触发条件
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select 
                              value={rule.condition.type}
                              onChange={e => updateRule(rule.id, r => r.condition.type = e.target.value)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="parameter_change">参数变更</option>
                              <option value="cost_change">成本波动</option>
                              <option value="requirement_change">需求变更</option>
                              <option value="constraint_conflict">约束冲突</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="字段/对象"
                              value={rule.condition.field}
                              onChange={e => updateRule(rule.id, r => r.condition.field = e.target.value)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <select 
                              value={rule.condition.operator}
                              onChange={e => updateRule(rule.id, r => r.condition.operator = e.target.value)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value=">">&gt;</option>
                              <option value="<">&lt;</option>
                              <option value="==">=</option>
                              <option value="!=">!=</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="比较值"
                              value={rule.condition.value}
                              onChange={e => updateRule(rule.id, r => r.condition.value = e.target.value)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">THEN</span> 执行动作
                          </h4>
                          <div className="space-y-3">
                            {rule.actions.map((action, actIdx) => (
                              <div key={actIdx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                <div className="flex gap-3 mb-3">
                                  <select
                                    value={action.component}
                                    onChange={e => updateRule(rule.id, r => {
                                      r.actions[actIdx].component = e.target.value;
                                      r.actions[actIdx].params = {}; // Reset params on component change
                                    })}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  >
                                    <option value="">-- 选择组件 --</option>
                                    {components.map(c => (
                                      <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                  <button 
                                    onClick={() => updateRule(rule.id, r => r.actions.splice(actIdx, 1))}
                                    className="px-3 py-2 text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                {/* Parameters for selected component */}
                                {action.component && (
                                  <div className="pl-4 border-l-2 border-blue-200 space-y-2">
                                    {components.find(c => c.name === action.component)?.params.map(paramName => (
                                      <div key={paramName} className="flex items-center gap-2">
                                        <label className="text-xs text-slate-500 w-24 shrink-0">{paramName}</label>
                                        <input 
                                          type="text"
                                          value={action.params[paramName] || ''}
                                          onChange={e => updateRule(rule.id, r => r.actions[actIdx].params[paramName] = e.target.value)}
                                          placeholder={`输入 ${paramName}`}
                                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            <button 
                              onClick={() => updateRule(rule.id, r => r.actions.push({ component: '', params: {} }))}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> 添加动作组件
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Section */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-600" /> 条件测试
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">模拟触发条件 (JSON格式)</label>
                  <textarea 
                    value={testJson}
                    onChange={e => setTestJson(e.target.value)}
                    className="w-full h-24 p-3 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="mt-3 flex items-center gap-4">
                    <button onClick={runTest} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                      执行测试
                    </button>
                    {testResult === 'error' && <span className="text-red-600 text-sm">JSON格式错误</span>}
                    {Array.isArray(testResult) && (
                      <span className={`text-sm font-medium ${testResult.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        {testResult.length > 0 
                          ? `✅ 匹配到 ${testResult.length} 条规则` 
                          : '❌ 未匹配到任何规则'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-4">
            <Settings className="w-12 h-12 opacity-20" />
            <p>请从左侧选择智能体以查看或配置规则</p>
          </div>
        )}
      </div>
    </div>
  );
}
