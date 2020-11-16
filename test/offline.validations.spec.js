const { model } = require("../src/validations");
const { Entity } = require("../src/entity");
const { expect } = require("chai");
describe("invalid models", () => {
	it("should throw on incorrect attribute signatures", () => {
		let record = {
			service: "testservice",
			entity: "testentity",
			table: "electro",
			version: "1",
			attributes: {
				prop1: {
					type: 1,
					field: 2,
					label: 3,
					readOnly: "not_bool",
					required: "also_not_bool",
					cast: 4,
					default: 5,
					validate: "not_fn_or_regexp",
					get: "not_fn",
					set: "also_not_fn",
				},
			},
			indexes: {
				main: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
				},
			},
		};
		expect(() => model(record)).to.throw(
			"instance.attributes.prop1.type is not of a type(s) string,array, instance.attributes.prop1.field is not of a type(s) string, instance.attributes.prop1.label is not of a type(s) string, instance.attributes.prop1.readOnly is not of a type(s) boolean, instance.attributes.prop1.required is not of a type(s) boolean, instance.attributes.prop1.cast is not of a type(s) string, instance.attributes.prop1.cast is not one of enum values: string,number, instance.attributes.prop1.default must be either a function or string, instance.attributes.prop1.validate must be either a function or Regexp, instance.attributes.prop1.get must be a function, instance.attributes.prop1.set must be a function",
		);
	});
	it("should not allow facets to be used more than once in one index", () => {
		const schema = {
			service: "MallStoreDirectory",
			entity: "MallStores",
			table: "StoreDirectory",
			version: "1",
			attributes: {
				id: {
					type: "string",
					field: "storeLocationId",
				},
				date: {
					type: "string",
					field: "dateTime",
				},
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
			},
			indexes: {
				record: {
					pk: {
						field: "pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "sk",
						facets: ["date", "prop2", "id", "prop3"],
					},
				},
			},
		};
		expect(() => new Entity(schema)).to.throw("The Access Pattern 'record' contains duplicate references the facet(s): 'id', 'prop3'. Facet attributes can only be used once within an index. If this leaves the Sort Key (sk) without any facets simply set this to be an empty array. - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-facets")
	});

	it("should not allow index fields to be used more than once in across indexes: duplicate pk", () => {
		const schema = {
			service: "MallStoreDirectory",
			entity: "MallStores",
			table: "StoreDirectory",
			version: "1",
			attributes: {
				id: {
					type: "string",
					field: "storeLocationId",
				},
				date: {
					type: "string",
					field: "dateTime",
				},
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
			},
			indexes: {
				record: {
					pk: {
						field: "pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "sk",
						facets: ["date", "prop2"],
					},
				},
				record2: {
					index: "gsi1",
					pk: {
						field: "pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "gsi1sk",
						facets: ["date", "prop2"],
					},
				},
			},
		};
		expect(() => new Entity(schema)).to.throw("Partition Key (pk) on Access Pattern 'record2' references the field 'pk' which is already referenced by the Access Pattern 'record'. Fields used for indexes need to be unique to avoid conflicts. - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-fields")
	});

	it("should not allow index fields to be used more than once in across indexes: duplicate sk", () => {
		const schema = {
			service: "MallStoreDirectory",
			entity: "MallStores",
			table: "StoreDirectory",
			version: "1",
			attributes: {
				id: {
					type: "string",
					field: "storeLocationId",
				},
				date: {
					type: "string",
					field: "dateTime",
				},
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
			},
			indexes: {
				record: {
					pk: {
						field: "pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "sk",
						facets: ["date", "prop2"],
					},
				},
				record2: {
					index: "gsi1",
					pk: {
						field: "gsi1pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "sk",
						facets: ["date", "prop2"],
					},
				},
			},
		};
		expect(() => new Entity(schema)).to.throw("Sort Key (sk) on Access Pattern 'record2' references the field 'gsi1pk' which is already referenced by the Access Pattern 'record2'. Fields used for indexes need to be unique to avoid conflicts. - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-fields")
	});

	it("should not allow index fields to be used more than once in across indexes: duplicate pk/sk", () => {
		const schema = {
			service: "MallStoreDirectory",
			entity: "MallStores",
			table: "StoreDirectory",
			version: "1",
			attributes: {
				id: {
					type: "string",
					field: "storeLocationId",
				},
				date: {
					type: "string",
					field: "dateTime",
				},
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
			},
			indexes: {
				record: {
					pk: {
						field: "pk",
						facets: ["id", "prop3"]
					},
					sk: {
						field: "pk",
						facets: ["date", "prop2"],
					},
				},
			},
		};
		expect(() => new Entity(schema)).to.throw("The Access Pattern 'record' references the field 'pk' as the field name for both the PK and SK. Fields used for indexes need to be unique to avoid conflicts. - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-fields")
	});
});
