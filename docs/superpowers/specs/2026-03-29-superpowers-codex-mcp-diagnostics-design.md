# Superpowers Codex MCP Diagnostics Integration

Add a small local MCP service dedicated to diagnosing the Superpowers Codex installation, and remove the bundle's implied promise of app-level external integration in this version.

## Motivation

The current Codex bundle already has strong workflow assets: skills, hooks, docs, and global pipeline enforcement. But one published integration surface is still effectively a placeholder:

- [`.mcp.json`](C:/Users/win/Codex-superpower/.mcp.json) exists but registers no MCP server

There is also an app-manifest-shaped surface in the repository, but app integration is not required for this version and should not be treated as part of the delivered feature set.

That creates an honesty gap. The repository looks more integrated than it really is. It also makes installation support harder than it needs to be, because the bundle has no official built-in diagnostic surface for checking whether its own skills, hooks, and config were wired correctly.

This design closes that gap with the smallest useful real integration:

1. publish a real local MCP service through `.mcp.json`
2. keep the MCP service read-only and diagnostic-focused
3. remove or stop advertising app-level external integration in this version
4. align docs and installation instructions with the new reality

## Goals

- Replace the empty MCP manifest stub with a real, coherent local registration
- Add a small local MCP service that can inspect the Superpowers Codex bundle and its installation state
- Make installation diagnostics part of the bundle itself rather than relying only on prose docs
- Keep the scope intentionally small, testable, and safe
- Preserve the existing Superpowers workflow and avoid turning this bundle into a general-purpose control plane

## Non-Goals

- App-level external integration in this version
- Automatic environment repair in this version
- Arbitrary shell execution through the MCP service
- Rewriting user config files without explicit future design
- Replacing the existing skills/hook workflow with MCP-driven behavior
- Building a large operational dashboard or full installer UI

## User-Facing Result

After this change, the bundle should feel more complete and more honest:

- the bundle can inspect whether its own installation is coherent
- users get one diagnostic entrypoint for "is Superpowers Codex set up correctly?"
- docs match the real published behavior
- the plugin no longer appears to offer app integration that it does not actually use

## Design

### 1. Real MCP Registration

[`.mcp.json`](C:/Users/win/Codex-superpower/.mcp.json) should register one local MCP server that lives inside this repository.

The registration should be explicit and local to the bundle. It should not depend on unpublished global files, and it should be possible to understand the wiring from the repository alone.

The MCP server should be implemented in a small bundle-local directory, with a minimal runtime surface and clear entrypoint.

### 2. No App Integration in This Version

App-level external integration is not part of this delivery.

That means the bundle should not ship an app integration promise as if it were active product behavior. The repository should either:

- stop advertising app integration through the plugin manifest wiring
- or keep the app surface inert and explicitly undocumented

For this version, the preferred direction is the more honest one: remove the advertised app integration surface from the plugin-facing contract if it is not being used.

### 3. MCP Scope: Read-Only Diagnostics Only

The MCP service should expose only read-only, diagnostic-focused tools in this version.

Proposed tools:

- `bundle_metadata`
  - returns the bundle's published identity, version, key paths, and supported capabilities
- `inspect_bundle`
  - checks for expected repository assets such as skills, hooks, manifests, docs, and key support files
- `inspect_installation`
  - checks whether the user environment appears wired to this bundle as expected
- `inspect_hooks`
  - checks whether the expected Codex hook files and references are present and coherent
- `inspect_config`
  - checks the expected config snippet shape and flags stale or contradictory settings
- `doctor`
  - produces one consolidated diagnostic report built from the other checks

Each tool should return structured, human-meaningful status rather than raw filesystem dumps.

### 4. Diagnostics Philosophy

The MCP should answer practical questions such as:

- "Is this bundle publishing a real diagnostic integration?"
- "Is the environment pointing at the expected Superpowers bundle?"
- "Are the expected hooks present?"
- "Does the documented config snippet match the actual intended configuration?"
- "What is missing or inconsistent right now?"

It should not mutate files. If something is wrong, it should report:

- what it checked
- what passed
- what failed
- what the user should do next

### 5. Installation and Docs Alignment

The following docs should be updated to reflect the real integrated bundle:

- [README.codex.md](C:/Users/win/Codex-superpower/docs/README.codex.md)
- [`.codex/INSTALL.md`](C:/Users/win/Codex-superpower/.codex/INSTALL.md)
- [hooks-snippet.toml](C:/Users/win/Codex-superpower/codex-global/config/hooks-snippet.toml)
- root [README.md](C:/Users/win/Codex-superpower/README.md) where it describes bundle surfaces and integration claims

These docs should clearly explain:

- that the bundle now includes a real diagnostic MCP
- what the MCP is for
- that the first version is read-only
- how the MCP relates to skills and hooks
- that app-level integration is not part of this version
- the expected config state for multi-agent support and hook wiring

The stale `collab` setting should be removed from the published snippet so the docs and config guidance no longer contradict the current Codex model.

## Architecture

### Repository Additions

The MCP implementation should live at a fixed bundle-local path:

- `scripts/mcp/superpowers-codex-diagnostics.mjs`

If one support module is needed for readability, it should live beside the entrypoint under the same directory. No broader MCP framework directory should be introduced in this version.

The implementation should stay small and purpose-built. The repository should make it obvious that this MCP belongs to the Superpowers Codex bundle itself.

### Data Sources

The MCP reads from:

- bundle-local manifests
- bundle-local docs
- bundle-local hooks
- expected global hook/config paths referenced by the bundle

It should avoid hidden coupling to unrelated user state whenever possible and degrade gracefully when expected files are absent.

## Testing Strategy

This work must follow TDD.

### Stage 1: Manifest and Documentation Tests

Write failing tests first for:

- `.mcp.json` no longer being an empty placeholder
- the MCP registration pointing to a real local entrypoint
- plugin-facing metadata no longer advertising unused app integration
- installation docs referencing the real integrated behavior
- removal of stale config guidance such as `collab = true`

### Stage 2: MCP Tool Tests

Write failing tests first for the behavior of:

- `bundle_metadata`
- `inspect_bundle`
- `inspect_installation`
- `inspect_hooks`
- `inspect_config`
- `doctor`

Tests should validate structured outputs and meaningful status reporting rather than incidental formatting.

### Stage 3: Integration Tests

Write failing tests first for:

- manifest-to-MCP coherence
- diagnostic coverage of the main installation gaps previously identified
- compatibility with the existing bundle layout
- absence of stale app-integration claims in published docs and plugin wiring

## Adversarial Review Strategy

Every stage should have its own adversarial review checkpoint.

### After Stage 1

Review questions:

- does the bundle promise only what it actually provides?
- did the docs become more honest and more coherent?
- is there still any placeholder or unused integration being published as if it were real?

### After Stage 2

Review questions:

- did the MCP remain narrowly scoped?
- are any tools too invasive for a first version?
- are any checks too brittle or too dependent on one machine layout?

### After Stage 3

Review questions:

- do the published docs, plugin manifest, and MCP agree with each other?
- can the bundle diagnose the important failures that motivated this work?
- did we accidentally create a maintenance burden larger than the value delivered?

## Multi-Agent Execution Plan

Implementation should be executed with coordination plus adversarial independence:

- one implementation stream for manifests/docs/wiring cleanup
- one implementation stream for the MCP service
- one separate adversarial reviewer per stage
- one coordinator to integrate changes, run tests, and decide whether a stage passes or loops back for fixes

Review agents must not be the same agents that implemented the stage they are evaluating.

## Success Criteria

This design succeeds when all of the following are true:

- `.mcp.json` is real and coherent
- the bundle exposes a functioning local read-only diagnostic MCP
- installation docs describe the integrated state accurately
- stale config guidance is removed
- the bundle no longer advertises app integration it does not use
- tests cover the MCP behavior and the main integration points
- the scope remains diagnostic and safe rather than expanding into automatic environment control

## What Does Not Change

- the existing Superpowers skill library remains the center of the workflow
- the global hook architecture remains in place
- pipeline enforcement remains separate from the new MCP
- this version does not automatically repair user environments
- this version does not add external app integration
- this version does not replace the current workflow with MCP-first behavior

## Scope Summary

This is a focused integration completion effort, not a new platform:

- one small local MCP service
- read-only diagnostics only
- docs and config alignment
- removal of unused app-integration promises
- TDD and adversarial review at every stage
