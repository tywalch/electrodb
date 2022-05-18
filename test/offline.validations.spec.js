const { model } = require("../src/validations");
const { Entity } = require("../src/entity");
const { expect } = require("chai");
describe("Model Validation", () => {
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
			"instance requires property \"model\", instance.model is required, instance.attributes.prop1.type is not of a type(s) string,array, instance.attributes.prop1.field is not of a type(s) string, instance.attributes.prop1.label is not of a type(s) string, instance.attributes.prop1.readOnly is not of a type(s) boolean, instance.attributes.prop1.required is not of a type(s) boolean, instance.attributes.prop1.cast is not of a type(s) string, instance.attributes.prop1.cast is not one of enum values: string,number, instance.attributes.prop1.validate must be either a function or Regexp, instance.attributes.prop1.get must be a function, instance.attributes.prop1.set must be a function - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-model",
		);
	});
	it("should not allow composite attributes to be used more than once in one index", () => {
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
		expect(() => new Entity(schema)).to.throw(`The Access Pattern 'record' contains duplicate references the composite attribute(s): "id", "prop3". Composite attributes may only be used once within an index. If this leaves the Sort Key (sk) without any composite attributes simply set this to be an empty array. - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-composite-attributes`)
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
