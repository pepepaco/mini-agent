# 🤖 Agent Chat

A no-JavaScript chat interface that gives an LLM real shell access on your machine. Built as a single Node.js file using a VIEWSTATE pattern — all state lives in the form, no database, no sessions.

## Features

- **Agentic shell loop** — the model runs shell commands (sh on Unix, PowerShell on Windows) and chains multiple calls until it resolves your request
- **Collapsible tool output** — shell calls and results are collapsed by default in the UI; errors open automatically
- **File & image serving** — the model copies files to `./assets/` served at `/assets/filename`; images render inline as thumbnails
- **Self-updating system prompt** — the model calls `update_prompt` to permanently modify its own instructions; stored across multiple cookies (~38KB max)
- **No JavaScript** — entire UI is server-rendered HTML forms; zero client-side JS
- **OpenAI-compatible** — works with any `/v1/chat/completions` API (OpenAI, Azure OpenAI, LM Studio, Ollama, etc.)
- **Encrypted state** — conversation and config are AES-256 encrypted in the VIEWSTATE field and in cookies
- **Compress** — summarize the conversation history into bullet points, keeping only the last exchange intact
- **Single file** — the entire server is `agent.js`

## Structure

```
agents/
├── agent.js        # the entire server
├── package.json
└── assets/         # auto-created on first run; served at /assets/*
```

## Setup

```bash
npm install
node agent.js
```

Open `http://localhost:3000`

## Configuration

Click ⚙️ in the header to open settings:

| Field | Description |
|---|---|
| Base URL | API endpoint (default: `https://api.openai.com/v1`) |
| API Key | Your API key (stored encrypted in cookies) |
| Model | Model name (default: `gpt-4.1`) |
| Shell 🐚 | Toggle shell execution on/off |
| Max turns | Maximum tool calls per message (default: 10) |
| System prompt | Full system prompt — editable by user and by the model itself |

Settings persist across sessions in encrypted cookies split across `chat_config_v1_0`, `chat_config_v1_1`, etc. To reset to defaults, clear all `chat_config_v1_*` cookies from your browser.

## Tools available to the model

### `run_shell`
Executes a shell command on the host machine. On Unix uses `/bin/sh`, on Windows uses PowerShell. The model uses this to read files, run scripts, install packages, query system info, and copy files to `./assets/`.

### `update_prompt`
Updates the system prompt in place. The model is instructed to preserve existing sections and only add or edit the relevant part. The updated prompt is validated for size before saving — if the encoded config exceeds ~38KB across all cookies, the model receives an error and must rewrite more concisely.

## Assets

The `./assets/` folder is created automatically on startup and served statically at `/assets/*`. The model can:

- Copy any file there via shell: `cp /path/to/file.jpg ./assets/`
- Embed images in its reply: `![description](/assets/file.jpg)`
- Offer file downloads: `[download](/assets/file.pdf)`

## UI

| Button | Action |
|---|---|
| **Send** | Send message; agentic loop runs until model gives a final reply |
| **Compress** | Summarize conversation history into bullets, keeping last Q&A |
| **Save** | Download the current chat as a standalone HTML file |
| **Refresh Title** | Ask the model to generate a short emoji title for the chat |
| **New chat** | Open a new chat in a new tab (inherits config) |
| **⚙️** | Toggle the settings panel |

Shell calls are shown inline as collapsible `<details>` elements, color-coded by type:

- 🟡 Yellow — command (collapsed, summary shows the command or reason)
- 🟢 Green — stdout output (collapsed, summary shows first line)
- 🔴 Red — error / non-zero exit (open by default so errors are visible)

## Compatibility

Works with any OpenAI-compatible API. For Azure OpenAI set the Base URL to your Azure endpoint — the `api-key` header is used automatically when the URL contains `openai.azure.com`.

## Security

> ⚠️ This app executes shell commands on the host machine as the user running the Node process. Only run it on localhost or trusted networks. Never expose port 3000 publicly.

The encryption key in `agent.js` is hardcoded — change it before deploying anywhere beyond your local machine. Avoid storing sensitive credentials (API keys, tokens) in the system prompt since they will be visible in the ⚙️ settings panel.

## Dependencies

```json
{
  "express": "^4.18.2",
  "cookie-parser": "^1.4.6",
  "marked": "^12.0.0"
}
```

All other modules (`crypto`, `child_process`, `os`, `fs`) are built into Node.js.