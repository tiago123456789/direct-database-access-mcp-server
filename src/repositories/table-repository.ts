import { withDatabase } from "../database/utils";

class TableRepository {
    constructor(private env: Env) { }

    async listTables() {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const columns = await db.unsafe(`
                                SELECT 
                                    table_name, 
                                    column_name, 
                                    data_type, 
                                    is_nullable,
                                    column_default
                                FROM information_schema.columns 
                                WHERE table_schema = 'public' 
                                ORDER BY table_name, ordinal_position
                            `);

            const tableMap = new Map();
            for (const col of columns) {
                if (!tableMap.has(col.table_name)) {
                    tableMap.set(col.table_name, {
                        name: col.table_name,
                        schema: "public",
                        columns: [],
                    });
                }
                tableMap.get(col.table_name).columns.push({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === "YES",
                    default: col.column_default,
                });
            }

            const tableInfo = Array.from(tableMap.values());
            return tableInfo;
        });
    }

    async queryOnTable(table: string, limitItems: number) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const sql = `SELECT * FROM ${table} LIMIT ${limitItems}`;
            const results = await db.unsafe(sql);
            return results;
        });
    }
    async getRequiredFields(table: string) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const sql = `
            SELECT *
              FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name   = '${table}'
               AND is_nullable = 'NO';`;
            const results = await db.unsafe(sql);

            return results;
        });
    }

    async insertRegister(table: string, data: any) {
        const values = Object.values(data).map(value => String(value).trim());
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            let sql = `
              INSERT INTO ${table}(${Object.keys(data).join(", ")})
              VALUES ('${values.join("','")}')
              RETURNING *;
            `

            await db.unsafe(sql);

        });
    }

    async updateRegister(table: string, columnId: string, id: string, data: any) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            const keys = Object.keys(data)
            const valuesToUpdate = keys.map(key => `${key} = '${data[key]}'`).join(", ")
            let sql = `
              UPDATE ${table}
              SET ${valuesToUpdate}
              WHERE ${columnId} = '${id}'
              RETURNING *;  
            `
            await db.unsafe(sql);
        });
    }
    async deleteRegister(table: string, columnId: string, id: string) {
        return await withDatabase((this.env as any).DATABASE_URL, async (db) => {
            await db.unsafe(`DELETE FROM ${table} WHERE ${columnId} = '${id}';`);
        });
    }
}

export default TableRepository;
