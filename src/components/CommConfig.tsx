import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Plus, Trash2, Settings2 } from 'lucide-react';

export function CommConfig() {
  const { agents, commLinks, setCommLinks } = useAppContext();
  
  // Flatten agents for dropdowns
  const agentList: string[] = [];
  Object.values(agents).forEach((cat: any) => {
    Object.values(cat.children).forEach((agent: any) => {
      agentList.push(agent.name);
    });
  });

  const [srcAgent, setSrcAgent] = useState(agentList[0] || '');
  const [dstAgent, setDstAgent] = useState(agentList[0] || '');
  const [status, setStatus] = useState('同步通信');
  
  // Detail states
  const [syncTimeout, setSyncTimeout] = useState('5000');
  const [syncRetries, setSyncRetries] = useState('2');
  const [asyncQueue, setAsyncQueue] = useState('100');
  const [asyncPersistent, setAsyncPersistent] = useState(false);
  const [ackTimeout, setAckTimeout] = useState('3000');
  const [maxWait, setMaxWait] = useState('10');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [broadcastScope, setBroadcastScope] = useState('所有智能体');

  const handleAdd = () => {
    if (srcAgent === dstAgent) {
      alert("源智能体和目标智能体不能相同");
      return;
    }

    let detail = {};
    if (status === '同步通信') detail = { timeout: parseInt(syncTimeout), retries: parseInt(syncRetries) };
    else if (status === '异步通信') detail = { queueSize: parseInt(asyncQueue), persistent: asyncPersistent };
    else if (status === '等待确认') detail = { ackTimeout: parseInt(ackTimeout), maxWait: parseInt(maxWait) };
    else if (status === '静默监听') detail = { filterKeyword };
    else if (status === '广播模式') detail = { fanout: true, scope: broadcastScope };

    setCommLinks(prev => {
      const existingIdx = prev.findIndex(l => l.src === srcAgent && l.dst === dstAgent);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], status, detail };
        return next;
      }
      return [...prev, { id: Math.random().toString(36).substr(2, 9), src: srcAgent, dst: dstAgent, status, detail }];
    });
  };

  const handleDelete = (id: string) => {
    setCommLinks(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Form Panel */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 shrink-0">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          新增/编辑通信链路
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">源智能体</label>
            <select value={srcAgent} onChange={e => setSrcAgent(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {agentList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">目标智能体</label>
            <select value={dstAgent} onChange={e => setDstAgent(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              {agentList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">通信状态</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="同步通信">同步通信</option>
              <option value="异步通信">异步通信</option>
              <option value="等待确认">等待确认</option>
              <option value="静默监听">静默监听</option>
              <option value="广播模式">广播模式</option>
            </select>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">细化参数配置</h4>
            {status === '同步通信' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">超时时间(ms)</label>
                  <input type="number" value={syncTimeout} onChange={e => setSyncTimeout(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">重试次数</label>
                  <input type="number" value={syncRetries} onChange={e => setSyncRetries(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
              </div>
            )}
            {status === '异步通信' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">队列大小</label>
                  <input type="number" value={asyncQueue} onChange={e => setAsyncQueue(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">持久化</label>
                  <input type="checkbox" checked={asyncPersistent} onChange={e => setAsyncPersistent(e.target.checked)} className="rounded text-blue-600" />
                </div>
              </div>
            )}
            {status === '等待确认' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">确认超时(ms)</label>
                  <input type="number" value={ackTimeout} onChange={e => setAckTimeout(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">最大等待次数</label>
                  <input type="number" value={maxWait} onChange={e => setMaxWait(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
              </div>
            )}
            {status === '静默监听' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">过滤关键词</label>
                  <input type="text" value={filterKeyword} onChange={e => setFilterKeyword(e.target.value)} placeholder="可选" className="w-32 px-2 py-1 border border-slate-300 rounded text-sm" />
                </div>
              </div>
            )}
            {status === '广播模式' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-700">广播范围</label>
                  <select value={broadcastScope} onChange={e => setBroadcastScope(e.target.value)} className="w-32 px-2 py-1 border border-slate-300 rounded text-sm">
                    <option>所有智能体</option>
                    <option>指定组</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleAdd} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4">
            <Plus className="w-4 h-4" /> 添加/更新通信
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">通信配置表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                <th className="p-4 font-medium">源智能体</th>
                <th className="p-4 font-medium">目标智能体</th>
                <th className="p-4 font-medium">通信状态</th>
                <th className="p-4 font-medium">细化配置</th>
                <th className="p-4 font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commLinks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">暂无通信配置，请添加</td>
                </tr>
              ) : (
                commLinks.map(link => (
                  <tr key={link.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800">{link.src}</td>
                    <td className="p-4 text-sm text-slate-600">{link.dst}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {link.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-mono">
                      {Object.entries(link.detail).map(([k, v]) => `${k}:${v}`).join(' | ')}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(link.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
