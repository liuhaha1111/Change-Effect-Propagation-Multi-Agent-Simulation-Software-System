import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAgents } from '../data';
import {
  createEmptyRule,
  findSelectedAgent,
  updateAgentById,
} from './ruleConfigLogic';

test('findSelectedAgent resolves an agent by its id', () => {
  const selected = findSelectedAgent(initialAgents, 'process_agent');

  assert.ok(selected);
  assert.equal(selected.agent.id, 'process_agent');
});

test('updateAgentById adds a rule for an agent even when the child key is not the id', () => {
  const updatedAgents = updateAgentById(initialAgents, 'purchase_agent', (agent) => {
    agent.rules.push(createEmptyRule('new-rule'));
  });

  const updatedSelection = findSelectedAgent(updatedAgents, 'purchase_agent');
  const originalSelection = findSelectedAgent(initialAgents, 'purchase_agent');

  assert.ok(updatedSelection);
  assert.ok(originalSelection);
  assert.equal(updatedSelection.agent.rules.length, 1);
  assert.equal(updatedSelection.agent.rules[0].id, 'new-rule');
  assert.equal(originalSelection.agent.rules.length, 0);
});

test('updateAgentById keeps nested rule edits isolated from the original state', () => {
  const updatedAgents = updateAgentById(initialAgents, 'process_agent', (agent) => {
    const targetRule = agent.rules.find((rule) => rule.id === 'r1');
    assert.ok(targetRule);
    targetRule.condition.value = '0.9';
  });

  const updatedSelection = findSelectedAgent(updatedAgents, 'process_agent');
  const originalSelection = findSelectedAgent(initialAgents, 'process_agent');

  assert.ok(updatedSelection);
  assert.ok(originalSelection);
  assert.equal(updatedSelection.agent.rules[0].condition.value, '0.9');
  assert.equal(originalSelection.agent.rules[0].condition.value, '0.7');
});
