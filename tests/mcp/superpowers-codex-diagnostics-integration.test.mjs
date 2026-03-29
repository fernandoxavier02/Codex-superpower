import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pluginManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, '.codex-plugin', 'plugin.json'), 'utf8'),
);
const mcpConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, '.mcp.json'), 'utf8'));
const publishedServerConfig = mcpConfig.mcpServers['superpowers-codex-diagnostics'];

function createJsonLineReader(stream) {
  let buffer = '';
  const queue = [];
  let pendingResolve;
  let pendingTimer;

  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;

    while (buffer.includes('\n')) {
      const newlineIndex = buffer.indexOf('\n');
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      const message = JSON.parse(line);
      if (pendingResolve) {
        clearTimeout(pendingTimer);
        const resolve = pendingResolve;
        pendingResolve = null;
        pendingTimer = null;
        resolve(message);
      } else {
        queue.push(message);
      }
    }
  });

  return {
    next(timeoutMs = 2000) {
      if (queue.length > 0) {
        return Promise.resolve(queue.shift());
      }

      return new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingTimer = setTimeout(() => {
          pendingResolve = null;
          pendingTimer = null;
          reject(new Error('Timed out waiting for MCP message'));
        }, timeoutMs);
      });
    },
  };
}

function writeMessage(stream, message) {
  stream.write(`${JSON.stringify(message)}\n`);
}

function spawnPublishedDiagnosticsServer(cwd) {
  const command =
    publishedServerConfig.command === 'node' ? process.execPath : publishedServerConfig.command;
  const args = publishedServerConfig.args.map((arg) => {
    if (typeof arg !== 'string') {
      return arg;
    }

    if (arg.startsWith('./') || arg.startsWith('.\\')) {
      return path.resolve(repoRoot, arg);
    }

    return arg;
  });

  return spawn(command, args, {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

test('diagnostics MCP accepts initialize and exposes bundle metadata tooling', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'integration-test', version: '1.0.0' },
    },
  });

  const initializeResponse = await reader.next();
  assert.equal(initializeResponse.id, 1);
  assert.equal(initializeResponse.result.serverInfo.name, 'superpowers-codex-diagnostics');

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });

  const toolsResponse = await reader.next();
  assert.equal(toolsResponse.id, 2);
  assert.ok(Array.isArray(toolsResponse.result.tools));
  const toolNames = toolsResponse.result.tools.map((tool) => tool.name).sort();
  assert.ok(toolNames.includes('bundle_metadata'));

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'bundle_metadata',
      arguments: {},
    },
  });

  const toolCallResponse = await reader.next();
  assert.equal(toolCallResponse.id, 3);
  assert.equal(toolCallResponse.result.structuredContent.bundle.name, 'superpowers-codex-global');
  assert.equal(
    toolCallResponse.result.structuredContent.bundle.version,
    pluginManifest.version,
  );
  assert.equal(toolCallResponse.result.structuredContent.mcpServer.readOnly, true);
  assert.deepEqual(
    [...toolCallResponse.result.structuredContent.diagnostics.tools].sort(),
    toolNames,
  );
});

test('diagnostics MCP initialize survives a missing plugin manifest in the inspected repo', async (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-mcp-init-'));
  const child = spawnPublishedDiagnosticsServer(tempRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'integration-test-missing-manifest', version: '1.0.0' },
    },
  });

  const initializeResponse = await reader.next();
  assert.equal(initializeResponse.id, 1);
  assert.equal(initializeResponse.result.serverInfo.name, 'superpowers-codex-diagnostics');
  assert.equal(initializeResponse.result.serverInfo.version, 'unknown');
});

test('diagnostics MCP returns an error for requests that omit an id', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
  });

  const errorResponse = await reader.next();
  assert.equal(errorResponse.error.code, -32600);
  assert.match(errorResponse.error.message, /missing id/i);
});

test('diagnostics MCP ignores supported notifications without replying', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    method: 'notifications/cancelled',
    params: {},
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'notification-test', version: '1.0.0' },
    },
  });

  const firstResponse = await reader.next();
  assert.equal(firstResponse.id, 1);
  assert.equal(firstResponse.result.serverInfo.name, 'superpowers-codex-diagnostics');
});

test('diagnostics MCP returns invalid params for malformed tools/call requests', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {},
  });

  const errorResponse = await reader.next();
  assert.equal(errorResponse.id, 1);
  assert.equal(errorResponse.error.code, -32602);
  assert.match(errorResponse.error.message, /invalid params/i);
});

test('diagnostics MCP returns invalid params for unknown tools', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'not_a_real_tool',
      arguments: {},
    },
  });

  const errorResponse = await reader.next();
  assert.equal(errorResponse.id, 1);
  assert.equal(errorResponse.error.code, -32602);
  assert.match(errorResponse.error.message, /invalid params/i);
});

test('diagnostics MCP returns invalid params for unexpected tool arguments', async (t) => {
  const child = spawnPublishedDiagnosticsServer(repoRoot);
  const reader = createJsonLineReader(child.stdout);

  t.after(() => {
    child.kill();
  });

  writeMessage(child.stdin, {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'bundle_metadata',
      arguments: { unexpected: true },
    },
  });

  const errorResponse = await reader.next();
  assert.equal(errorResponse.id, 1);
  assert.equal(errorResponse.error.code, -32602);
  assert.match(errorResponse.error.message, /invalid params/i);
});
