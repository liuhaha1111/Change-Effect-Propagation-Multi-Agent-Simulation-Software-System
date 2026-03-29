/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import { ComponentLibrary } from './components/ComponentLibrary';
import { RuleConfig } from './components/RuleConfig';
import { CommConfig } from './components/CommConfig';
import { Simulation } from './components/Simulation';
import { Blocks, GitMerge, Network, PlayCircle } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('components');

  const tabs = [
    { id: 'components', name: '智能体组件库', icon: Blocks },
    { id: 'rules', name: '规则配置与冲突检测', icon: GitMerge },
    { id: 'comm', name: '智能体通信配置', icon: Network },
    { id: 'sim', name: '智能体仿真运行', icon: PlayCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Network className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">变更效应传播多智能体仿真系统</h1>
            </div>
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'components' && <ComponentLibrary />}
        {activeTab === 'rules' && <RuleConfig />}
        {activeTab === 'comm' && <CommConfig />}
        {activeTab === 'sim' && <Simulation />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
