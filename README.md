# 🤖 Agent Chat

A no-JavaScript chat interface that gives an LLM real shell access on your machine. Built as a single Node.js file using a VIEWSTATE pattern — all state lives in the form, no database, no sessions.

## Features

- **Agentic shell loop** — the model runs shell commands (`sh` on Unix, PowerShell on Windows) and chains multiple calls until it resolves your request
- **MCP server support** — connect any MCP-over-HTTP server (search, files, databases, etc.); tools are passed automatically on every API call
- **Collapsible tool output** — shell calls and results are collapsed by default; errors open automatically
- **File & image serving** — the model copies files to `./assets/` served at `/assets/filename`; images render inline as thumbnails
- **Self-updating system prompt** — the model calls `update_prompt` to permanently modify its own instructions; stored across multiple cookies (~38 KB max)
- **Cookie budget meter** — the settings panel shows a live progress bar of cookie storage used vs. available, so you never silently run out of space
- **No JavaScript** — entire UI is server-rendered HTML forms; minimal client JS only for scroll position
- **OpenAI-compatible** — works with any `/v1/chat/completions` API (OpenAI, Azure OpenAI, Anthropic, LM Studio, Ollama, etc.)
- **Encrypted state** — conversation and config are AES-256 encrypted in the VIEWSTATE field and in cookies
- **Compress** — summarize conversation history into bullet points, keeping only the last exchange intact
- **Single file** — the entire server is one JS file (~15 KB)
- **Terminal UI** — dark monospace interface, no external CSS dependencies

## Structure

```
agents/
├── chat.js         # the entire server
├── package.json
└── assets/         # auto-created on first run; served at /assets/*
```

## Setup

```bash
npm install
node chat.js
```

Open `http://localhost:3001`

## Configuration

Click ⚙ in the header to open settings:

| Field | Description |
|---|---|
| Base URL | API endpoint (default: `https://api.openai.com/v1`) |
| API Key | Your API key (stored encrypted in cookies) |
| Model | Model name (default: `gpt-4.1`) |
| Shell 🐚 | Toggle shell execution on/off |
| Max turns | Maximum tool calls per message (default: 10) |
| System prompt | Full system prompt — editable by user and by the model itself |
| 🔌 MCP Servers | List of MCP-over-HTTP servers to attach on every API call |

Settings persist across sessions in encrypted cookies. To reset to defaults, clear all `c1_*` cookies from your browser.

### Cookie storage budget

The settings panel shows a live meter:

```
🍪 4,821 / 38,000 bytes (12%) — 33,179 free
```

The bar turns orange above 70% and red above 90%. If you try to save a config that exceeds the budget, a warning appears in chat instead of silently failing.

## MCP Servers

MCP (Model Context Protocol) servers expose additional tools to the model — web search, file systems, databases, calendar access, and more. Any server that speaks the MCP-over-HTTP protocol works here.

### Adding an MCP server

1. Open ⚙ settings
2. In the **🔌 MCP** section, fill in a row:
   - **Name** — a short label (e.g. `brave-search`, `filesystem`)
   - **URL** — the full server URL (e.g. `https://mcp.brave.com/sse`)
   - **Token** — Bearer token if the server requires authentication (optional)
3. Click **save**

Each server is passed as an entry in `mcp_servers` on every API call:

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://mcp.brave.com/sse",
      "name": "brave-search",
      "headers": { "Authorization": "Bearer sk-..." }
    }
  ]
}
```

The model sees the MCP tools automatically alongside `run_shell` and `update_prompt`. No changes to the system prompt are needed.

### Does the system prompt need to mention MCP?

No. MCP tools are injected at the API level. The model discovers them from the tool definitions returned by the server, not from the system prompt. You can optionally add a note to the system prompt (e.g. *"You have access to a web search tool via Brave Search"*) if you want to guide the model's behavior, but it is not required.

### MCP server examples

| Name | URL | Notes |
|---|---|---|
| Brave Search | `https://mcp.brave.com/sse` | Requires Brave Search API key |
| Filesystem | `http://localhost:3100/sse` | Run `npx @modelcontextprotocol/server-filesystem` locally |
| Fetch / browser | `http://localhost:3200/sse` | Run `npx @modelcontextprotocol/server-fetch` locally |
| Any custom server | `https://yourserver.com/mcp` | Any MCP-over-HTTP implementation |

> **Note:** MCP server support depends on your API provider passing `mcp_servers` through to the model. It works natively with the Anthropic API and with OpenAI-compatible providers that support it. If your provider ignores the field, the servers are silently skipped.

### Storage cost

Each MCP entry (name + URL + optional token) is stored encrypted in cookies as part of the config. A typical entry costs roughly 100–200 bytes of your 38 KB cookie budget. The budget meter updates live so you can see the impact.

## Tools available to the model

### `run_shell`
Executes a shell command on the host machine. On Unix uses `/bin/sh`, on Windows uses PowerShell. The model uses this to read files, run scripts, install packages, query system info, and copy files to `./assets/`.

### `update_prompt`
Updates the system prompt in place. The model preserves existing sections and only adds or edits the relevant part. The updated prompt is validated against the cookie budget before saving — if the encoded config exceeds ~38 KB, the model receives an error and must rewrite more concisely.

### MCP tools (dynamic)
Any tools exposed by connected MCP servers are available alongside the built-in tools above. Their names and descriptions come from the MCP server itself.

## Assets

The `./assets/` folder is created automatically on startup and served statically at `/assets/*`. The model can:

- Copy any file there via shell: `cp /path/to/file.jpg ./assets/`
- Embed images in its reply: `![description](/assets/file.jpg)`
- Offer file downloads: `[download](/assets/file.pdf)`

## UI

| Button | Action |
|---|---|
| **→** | Send message; agentic loop runs until the model gives a final reply |
| **compress** | Summarize conversation history into bullets, keeping last Q&A |
| **save** | Download the current chat as a standalone HTML file |
| **title** | Ask the model to generate a short emoji title for the chat |
| **new** | Open a new chat in a new tab (inherits config) |
| **⚙** | Toggle the settings panel |

Shell calls are shown inline as collapsible `<details>` elements, color-coded:

- 🟢 Green left border — command being run (collapsed; summary shows command or reason)
- 🔵 Blue left border — stdout output (collapsed; summary shows first line)
- 🔴 Red left border — error / non-zero exit (open by default so errors are visible)

## Compatibility

Works with any OpenAI-compatible API. For Azure OpenAI, set the Base URL to your Azure endpoint — the `api-key` header is used automatically when the URL contains `openai.azure.com`.

## Security

> ⚠️ This app executes shell commands on the host machine as the user running the Node process. Only run it on localhost or trusted networks. Never expose port 3001 publicly.

The encryption key in `chat.js` is hardcoded — change it before deploying anywhere beyond your local machine. Avoid storing sensitive credentials in the system prompt since they will be visible in the ⚙ settings panel. MCP server tokens are stored encrypted in cookies but are visible in the settings panel in plaintext.

## Dependencies

```json
{
  "express": "^4.18.2",
  "cookie-parser": "^1.4.6",
  "marked": "^12.0.0"
}
```

All other modules (`crypto`, `child_process`, `os`, `fs`) are built into Node.js.
