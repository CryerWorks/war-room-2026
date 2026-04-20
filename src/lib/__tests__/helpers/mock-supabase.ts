/**
 * Shared Supabase mock factory for integration tests.
 *
 * WHY A SHARED HELPER?
 * Every API route calls supabase.from("table").select().eq()... etc.
 * Supabase uses a builder pattern (method chaining), so we need a mock
 * that returns `this` for every chain method and resolves with data
 * at the terminal call (.single() or await).
 *
 * HOW IT WORKS:
 * You pass in a map of table names → row arrays. When the route calls
 * .from("goals"), the mock looks up "goals" in your map and filters
 * the rows as .eq()/.in()/.lt() calls are chained.
 *
 * TRACKING MUTATIONS:
 * Every .update() and .insert() call is recorded in _updateCalls and
 * _insertCalls so tests can assert "did the route write the right data?"
 */

export interface MockCall {
  table: string;
  data: any;
  filters: Record<string, any>;
}

export function createMockSupabase(tableData: Record<string, any[]> = {}) {
  const updateCalls: MockCall[] = [];
  const insertCalls: { table: string; data: any }[] = [];
  const deleteCalls: { table: string; filters: Record<string, any> }[] = [];

  function createBuilder(tableName: string) {
    let filteredData = [...(tableData[tableName] || [])];
    const filters: Record<string, any> = {};

    const builder: any = {
      select: () => builder,
      eq: (col: string, val: any) => {
        filters[col] = val;
        filteredData = filteredData.filter((row) => row[col] === val);
        return builder;
      },
      neq: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => row[col] !== val);
        return builder;
      },
      lt: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => row[col] < val);
        return builder;
      },
      gte: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => row[col] >= val);
        return builder;
      },
      lte: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => row[col] <= val);
        return builder;
      },
      in: (col: string, vals: any[]) => {
        filteredData = filteredData.filter((row) => vals.includes(row[col]));
        return builder;
      },
      is: (col: string, val: any) => {
        filteredData = filteredData.filter((row) => {
          const v = row[col];
          return val === null ? v === null || v === undefined : v === val;
        });
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      single: () => ({
        data: filteredData.length > 0 ? filteredData[0] : null,
        error: null,
      }),
      update: (data: any) => {
        updateCalls.push({ table: tableName, data, filters: { ...filters } });
        return builder;
      },
      insert: (data: any) => {
        insertCalls.push({ table: tableName, data });
        return builder;
      },
      delete: () => {
        deleteCalls.push({ table: tableName, filters: { ...filters } });
        return { eq: (col: string, val: any) => {
          deleteCalls[deleteCalls.length - 1].filters[col] = val;
          return { error: null };
        }, error: null };
      },
      // When awaited directly (no .single()), return the array
      then: (resolve: any) =>
        resolve({ data: filteredData, error: null }),
    };

    return builder;
  }

  const supabase = {
    from: (table: string) => createBuilder(table),
    auth: {
      getUser: () => ({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
    },
    _updateCalls: updateCalls,
    _insertCalls: insertCalls,
    _deleteCalls: deleteCalls,
  };

  return supabase as any;
}

/**
 * Create a mock NextRequest with a JSON body.
 *
 * WHY NOT just `new Request()`?
 * Next.js route handlers expect NextRequest, which extends Request
 * with extra methods. For our tests, a standard Request works because
 * we only use .json() and URL parsing — NextRequest is a superset.
 */
export function mockRequest(
  url: string,
  options: { method?: string; body?: any } = {}
) {
  const { method = "GET", body } = options;
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
