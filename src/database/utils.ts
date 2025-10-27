import postgres from "postgres";
import { getDb } from "./connection";

export async function withDatabase<T>(
	databaseUrl: string,
	operation: (db: postgres.Sql) => Promise<T>
): Promise<T> {
	const db = getDb(databaseUrl);
	const startTime = Date.now();
	try {
		const result = await operation(db);
		const duration = Date.now() - startTime;
		console.log(`Database operation completed successfully in ${duration}ms`);
		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		console.error(`Database operation failed after ${duration}ms:`, error);
		throw error;
	}
}

export function hasTemplateParams(sql: string): boolean {
	const regex = /\$([0-9A-Za-z]+)/gm;
	return regex.test(sql);
}
	