import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Upload, FileJson } from 'lucide-react';

export function ComponentLibrary() {
  const { components, setComponents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          setComponents(prev => {
            const newIds = new Set(prev.map(c => c.id));
            const toAdd = imported.filter(c => c.id && c.name && !newIds.has(c.id));
            return [...prev, ...toAdd];
          });
          alert(`成功导入 ${imported.filter(c => c.id && c.name && !components.find(existing => existing.id === c.id)).length} 个组件`);
        }
      } catch (err) {
        alert('JSON解析错误');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">智能体组件库</h2>
          <p className="text-slate-500 mt-1">可复用行为组件，作为智能体规则中的“Then事件”执行单元</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            导入组件 (JSON)
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索组件名称、类型或描述..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          共 {filteredComponents.length} 个组件
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredComponents.map(comp => (
          <div key={comp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-2">
              <h3 className="font-semibold text-slate-900 leading-tight">{comp.name}</h3>
              <span className="shrink-0 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                {comp.type}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-sm text-slate-600 mb-4 flex-1">{comp.desc}</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <FileJson className="w-3 h-3" /> 参数
                </div>
                <div className="text-xs font-mono text-slate-700 break-words">
                  {comp.params.length > 0 ? comp.params.map(p => `[${p}]`).join(' · ') : '无参数'}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredComponents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            未找到匹配的组件
          </div>
        )}
      </div>
    </div>
  );
}
