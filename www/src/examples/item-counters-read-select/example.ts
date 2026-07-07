import { AccountService } from "./service";
import { User } from "./entities";

type Cursor = string | null;

type QueryResponse = {
  cursor: Cursor;
  data: unknown;
};

type CountQueryResponse = {
  cursor: Cursor;
  data: { count: number };
};

type CountFnOptions = {
  next: Cursor;
};

type CountFn = (options: CountFnOptions) => Promise<CountQueryResponse>;

function toCountFnResponse(resp: QueryResponse): CountQueryResponse {
  const { cursor } = resp;

  const data = { count: 0 };
  if (
    typeof resp.data === "object" &&
    resp.data !== null &&
    "Count" in resp.data &&
    typeof resp.data.Count === "number"
  ) {
    data.count = resp.data.Count;
  }

  return {
    cursor,
    data,
  };
}

type PaginateCountQueryOptions = {
  countFn: CountFn;
};

// this function exists to demonstrate how you might implement some indirection to accomplish this task in a generic way
async function paginateCountQuery(options: PaginateCountQueryOptions) {
  const { countFn } = options;
  let count = 0;
  let next: Cursor = null;
  do {
    const { cursor, data } = await countFn({ next });
    count += data.count;
    next = cursor;
  } while (next);

  return count;
}

type CreateCountFnOptions = {
  accountId: string;
};

// count collection query
function createMembersCountFn(options: CreateCountFnOptions): CountFn {
  const { accountId } = options;
  return ({ next }) => {
    return AccountService.collections
      .members({ accountId })
      .go({
        // `raw` allows you return the unprocess results directly from DynamoDB (escape hatch)
        data: "raw",
        // paginate through the results using the cursor
        cursor: next,
        // `params` allows you to append additional parameters to the DynamoDB query (escape hatch)
        params: { Select: "COUNT" },
        // transform results
      })
      .then(toCountFnResponse);
  };
}

// count entity query
function createUsersCountFn(options: CreateCountFnOptions): CountFn {
  const { accountId } = options;
  return async ({ next }) => {
    return User.query
      .account({ accountId })
      .go({
        // `raw` allows you return the unprocess results directly from DynamoDB (escape hatch)
        data: "raw",
        // paginate through the results using the cursor
        cursor: next,
        // `params` allows you to append additional parameters to the DynamoDB query (escape hatch)
        params: { Select: "COUNT" },
        // transform results
      })
      .then(toCountFnResponse);
  };
}

function createUsersScanCountFn(options: CreateCountFnOptions): CountFn {
  const { accountId } = options;
  return async ({ next }) => {
    return User.scan
      .where((attr, op) => op.eq(attr.accountId, accountId))
      .go({
        // `raw` allows you return the unprocess results directly from DynamoDB (escape hatch)
        data: "raw",
        // paginate through the results using the cursor
        cursor: next,
        // `params` allows you to append additional parameters to the DynamoDB query (escape hatch)
        params: { Select: "COUNT" },
        // transform results
      })
      .then(toCountFnResponse);
  };
}

(async function main() {
  const accountId = "1234";

  const membersCount = await paginateCountQuery({
    countFn: createMembersCountFn({ accountId }),
  });

  const usersCount = await paginateCountQuery({
    countFn: createUsersCountFn({ accountId }),
  });

  const usersScanCount = await paginateCountQuery({
    countFn: createUsersScanCountFn({ accountId }),
  });
})().catch(console.error);
