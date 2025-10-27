import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { hasTemplateParams, withDatabase } from "../database/utils";
import z from "zod";
import SavedQueriesRepository from "../repositories/saved-queries-repository";
import TableRepository from "../repositories/table-repository";


export function registerDatabaseTools(server: McpServer, env: Env, props: Props) {
  const savedQueryRepository = new SavedQueriesRepository(env)
  const tableRepository = new TableRepository(env)

  server.tool(
    "listTables",
    "Get a list of all tables in the database along with their column information. Use this first to understand the database structure before querying.",
    {},
    async () => {
      const tablesInfo = await tableRepository.listTables()

      return {
        content: [
          {
            type: "text",
            text: `**Database Tables and Schema**\n\n${JSON.stringify(tablesInfo, null, 2)}\n\n**Total tables found:** ${tablesInfo.length}\n\n**Note:** Use the \`queryDatabase\` tool to run SELECT queries, or \`executeDatabase\` tool for write operations (if you have write access).`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "ExecuteSelectQueryTable",
    {
      title: "Execute a SELECT query against the table in the PostgreSQL database.",
      description: "Execute a SELECT query against the table in the PostgreSQL database.",
      inputSchema: {
        table: z.string(),
        limitItems: z.number().optional().default(10),
      },
    },
    async ({ table, limitItems }) => {
      const results = await tableRepository.queryOnTable(table, limitItems)
      return {
        content: [
          {
            type: "text",
            text: `**Query Results**\n\`\`\`sql\n${JSON.stringify(results, null, 2)}\n`,
          },
        ],
      };
    }
  )

  server.registerTool(
    "GetRequiredFieldsTable",
    {
      title: "Get the required fields of a table in the PostgreSQL database.",
      description: "Get the required fields of a table in the PostgreSQL database.",
      inputSchema: {
        table: z.string(),
      },
    },
    async ({ table }) => {
      const results = await tableRepository.getRequiredFields(table)

      return {
        content: [
          {
            type: "text",
            text: `**Required Fields**\n\`\`\`sql\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n**Rows returned:** ${Array.isArray(results) ? results.length : 1}`,
          },
        ],
      };
    }
  )

  server.registerTool(
    "InsertDataOnTable",
    {
      title: "Insert data on a table in the PostgreSQL database.",
      description: "Insert data on a table in the PostgreSQL database.",
      inputSchema: {
        table: z.string(),
        data: z.any(),
      },
    },
    async ({ table, data }) => {
      await tableRepository.insertRegister(table, data)
      return {
        content: [
          {
            type: "text",
            text: `**Insert Data**\n\`\`\`sql\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n**Success**`,
          },
        ],
      };
    }
  )

  server.registerTool(
    "UpdateDataOnTable",
    {
      title: "Update data on a table in the PostgreSQL database.",
      description: "Update data on a table in the PostgreSQL database.",
      inputSchema: {
        table: z.string(),
        id: z.string(),
        columnId: z.string(),
        data: z.any(),
      },
    },
    async ({ table, id, columnId, data }) => {
      await tableRepository.updateRegister(table, columnId, id, data)

      return {
        content: [
          {
            type: "text",
            text: `**Update Data**\n\`\`\`sql\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n**Success**`,
          },
        ],
      };
    }
  )

  server.registerTool(
    "RemoveDataOnTable",
    {
      title: "Remove data on a table in the PostgreSQL database.",
      description: "Remove data on a table in the PostgreSQL database.",
      inputSchema: {
        table: z.string(),
        id: z.string(),
        columnId: z.string(),
      },
    },
    async ({ table, id, columnId }) => {
      return await withDatabase((env as any).DATABASE_URL, async (db) => {
        await tableRepository.deleteRegister(table, columnId, id);

        return {
          content: [
            {
              type: "text",
              text: `**Removed registers from table ${table} successfully**`,
            },
          ],
        };
      });
    }
  )

  server.registerTool(
    "SaveQueryDatabase",
    {
      title: "Save SQL query to run later.",
      description: "Save SQL query to run later.",
      inputSchema: {
        name: z.string(),
        sql: z.string()
      },
    },
    async ({ name, sql }) => {
      return await withDatabase((env as any).DATABASE_URL, async (db) => {
        try {
          if (!hasTemplateParams(sql)) {
            await db.unsafe(sql);
          }

          await savedQueryRepository.saveQuery(name, sql);
          return {
            content: [
              {
                type: "text",
                text: `**Query saved successfully**`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `**Error saving query**\n\`\`\`sql\n${sql}\n\`\`\`\n\n**Error:** ${(error as Error).message}`,
                isError: true,
              },
            ],
          }
        }
      });
    }
  )

  server.registerTool(
    "ExecuteSavedQueryDatabase",
    {
      title: "Execute saved SQL query.",
      inputSchema: {
        name: z.string(),
        data: z.any().optional(),
      },
    },
    async ({ name, data }) => {
      const savedQuery = await savedQueryRepository.getQuery(name);
      if (!savedQuery) {
        return {
          content: [
            {
              type: "text",
              text: `**Query named ${name} not found**`,
            },
          ],
        };
      }
      return await withDatabase((env as any).DATABASE_URL, async (db) => {
        if (hasTemplateParams(savedQuery.sql)) {
          Object.keys(data).forEach(key => {
            savedQuery.sql = savedQuery.sql.replace(`$${key}`, "'" + data[key] + "'");
          });
        }

        const results = await db.unsafe(savedQuery.sql);
        return {
          content: [
            {
              type: "text",
              text: `**Query Results**\n\`\`\`sql\n${savedQuery.sql}\n\`\`\`\n\n**Results:**\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\`\n\n**Rows returned:** ${Array.isArray(results) ? results.length : 1}`,
            },
          ],
        };
      });
    }
  )

  server.registerTool(
    "ListSavedQueriesDatabase",
    {
      title: "List saved SQL queries.",
      inputSchema: {},
    },
    async () => {
      const savedQueryies = await savedQueryRepository.listQueries();
      return {
        content: [
          {
            type: "text",
            text: `**Saved Queries:**\n\`\`\`json\n${JSON.stringify(savedQueryies, null, 2)}\n\`\`\`\n\n**Rows returned:** ${Array.isArray(savedQueryies) ? savedQueryies.length : 1}`,
          },
        ],
      };
    }
  )

}
