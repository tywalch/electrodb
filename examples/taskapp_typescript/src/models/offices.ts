const schema = {
	"model": {
		"entity": "offices",
		"version": "1",
		"service": "taskapp"
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
				"facets": ["country", "state"]
			},
			"sk": {
				"field": "sk",
				"facets": ["city", "zip", "office"]
			}
		},
		"office": {
			"index": "gsi1pk-gsi1sk-index",
			"collection": "workplaces",
			"pk": {
				"field": "gsi1pk",
				"facets": ["office"]
			},
			"sk": {
				"field": "gsi1sk",
				"facets": []
			}
		}
	}
} as const;

export default schema;