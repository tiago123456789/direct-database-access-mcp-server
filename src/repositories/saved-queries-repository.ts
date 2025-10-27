import { withDatabase } from "../database/utils";

class SavedQueriesRepository {

    constructor(private env: Env) { }

    async saveQuery(name: string, sql: string) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            await db.unsafe(`INSERT INTO saved_queries (name, sql) VALUES ('${name}', '${sql}');`);
        });
    }

    async getQuery(name: string) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const items = await db.unsafe(`SELECT sql FROM saved_queries WHERE name = '${name}';`);
            return items[0] || null;
        });
    }

    async listQueries() {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const items = await db.unsafe(`SELECT name FROM saved_queries;`);
            return items;
        });
    }
}

export default SavedQueriesRepository;
