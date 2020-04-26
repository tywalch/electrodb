const { model } = require("../src/validations");
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
});
