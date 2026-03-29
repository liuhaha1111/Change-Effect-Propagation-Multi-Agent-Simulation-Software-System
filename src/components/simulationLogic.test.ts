import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAgents, initialCommLinks } from '../data';
import { buildTriggerOptions, buildInitialSimulationEvents } from './simulationLogic';

const processAgent = initialAgents['设计类智能体'].children['工艺设计智能体'];
const strengthRule = processAgent.rules[0];
const costRule = processAgent.rules[1];
const purchaseAgent = initialAgents['供应链智能体'].children['采购智能体'];

test('buildTriggerOptions returns rule-backed labels for the selected agent', () => {
  const options = buildTriggerOptions(processAgent);

  assert.deepEqual(
    options.map((option) => option.label),
    ['参数变更 | 强度 > 0.7', '成本波动 | 材料成本 > 5'],
  );
});

test('buildInitialSimulationEvents changes downstream content by selected rule', () => {
  const strengthEvents = buildInitialSimulationEvents(
    processAgent,
    strengthRule,
    Object.values(initialAgents).flatMap((category) => Object.values(category.children)),
    initialCommLinks,
  );
  const costEvents = buildInitialSimulationEvents(
    processAgent,
    costRule,
    Object.values(initialAgents).flatMap((category) => Object.values(category.children)),
    initialCommLinks,
  );

  assert.notDeepEqual(strengthEvents.logs, costEvents.logs);
  assert.notDeepEqual(strengthEvents.nextAgents, costEvents.nextAgents);
});

test('agents without rules expose no trigger options', () => {
  const options = buildTriggerOptions(purchaseAgent);

  assert.equal(options.length, 0);
});
