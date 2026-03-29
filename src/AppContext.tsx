import React, { createContext, useState, useContext } from 'react';
import { ComponentDef, AgentCategory, CommLink } from './types';
import { initialComponents, initialAgents, initialCommLinks } from './data';

interface AppContextType {
  components: ComponentDef[];
  setComponents: React.Dispatch<React.SetStateAction<ComponentDef[]>>;
  agents: Record<string, AgentCategory>;
  setAgents: React.Dispatch<React.SetStateAction<Record<string, AgentCategory>>>;
  commLinks: CommLink[];
  setCommLinks: React.Dispatch<React.SetStateAction<CommLink[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [components, setComponents] = useState<ComponentDef[]>(initialComponents);
  const [agents, setAgents] = useState<Record<string, AgentCategory>>(initialAgents);
  const [commLinks, setCommLinks] = useState<CommLink[]>(initialCommLinks);

  return (
    <AppContext.Provider value={{ components, setComponents, agents, setAgents, commLinks, setCommLinks }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
