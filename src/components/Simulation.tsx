import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Play, Download, Activity } from 'lucide-react';
import type { Agent, AgentCategory } from '../types';
import {
  buildInitialSimulationEvents,
  buildTriggerOptions,
  formatRuleCondition,
} from './simulationLogic';

export function Simulation() {
  const { agents, commLinks } = useAppContext();

  const allAgents: Agent[] = (Object.values(agents) as AgentCategory[]).flatMap((category) =>
    Object.values(category.children),
  );
  const agentList = allAgents.map((agent) => agent.name);
  const agentMap = Object.fromEntries(allAgents.map((agent) => [agent.name, agent])) as Record<string, Agent>;

  const [triggerAgent, setTriggerAgent] = useState(agentList[0] || '');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([
    { msg: "[系统] 就绪，选择起始智能体并运行仿真。", type: "info", time: new Date().toLocaleTimeString() }
  ]);
  
  const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());
  const [propagationEdges, setPropagationEdges] = useState<{from: string, to: string}[]>([]);

  const selectedAgent = agentMap[triggerAgent] ?? null;
  const triggerOptions = buildTriggerOptions(selectedAgent);
  const selectedRule = selectedAgent?.rules.find((rule) => rule.id === selectedRuleId) ?? selectedAgent?.rules[0] ?? null;
  const canRun = Boolean(selectedAgent && selectedRule);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Fixed positions for demo
  const nodePositions: Record<string, {x: number, y: number}> = {
    "工艺设计智能体": { x: 200, y: 150 },
    "功能设计智能体": { x: 100, y: 300 },
    "结构设计智能体": { x: 300, y: 300 },
    "采购智能体": { x: 450, y: 200 },
    "物流智能体": { x: 550, y: 350 },
    "项目管理智能体": { x: 400, y: 450 }
  };

  const drawTopology = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive canvas
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = 500;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all base links
    commLinks.forEach(link => {
      const from = nodePositions[link.src];
      const to = nodePositions[link.dst];
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw active propagation edges
    propagationEdges.forEach(edge => {
      const from = nodePositions[edge.from];
      const to = nodePositions[edge.to];
      if (!from || !to) return;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      ctx.beginPath();
      ctx.moveTo(to.x - 30 * Math.cos(angle), to.y - 30 * Math.sin(angle));
      ctx.lineTo(to.x - 40 * Math.cos(angle - Math.PI/6), to.y - 40 * Math.sin(angle - Math.PI/6));
      ctx.lineTo(to.x - 40 * Math.cos(angle + Math.PI/6), to.y - 40 * Math.sin(angle + Math.PI/6));
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
    });

    // Draw nodes
    agentList.forEach(agent => {
      const pos = nodePositions[agent];
      if (!pos) return;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
      
      const isAffected = affectedNodes.has(agent);
      ctx.fillStyle = isAffected ? '#ef4444' : '#10b981'; // red-500 : emerald-500
      ctx.fill();
      
      ctx.strokeStyle = isAffected ? '#991b1b' : '#047857';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text background
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(pos.x - 50, pos.y + 30, 100, 20);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(agent, pos.x, pos.y + 45);
    });
  };

  useEffect(() => {
    drawTopology();
    window.addEventListener('resize', drawTopology);
    return () => window.removeEventListener('resize', drawTopology);
  }, [affectedNodes, propagationEdges, commLinks]);

  useEffect(() => {
    if (agentList.length === 0) return;
    if (!agentMap[triggerAgent]) {
      setTriggerAgent(agentList[0]);
    }
  }, [agentList, agentMap, triggerAgent]);

  useEffect(() => {
    const firstRuleId = selectedAgent?.rules[0]?.id ?? '';
    const hasSelectedRule = selectedAgent?.rules.some((rule) => rule.id === selectedRuleId) ?? false;

    if (!hasSelectedRule && selectedRuleId !== firstRuleId) {
      setSelectedRuleId(firstRuleId);
    }
  }, [selectedAgent, selectedRuleId]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: string = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const runSim = async () => {
    if (!selectedAgent || !selectedRule) return;
    
    setAffectedNodes(new Set());
    setPropagationEdges([]);
    setLogs([]);

    const ruleSummary = formatRuleCondition(selectedRule);
    const initialEvents = buildInitialSimulationEvents(selectedAgent, selectedRule, allAgents, commLinks);

    addLog(`🚀 仿真启动 | 起始智能体: ${triggerAgent} | 触发事件: "${ruleSummary}"`, 'sys');

    const visited = new Set<string>();
    const queue = [{ agent: triggerAgent, depth: 0, from: null as string | null, reason: ruleSummary }];
    const newAffected = new Set<string>();
    const newEdges: {from: string, to: string}[] = [];

    // Simulate async propagation for visual effect
    const processQueue = async () => {
      while (queue.length > 0) {
        const { agent, depth, from, reason } = queue.shift()!;
        
        if (visited.has(agent)) continue;
        visited.add(agent);
        
        newAffected.add(agent);
        setAffectedNodes(new Set(newAffected));
        
        if (from) {
          newEdges.push({ from, to: agent });
          setPropagationEdges([...newEdges]);
        }

        if (depth === 0) {
          addLog(`📍 [深度${depth}] 智能体「${agent}」命中规则：${ruleSummary}`, 'effect');
        } else {
          addLog(`📍 [深度${depth}] 智能体「${agent}」接收传播，原因：${reason}`, 'effect');
        }
        
        await new Promise(r => setTimeout(r, 800)); // Visual delay

        if (depth === 0) {
          initialEvents.logs.forEach((entry) => addLog(`   ${entry.msg}`, entry.type));

          if (initialEvents.nextAgents.length === 0) {
            addLog(`⚠️ 本次事件未触发跨智能体传播。`, 'warn');
          } else {
            for (const nextAgent of initialEvents.nextAgents) {
              addLog(`   ➡️ 事件传播 → 通知 ${nextAgent.agent}（${nextAgent.reason}）`, 'info');
              queue.push({ agent: nextAgent.agent, depth: depth + 1, from: agent, reason: nextAgent.reason });
            }
          }

          continue;
        }

        const outgoing = commLinks.filter(l => l.src === agent);
        if (outgoing.length === 0) {
          addLog(`   ℹ️ 智能体「${agent}」没有继续向外传播。`, 'info');
        }

        for (const link of outgoing) {
          if (!visited.has(link.dst)) {
            addLog(`   ➡️ 通信传播 → 通知 ${link.dst} (${link.status})`, 'info');
            queue.push({ agent: link.dst, depth: depth + 1, from: agent, reason: `经由${agent}传播` });
          }
        }
      }
      
      if (newAffected.size === 1) {
        addLog(`⚠️ 变更仅影响起始智能体，未通过通信链路传播。`, 'warn');
      } else {
        addLog(`✅ 传播结束，共 ${newAffected.size} 个智能体受到影响。`, 'sys');
      }
    };

    processQueue();
  };

  const exportConfig = () => {
    const config = {
      agents,
      commLinks,
      exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "simulation_config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">触发智能体</label>
            <select value={triggerAgent} onChange={e => setTriggerAgent(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {agentList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">触发事件</label>
            <select
              value={selectedRule?.id ?? ''}
              onChange={e => setSelectedRuleId(e.target.value)}
              disabled={triggerOptions.length === 0}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {triggerOptions.length === 0 ? (
                <option value="">暂无可选事件</option>
              ) : (
                triggerOptions.map((option) => (
                  <option key={option.ruleId} value={option.ruleId}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={runSim}
            disabled={!canRun}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" /> 运行仿真
          </button>
        </div>
        <button onClick={exportConfig} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download className="w-4 h-4" /> 导出配置
        </button>
      </div>

      {!canRun && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          当前触发智能体暂无可选触发事件，请先在规则配置中为该智能体添加规则。
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
        {/* Topology Panel */}
        <div className="flex-[2] bg-slate-50 rounded-xl border border-slate-200 shadow-inner p-4 flex flex-col relative">
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> 智能体拓扑图 (变更影响高亮)
          </h3>
          <div className="flex-1 relative bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>
          <div className="mt-3 flex gap-4 text-xs font-medium text-slate-600 justify-center">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> 未影响</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> 受变更影响</span>
            <span className="flex items-center gap-1"><div className="w-3 h-1 bg-amber-500"></div> 传播路径</span>
          </div>
        </div>

        {/* Log Panel */}
        <div className="flex-1 bg-slate-900 rounded-xl shadow-sm p-4 flex flex-col overflow-hidden text-slate-300 font-mono text-xs">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm font-sans">
            📋 仿真日志
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {logs.map((log, i) => (
              <div key={i} className={`pl-2 border-l-2 ${
                log.type === 'effect' ? 'border-amber-400 text-amber-200' : 
                log.type === 'warn' ? 'border-red-400 text-red-300' :
                log.type === 'sys' ? 'border-emerald-400 text-emerald-300' :
                'border-blue-500'
              }`}>
                <span className="text-slate-500 mr-2">[{log.time}]</span>
                {log.msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
