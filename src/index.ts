import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { Props } from "./types";
import { closeDb } from "./database/connection";
import { registerAllTools } from "./tools/register-tools";

export class MyMCP extends McpAgent<Env, Record<string, never>, Props> {
	server = new McpServer({
		name: "PostgreSQL Database MCP Server",
		version: "1.0.0",
	});

	/**
	 * Cleanup database connections when Durable Object is shutting down
	 */
	async cleanup(): Promise<void> {
		try {
			await closeDb();
			console.log('Database connections closed successfully');
		} catch (error) {
			console.error('Error during database cleanup:', error);
		}
	}

	/**
	 * Durable Objects alarm handler - used for cleanup
	 */
	async alarm(): Promise<void> {
		await this.cleanup();
	}

	async init() {
		registerAllTools(this.server, this.env, this.props);
	}
}

const hasAuthorization = (request: Request, env: Env) => {
	const token = request.headers.get("api-key");
	if (!token) {
		return false;
	}

	const accessToken = token.split(" ")[1];
	return accessToken === env.ACCESS_TOKEN;
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (!hasAuthorization(request, env)) {
			return new Response("Unauthorized", { status: 401 });
		}

		const headers: any = {}
		for (const [key, value] of request.headers.entries()) {
			headers[key] = value
		}

		ctx.props.headers = headers

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
