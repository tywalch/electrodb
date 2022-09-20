/* istanbul ignore file */
import { Entity, EntityItem, QueryResponse, CreateEntityItem } from "../../../../";
import { table, client } from '../config';

export const office = new Entity({
	"model": {
		"entity": "office",
		"version": "1",
		"service": "taskmanager"
	},
	"attributes": {
		"office": {
			"type": "string"
		},
		"country": {
			"type": "string"
		},
		"state": {
			"type": "string"
		},
		"city": {
			"type": "string"
		},
		"zip": {
			"type": "string"
		},
		"address": {
			"type": "string"
		}
	},
	"indexes": {
		"locations": {
			"pk": {
				"field": "pk",
				"composite": ["country", "state"]
			},
			"sk": {
				"field": "sk",
				"composite": ["city", "zip", "office"]
			}
		},
		"office": {
			"index": "gsi1pk-gsi1sk-index",
			"collection": "workplaces",
			"pk": {
				"field": "gsi1pk",
				"composite": ["office"]
			},
			"sk": {
				"field": "gsi1sk",
				"composite": []
			}
		}
	}
}, { table, client });

export type OfficeItem = EntityItem<typeof office>;
export type CreateOfficeItem = CreateEntityItem<typeof office>;
export type OfficeQueryResponse = QueryResponse<typeof office>;