import type { Agent, AgentCategory, Rule } from '../types';

type AgentsState = Record<string, AgentCategory>;

type SelectedAgentResult = {
  agent: Agent;
  categoryName: string;
};

function cloneRule(rule: Rule): Rule {
  return {
    ...rule,
    condition: { ...rule.condition },
    actions: rule.actions.map((action) => ({
      ...action,
      params: { ...action.params },
    })),
  };
}

function cloneAgent(agent: Agent): Agent {
  return {
    ...agent,
    rules: agent.rules.map(cloneRule),
  };
}

function createRuleId() {
  return Math.random().toString(36).slice(2, 11);
}

export function createEmptyRule(ruleId = createRuleId()): Rule {
  return {
    id: ruleId,
    condition: {
      type: 'parameter_change',
      field: '新参数',
      operator: '>',
      value: '0',
    },
    actions: [],
  };
}

export function findSelectedAgent(
  agents: AgentsState,
  selectedAgentId: string | null,
): SelectedAgentResult | null {
  if (!selectedAgentId) {
    return null;
  }

  for (const [categoryName, category] of Object.entries(agents)) {
    for (const agent of Object.values(category.children)) {
      if (agent.id === selectedAgentId) {
        return { agent, categoryName };
      }
    }
  }

  return null;
}

export function updateAgentById(
  agents: AgentsState,
  selectedAgentId: string,
  updater: (agent: Agent) => void,
): AgentsState {
  for (const [categoryName, category] of Object.entries(agents)) {
    for (const [agentKey, agent] of Object.entries(category.children)) {
      if (agent.id !== selectedAgentId) {
        continue;
      }

      const nextAgent = cloneAgent(agent);
      updater(nextAgent);

      return {
        ...agents,
        [categoryName]: {
          ...category,
          children: {
            ...category.children,
            [agentKey]: nextAgent,
          },
        },
      };
    }
  }

  return agents;
}
