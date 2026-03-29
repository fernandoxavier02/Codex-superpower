#!/usr/bin/env node

import readline from 'node:readline';
import { getToolDefinitions, runTool } from './superpowers-codex-diagnostics-lib.mjs';

const SERVER_NAME = 'superpowers-codex-diagnostics';
const PROTOCOL_VERSION = '2024-11-05';

function sendMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    result,
  });
}

function sendError(id, code, message) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  });
}

async function handleToolCall(id, params) {
  const { name, arguments: args = {} } = params || {};

  if (typeof name !== 'string' || name.length === 0) {
    sendError(id, -32602, 'Invalid params: tools/call requires a tool name');
    return;
  }

  const toolDefinition = getToolDefinitions().find((tool) => tool.name === name);
  if (!toolDefinition) {
    sendError(id, -32602, `Invalid params: unknown tool "${name}"`);
    return;
  }

  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    sendError(id, -32602, 'Invalid params: tools/call arguments must be an object');
    return;
  }

  if (toolDefinition.inputSchema?.additionalProperties === false && Object.keys(args).length > 0) {
    sendError(id, -32602, `Invalid params: "${name}" does not accept arguments`);
    return;
  }

  const result = await runTool(name, args, { repoRoot: process.cwd() });
  sendResult(id, {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
  });
}

async function handleRequest(message) {
  switch (message.method) {
    case 'initialize':
      {
        const metadata = await runTool('bundle_metadata', {}, { repoRoot: process.cwd() });
      sendResult(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: SERVER_NAME,
            version: metadata.bundle.version,
        },
        instructions:
          'Read-only Superpowers Codex diagnostics. This rollout exposes bundle diagnostics only and does not repair the environment automatically.',
      });
      return;
      }
    case 'tools/list':
      sendResult(message.id, {
        tools: getToolDefinitions(),
      });
      return;
    case 'tools/call':
      await handleToolCall(message.id, message.params);
      return;
    case 'ping':
      sendResult(message.id, {});
      return;
    default:
      sendError(message.id, -32601, `Method not found: ${message.method}`);
  }
}

const lineReader = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

lineReader.on('line', (line) => {
  if (!line.trim()) {
    return;
  }

  (async () => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      sendError(null, -32700, 'Invalid JSON');
      return;
    }

    if (typeof message.method === 'string' && message.method.startsWith('notifications/')) {
      return;
    }

    if (message.method && message.id === undefined) {
      sendError(null, -32600, 'Missing id for request method');
      return;
    }

    try {
      await handleRequest(message);
    } catch (error) {
      sendError(message.id ?? null, -32603, error.message);
    }
  })();
});
