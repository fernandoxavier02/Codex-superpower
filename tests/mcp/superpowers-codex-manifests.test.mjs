import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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
  assert.equal(fs.existsSync(path.join(repoRoot, '.app.json')), false);
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
  assert.match(rootReadme, /does not ship any external app surface/i);
  assert.match(readmeCodex, /repo-local only/i);
  assert.match(installDoc, /repo-local only/i);

  assert.doesNotMatch(readmeCodex, /app integration/i);
  assert.doesNotMatch(installDoc, /app integration/i);
  assert.doesNotMatch(readmeCodex, /C:\\Users\\win\\plugins\\superpowers-codex-global/i);
  assert.doesNotMatch(installDoc, /C:\\Users\\win\\plugins\\superpowers-codex-global/i);
});

test('hooks snippet uses multi_agent and does not mention collab', () => {
  const hooksSnippet = readText('codex-global/config/hooks-snippet.toml');

  assert.match(hooksSnippet, /multi_agent = true/);
  assert.doesNotMatch(hooksSnippet, /collab = true/);
});

test('published version metadata matches the current release note', () => {
  const pluginManifest = readJson('.codex-plugin/plugin.json');
  const packageManifest = readJson('package.json');
  const releaseNotes = readText('RELEASE-NOTES.md');
  const currentRelease = releaseNotes.match(/^## v([0-9]+\.[0-9]+\.[0-9]+) \([0-9-]+\)/m);

  assert.ok(currentRelease);
  assert.equal(pluginManifest.version, currentRelease[1]);
  assert.equal(packageManifest.version, currentRelease[1]);
});
