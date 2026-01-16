#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

// Configuration
const API_URL = process.env.VIBES_API_URL || "https://vibes-api.fly.dev";
const MIN_HEARTBEAT_SECONDS = 60;
const HEARTBEAT_INTERVAL = Math.max(
  MIN_HEARTBEAT_SECONDS,
  parseInt(process.env.VIBES_HEARTBEAT_SECONDS || "60", 10)
) * 1000;

// Client ID storage
function getVibesDir(): string {
  return join(homedir(), ".vibes");
}

function loadOrCreateClientId(): string {
  const dir = getVibesDir();
  const file = join(dir, "client_id");

  if (existsSync(file)) {
    return readFileSync(file, "utf-8").trim();
  }

  // Create directory if needed
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate new client ID
  const clientId = randomUUID();
  writeFileSync(file, clientId);
  return clientId;
}

// Agent detection
function detectAgent(): string {
  if (process.env.CLAUDE_CODE) return "claude-code";
  if (process.env.OPENCODE) return "opencode";
  if (process.env.CURSOR_SESSION) return "cursor";
  if (process.env.WINDSURF) return "windsurf";

  // Check parent process name as fallback
  const parentPid = process.ppid;
  if (parentPid) {
    try {
      // This is a simple heuristic - may not work on all systems
      const ppidStr = String(parentPid);
      if (process.env._ && process.env._.includes("claude")) return "claude-code";
    } catch {
      // Ignore errors
    }
  }

  return "other";
}

// API client (exported for testing)
export interface Drop {
  m: string;
  t: string;
}

export interface VibesResponse {
  drops: Drop[];
  n: number;
  ok: boolean;
  w: number; // weekly drops count (global)
}

async function sendHeartbeat(clientId: string, agent: string): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ c: clientId, a: agent }),
    });
    const data = await res.json() as { n: number };
    return data.n;
  } catch {
    return 0;
  }
}

async function postVibes(
  clientId: string,
  agent: string,
  message?: string,
  limit: number = 5
): Promise<VibesResponse> {
  try {
    const res = await fetch(`${API_URL}/vibes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        agent: agent,
        message: message,
        limit: limit,
      }),
    });
    return await res.json() as VibesResponse;
  } catch {
    return { drops: [], n: 0, ok: false, w: 0 };
  }
}

// Format output for display (exported for testing)
export function formatOutput(response: VibesResponse, didPost: boolean): string {
  const lines: string[] = [];

  if (didPost && response.ok) {
    lines.push("📤 dropped\n");
  }

  // Subtract 1 to exclude self from count
  const others = Math.max(0, response.n - 1);

  // Build status line with optional weekly count
  let statusLine = others > 0
    ? `💭 ${others} other${others === 1 ? "" : "s"} vibing`
    : "💭 Quiet right now...";

  if (response.w > 0) {
    statusLine += ` · ${response.w} drop${response.w === 1 ? "" : "s"} this week`;
  }
  lines.push(statusLine + "\n");

  if (response.drops.length > 0) {
    for (const drop of response.drops) {
      // Right-align the time
      const msg = `"${drop.m}"`;
      const time = drop.t;
      const padding = Math.max(1, 45 - msg.length);
      lines.push(msg + " ".repeat(padding) + time);
    }
  } else {
    lines.push("\nDrop a vibe to start the conversation!");
  }

  return lines.join("\n");
}

// Main server
async function main() {
  const clientId = loadOrCreateClientId();
  const agent = detectAgent();

  // Start background heartbeat
  sendHeartbeat(clientId, agent); // Initial heartbeat
  setInterval(() => {
    sendHeartbeat(clientId, agent);
  }, HEARTBEAT_INTERVAL);

  // Create MCP server
  const server = new Server(
    {
      name: "vibes",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "vibes",
          description: "See/post vibes from devs coding right now",
          inputSchema: {
            type: "object" as const,
            properties: {
              message: {
                type: "string",
                description: "Share a thought (max 140 chars)",
              },
            },
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "vibes") {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const args = request.params.arguments as { message?: string } | undefined;
    const message = args?.message;

    const response = await postVibes(clientId, agent, message);
    const output = formatOutput(response, !!message);

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
