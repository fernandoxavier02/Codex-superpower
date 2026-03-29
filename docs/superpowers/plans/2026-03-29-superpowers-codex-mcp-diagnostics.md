# Superpowers Codex MCP Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers-codex-global:subagent-driven-development` for same-session execution or `superpowers-codex-global:executing-plans` for fresh-session execution from this document. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real read-only diagnostic MCP to the Superpowers Codex bundle, remove unused app-integration promises, and align manifests, docs, and config with the actual shipped behavior.

**Architecture:** Clean up the plugin-facing contract first, then add a tiny bundle-local MCP service that exposes diagnostic tools only. Keep the MCP implementation in `scripts/mcp/`, keep the plugin contract rooted in `.mcp.json`, and use tests to lock down both published surfaces and internal behavior before implementation.

**Tech Stack:** JSON manifests, Markdown docs, Node.js (`node:test`, stdio MCP implementation), existing Codex plugin manifest format

**Spec:** `docs/superpowers/specs/2026-03-29-superpowers-codex-mcp-diagnostics-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `.mcp.json` | Plugin MCP registration | Replace empty stub with real local stdio registration |
| `.codex-plugin/plugin.json` | Plugin-facing contract | Remove unused `apps` entry, keep MCP registration |
| `.app.json` | Unused app-integration surface | Delete from shipped contract |
| `scripts/mcp/superpowers-codex-diagnostics-lib.mjs` | Pure diagnostic logic | Create |
| `scripts/mcp/superpowers-codex-diagnostics.mjs` | MCP stdio entrypoint | Create |
| `tests/mcp/superpowers-codex-manifests.test.mjs` | Manifest/docs contract tests | Create |
| `tests/mcp/superpowers-codex-diagnostics.test.mjs` | MCP unit tests | Create |
| `tests/mcp/superpowers-codex-diagnostics-integration.test.mjs` | Manifest/MCP integration tests | Create |
| `docs/README.codex.md` | Codex usage and install docs | Update |
| `.codex/INSTALL.md` | Install instructions | Update |
| `codex-global/config/hooks-snippet.toml` | Config snippet | Remove stale `collab` |
| `README.md` | Bundle overview | Update to mention diagnostic MCP and removal of app integration |
| `RELEASE-NOTES.md` | Change record | Add release note entry for this work |

---

### Task 1: Write failing manifest and documentation contract tests

**Files:**
- Create: `tests/mcp/superpowers-codex-manifests.test.mjs`
- Read: `.codex-plugin/plugin.json`
- Read: `.mcp.json`
- Read: `docs/README.codex.md`
- Read: `.codex/INSTALL.md`
- Read: `README.md`
- Read: `codex-global/config/hooks-snippet.toml`

- [ ] **Step 1: Create the failing manifest/docs test**

Create `tests/mcp/superpowers-codex-manifests.test.mjs` with this full content:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/Users/win/Codex-superpower';

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('plugin manifest keeps MCP wiring and stops advertising unused apps', () => {
  const pluginManifest = readJson('.codex-plugin/plugin.json');

  assert.equal(pluginManifest.mcpServers, './.mcp.json');
  assert.equal('apps' in pluginManifest, false);
});

test('.mcp.json registers a local diagnostics server', () => {
  const mcpConfig = readJson('.mcp.json');
  const server = mcpConfig.mcpServers['superpowers-codex-diagnostics'];

  assert.ok(server);
  assert.equal(server.type, 'stdio');
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['./scripts/mcp/superpowers-codex-diagnostics.mjs']);
});

test('diagnostics entrypoint referenced by .mcp.json exists', () => {
  const fullPath = path.join(repoRoot, 'scripts/mcp/superpowers-codex-diagnostics.mjs');
  assert.equal(fs.existsSync(fullPath), true);
});

test('docs describe MCP diagnostics and do not advertise app integration', () => {
  const readmeCodex = readText('docs/README.codex.md');
  const installDoc = readText('.codex/INSTALL.md');
  const rootReadme = readText('README.md');

  assert.match(readmeCodex, /diagnostic MCP/i);
  assert.match(installDoc, /diagnostic MCP/i);
  assert.match(rootReadme, /diagnostic MCP/i);

  assert.doesNotMatch(readmeCodex, /app integration/i);
  assert.doesNotMatch(installDoc, /app integration/i);
});

test('hooks snippet uses multi_agent and does not mention collab', () => {
  const hooksSnippet = readText('codex-global/config/hooks-snippet.toml');

  assert.match(hooksSnippet, /multi_agent = true/);
  assert.doesNotMatch(hooksSnippet, /collab = true/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs
```

Expected: FAIL because `.mcp.json` is empty, `.codex-plugin/plugin.json` still advertises `apps`, the diagnostics entrypoint does not exist yet, and docs do not mention the MCP.

- [ ] **Step 3: Confirm the failure reason is correct**

Verify the failures are specifically about:

- missing local MCP registration
- missing diagnostics entrypoint
- unused app contract still being advertised
- stale docs/config

Do not proceed until the test is failing for the intended reasons.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/mcp/superpowers-codex-manifests.test.mjs
git commit -m "test: add failing manifest and docs contract checks for MCP diagnostics"
```

---

### Task 2: Make manifests and docs pass the contract tests

**Files:**
- Modify: `.mcp.json`
- Modify: `.codex-plugin/plugin.json`
- Delete: `.app.json`
- Modify: `docs/README.codex.md`
- Modify: `.codex/INSTALL.md`
- Modify: `README.md`
- Modify: `codex-global/config/hooks-snippet.toml`
- Modify: `RELEASE-NOTES.md`

- [ ] **Step 1: Replace the empty MCP manifest**

Update `.mcp.json` to:

```json
{
  "mcpServers": {
    "superpowers-codex-diagnostics": {
      "type": "stdio",
      "command": "node",
      "args": ["./scripts/mcp/superpowers-codex-diagnostics.mjs"],
      "note": "Local read-only diagnostics MCP for the Superpowers Codex bundle."
    }
  }
}
```

- [ ] **Step 2: Remove unused app wiring from the plugin manifest**

In `.codex-plugin/plugin.json`, remove the `apps` line entirely and keep the MCP registration:

```json
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.mcp.json",
  "interface": {
```

After this edit, there should be no `apps` property in the plugin manifest.

- [ ] **Step 3: Remove the unused app manifest file**

Delete `.app.json` from the repository.

- [ ] **Step 4: Update docs to describe the real integration**

Apply these documentation changes:

In `docs/README.codex.md`, add a short section after "How It Works":

```md
## Diagnostic MCP

This bundle now ships a local read-only diagnostic MCP. Its purpose is to inspect
the Superpowers Codex bundle, verify expected installation wiring, and report
missing or inconsistent setup.

It does not repair the environment automatically in this version.
```

In `.codex/INSTALL.md`, add after the installation steps:

```md
## Diagnostic MCP

The bundle includes a local read-only diagnostic MCP registered through `.mcp.json`.
It is intended to help verify that the bundle, hooks, and installation wiring are
coherent after setup.
```

In `README.md`, add to "What This Repository Contains":

```md
- `.mcp.json` with the local read-only diagnostic MCP registration
- `scripts/mcp/` with the Superpowers Codex diagnostics service
```

Also add this sentence near the scope description:

```md
This version does not ship external app integration; its real integration surface is the local diagnostic MCP.
```

- [ ] **Step 5: Remove stale config guidance**

In `codex-global/config/hooks-snippet.toml`, change the features block to:

```toml
[features]
multi_agent = true
skills = true
steer = true
```

There should be no `collab = true` line afterward.

- [ ] **Step 6: Add a release note entry**

Prepend this section to `RELEASE-NOTES.md`:

```md
## v5.0.9 (2026-03-29)

### Superpowers Codex Diagnostic MCP

- replaced the empty `.mcp.json` stub with a real local diagnostic MCP registration
- removed unused app-integration advertising from the shipped plugin contract
- updated installation and README docs to describe the read-only diagnostics flow
- removed stale `collab = true` guidance from the published Codex config snippet
```

- [ ] **Step 7: Run the manifest/docs test to verify it passes**

Run:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs
```

Expected: PASS

- [ ] **Step 8: Request adversarial review for Stage 1**

Spawn a reviewer subagent with read-only scope over:

- `.mcp.json`
- `.codex-plugin/plugin.json`
- `docs/README.codex.md`
- `.codex/INSTALL.md`
- `README.md`
- `codex-global/config/hooks-snippet.toml`
- `RELEASE-NOTES.md`

Prompt:

```text
Review Stage 1 of the Superpowers Codex MCP diagnostics rollout.
Check whether the bundle promises only what it now actually provides.
Flag any remaining misleading app-integration claims, manifest inconsistencies,
or documentation contradictions. Do not implement changes; only review.
```

- [ ] **Step 9: Fix any adversarial findings and re-run the test**

If the reviewer finds issues, fix them and rerun:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs
```

Expected: PASS

- [ ] **Step 10: Commit Stage 1**

```bash
git add .mcp.json .codex-plugin/plugin.json docs/README.codex.md .codex/INSTALL.md README.md codex-global/config/hooks-snippet.toml RELEASE-NOTES.md tests/mcp/superpowers-codex-manifests.test.mjs
git rm .app.json
git commit -m "feat: publish real MCP diagnostics contract for superpowers codex"
```

---

### Task 3: Write failing unit tests for the diagnostics MCP behavior

**Files:**
- Create: `tests/mcp/superpowers-codex-diagnostics.test.mjs`
- Read: `.mcp.json`
- Read: `.codex-plugin/plugin.json`

- [ ] **Step 1: Create the failing MCP unit test**

Create `tests/mcp/superpowers-codex-diagnostics.test.mjs` with this full content:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  getToolDefinitions,
  runTool,
} from '../../scripts/mcp/superpowers-codex-diagnostics-lib.mjs';

const repoRoot = 'C:/Users/win/Codex-superpower';

test('tool catalog exposes the expected read-only diagnostics tools', () => {
  const tools = getToolDefinitions();
  const names = tools.map((tool) => tool.name).sort();

  assert.deepEqual(names, [
    'bundle_metadata',
    'doctor',
    'inspect_bundle',
    'inspect_config',
    'inspect_hooks',
    'inspect_installation',
  ]);
});

test('bundle_metadata returns identity and key bundle paths', async () => {
  const result = await runTool('bundle_metadata', {}, { repoRoot });

  assert.equal(result.bundle.name, 'superpowers-codex-global');
  assert.equal(result.bundle.hasMcpConfig, true);
  assert.equal(result.bundle.hasPluginManifest, true);
});

test('inspect_bundle reports expected assets', async () => {
  const result = await runTool('inspect_bundle', {}, { repoRoot });

  assert.equal(result.status, 'ok');
  assert.equal(result.assets.skills, true);
  assert.equal(result.assets.hooks, true);
  assert.equal(result.assets.mcpManifest, true);
});

test('inspect_config flags no stale collab setting', async () => {
  const result = await runTool('inspect_config', {}, { repoRoot });

  assert.equal(result.status, 'ok');
  assert.equal(result.flags.collabSettingPresent, false);
  assert.equal(result.flags.multiAgentEnabledInSnippet, true);
});

test('doctor aggregates checks into one summary', async () => {
  const result = await runTool('doctor', {}, { repoRoot });

  assert.equal(result.status, 'ok');
  assert.ok(Array.isArray(result.checks));
  assert.ok(result.checks.length >= 4);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test tests/mcp/superpowers-codex-diagnostics.test.mjs
```

Expected: FAIL because the diagnostics library and entrypoint do not exist yet.

- [ ] **Step 3: Confirm the failure reason is correct**

Verify the failure is caused by missing implementation files, not by syntax errors in the test.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/mcp/superpowers-codex-diagnostics.test.mjs
git commit -m "test: add failing unit tests for superpowers codex diagnostics mcp"
```

---

### Task 4: Implement the read-only diagnostics MCP

**Files:**
- Create: `scripts/mcp/superpowers-codex-diagnostics-lib.mjs`
- Create: `scripts/mcp/superpowers-codex-diagnostics.mjs`

- [ ] **Step 1: Create the diagnostics library**

Create `scripts/mcp/superpowers-codex-diagnostics-lib.mjs` with this full content:

```js
import fs from 'node:fs';
import path from 'node:path';

export function getToolDefinitions() {
  return [
    { name: 'bundle_metadata' },
    { name: 'inspect_bundle' },
    { name: 'inspect_installation' },
    { name: 'inspect_hooks' },
    { name: 'inspect_config' },
    { name: 'doctor' },
  ];
}

function exists(root, relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function readJson(root, relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function readText(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

async function bundleMetadata(repoRoot) {
  const pluginManifest = readJson(repoRoot, '.codex-plugin/plugin.json');
  return {
    status: 'ok',
    bundle: {
      name: pluginManifest.name,
      version: pluginManifest.version,
      hasMcpConfig: exists(repoRoot, '.mcp.json'),
      hasPluginManifest: true,
      hasSkills: exists(repoRoot, 'skills'),
      hasHooks: exists(repoRoot, 'hooks'),
    },
  };
}

async function inspectBundle(repoRoot) {
  return {
    status: 'ok',
    assets: {
      skills: exists(repoRoot, 'skills'),
      hooks: exists(repoRoot, 'hooks'),
      docs: exists(repoRoot, 'docs'),
      mcpManifest: exists(repoRoot, '.mcp.json'),
      pluginManifest: exists(repoRoot, '.codex-plugin/plugin.json'),
    },
  };
}

async function inspectInstallation(repoRoot) {
  const skillsPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.agents', 'skills', 'superpowers');
  return {
    status: exists(repoRoot, 'skills') ? 'ok' : 'warn',
    checks: {
      bundleSkillsPresent: exists(repoRoot, 'skills'),
      expectedUserSkillsLinkPath: skillsPath,
      userSkillsLinkExists: fs.existsSync(skillsPath),
    },
  };
}

async function inspectHooks(repoRoot) {
  return {
    status: 'ok',
    hooks: {
      rootHooksManifest: exists(repoRoot, 'hooks/hooks.json'),
      globalHookSnippet: exists(repoRoot, 'codex-global/config/hooks-snippet.toml'),
      orchestratorGate: exists(repoRoot, 'codex-global/hooks/require-orchestrator-decision.cjs'),
    },
  };
}

async function inspectConfig(repoRoot) {
  const snippet = readText(repoRoot, 'codex-global/config/hooks-snippet.toml');
  return {
    status: /multi_agent = true/.test(snippet) && !/collab = true/.test(snippet) ? 'ok' : 'warn',
    flags: {
      multiAgentEnabledInSnippet: /multi_agent = true/.test(snippet),
      collabSettingPresent: /collab = true/.test(snippet),
    },
  };
}

export async function runTool(name, args = {}, context = {}) {
  const repoRoot = context.repoRoot || process.cwd();

  switch (name) {
    case 'bundle_metadata':
      return bundleMetadata(repoRoot);
    case 'inspect_bundle':
      return inspectBundle(repoRoot);
    case 'inspect_installation':
      return inspectInstallation(repoRoot);
    case 'inspect_hooks':
      return inspectHooks(repoRoot);
    case 'inspect_config':
      return inspectConfig(repoRoot);
    case 'doctor': {
      const checks = [
        await bundleMetadata(repoRoot),
        await inspectBundle(repoRoot),
        await inspectInstallation(repoRoot),
        await inspectHooks(repoRoot),
        await inspectConfig(repoRoot),
      ];
      const status = checks.some((check) => check.status !== 'ok') ? 'warn' : 'ok';
      return { status, checks };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

- [ ] **Step 2: Create the MCP stdio entrypoint**

Create `scripts/mcp/superpowers-codex-diagnostics.mjs` with this full content:

```js
import readline from 'node:readline';
import { getToolDefinitions, runTool } from './superpowers-codex-diagnostics-lib.mjs';

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleMessage(message) {
  if (message.method === 'tools/list') {
    write({ id: message.id, result: { tools: getToolDefinitions() } });
    return;
  }

  if (message.method === 'tools/call') {
    const { name, arguments: args = {} } = message.params || {};
    const result = await runTool(name, args, { repoRoot: process.cwd() });
    write({ id: message.id, result });
    return;
  }

  write({
    id: message.id,
    error: { code: -32601, message: `Unsupported method: ${message.method}` },
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const message = JSON.parse(line);
    await handleMessage(message);
  } catch (error) {
    write({
      error: { code: -32603, message: error.message },
    });
  }
});
```

- [ ] **Step 3: Run the MCP unit test to verify it passes**

Run:

```bash
node --test tests/mcp/superpowers-codex-diagnostics.test.mjs
```

Expected: PASS

- [ ] **Step 4: Request adversarial review for Stage 2**

Spawn a reviewer subagent with read-only scope over:

- `scripts/mcp/superpowers-codex-diagnostics-lib.mjs`
- `scripts/mcp/superpowers-codex-diagnostics.mjs`
- `tests/mcp/superpowers-codex-diagnostics.test.mjs`

Prompt:

```text
Review Stage 2 of the Superpowers Codex diagnostics rollout.
Check whether the MCP stayed read-only, narrowly scoped, and robust enough
for bundle diagnostics. Flag brittle assumptions, hidden side effects,
or scope creep. Do not implement changes; only review.
```

- [ ] **Step 5: Fix any adversarial findings and re-run the unit test**

If the reviewer finds issues, fix them and rerun:

```bash
node --test tests/mcp/superpowers-codex-diagnostics.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit Stage 2**

```bash
git add scripts/mcp/superpowers-codex-diagnostics-lib.mjs scripts/mcp/superpowers-codex-diagnostics.mjs tests/mcp/superpowers-codex-diagnostics.test.mjs
git commit -m "feat: add read-only superpowers codex diagnostics mcp"
```

---

### Task 5: Write failing integration tests and close the rollout

**Files:**
- Create: `tests/mcp/superpowers-codex-diagnostics-integration.test.mjs`
- Read: `.mcp.json`
- Read: `.codex-plugin/plugin.json`
- Read: `scripts/mcp/superpowers-codex-diagnostics.mjs`
- Read: `scripts/mcp/superpowers-codex-diagnostics-lib.mjs`

- [ ] **Step 1: Create the failing integration test**

Create `tests/mcp/superpowers-codex-diagnostics-integration.test.mjs` with this full content:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runTool } from '../../scripts/mcp/superpowers-codex-diagnostics-lib.mjs';

const repoRoot = 'C:/Users/win/Codex-superpower';

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

test('plugin manifest and .mcp.json stay coherent', () => {
  const pluginManifest = readJson('.codex-plugin/plugin.json');
  const mcpConfig = readJson('.mcp.json');

  assert.equal(pluginManifest.mcpServers, './.mcp.json');
  assert.ok(mcpConfig.mcpServers['superpowers-codex-diagnostics']);
});

test('doctor reports an aggregated ok-or-warn status with expected checks', async () => {
  const result = await runTool('doctor', {}, { repoRoot });

  assert.ok(['ok', 'warn'].includes(result.status));
  assert.ok(result.checks.some((check) => check.bundle));
  assert.ok(result.checks.some((check) => check.assets));
  assert.ok(result.checks.some((check) => check.flags));
});

test('root documentation matches the no-app-integration contract', () => {
  const rootReadme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  assert.match(rootReadme, /does not ship external app integration/i);
});
```

- [ ] **Step 2: Run the integration test to verify it fails**

Run:

```bash
node --test tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

Expected: FAIL until all final wording and manifest/MCP coherence is in place.

- [ ] **Step 3: Make any final integration fixes**

Apply any missing polish needed so the integration test passes. Typical fixes here should be limited to:

- wording mismatches across docs
- manifest/MCP coherence
- missing or inconsistent fields in the diagnostic output

Do not broaden scope beyond the approved design.

- [ ] **Step 4: Run the full targeted test set**

Run:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs tests/mcp/superpowers-codex-diagnostics.test.mjs tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

Expected: PASS

- [ ] **Step 5: Request adversarial review for Stage 3**

Spawn a reviewer subagent with read-only scope over:

- `.mcp.json`
- `.codex-plugin/plugin.json`
- `scripts/mcp/superpowers-codex-diagnostics-lib.mjs`
- `scripts/mcp/superpowers-codex-diagnostics.mjs`
- `docs/README.codex.md`
- `.codex/INSTALL.md`
- `README.md`
- `codex-global/config/hooks-snippet.toml`
- `tests/mcp/*.test.mjs`

Prompt:

```text
Review the final Stage 3 integration for the Superpowers Codex diagnostics rollout.
Check whether manifests, docs, plugin wiring, and MCP outputs agree with each other.
Flag any remaining contradictions, over-promises, or missing diagnostic coverage.
Do not implement changes; only review.
```

- [ ] **Step 6: Fix any final adversarial findings and rerun the full targeted test set**

Run:

```bash
node --test tests/mcp/superpowers-codex-manifests.test.mjs tests/mcp/superpowers-codex-diagnostics.test.mjs tests/mcp/superpowers-codex-diagnostics-integration.test.mjs
```

Expected: PASS

- [ ] **Step 7: Commit Stage 3**

```bash
git add tests/mcp/superpowers-codex-diagnostics-integration.test.mjs .mcp.json .codex-plugin/plugin.json scripts/mcp/superpowers-codex-diagnostics-lib.mjs scripts/mcp/superpowers-codex-diagnostics.mjs docs/README.codex.md .codex/INSTALL.md README.md codex-global/config/hooks-snippet.toml RELEASE-NOTES.md
git commit -m "test: close diagnostics mcp rollout with integration coverage"
```

---

## Execution Notes

- Recommended execution mode for this plan: **Subagent-Driven**
- Implement Stage 1 with one implementation subagent and one adversarial reviewer
- Implement Stage 2 with one implementation subagent and one adversarial reviewer
- Implement Stage 3 with one integration/polish subagent and one adversarial reviewer
- The controller must keep one visible `update_plan` task in progress at a time and must not skip the adversarial review checkpoints

## Done Criteria

The work is done only when:

- `.mcp.json` registers the local diagnostics MCP
- `.codex-plugin/plugin.json` no longer advertises unused app integration
- `.app.json` is removed from the shipped contract
- docs describe the MCP honestly
- `collab = true` is gone from the published snippet
- all three targeted `node --test` commands pass
- adversarial review has run after each stage and any findings are resolved
