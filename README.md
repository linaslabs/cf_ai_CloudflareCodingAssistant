# Cloudflare Internship Application Assignment

## Description

An AI coding assistant (named Gizmo) based on the Cloudflare stack that reads and reviews any code inputs and code-related questions.

_This project was initiated using the Cloudflare `agents-starter` template and modified to function as a specialized coding assistant._

## Technologies Used

List the core technologies:

- **Frontend:** React, Vite (hosted via Cloudflare Pages infrastructure)
- **Backend:** Cloudflare Workers
- **State:** Cloudflare Agents SDK (with Durable Objects)
- **AI Model:** [`@cf/meta/llama-3.2-3b-instruct` via Cloudflare Workers AI]
- **Communication:** WebSockets (managed by Agents SDK)

## Instructions to run this project (locally)

### 1. Prerequisites

- Node.js and npm
- Wrangler CLI
- A Cloudflare account

### 2. Local Development

1.  **Clone the repository:**
    ```bash
    git clone <this-repo-url>
    cd <this-repo-name>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    ```
4.  Access the app by opening your browser to the port specified in the terminal output.

## Documentation

Template used: https://github.com/cloudflare/agents-starter

### Logical Flow:

- The user interacts with the frontend via the chat input.
- Messages are sent via WebSocket to a specific Cloudflare Agent instance (which is a Durable Object).
- The Agent class maintains the conversation state using built-in SDK features backed by Durable Object storage.
- The Agent calls the AI model (Workers AI Llama) via the AI SDK.
- The streamed response is sent back to the frontend via the WebSocket.
