#!/usr/bin/env node
/**
 * Guards against reintroducing the obsolete client-side AI provider layer.
 *
 * History: this exact file set was deleted in commit 4656570 because AI
 * chat is handled exclusively by the backend's AiOrchestratorService (see
 * backend/src/ai/orchestrator.service.ts) - the frontend only ever talks to
 * POST /ai/messages and POST /ai/messages/stream (see
 * src/features/ai/chat-service.ts). It was then accidentally reintroduced
 * by a later commit that copied an old project snapshot over the repo,
 * breaking the Vercel build with the exact same "Property 'auto' is
 * missing" TypeScript error that had already been fixed once.
 *
 * Rather than rely on that surfacing correctly through TypeScript (which
 * gives a confusing, indirect error message and only catches it if the
 * type happens to conflict), this runs as an explicit first step of every
 * build and fails immediately with a clear, specific explanation if any of
 * these paths ever reappear.
 *
 * If AI provider logic is EVER intentionally needed on the client again,
 * update this list deliberately as part of that architectural decision -
 * don't just delete this check.
 */
const fs = require("node:fs");
const path = require("node:path");

const FORBIDDEN_PATHS = [
  "src/features/ai/providers/types.ts",
  "src/features/ai/providers/registry.ts",
  "src/features/ai/providers/demo.ts",
  "src/features/ai/providers/openai.ts",
  "src/features/ai/providers/anthropic.ts",
  "src/features/ai/providers/gemini.ts",
  "src/features/ai/providers/ollama.ts",
  "src/features/ai/providers/stream-utils.ts",
  "src/features/ai/action-protocol.ts",
  "src/features/ai/tools/registry.ts",
  "src/features/ai/tools/conversations-tools.ts",
];

const repoRoot = path.resolve(__dirname, "..");
const found = FORBIDDEN_PATHS.filter((p) => fs.existsSync(path.join(repoRoot, p)));

if (found.length > 0) {
  console.error("\n" + "=".repeat(78));
  console.error("BUILD BLOCKED: obsolete client-side AI provider layer has been reintroduced.");
  console.error("=".repeat(78));
  console.error("\nThe following file(s) should not exist - AI chat is handled exclusively");
  console.error('by the backend\'s AiOrchestratorService, not by any client-side provider:\n');
  found.forEach((p) => console.error(`  - ${p}`));
  console.error(
    "\nThese were deleted in commit 4656570 (\"fix(ai): remove orphaned client-side\n" +
      "AI provider layer\") and again in d8c6263 after being accidentally\n" +
      "reintroduced. If you're seeing this, something copied an old project\n" +
      "snapshot back over this repository.\n" +
      "\n" +
      "Fix: delete the file(s) above. Verify nothing imports them first:\n" +
      "  grep -rn \"features/ai/providers\\|features/ai/action-protocol\\|features/ai/tools/registry\\|features/ai/tools/conversations-tools\" src\n" +
      "(it should print nothing outside the files themselves - chat-service.ts\n" +
      "only calls POST /ai/messages and POST /ai/messages/stream).\n",
  );
  console.error("=".repeat(78) + "\n");
  process.exit(1);
}

process.exit(0);
