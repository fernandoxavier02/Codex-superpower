#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const engine = require(path.resolve(__dirname, "..", "hooks", "orchestrator-gate-engine.js"));

function readInput(args) {
  const fileFlag = args.indexOf("--file");
  if (fileFlag >= 0 && args[fileFlag + 1]) {
    return fs.readFileSync(path.resolve(process.cwd(), args[fileFlag + 1]), "utf8");
  }
  if (args.includes("--stdin")) {
    return fs.readFileSync(0, "utf8");
  }
  return "";
}

function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      "  node .codex/scripts/pipeline-state.cjs status",
      "  node .codex/scripts/pipeline-state.cjs reset",
      "  node .codex/scripts/pipeline-state.cjs init --stdin|--file <path>",
      "  node .codex/scripts/pipeline-state.cjs checkpoint --stdin|--file <path>",
      "  node .codex/scripts/pipeline-state.cjs final --stdin|--file <path>",
      "",
    ].join("\n")
  );
}

function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "status") {
    const state = engine.loadPipelineState();
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }

  if (command === "reset") {
    const state = engine.resetPipelineState();
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }

  const payload = readInput(args);
  if (!payload) {
    throw new Error("Nenhum payload informado. Use --stdin ou --file.");
  }

  if (command === "init") {
    const decision = engine.parseYamlDecisionBlock(payload);
    if (!decision || !engine.isDecisionValid(decision)) {
      throw new Error("ORCHESTRATOR_DECISION invalido ou ausente.");
    }
    const state = engine.initializePipelineState(decision, { autoPersist: true });
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }

  if (command === "checkpoint") {
    const checkpoint = engine.parsePipelineCheckpoint(payload);
    if (!checkpoint) {
      throw new Error("PIPELINE_CHECKPOINT ausente.");
    }
    const state = engine.loadPipelineState();
    const nextState = engine.applyCheckpointToState(state, checkpoint);
    engine.savePipelineState(nextState);
    process.stdout.write(`${JSON.stringify(nextState, null, 2)}\n`);
    return;
  }

  if (command === "final") {
    const finalResult = engine.parseFinalValidatorResult(payload);
    if (!finalResult) {
      throw new Error("FINAL_VALIDATOR_RESULT ausente.");
    }
    const state = engine.loadPipelineState();
    const nextState = engine.applyFinalValidatorResult(state, finalResult);
    engine.savePipelineState(nextState);
    process.stdout.write(`${JSON.stringify(nextState, null, 2)}\n`);
    return;
  }

  throw new Error(`Comando nao suportado: ${command}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
