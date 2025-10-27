
## About

- MCP SERVER where allow you chat with your database(Postgresql) using AI
- You can deploy this MCP server as a remote MCP server using Cloudflare Workers
- This is production ready MCP

## Key features

- List the tables of your database
- Query the tables of your database
- Execute write operations like INSERT/UPDATE/DELETE (privileged users only)
- Create queries and saved to execute later. PS: you can create queries with parameters
and save the queries to execute later.
- All operations sent to Cloudflare Workers will check the api-key sent in the header

## Folder structure

```
- src/
  - database/      // Database connection and utils
  - tools/         // Tools implementation
  - repositories/  // Repositories implementation
```

## Transport Protocols

This MCP server supports both modern and legacy transport protocols:

- **`/mcp` - Streamable HTTP** (recommended): Uses a single endpoint with bidirectional communication, automatic connection upgrades, and better resilience for network interruptions
- **`/sse` - Server-Sent Events** (legacy): Uses separate endpoints for requests/responses, maintained for backward compatibility

For new implementations, use the `/mcp` endpoint as it provides better performance and reliability.

## Prerequisites

- Node.js installed on your machine
- A Cloudflare account (free tier works)
- A PostgreSQL database (local or hosted)

### Step 1: Install Wrangler CLI

Install Wrangler globally to manage your Cloudflare Workers:

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

Log in to your Cloudflare account:

```bash
wrangler login
```

This will open a browser window where you can authenticate with your Cloudflare account.

### Step 3: Clone and Install dependencies

Clone the repo directly & install dependencies: `pnpm install`.

## Environment Variables Setup

Before running the MCP server, you need to configure several environment variables for authentication and database access.

### Create Environment Variables File

1. **Create your `.dev.vars` file** from the example:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **Configure all required environment variables** in `.dev.vars`:
   ```
   ACCESS_TOKEN=random_value_to_use_as_api_key
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   ```

### Database setup

- To save the queries to execute later you will need execute the SQL script on your database. PS: you need to execute the script named **instructions.sql** only once.

### Run the server locally

   ```bash
   wrangler dev
   ```
   This makes the server available at `http://localhost:8792`

## Production Deployment

#### Deploy
Deploy the MCP server to make it available on your workers.dev domain

```bash
wrangler deploy
```

### Access the remote MCP server from Kilo Code and Vscode

You can access the remote MCP server from Kilo Code and Vscode using the following configuration:

```
// Kilocode MCP
{
  "mcpServers": {
    "direct-database-mcp-server-prod": {
      "url": "url_cloudflare_workers_generated_after_deployed/sse",
      "headers": {
        "api-key": "Bearer same_value_of_ACCESS_TOKEN"
      }
    }
  }
}
// Vscode MCP
{
  "servers": {
    "direct-database-mcp-server-prod": {
      "url": "https://my-mcp-server.tiagorosadacost.workers.dev/sse",
      "headers": {
        "api-key": "Bearer 701cdccb-e605-423f-a778-66ed0698117f"
      }
    }
  }
}

```
