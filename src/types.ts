export interface ComponentDef {
  id: string;
  name: string;
  type: string;
  desc: string;
  params: string[];
}

export interface RuleCondition {
  type: string;
  field: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  component: string;
  params: Record<string, string>;
}

export interface Rule {
  id: string;
  condition: RuleCondition;
  actions: RuleAction[];
}

export interface Agent {
  id: string;
  name: string;
  rules: Rule[];
}

export interface AgentCategory {
  name: string;
  children: Record<string, Agent>;
}

export interface CommLink {
  id: string;
  src: string;
  dst: string;
  status: string;
  detail: Record<string, any>;
}
