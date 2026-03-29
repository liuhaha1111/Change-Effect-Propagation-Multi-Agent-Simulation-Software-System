import React, { useState } from 'react';
import { Folder, ChevronRight, Plus, Trash2, AlertTriangle, Play, Settings } from 'lucide-react';
import { useAppContext } from '../AppContext';
import type { AgentCategory, Rule } from '../types';
import { createEmptyRule, findSelectedAgent, updateAgentById } from './ruleConfigLogic';

const CONDITION_TYPE_OPTIONS = [
  { value: 'parameter_change', label: '参数变更' },
  { value: 'cost_change', label: '成本波动' },
  { value: 'requirement_change', label: '需求变更' },
  { value: 'constraint_conflict', label: '约束冲突' },
];

const OPERATOR_OPTIONS = ['>', '<', '==', '!='];

export function RuleConfig() {
  const { agents, setAgents, components } = useAppContext();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [conflictResult, setConflictResult] = useState<string[] | null>(null);
  const [testResult, setTestResult] = useState<Rule[] | 'error' | null>(null);
  const [testJson, setTestJson] = useState(
    '{"type":"parameter_change","field":"强度","operator":">","value":"0.7"}',
  );

  const selection = findSelectedAgent(agents, selectedAgentId);
  const selectedAgent = selection?.agent ?? null;
  const selectedCategory = selection?.categoryName ?? null;
  const agentCategories = Object.entries(agents) as Array<[string, AgentCategory]>;

  const handleAddRule = () => {
    if (!selectedAgentId) {
      return;
    }

    setAgents((prev) =>
      updateAgentById(prev, selectedAgentId, (agent) => {
        agent.rules.push(createEmptyRule());
      }),
    );
  };

  const updateRule = (ruleId: string, updater: (rule: Rule) => void) => {
    if (!selectedAgentId) {
      return;
    }

    setAgents((prev) =>
      updateAgentById(prev, selectedAgentId, (agent) => {
        const rule = agent.rules.find((item) => item.id === ruleId);
        if (rule) {
          updater(rule);
        }
      }),
    );
  };

  const deleteRule = (ruleId: string) => {
    if (!selectedAgentId) {
      return;
    }

    setAgents((prev) =>
      updateAgentById(prev, selectedAgentId, (agent) => {
        agent.rules = agent.rules.filter((rule) => rule.id !== ruleId);
      }),
    );
  };

  const detectConflicts = () => {
    if (!selectedAgent) {
      return;
    }

    const conflicts: string[] = [];
    const { rules } = selectedAgent;

    for (let i = 0; i < rules.length; i += 1) {
      for (let j = i + 1; j < rules.length; j += 1) {
        if (JSON.stringify(rules[i].condition) === JSON.stringify(rules[j].condition)) {
          conflicts.push(`规则 ${i + 1} 与规则 ${j + 1} 具有完全相同的触发条件，可能导致执行冲突。`);
        }
      }
    }

    setConflictResult(conflicts);
  };

  const runTest = () => {
    if (!selectedAgent) {
      return;
    }

    try {
      const testCond = JSON.parse(testJson);
      const matchedRules = selectedAgent.rules.filter(
        (rule) =>
          rule.condition.type === testCond.type &&
          rule.condition.field === testCond.field &&
          rule.condition.operator === testCond.operator &&
          rule.condition.value == testCond.value,
      );

      setTestResult(matchedRules);
    } catch {
      setTestResult('error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:w-80">
        <div className="border-b border-slate-100 bg-slate-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-800">
            <Folder className="h-4 w-4 text-blue-500" />
            智能体类别与对象树
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {agentCategories.map(([categoryName, category]) => (
            <div key={categoryName} className="mb-4">
              <div className="mb-2 flex items-center gap-1 px-2 text-sm font-semibold text-slate-700">
                <ChevronRight className="h-4 w-4 text-slate-400" />
                {categoryName}
              </div>

              <div className="space-y-1 pl-6">
                {Object.values(category.children).map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setConflictResult(null);
                      setTestResult(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedAgentId === agent.id
                        ? 'bg-blue-50 font-medium text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        selectedAgentId === agent.id ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                    />
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {selectedAgent ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 p-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedAgent.name}</h3>
                <p className="mt-1 text-xs text-slate-500">所属分类：{selectedCategory}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={detectConflicts}
                  className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <AlertTriangle className="h-4 w-4" />
                  冲突检测
                </button>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  新增规则
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {conflictResult && (
                <div
                  className={`rounded-lg border p-4 ${
                    conflictResult.length > 0
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-green-200 bg-green-50 text-green-700'
                  }`}
                >
                  <h4 className="mb-2 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    {conflictResult.length > 0 ? '检测到冲突' : '未检测到明显冲突'}
                  </h4>

                  {conflictResult.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {conflictResult.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedAgent.rules.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-slate-500">
                  暂无规则，请点击右上角新增规则
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedAgent.rules.map((rule, ruleIndex) => (
                    <div
                      key={rule.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="font-semibold text-slate-700">规则 {ruleIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                              IF
                            </span>
                            触发条件
                          </h4>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <select
                              value={rule.condition.type}
                              onChange={(event) =>
                                updateRule(rule.id, (draftRule) => {
                                  draftRule.condition.type = event.target.value;
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {CONDITION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="字段/对象"
                              value={rule.condition.field}
                              onChange={(event) =>
                                updateRule(rule.id, (draftRule) => {
                                  draftRule.condition.field = event.target.value;
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <select
                              value={rule.condition.operator}
                              onChange={(event) =>
                                updateRule(rule.id, (draftRule) => {
                                  draftRule.condition.operator = event.target.value;
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {OPERATOR_OPTIONS.map((operator) => (
                                <option key={operator} value={operator}>
                                  {operator === '==' ? '=' : operator}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="比较值"
                              value={rule.condition.value}
                              onChange={(event) =>
                                updateRule(rule.id, (draftRule) => {
                                  draftRule.condition.value = event.target.value;
                                })
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                              THEN
                            </span>
                            执行动作
                          </h4>

                          <div className="space-y-3">
                            {rule.actions.map((action, actionIndex) => (
                              <div
                                key={`${rule.id}-${actionIndex}`}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="mb-3 flex gap-3">
                                  <select
                                    value={action.component}
                                    onChange={(event) =>
                                      updateRule(rule.id, (draftRule) => {
                                        draftRule.actions[actionIndex].component =
                                          event.target.value;
                                        draftRule.actions[actionIndex].params = {};
                                      })
                                    }
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">-- 选择组件 --</option>
                                    {components.map((component) => (
                                      <option key={component.id} value={component.name}>
                                        {component.name}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRule(rule.id, (draftRule) => {
                                        draftRule.actions.splice(actionIndex, 1);
                                      })
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 transition-colors hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                {action.component && (
                                  <div className="space-y-2 border-l-2 border-blue-200 pl-4">
                                    {components
                                      .find((component) => component.name === action.component)
                                      ?.params.map((paramName) => (
                                        <div key={paramName} className="flex items-center gap-2">
                                          <label className="w-24 shrink-0 text-xs text-slate-500">
                                            {paramName}
                                          </label>
                                          <input
                                            type="text"
                                            value={action.params[paramName] ?? ''}
                                            onChange={(event) =>
                                              updateRule(rule.id, (draftRule) => {
                                                draftRule.actions[actionIndex].params[
                                                  paramName
                                                ] = event.target.value;
                                              })
                                            }
                                            placeholder={`输入 ${paramName}`}
                                            className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() =>
                                updateRule(rule.id, (draftRule) => {
                                  draftRule.actions.push({ component: '', params: {} });
                                })
                              }
                              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              <Plus className="h-4 w-4" />
                              添加动作组件
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                  <Play className="h-4 w-4 text-green-600" />
                  条件测试
                </h4>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    模拟触发条件（JSON 格式）
                  </label>
                  <textarea
                    value={testJson}
                    onChange={(event) => setTestJson(event.target.value)}
                    className="h-24 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={runTest}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900"
                    >
                      执行测试
                    </button>

                    {testResult === 'error' && (
                      <span className="text-sm text-red-600">JSON 格式错误</span>
                    )}

                    {Array.isArray(testResult) && (
                      <span
                        className={`text-sm font-medium ${
                          testResult.length > 0 ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {testResult.length > 0
                          ? `已匹配到 ${testResult.length} 条规则`
                          : '未匹配到任何规则'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-slate-400">
            <Settings className="h-12 w-12 opacity-20" />
            <p>请从左侧选择智能体以查看或配置规则</p>
          </div>
        )}
      </div>
    </div>
  );
}
