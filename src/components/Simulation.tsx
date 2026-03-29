import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Play, Download, Activity } from 'lucide-react';

export function Simulation() {
  const { agents, commLinks } = useAppContext();
  
  const agentList: string[] = [];
  const agentRulesMap: Record<string, string> = {};
  Object.values(agents).forEach((cat: any) => {
    Object.values(cat.children).forEach((agent: any) => {
      agentList.push(agent.name);
      // Just grab first rule description for logging
      agentRulesMap[agent.name] = agent.rules.length > 0 
        ? `IF ${agent.rules[0].condition.field} ${agent.rules[0].condition.operator} ${agent.rules[0].condition.value} THEN ...`
        : "默认传播";
    });
  });

  const [triggerAgent, setTriggerAgent] = useState(agentList[0] || '');
  const [triggerEvent, setTriggerEvent] = useState('结构强度参数变更');
  const [logs, setLogs] = useState<{msg: string, type: string, time: string}[]>([
    { msg: "[系统] 就绪，选择起始智能体并运行仿真。", type: "info", time: new Date().toLocaleTimeString() }
  ]);
  
  const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());
  const [propagationEdges, setPropagationEdges] = useState<{from: string, to: string}[]>([]);

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
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: string = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const runSim = async () => {
    if (!triggerAgent) return;
    
    setAffectedNodes(new Set());
    setPropagationEdges([]);
    setLogs([]);
    
    addLog(`🚀 仿真启动 | 起始智能体: ${triggerAgent} | 触发事件: "${triggerEvent}"`, 'sys');

    const visited = new Set<string>();
    const queue = [{ agent: triggerAgent, sourceEvent: triggerEvent, depth: 0, from: null as string | null }];
    const newAffected = new Set<string>();
    const newEdges: {from: string, to: string}[] = [];

    // Simulate async propagation for visual effect
    const processQueue = async () => {
      while (queue.length > 0) {
        const { agent, sourceEvent, depth, from } = queue.shift()!;
        
        if (visited.has(agent)) continue;
        visited.add(agent);
        
        newAffected.add(agent);
        setAffectedNodes(new Set(newAffected));
        
        if (from) {
          newEdges.push({ from, to: agent });
          setPropagationEdges([...newEdges]);
        }

        addLog(`📍 [深度${depth}] 智能体「${agent}」受到影响，执行规则: ${agentRulesMap[agent]}`, 'effect');
        
        await new Promise(r => setTimeout(r, 800)); // Visual delay

        const outgoing = commLinks.filter(l => l.src === agent);
        for (const link of outgoing) {
          if (!visited.has(link.dst)) {
            addLog(`   ➡️ 通信触发 → 通知 ${link.dst} (${link.status})`, 'info');
            queue.push({ agent: link.dst, sourceEvent: `经由${agent}传播: ${sourceEvent}`, depth: depth + 1, from: agent });
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
            <input type="text" value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} placeholder="触发条件描述" className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" />
          </div>
          <button onClick={runSim} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Play className="w-4 h-4" /> 运行仿真
          </button>
        </div>
        <button onClick={exportConfig} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Download className="w-4 h-4" /> 导出配置
        </button>
      </div>

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
