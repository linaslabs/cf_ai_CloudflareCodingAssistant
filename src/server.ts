import { routeAgentRequest } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
import { createWorkersAI } from "workers-ai-provider";
// import { env } from "cloudflare:workers";

// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };

    const workersai = createWorkersAI({ binding: this.env.AI });

    const model = workersai("@cf/meta/llama-3.2-3b-instruct");

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `You are a coding agent, you help the user with whatever coding problem they have,
          for example, given some code, understand what it is trying to accomplish from the user and try to optimise it as best as possible. 
          If the user does not provide code, help them in any other way you can with coding related tasks.
          Keep your responses concise and to the point, provide code snippets where possible and make sure your points are separated well. 
          Wherever you decide to make text bold, make sure the line before this text is an empty line to allow good separation of points.
          For any code snippets, use markdown formatting with the appropriate language tags.`,

          messages: convertToModelMessages(processedMessages),
          model,
          // tools: allTools,

          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          maxOutputTokens: 6000,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
