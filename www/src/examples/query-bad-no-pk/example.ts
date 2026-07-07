import { StoreLocations } from "./entity";

// @ts-expect-error - the `stores` access pattern requires at least the PK composite attributes
await StoreLocations.query.stores().go();
