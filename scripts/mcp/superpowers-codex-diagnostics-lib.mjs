import fs from 'node:fs';
import path from 'node:path';

export function getToolDefinitions() {
  return [
    {
      name: 'bundle_metadata',
      description: 'Returns bundle identity, core paths, and the published diagnostics scope.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'inspect_bundle',
      description: 'Checks whether the core bundle assets are present in the repository.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'inspect_installation',
      description: 'Reports the expected user skill-link path and whether the link exists.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'inspect_hooks',
      description: 'Checks the bundle hook manifests and key orchestrator gate assets.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'inspect_config',
      description: 'Checks the published Codex config snippet for expected multi-agent settings.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'doctor',
      description: 'Aggregates the read-only diagnostics checks into one summary.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
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

function isSymbolicLinkPath(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return false;
  }

  try {
    return fs.lstatSync(targetPath).isSymbolicLink();
  } catch {
    return false;
  }
}

function resolveRealPath(targetPath) {
  if (!targetPath || !fs.existsSync(targetPath)) {
    return null;
  }

  try {
    return fs.realpathSync(targetPath);
  } catch {
    return null;
  }
}

function readPluginManifest(root) {
  const relPath = '.codex-plugin/plugin.json';
  const fullPath = path.join(root, relPath);

  if (!fs.existsSync(fullPath)) {
    return { ok: false, error: 'missing_plugin_manifest', manifest: null };
  }

  try {
    return { ok: true, error: null, manifest: readJson(root, relPath) };
  } catch {
    return { ok: false, error: 'invalid_plugin_manifest', manifest: null };
  }
}

async function bundleMetadata(repoRoot) {
  const pluginManifestResult = readPluginManifest(repoRoot);
  const hasMcpConfig = exists(repoRoot, '.mcp.json');
  const hasPluginManifest = exists(repoRoot, '.codex-plugin/plugin.json');
  const hasSkills = exists(repoRoot, 'skills');
  const hasHooks = exists(repoRoot, 'hooks');
  const errors = [];

  if (!pluginManifestResult.ok) {
    errors.push(pluginManifestResult.error);
  }
  if (!hasMcpConfig) {
    errors.push('missing_mcp_config');
  }
  if (!hasSkills) {
    errors.push('missing_skills');
  }
  if (!hasHooks) {
    errors.push('missing_hooks');
  }

  return {
    status:
      pluginManifestResult.ok && hasMcpConfig && hasPluginManifest && hasSkills && hasHooks
        ? 'ok'
        : 'warn',
    bundle: {
      name: pluginManifestResult.manifest?.name ?? 'unknown',
      version: pluginManifestResult.manifest?.version ?? 'unknown',
      hasMcpConfig,
      hasPluginManifest,
      hasSkills,
      hasHooks,
    },
    mcpServer: {
      name: 'superpowers-codex-diagnostics',
      transport: 'stdio',
      readOnly: true,
    },
    diagnostics: {
      tools: getToolDefinitions().map((tool) => tool.name),
      note: 'Stage 2 expands the read-only diagnostics surface while keeping the MCP narrowly scoped.',
    },
    errors,
  };
}

async function inspectBundle(repoRoot) {
  const assets = {
    skills: exists(repoRoot, 'skills'),
    hooks: exists(repoRoot, 'hooks'),
    docs: exists(repoRoot, 'docs'),
    mcpManifest: exists(repoRoot, '.mcp.json'),
    pluginManifest: exists(repoRoot, '.codex-plugin/plugin.json'),
  };

  return {
    status:
      assets.skills && assets.hooks && assets.mcpManifest && assets.pluginManifest ? 'ok' : 'warn',
    assets,
  };
}

async function inspectInstallation(repoRoot, context = {}) {
  const userHome = context.userHome ?? process.env.USERPROFILE ?? process.env.HOME ?? '';
  const observedSkillsPath = userHome
    ? path.join(userHome, '.agents', 'skills', 'superpowers')
    : null;
  const bundleSkillsPath = path.join(repoRoot, 'skills');
  const bundleSkillsPresent = exists(repoRoot, 'skills');
  const userSkillsLinkObserved = isSymbolicLinkPath(observedSkillsPath);
  const userSkillsLinkTargetsBundle =
    userSkillsLinkObserved &&
    resolveRealPath(observedSkillsPath) === resolveRealPath(bundleSkillsPath);

  return {
    status: bundleSkillsPresent && userSkillsLinkObserved && userSkillsLinkTargetsBundle ? 'ok' : 'warn',
    checks: {
      bundleSkillsPresent,
      expectedUserSkillsLinkPath: '~/.agents/skills/superpowers',
      userSkillsLinkObserved,
      userSkillsLinkTargetsBundle,
    },
  };
}

async function inspectHooks(repoRoot) {
  const hooks = {
    rootHooksManifest: exists(repoRoot, 'hooks/hooks.json'),
    globalHookSnippet: exists(repoRoot, 'codex-global/config/hooks-snippet.toml'),
    orchestratorGate: exists(repoRoot, 'codex-global/hooks/require-orchestrator-decision.cjs'),
  };

  return {
    status: Object.values(hooks).every(Boolean) ? 'ok' : 'warn',
    hooks,
  };
}

async function inspectConfig(repoRoot) {
  if (!exists(repoRoot, 'codex-global/config/hooks-snippet.toml')) {
    return {
      status: 'warn',
      flags: {
        multiAgentEnabledInSnippet: false,
        collabSettingPresent: false,
      },
    };
  }

  const snippet = readText(repoRoot, 'codex-global/config/hooks-snippet.toml');
  const multiAgentEnabledInSnippet = /multi_agent = true/.test(snippet);
  const collabSettingPresent = /collab = true/.test(snippet);

  return {
    status: multiAgentEnabledInSnippet && !collabSettingPresent ? 'ok' : 'warn',
    flags: {
      multiAgentEnabledInSnippet,
      collabSettingPresent,
    },
  };
}

export async function runTool(name, args = {}, context = {}) {
  const repoRoot = context.repoRoot || process.cwd();

  switch (name) {
    case 'bundle_metadata':
      return bundleMetadata(repoRoot);
    case 'inspect_bundle':
      return inspectBundle(repoRoot, args);
    case 'inspect_installation':
      return inspectInstallation(repoRoot, context);
    case 'inspect_hooks':
      return inspectHooks(repoRoot, args);
    case 'inspect_config':
      return inspectConfig(repoRoot, args);
    case 'doctor': {
      const checks = [
        await bundleMetadata(repoRoot),
        await inspectBundle(repoRoot),
        await inspectInstallation(repoRoot, context),
        await inspectHooks(repoRoot),
        await inspectConfig(repoRoot),
      ];

      return {
        status: checks.some((check) => check.status !== 'ok') ? 'warn' : 'ok',
        checks,
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
