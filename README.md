# 🤖 Agent Chat

A zero-dependency, no-JavaScript chat interface that gives an LLM real shell access on your machine. Built as a single Node.js file using a VIEWSTATE pattern — all state lives in the form, no database, no sessions.

## Features

- **Agentic shell loop** — the model can run shell commands (sh on Unix, PowerShell on Windows) and chain multiple calls until it resolves your request
- **File & image serving** — the model copies files to `./assets/` and they are served at `/assets/filename`; images render inline as thumbnails in the chat
- **Self-updating system prompt** — the model can call `update_prompt` to permanently modify its own instructions when you ask it to remember something
- **No JavaScript** — the entire UI is server-rendered HTML forms; zero client-side JS
- **OpenAI-compatible** — works with any API that follows the OpenAI `/v1/chat/completions` spec (OpenAI, Azure OpenAI, local models via LM Studio, Ollama, etc.)
- **Encrypted state** — conversation and config are AES-256 encrypted in the VIEWSTATE hidden field and in cookies
- **Single file** — the entire server is `agent.js`, ~14 KB

## Structure

```
agents/
├── agent.js        # the entire server
├── package.json
└── assets/         # auto-created on first run; files here are served at /assets/*
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
| API Key | Your API key (stored encrypted in a cookie) |
| Model | Model name (default: `gpt-4.1`) |
| Shell 🐚 | Toggle shell execution on/off |
| Max turns | Maximum shell tool calls per message (default: 10) |
| System prompt | Full system prompt — editable by user and by the model itself |

Settings are saved in an encrypted cookie and persist across sessions. To reset to defaults, clear the `chat_config_v1` cookie from your browser.

## Tools available to the model

### `run_shell`
Executes a shell command on the host machine. On Unix uses `/bin/sh`, on Windows uses PowerShell. The model uses this to read files, run scripts, install packages, query system info, and copy files to `./assets/`.

### `update_prompt`
Replaces the system prompt with new content. The model calls this when you ask it to remember something permanently or change its behavior. The new prompt is saved to the config cookie immediately.

## Assets

The `./assets/` folder is created automatically on startup and served statically at `/assets/*`. The model knows it can:

- Copy any file there via shell: `cp /path/to/file.jpg ./assets/`
- Embed images in its reply: `![description](/assets/file.jpg)`
- Offer file downloads: `[download](/assets/file.pdf)`

## UI

| Button | Action |
|---|---|
| **Send** | Send message; shell loop runs until model gives a final reply |
| **Save** | Download the current chat as a standalone HTML file |
| **Refresh Title** | Ask the model to generate a short emoji title for the chat |
| **New chat** | Open a new chat in a new tab (inherits config) |
| **⚙️** | Toggle the settings panel |

Shell calls are shown inline in the conversation with color-coded badges:

- 🟡 Yellow — command executed
- 🟢 Green — stdout output
- 🔴 Red — command exited with non-zero code

## Compatibility

Works with any OpenAI-compatible API. To use with Azure OpenAI, set the Base URL to your Azure endpoint — the `api-key` header is used automatically when the URL contains `openai.azure.com`.

## Security

> ⚠️ This app executes shell commands on the host machine as the user running the Node process. Only run it on localhost or trusted networks. Never expose port 3000 publicly.

The encryption key in `agent.js` is hardcoded — change it before deploying anywhere beyond your local machine.

## Dependencies

```json
{
  "express": "^4.18.2",
  "cookie-parser": "^1.4.6",
  "marked": "^12.0.0"
}
```

All other modules (`crypto`, `child_process`, `os`, `fs`) are built into Node.js.
