import { Entity, EntityRecord, ExecutionOptionCompare, Service } from "../../../index";
import { bool } from "aws-sdk/clients/signer";

const table = 'electro';

export const Attraction = new Entity({
  model: {
    entity: 'attraction',
    service: 'comparison',
    version: '1'
  },
  attributes: {
    name: {
      type: 'string'
    },
    country: {
      type: 'string'
    },
    state: {
      type: 'string'
    },
    county: {
      type: 'string'
    },
    city: {
      type: 'string'
    },
    zip: {
      type: 'string'
    }
  },
  indexes: {
    location: {
      pk: {
        field: 'pk',
        composite: ['country', 'state']
      },
      sk: {
        field: 'sk',
        composite: ['county', 'city', 'zip', 'name']
      }
    },
    clusteredLocation: {
      index: 'gsi1pk-gsi1sk-index',
      collection: ['clusteredRegion'],
      type: 'clustered',
      pk: {
        field: 'gsi1pk',
        composite: ['country', 'state']
      },
      sk: {
        field: 'gsi1sk',
        composite: ['county', 'city', 'zip', 'name']
      }
    },
    isolatedLocation: {
      index: 'gsi2pk-gsi2sk-index',
      collection: ['isolatedRegion'],
      type: 'isolated',
      pk: {
        field: 'gsi2pk',
        composite: ['country', 'state']
      },
      sk: {
        field: 'gsi2sk',
        composite: ['county', 'city', 'zip', 'name']
      }
    }
  }
}, { table });

export const AttractionService = new Service({ Attraction });

type Exhaustive<T extends string> = {
  [K in T]: K;
}

export type AttractionIndexes = keyof typeof Attraction['query'];

export const indexes: Exhaustive<AttractionIndexes> = {
  clusteredLocation: 'clusteredLocation',
  isolatedLocation: 'isolatedLocation',
  location: 'location',
}

export const indexTypes: Record<AttractionIndexes, 'clustered' | 'isolated'> = {
  clusteredLocation: 'clustered',
  isolatedLocation: 'isolated',
  location: 'isolated',
}

export const indexHasCollection: Record<AttractionIndexes, boolean> = {
  clusteredLocation: true,
  isolatedLocation: true,
  location: false,
}

type AttractionCollections = keyof typeof AttractionService['collections'];

export const collections: Exhaustive<AttractionCollections> = {
  clusteredRegion: 'clusteredRegion',
  isolatedRegion: 'isolatedRegion',
}

export const collectionTypes: Record<AttractionCollections, 'clustered' | 'isolated'> = {
  clusteredRegion: 'clustered',
  isolatedRegion: 'isolated',
}

export const comparisons: Exhaustive<ExecutionOptionCompare> = {
  attributes: 'attributes',
  keys: "keys",
  v2: 'v2',
};

export type Operators = "" | "gte" | "gt" | "lt" | "lte" | "between" | "begins";

export const operators: Exhaustive<Operators> = {
  "": "",
  gte: "gte",
  gt: "gt",
  lt: "lt",
  lte: "lte",
  between: "between",
  begins: "begins",
}

export const data: EntityRecord<typeof Attraction> = {
  country: 'USA',
  state: 'Wisconsin',
  county: 'Dane',
  city: 'Madison',
  zip: '53713',
  name: 'Veterans Memorial Coliseum',
}

export const {
  country,
  county,
  state,
  city,
  zip,
  name
} = data;

export const pks = new Set(['country', 'state']);
export const sks = new Set(['county', 'city', 'zip', 'name']);

export const operatorParts = {
  "": [{country, state, county, city}],
  gte: [{country, state}, {county, city}],
  gt: [{country, state}, {county, city}],
  lt: [{country, state}, {county, city}],
  lte: [{country, state}, {county, city}],
  between: [{country, state}, {county, city: 'Madison'}, {county, city: 'Marshall'}],
  begins: [{country, state}, {county, city}],
} as const;

export type OperatorParts = typeof operatorParts

export type ValuesOf<T> = {
  [K in keyof T]: T[K]
}[keyof T];

export type ConfigurationItem =
  {
    hasCollection: boolean;
    operator: Operators;
    parts: ValuesOf<OperatorParts>;
    type: 'clustered' | 'isolated';
    compare?: ExecutionOptionCompare;
  } & ({
  target: "Entity";
  index: AttractionIndexes;
} | {
  target: "Service";
  collection: AttractionCollections;
});