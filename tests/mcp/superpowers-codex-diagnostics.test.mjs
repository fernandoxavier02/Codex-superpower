import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getToolDefinitions,
  runTool,
} from '../../scripts/mcp/superpowers-codex-diagnostics-lib.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

test('bundle_metadata degrades gracefully when the plugin manifest is missing', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-missing-manifest-'));

  const result = await runTool('bundle_metadata', {}, { repoRoot: tempRoot });

  assert.equal(result.status, 'warn');
  assert.equal(result.bundle.name, 'unknown');
  assert.equal(result.bundle.hasPluginManifest, false);
  assert.ok(result.errors.includes('missing_plugin_manifest'));
  assert.ok(result.errors.includes('missing_mcp_config'));
  assert.ok(result.errors.includes('missing_skills'));
  assert.ok(result.errors.includes('missing_hooks'));
});

test('inspect_bundle warns when required bundle assets are missing', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-empty-bundle-'));

  const result = await runTool('inspect_bundle', {}, { repoRoot: tempRoot });

  assert.equal(result.status, 'warn');
  assert.equal(result.assets.skills, false);
  assert.equal(result.assets.hooks, false);
  assert.equal(result.assets.mcpManifest, false);
});

test('inspect_bundle stays ok when operational assets exist but docs are absent', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-docless-bundle-'));

  fs.mkdirSync(path.join(tempRoot, 'skills'));
  fs.mkdirSync(path.join(tempRoot, 'hooks'));
  fs.mkdirSync(path.join(tempRoot, '.codex-plugin'));
  fs.writeFileSync(path.join(tempRoot, '.mcp.json'), '{}');
  fs.writeFileSync(
    path.join(tempRoot, '.codex-plugin', 'plugin.json'),
    JSON.stringify({ name: 'superpowers-codex-global', version: '5.0.9' }),
  );

  const result = await runTool('inspect_bundle', {}, { repoRoot: tempRoot });

  assert.equal(result.status, 'ok');
  assert.equal(result.assets.docs, false);
  assert.equal(result.assets.mcpManifest, true);
});

test('inspect_hooks warns when required hook assets are missing', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-empty-hooks-'));

  const result = await runTool('inspect_hooks', {}, { repoRoot: tempRoot });

  assert.equal(result.status, 'warn');
  assert.equal(result.hooks.rootHooksManifest, false);
  assert.equal(result.hooks.globalHookSnippet, false);
  assert.equal(result.hooks.orchestratorGate, false);
});

test('inspect_installation warns when the expected skills link is absent', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-installation-'));
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-home-'));

  fs.mkdirSync(path.join(tempRoot, 'skills'));

  const result = await runTool('inspect_installation', {}, { repoRoot: tempRoot, userHome: fakeHome });

  assert.equal(result.status, 'warn');
  assert.equal(result.checks.bundleSkillsPresent, true);
  assert.equal(result.checks.expectedUserSkillsLinkPath, '~/.agents/skills/superpowers');
  assert.equal(result.checks.userSkillsLinkObserved, false);
});

test('inspect_installation warns when the expected skills path exists but is not a link', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-installation-fake-link-'));
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-home-fake-link-'));

  fs.mkdirSync(path.join(tempRoot, 'skills'));
  fs.mkdirSync(path.join(fakeHome, '.agents', 'skills', 'superpowers'), { recursive: true });

  const result = await runTool('inspect_installation', {}, { repoRoot: tempRoot, userHome: fakeHome });

  assert.equal(result.status, 'warn');
  assert.equal(result.checks.userSkillsLinkObserved, false);
  assert.equal(result.checks.userSkillsLinkTargetsBundle, false);
});

test('inspect_installation warns when the observed skills link points somewhere else', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-installation-stale-link-'));
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-home-stale-link-'));
  const wrongTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-wrong-target-'));

  fs.mkdirSync(path.join(tempRoot, 'skills'));
  fs.mkdirSync(path.join(fakeHome, '.agents', 'skills'), { recursive: true });
  fs.symlinkSync(
    wrongTarget,
    path.join(fakeHome, '.agents', 'skills', 'superpowers'),
    'junction',
  );

  const result = await runTool('inspect_installation', {}, { repoRoot: tempRoot, userHome: fakeHome });

  assert.equal(result.status, 'warn');
  assert.equal(result.checks.userSkillsLinkObserved, true);
  assert.equal(result.checks.userSkillsLinkTargetsBundle, false);
});

test('inspect_config warns instead of throwing when the snippet is missing', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-missing-config-'));

  const result = await runTool('inspect_config', {}, { repoRoot: tempRoot });

  assert.equal(result.status, 'warn');
  assert.equal(result.flags.multiAgentEnabledInSnippet, false);
  assert.equal(result.flags.collabSettingPresent, false);
});

test('doctor aggregates checks into one summary', async () => {
  const result = await runTool('doctor', {}, { repoRoot });

  assert.ok(['ok', 'warn'].includes(result.status));
  assert.ok(Array.isArray(result.checks));
  assert.ok(result.checks.length >= 4);
  assert.ok(result.checks.some((check) => check.checks?.expectedUserSkillsLinkPath));
});

test('doctor respects installation context overrides', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-doctor-context-'));
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-doctor-home-'));
  const ambientHome = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-doctor-ambient-'));
  const linkTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-link-target-'));
  const previousUserProfile = process.env.USERPROFILE;
  const previousHome = process.env.HOME;

  fs.mkdirSync(path.join(tempRoot, 'skills'));
  fs.mkdirSync(path.join(tempRoot, 'hooks'));
  fs.mkdirSync(path.join(tempRoot, 'codex-global', 'config'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'codex-global', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.codex-plugin'));
  fs.writeFileSync(path.join(tempRoot, 'hooks', 'hooks.json'), '{}');
  fs.writeFileSync(path.join(tempRoot, '.mcp.json'), '{}');
  fs.writeFileSync(
    path.join(tempRoot, '.codex-plugin', 'plugin.json'),
    JSON.stringify({ name: 'superpowers-codex-global', version: '5.0.9' }),
  );
  fs.writeFileSync(
    path.join(tempRoot, 'codex-global', 'config', 'hooks-snippet.toml'),
    '[features]\nmulti_agent = true\nskills = true\nsteer = true\n',
  );
  fs.writeFileSync(
    path.join(tempRoot, 'codex-global', 'hooks', 'require-orchestrator-decision.cjs'),
    '// test hook\n',
  );
  fs.mkdirSync(path.join(fakeHome, '.agents', 'skills'), { recursive: true });
  fs.symlinkSync(
    path.join(tempRoot, 'skills'),
    path.join(fakeHome, '.agents', 'skills', 'superpowers'),
    'junction',
  );

  process.env.USERPROFILE = ambientHome;
  process.env.HOME = ambientHome;

  try {
    const result = await runTool('doctor', {}, { repoRoot: tempRoot, userHome: fakeHome });

    assert.equal(result.status, 'ok');
    const installationCheck = result.checks.find((check) => check.checks?.expectedUserSkillsLinkPath);
    assert.equal(installationCheck.checks.userSkillsLinkTargetsBundle, true);
  } finally {
    if (previousUserProfile === undefined) {
      delete process.env.USERPROFILE;
    } else {
      process.env.USERPROFILE = previousUserProfile;
    }

    if (previousHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousHome;
    }
  }
});
