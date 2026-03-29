# 智能体仿真触发事件下拉化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the free-text simulation trigger event with a rule-backed dropdown and make each selected event produce distinct simulation logs and propagation results.

**Architecture:** Keep the UI state in `Simulation.tsx`, but move rule-to-option formatting and rule action simulation into pure helper functions so behavior can be tested without rendering React. The simulation run path should select a rule by ID, derive scenario-specific logs and next-hop targets from the rule actions, and then animate propagation using those derived results.

**Tech Stack:** React 19, TypeScript, Vite, Node.js built-in test runner via `tsx`

---

### Task 1: Add pure simulation helpers and regression tests

**Files:**
- Create: `src/components/simulationLogic.ts`
- Create: `src/components/simulationLogic.test.ts`
- Modify: `src/types.ts`

**Step 1: Write the failing test**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTriggerOptions, buildInitialSimulationEvents } from './simulationLogic';

test('buildTriggerOptions returns rule-backed labels for one agent', () => {
  const options = buildTriggerOptions(agent);
  assert.equal(options[0].label, '参数变更 | 强度 > 0.7');
});

test('buildInitialSimulationEvents changes output by selected rule', () => {
  const strengthEvents = buildInitialSimulationEvents(processAgent, strengthRule, allAgents, commLinks);
  const costEvents = buildInitialSimulationEvents(processAgent, costRule, allAgents, commLinks);

  assert.notDeepEqual(strengthEvents.logs, costEvents.logs);
  assert.notDeepEqual(strengthEvents.nextAgents, costEvents.nextAgents);
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/components/simulationLogic.test.ts`
Expected: FAIL because helper module or exported functions do not exist yet

**Step 3: Write minimal implementation**

```ts
export function buildTriggerOptions(agent: Agent | null) {
  if (!agent) return [];
  return agent.rules.map((rule) => ({
    ruleId: rule.id,
    label: `${conditionTypeLabel(rule.condition.type)} | ${rule.condition.field} ${rule.condition.operator} ${rule.condition.value}`,
  }));
}
```

```ts
export function buildInitialSimulationEvents(agent, rule, allAgents, commLinks) {
  // Map each action to scenario-specific logs and next-hop agents.
  return { logs, nextAgents };
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/components/simulationLogic.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types.ts src/components/simulationLogic.ts src/components/simulationLogic.test.ts
git commit -m "feat: add rule-driven simulation helpers"
```

### Task 2: Convert the simulation panel to dropdown-backed rule selection

**Files:**
- Modify: `src/components/Simulation.tsx`

**Step 1: Write the failing test**

If a component-level test harness is not present, keep the regression at the helper level and add an assertion for disabled-state logic in `simulationLogic.test.ts`.

```ts
test('agents without rules expose no trigger options', () => {
  const options = buildTriggerOptions(agentWithoutRules);
  assert.equal(options.length, 0);
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/components/simulationLogic.test.ts`
Expected: FAIL because helper does not yet cover the empty-rule branch

**Step 3: Write minimal implementation**

```tsx
const [selectedRuleId, setSelectedRuleId] = useState('');
const triggerOptions = buildTriggerOptions(selectedAgent);
const canRun = Boolean(triggerAgent && selectedRule);

<select value={selectedRuleId} onChange={(e) => setSelectedRuleId(e.target.value)}>
  {triggerOptions.length === 0 ? (
    <option value="">暂无可选事件</option>
  ) : (
    triggerOptions.map((option) => <option key={option.ruleId} value={option.ruleId}>{option.label}</option>)
  )}
</select>

<button disabled={!canRun}>运行仿真</button>
```

Update `runSim` so it:
- resolves the selected rule
- logs the selected condition summary
- uses helper output to seed logs and queue contents
- falls back to warning logs when there is no downstream propagation

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/components/simulationLogic.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Simulation.tsx src/components/simulationLogic.ts src/components/simulationLogic.test.ts
git commit -m "feat: switch simulation trigger to rule dropdown"
```

### Task 3: Verify integrated behavior and build output

**Files:**
- Modify: `docs/plans/2026-03-29-simulation-trigger-dropdown-design.md`
- Modify: `docs/plans/2026-03-29-simulation-trigger-dropdown.md`

**Step 1: Run focused tests**

```bash
npx tsx --test src/components/simulationLogic.test.ts
```

Expected: PASS

**Step 2: Run static verification**

```bash
npm run lint
npm run build
```

Expected:
- `npm run lint` exits 0
- `npm run build` exits 0

**Step 3: Document any gaps**

If UI-only behavior is not covered by automated tests, add a short note to the plan or final summary describing the manual checks:

- switch between `工艺设计智能体` and `采购智能体`
- confirm dropdown options refresh
- confirm no-rule agents disable the run button
- run two different rules for `工艺设计智能体` and compare logs/topology

**Step 4: Commit**

```bash
git add docs/plans/2026-03-29-simulation-trigger-dropdown-design.md docs/plans/2026-03-29-simulation-trigger-dropdown.md src/components/Simulation.tsx src/components/simulationLogic.ts src/components/simulationLogic.test.ts
git commit -m "feat: differentiate simulation behavior by trigger event"
```
