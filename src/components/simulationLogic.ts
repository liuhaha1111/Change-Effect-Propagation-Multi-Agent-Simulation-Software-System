import type { Agent, CommLink, Rule } from '../types';

export interface TriggerOption {
  ruleId: string;
  label: string;
}

export interface SimulationLogSeed {
  msg: string;
  type: 'info' | 'warn' | 'sys' | 'effect';
}

export interface SimulationTarget {
  agent: string;
  reason: string;
}

export interface InitialSimulationEvents {
  logs: SimulationLogSeed[];
  nextAgents: SimulationTarget[];
}

const CONDITION_TYPE_LABELS: Record<string, string> = {
  parameter_change: '参数变更',
  cost_change: '成本波动',
  requirement_change: '需求变更',
  constraint_conflict: '约束冲突',
};

function getConditionTypeLabel(type: string) {
  return CONDITION_TYPE_LABELS[type] ?? type;
}

export function formatRuleCondition(rule: Rule) {
  return `${getConditionTypeLabel(rule.condition.type)} | ${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`;
}

export function buildTriggerOptions(agent: Agent | null | undefined): TriggerOption[] {
  if (!agent) return [];

  return agent.rules.map((rule) => ({
    ruleId: rule.id,
    label: formatRuleCondition(rule),
  }));
}

function findAgentByName(allAgents: Agent[], name: string) {
  return allAgents.find((agent) => agent.name === name) ?? null;
}

function getOutgoingTargets(agent: Agent, commLinks: CommLink[]) {
  return commLinks.filter((link) => link.src === agent.name).map((link) => link.dst);
}

export function buildInitialSimulationEvents(
  agent: Agent,
  rule: Rule,
  allAgents: Agent[],
  commLinks: CommLink[],
): InitialSimulationEvents {
  const logs: SimulationLogSeed[] = [];
  const nextTargetMap = new Map<string, SimulationTarget>();

  const addTarget = (agentName: string, reason: string) => {
    if (!findAgentByName(allAgents, agentName)) {
      logs.push({
        msg: `⚠️ 动作目标“${agentName}”不存在，已跳过该传播目标。`,
        type: 'warn',
      });
      return;
    }

    if (!nextTargetMap.has(agentName)) {
      nextTargetMap.set(agentName, { agent: agentName, reason });
    }
  };

  for (const action of rule.actions) {
    switch (action.component) {
      case '影响范围计算': {
        const intensity = action.params['变更强度'] || '未定义';
        const source = action.params['变更源ID'] || agent.name;
        logs.push({
          msg: `📊 影响范围分析完成，变更源 ${source} 的影响强度为 ${intensity}。`,
          type: 'effect',
        });
        break;
      }
      case '通知供应链智能体': {
        const priority = action.params['优先级'] || '普通';
        const message = action.params['消息内容'] || '上游变更通知';
        logs.push({
          msg: `📨 已向供应链发出通知，消息“${message}”，优先级 ${priority}。`,
          type: 'info',
        });

        allAgents
          .filter((candidate) => candidate.name.includes('采购') || candidate.name.includes('物流'))
          .forEach((candidate) => addTarget(candidate.name, `供应链通知: ${message}`));
        break;
      }
      case '更新设计参数': {
        const path = action.params['参数路径'] || '未知参数';
        const value = action.params['新值'] || '未提供';
        logs.push({
          msg: `🛠️ 设计参数已更新，${path} -> ${value}。`,
          type: 'effect',
        });

        getOutgoingTargets(agent, commLinks).forEach((target) => addTarget(target, `参数更新: ${path}`));
        break;
      }
      case 'BOM版本更新': {
        const bomId = action.params['BOM_ID'] || '未知BOM';
        const reason = action.params['变更原因'] || '未说明';
        logs.push({
          msg: `🧾 BOM 版本 ${bomId} 已更新，原因：${reason}。`,
          type: 'effect',
        });

        getOutgoingTargets(agent, commLinks).forEach((target) => addTarget(target, `BOM更新: ${bomId}`));
        addTarget('采购智能体', `BOM更新: ${bomId}`);
        break;
      }
      case '冲突消解器': {
        const conflictType = action.params['冲突类型'] || '未定义冲突';
        logs.push({
          msg: `⚠️ 发现${conflictType}，已触发冲突消解流程。`,
          type: 'warn',
        });
        break;
      }
      case '触发下游智能体规则': {
        const targetAgent = action.params['目标智能体ID'] || '';
        const reason = action.params['触发条件'] || '下游规则触发';
        logs.push({
          msg: `🎯 定向触发下游规则，目标 ${targetAgent}，条件“${reason}”。`,
          type: 'info',
        });
        if (targetAgent) {
          addTarget(targetAgent, reason);
        }
        break;
      }
      default: {
        logs.push({
          msg: `ℹ️ 动作“${action.component}”暂无专用仿真映射，记录为观察事件。`,
          type: 'info',
        });
      }
    }
  }

  if (logs.length === 0) {
    logs.push({
      msg: `ℹ️ 规则“${formatRuleCondition(rule)}”没有定义可执行动作。`,
      type: 'info',
    });
  }

  return {
    logs,
    nextAgents: Array.from(nextTargetMap.values()),
  };
}
