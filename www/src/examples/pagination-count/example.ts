import { StoreLocations } from "./entity";

type GetLeasesOptions = {
  storeId: string;
  cursor?: string | null;
  limit: number;
};

async function getLeases(options: GetLeasesOptions) {
  const { storeId, cursor, limit } = options;

  if (limit < 1 || limit >= 200) {
    throw new Error("Limit must be at least 1 and at most 200");
  }

  return StoreLocations.query.leases({ storeId }).go({ cursor, count: limit });
}

await getLeases({ storeId: "LatteLarrys", cursor: null, limit: 10 });
