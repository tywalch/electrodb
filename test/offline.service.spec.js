const { Service } = require("../src/service");
const { Entity } = require("../src/entity");
const { expect } = require("chai");

let modelOne = {
	entity: "entityOne",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionA",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionC",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionD",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let modelTwo = {
	entity: "entityTwo",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionE",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionF",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionG",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let modelThree = {
	entity: "entityThree",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionE",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionF",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionD",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let database = new Service({
	version: "1",
	table: "electro",
	service: "electrotest",
});

database.join(modelOne);
database.join(modelTwo);
database.join(modelThree);

describe("Service Offline", async () => {
	describe("TypeScript oriented constructor", () => {
		let modelOne = {
			model: {
				entity: "entityOne",
				service: "myservice",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
				prop4: {
					type: "string",
				},
				prop5: {
					type: "string",
				},
				prop6: {
					type: "string",
				},
				prop7: {
					type: "string",
				},
				prop8: {
					type: "string",
				},
				prop9: {
					type: "string",
				},
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				},
				index2: {
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
					index: "gsi1pk-gsi1sk-index",
				},
				index3: {
					pk: {
						field: "gsi2pk",
						facets: ["prop5"],
					},
					sk: {
						field: "gsi2sk",
						facets: ["prop6", "prop7"],
					},
					collection: "collectionC",
					index: "gsi2pk-gsi2sk-index",
				},
				index4: {
					pk: {
						field: "gsi3pk",
						facets: ["prop7"],
					},
					sk: {
						field: "gsi3sk",
						facets: ["prop8", "prop9"],
					},
					collection: "collectionD",
					index: "gsi3pk-gsi3sk-index",
				},
			},
		};

		let modelTwo = {
			model: {
				entity: "entityTwo",
				service: "myservice",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
				prop4: {
					type: "string",
				},
				prop5: {
					type: "string",
				},
				prop6: {
					type: "string",
				},
				prop7: {
					type: "string",
				},
				prop8: {
					type: "string",
				},
				prop9: {
					type: "string",
				},
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionE",
				},
				index2: {
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
					index: "gsi1pk-gsi1sk-index",
				},
				index3: {
					pk: {
						field: "gsi2pk",
						facets: ["prop5"],
					},
					sk: {
						field: "gsi2sk",
						facets: ["prop6", "prop7"],
					},
					collection: "collectionF",
					index: "gsi2pk-gsi2sk-index",
				},
				index4: {
					pk: {
						field: "gsi3pk",
						facets: ["prop7"],
					},
					sk: {
						field: "gsi3sk",
						facets: ["prop8", "prop9"],
					},
					collection: "collectionG",
					index: "gsi3pk-gsi3sk-index",
				},
			},
		};

		let modelThree = {
			model: {
				entity: "entityThree",
				service: "myservice",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
				prop4: {
					type: "string",
				},
				prop5: {
					type: "string",
				},
				prop6: {
					type: "string",
				},
				prop7: {
					type: "string",
				},
				prop8: {
					type: "string",
				},
				prop9: {
					type: "string",
				},
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionE",
				},
				index2: {
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
					index: "gsi1pk-gsi1sk-index",
				},
				index3: {
					pk: {
						field: "gsi2pk",
						facets: ["prop5"],
					},
					sk: {
						field: "gsi2sk",
						facets: ["prop6", "prop7"],
					},
					collection: "collectionF",
					index: "gsi2pk-gsi2sk-index",
				},
				index4: {
					pk: {
						field: "gsi3pk",
						facets: ["prop7"],
					},
					sk: {
						field: "gsi3sk",
						facets: ["prop8", "prop9"],
					},
					collection: "collectionD",
					index: "gsi3pk-gsi3sk-index",
				},
			},
		};
		let modelThreeV2 = {
			model: {
				entity: "entityThree",
				service: "myservice",
				version: "2"
			},
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
				prop4: {
					type: "string",
				},
				prop5: {
					type: "string",
				},
				prop6: {
					type: "string",
				},
				prop7: {
					type: "string",
				},
				prop8: {
					type: "string",
				},
				prop9: {
					type: "string",
				},
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionE",
				},
				index2: {
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
					index: "gsi1pk-gsi1sk-index",
				},
				index3: {
					pk: {
						field: "gsi2pk",
						facets: ["prop5"],
					},
					sk: {
						field: "gsi2sk",
						facets: ["prop6", "prop7"],
					},
					collection: "collectionF",
					index: "gsi2pk-gsi2sk-index",
				},
				index4: {
					pk: {
						field: "gsi3pk",
						facets: ["prop7"],
					},
					sk: {
						field: "gsi3sk",
						facets: ["prop8", "prop9"],
					},
					collection: "collectionD",
					index: "gsi3pk-gsi3sk-index",
				},
			},
		};
		it("Should take a map of Entities", () => {
			let entityMap = {
				modelOne: new Entity(modelOne),
				modelTwo: new Entity(modelTwo),
				modelThree: new Entity(modelThree),
				entityThreeV2: new Entity(modelThreeV2)
			};
			let service = new Service(entityMap);
			expect(service.entities.modelOne).to.equal(entityMap.modelOne);
			expect(service.entities.modelTwo).to.equal(entityMap.modelTwo);
			expect(service.entities.modelThree).to.equal(entityMap.modelThree);
			expect(service.entities.entityThreeV2).to.equal(entityMap.entityThreeV2);
		});
		it("Should allow Entities with different versions to be added", () => {
			let entityMap = {
				modelOne: new Entity(modelOne),
				modelTwo: new Entity(modelTwo),
				modelThree: new Entity(modelThree),
			};
			let service = new Service(entityMap);
			expect(service.entities.modelOne).to.equal(entityMap.modelOne);
			expect(service.entities.modelTwo).to.equal(entityMap.modelTwo);
			expect(service.entities.modelThree).to.equal(entityMap.modelThree);
		});
		it("Should take a map of Models", () => {
			let entityMap = {
				modelOne,
				modelTwo,
				modelThree,
			};
			let service = new Service(entityMap);
			expect(service.entities.modelOne.model.entity).to.equal(modelOne.model.entity);
			expect(service.entities.modelTwo.model.entity).to.equal(modelTwo.model.entity);
			expect(service.entities.modelThree.model.entity).to.equal(modelThree.model.entity);
		});
		describe("Should apply service configuration options onto entities", () => {
			let model1 = {
				model: {
					entity: "e1",
					service: "s",
					version: "1"
				},
				attributes: {
					attr1: {
						type: "string"
					},
					attr2: {
						type: "string"
					}
				},
				indexes: {
					records: {
						pk: {
							field: "pk",
							facets: ["attr1"]
						},
						sk: {
							field: "sk",
							facets: ["attr2"]
						}
					},
					more: {
						index: "gsi1",
						collection: "morerecords",
						pk: {
							field: "gsi1pk",
							facets: ["attr1"]
						},
						sk: {
							field: "gsi1sk",
							facets: ["attr2"]
						}
					}
				}
			};
			let model2 = {
				model: {
					entity: "e2",
					service: "s",
					version: "1"
				},
				attributes: {
					attr1: {
						type: "string"
					},
					attr2: {
						type: "string"
					}
				},
				indexes: {
					records: {
						pk: {
							field: "pk",
							facets: ["attr1"]
						},
						sk: {
							field: "sk",
							facets: ["attr2"]
						}
					},
					more: {
						index: "gsi1",
						collection: "morerecords",
						pk: {
							field: "gsi1pk",
							facets: ["attr1"]
						},
						sk: {
							field: "gsi1sk",
							facets: ["attr2"]
						}
					}
				}
			}
			it("Should apply a table name to each entity when not set on the entity itself", () => {
				let table = "table_name";
				let entity1 = new Entity(model1);
				let entity2 = new Entity(model2);
				let service = new Service({entity1, entity2}, {table});
				let query = service.collections
					.morerecords({attr1: "blah"})
					.params();
				expect(query.TableName).to.equal(table)
			});
			it("Should apply a table name to each entity even when set on the entities themselves", () => {
				let table = "table_name";
				let entity1 = new Entity(model1, {table: "different_table_name"});
				let entity2 = new Entity(model2, {table: "different_table_name"});
				let service = new Service({entity1, entity2}, {table});
				let query = service.collections
					.morerecords({attr1: "blah"})
					.params();
				expect(query.TableName).to.equal(table)
			});
			it("Allow a table name to only be supplied via query options", () => {
				let table = "table_name";
				let entity1 = new Entity(model1);
				let entity2 = new Entity(model2);
				let service = new Service({entity1, entity2});
				let query = service.collections
					.morerecords({attr1: "blah"})
					.params({table});
				expect(query.TableName).to.equal(table);
				expect(() => service.collections.morerecords({attr1: "blah"}).params()).to.throw("Table name not defined. Table names must be either defined on the model, instance configuration, or as a query option. - For more detail on this error reference: https://github.com/tywalch/electrodb#missing-table");
			});
			it("Should throw if entities are defined with different table names", () => {
				let table = "table_name";
				let entity1 = new Entity(model1, {table: "different_table_name1"});
				let entity2 = new Entity(model2, {table: "different_table_name2"});
				expect(() => new Service({entity1, entity2})).to.throw("Entity with name 'entity2' is defined to use a different Table than what is defined on other Service Entities and/or the Service itself. Entity 'entity2' is defined with table name 'different_table_name2' but the Service has been defined to use table name 'different_table_name1'. All Entities in a Service must reference the same DynamoDB table. To ensure all Entities will use the same DynamoDB table, it is possible to apply the property 'table' to the Service constructor's configuration parameter. - For more detail on this error reference: https://github.com/tywalch/electrodb#join");
				let service = new Service({entity1, entity2}, {table});
				let query = service.collections
					.morerecords({attr1: "blah"})
					.params();
				expect(query.TableName).to.equal(table)
			});
			it("Should apply a docClient to each entity", () => {
				let client = {};
				let table = "table_name";
				let entity1 = new Entity(model1);
				let entity2 = new Entity(model2 );
				let service = new Service({entity1, entity2}, {table, client});
				expect(service.client).to.equal(client);
				expect(entity1.client).to.equal(client);
				expect(entity2.client).to.equal(client);
			});
		});
	})
	it("Should not allow a service to be created without a name", () => {
		expect(() => new Service()).to.throw(`Invalid service name: "". Service name must have length greater than zero - For more detail on this error reference: https://github.com/tywalch/electrodb#join`)
	});
	it("Should not allow a join to be performed on an object other than an Entity or Model", () => {
		let service = new Service("MyService");
		expect(() => service.join({model: {entity: "beep-boop"}})).to.throw(`Invalid instance: Valid instances to join include Models and Entity instances. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`)
	});
	it("Should not allow a join to be performed on an empty object", () => {
		let service = new Service("MyService");
		expect(() => service.join({})).to.throw(`Invalid instance: Valid instances to join include Models and Entity instances. Additionally, all models must be in the same format (v1 vs beta). Review https://github.com/tywalch/electrodb#version-v1-migration for more detail. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`)
	});
	it("Should allow joining already initiated entities", () => {
		let schema = {
			model: {
				entity: "MyEntity",
				service: "MyService",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
					field: "abc"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let service = new Service("MyService", {table: "MyTable"});
		let entity = new Entity(schema, {table: "MyTable"});
		// service.join(entity);
		expect(() => service.join(entity)).to.not.throw();
		expect(service.entities).to.have.property("MyEntity");
	});
	it("Should not allow joining a model with a different service name", () => {
		let schema = {
			model: {
				entity: "MyEntity",
				service: "MyOtherService",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
					field: "abc"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let service = new Service("MyService", {table: "MyTable"});
		let entity = new Entity(schema, {table: "MyTable"});
		expect(() => service.join(entity)).to.throw("Service name defined on joined instance, MyOtherService, does not match the name of this Service: MyService. Verify or update the service name on the Entity/Model to match the name defined on this service.");
	});
	it("Should allow joining a v1 style model", () => {
		let schema = {
			model: {
				entity: "MyEntity",
				service: "MyService",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
					field: "abc"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let service = new Service("MyService", {table: "MyTable"});
		// service.join(entity);
		expect(() => service.join(schema)).to.not.throw();
		expect(service.entities).to.have.property("MyEntity");
	});
	it("Should require that all partition keys should be defined with the same casing", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						casing: "upper",
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						casing: "lower",
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop5", "prop4"],
					},
					collection: "collectionA",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});

		database
			.join(entityOne)
		expect(() => database.join(entityTwo)).to.throw(`Validation Error while joining entity, "entityTwo". The pk property "casing" provided "lower" does not match established casing "upper" on index "(Primary Index)". Index casing options must match across all entities participating in a collection - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
	});
	it("Should require that all sort keys should be defined with the same casing", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						casing: "upper",
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						casing: "lower",
						field: "sk",
						facets: ["prop5", "prop4"],
					},
					collection: "collectionA",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});

		database
			.join(entityOne)
		expect(() => database.join(entityTwo)).to.throw(`Validation Error while joining entity, "entityTwo". The sk property "casing" provided "upper" does not match established casing "lower" on index "(Primary Index)". Index casing options must match across all entities participating in a collection - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
	});
	it("Should allow partial casing definitions if defaults align with chosen casing", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						casing: "lower",
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						casing: "lower",
						field: "sk",
						facets: ["prop5", "prop4"],
					},
					collection: "collectionA",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});

		database
			.join(entityOne)
		expect(() => database.join(entityTwo)).to.not.throw();
	});
	it("Should require matching PK values for entities associated with a common collection", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1", "prop7"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop5", "prop4"],
					},
					collection: "collectionA",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});

		database
			.join(entityOne)
		expect(() => database.join(entityTwo)).to.throw("Partition Key composite attributes provided [\"prop1\"] for index \"(Primary Index)\" do not match established composite attributes [\"prop1\", \"prop7\"] on established index \"(Primary Index)\" - For more detail on this error reference: https://github.com/tywalch/electrodb#join");
	});
	it("Should require all PK values", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1", "prop7"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				},
				prop7: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1", "prop7"],
					},
					sk: {
						field: "sk",
						facets: ["prop5", "prop4"],
					},
					collection: "collectionA",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});

		database
			.join(entityOne)
			.join(entityTwo);

		expect(() => database.collections.collectionA({prop1: "abc",}).params()).to.throw('Incomplete or invalid key composite attributes supplied. Missing properties: "prop7"');
		expect(database.collections.collectionA({prop1: "abc", prop7: "def", prop2: "hij"}).params()).to.deep.equal({
			KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
			TableName: 'electro',
			ExpressionAttributeNames: {
				"#pk": "pk",
				"#sk1": "sk"
			},
			ExpressionAttributeValues: {
				':pk': '$electrotest_1#prop1_abc#prop7_def',
				':sk1': '$collectiona'
			}
		});
	});

	it("Should add three records and retrieve correct records based on collections", async () => {
		let recordOne = {
			prop1: "prop1",
			prop2: "prop2-one",
			prop3: "prop3",
			prop4: "prop4-one",
			prop5: "prop5",
			prop6: "prop6-one",
			prop7: "prop7",
			prop8: "prop8-one",
			prop9: "prop9-one",
		};
		let paramsOne = database.entities.entityOne.put(recordOne).params();
		expect(paramsOne).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-one",
				prop3: "prop3",
				prop4: "prop4-one",
				prop5: "prop5",
				prop6: "prop6-one",
				prop7: "prop7",
				prop8: "prop8-one",
				prop9: "prop9-one",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectiona#entityone#prop2_prop2-one#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entityone#prop4_prop4-one#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionc#entityone#prop6_prop6-one#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiond#entityone#prop8_prop8-one#prop9_prop9-one",
				__edb_e__: "entityOne",
				__edb_v__: "1",
			},
			TableName: "electro",
		});
		let recordTwo = {
			prop1: "prop1",
			prop2: "prop2-two",
			prop3: "prop3",
			prop4: "prop4-two",
			prop5: "prop5",
			prop6: "prop6-two",
			prop7: "prop7",
			prop8: "prop8-two",
			prop9: "prop9-two",
		};
		let paramsTwo = database.entities.entityTwo.put(recordTwo).params();
		expect(paramsTwo).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-two",
				prop3: "prop3",
				prop4: "prop4-two",
				prop5: "prop5",
				prop6: "prop6-two",
				prop7: "prop7",
				prop8: "prop8-two",
				prop9: "prop9-two",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectione#entitytwo#prop2_prop2-two#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entitytwo#prop4_prop4-two#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionf#entitytwo#prop6_prop6-two#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiong#entitytwo#prop8_prop8-two#prop9_prop9-two",
				__edb_e__: "entityTwo",
				__edb_v__: "1",
			},
			TableName: "electro",
		});
		let recordThree = {
			prop1: "prop1",
			prop2: "prop2-three",
			prop3: "prop3",
			prop4: "prop4-three",
			prop5: "prop5",
			prop6: "prop6-three",
			prop7: "prop7",
			prop8: "prop8-three",
			prop9: "prop9-three",
		};
		let paramsThree = database.entities.entityThree.put(recordThree).params();
		expect(paramsThree).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-three",
				prop3: "prop3",
				prop4: "prop4-three",
				prop5: "prop5",
				prop6: "prop6-three",
				prop7: "prop7",
				prop8: "prop8-three",
				prop9: "prop9-three",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectione#entitythree#prop2_prop2-three#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entitythree#prop4_prop4-three#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionf#entitythree#prop6_prop6-three#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiond#entitythree#prop8_prop8-three#prop9_prop9-three",
				__edb_e__: "entityThree",
				__edb_v__: "1",
			},
			TableName: "electro",
		});
	}).timeout(10000);
});


describe("Misconfiguration exceptions", () => {
	it("Should should not allow joined entities to have the same collection name across different indexes", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},

				},
				index2: {
					index: "gis2",
					collection: "collectionA",
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop2", "prop1"],
					},
				}
			},
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop3: {
					type: "string"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
				},
				index2: {
					index: "gis1",
					collection: "collectionA",
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Collection defined on provided index "gis1" does not match collection established index "gis2". Collections must be defined on the same index across all entities within a service. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
		// expect(() => database.join(entityTwo)).to.throw("You cant do that");
	});
	it("Should require collections to be set on the same index", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
				},
				index2: {
					pk: {
						field: "pk2",
						facets: ["prop1"],
					},
					sk: {
						field: "sk2",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
					index: "different-index-than-entity-one",
				}
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Collection defined on provided index "different-index-than-entity-one" does not match collection established index "(Primary Index)". Collections must be defined on the same index across all entities within a service. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
		// expect(() => database.join(entityTwo)).to.throw("You cant do that");
	});
	it("Should validate the PK composite attributes match on all added schemas", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop4"],
					},
					sk: {
						field: "sk",
						facets: ["prop1", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Partition Key composite attributes provided for index "(Primary Index)" do not match established composite attribute "prop1" on established index "(Primary Index)": "prop1" != "prop4"; Composite attribute definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these composite attribute definitions are identical for all entities associated with this service. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
	});
	it("Should validate the PK composite attribute labels match on all added schemas and throw when incorrect", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
					label: "rop"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Partition Key composite attributes provided for index "(Primary Index)" contain conflicting composite attribute labels for established composite attribute "prop1" on established index "(Primary Index)". Established composite attribute "prop1" on established index "(Primary Index)" was defined with label "rop" while provided composite attribute "prop1" on provided index "(Primary Index)" is defined with label "prop1". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
	});
	it("Should validate the PK composite attribute labels match on all added schemas and not throw when they do match", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
					label: "rop"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
					label: "rop"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		database.join(entityTwo);
	});
	it("Should validate that attributes with the same have the same field also listed", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
					field: "abc"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
					field: "def"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Attribute provided "prop1" with Table Field "def" does not match established Table Field "abc"`);
	});
	it("Should validate the PK field matches on all added schemas", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pkz",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);		
		expect(() => database.join(entityTwo)).to.throw(`Partition Key composite attributes provided "pkz" for index "(Primary Index)" do not match established field "pk" on established index "(Primary Index)" - For more detail on this error reference: https://github.com/tywalch/electrodb#join`);
	});
	it("Should validate the attributes with matching names have matching fields on all added schemas", () => {
		let entityOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let entityTwo = {
			entity: "entityTwo",
			attributes: {
				prop1: {
					type: "string",
					field: "notProp1"
				},
				prop4: {
					type: "string"
				},
				prop5: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionA",
				},
			}
		};
		let database = new Service({
			version: "1",
			table: "electro",
			service: "electrotest",
		});
		database.join(entityOne);
		expect(() => database.join(entityTwo)).to.throw(`Attribute provided "prop1" with Table Field "notProp1" does not match established Table Field "prop1"`);
	});
	it("Should disallow for 'v1' construction with 'beta' entities", () => {
		let database = new Service("electrotest", {table: "electro_test"});
		expect(() => database.join(modelOne)).to.throw("Invalid instance: Valid instances to join include Models and Entity instances. Additionally, all models must be in the same format (v1 vs beta). Review https://github.com/tywalch/electrodb#version-v1-migration for more detail.");
	});
	it("Change the table name for the service and it's entities", () => {
		let schema = {
			model: {
				entity: "MyEntity",
				service: "MyService",
				version: "1"
			},
			attributes: {
				prop1: {
					type: "string",
					field: "abc"
				},
				prop2: {
					type: "string"
				},
				prop3: {
					type: "string"
				}
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				}
			}
		};
		let tableBefore = "table_before";
		let tableAfter = "table_after";
		let service = new Service("MyService", {table: tableBefore});
		service.join(schema);
		let collectionParamsBefore = service.collections.collectionA({prop1: "abc"}).params();
		let entityParamsBefore = service.entities.MyEntity.query.index1({prop1: "abc"}).params();
		expect(collectionParamsBefore.TableName).to.equal(tableBefore);
		expect(entityParamsBefore.TableName).to.equal(tableBefore);
		service._setTableName(tableAfter);
		let collectionParamsAfter = service.collections.collectionA({prop1: "abc"}).params();
		let entityParamsAfter = service.entities.MyEntity.query.index1({prop1: "abc"}).params();
		expect(collectionParamsAfter.TableName).to.equal(tableAfter);
		expect(entityParamsAfter.TableName).to.equal(tableAfter);
	});
	it("Should build the correct pk and sk when the table's pk/sk are part of a collection", async () => {
		let modelOne = {
			entity: "entityOne",
			attributes: {
				prop1: {
					type: "string",
				},
				prop2: {
					type: "string",
				},
				prop3: {
					type: "string",
				},
				prop4: {
					type: "string",
				},
				prop5: {
					type: "string",
				},
				prop6: {
					type: "string",
				},
				prop7: {
					type: "string",
				},
				prop8: {
					type: "string",
				},
				prop9: {
					type: "string",
				},
			},
			indexes: {
				index1: {
					pk: {
						field: "pk",
						facets: ["prop1"],
					},
					sk: {
						field: "sk",
						facets: ["prop2", "prop3"],
					},
					collection: "collectionA",
				},
				index2: {
					pk: {
						field: "gsi1pk",
						facets: ["prop3"],
					},
					sk: {
						field: "gsi1sk",
						facets: ["prop4", "prop5"],
					},
					collection: "collectionB",
					index: "gsi1pk-gsi1sk-index",
				},
				index3: {
					pk: {
						field: "gsi2pk",
						facets: ["prop5"],
					},
					sk: {
						field: "gsi2sk",
						facets: ["prop6", "prop7"],
					},
					collection: "collectionC",
					index: "gsi2pk-gsi2sk-index",
				},
				index4: {
					pk: {
						field: "gsi3pk",
						facets: ["prop7"],
					},
					sk: {
						field: "gsi3sk",
						facets: ["prop8", "prop9"],
					},
					collection: "collectionD",
					index: "gsi3pk-gsi3sk-index",
				},
			},
		};
		let database = new Service({version: "1", table: "electro", service: "electrotest"});
		database.join(modelOne);

		let prop1 = "prop1";
		let prop2 = "prop2";
		let prop3 = "prop3";
		let prop4 = "prop4";
		let prop5 = "prop5";
		let prop6 = "prop6";
		let prop7 = "prop7";
		let prop8 = "prop8";
		let prop9 = "prop9";

		let query = database.entities.entityOne.query.index1({prop1, prop2, prop3}).params();
		let scan = database.entities.entityOne.scan.params();
		let get = database.entities.entityOne.get({prop1, prop2, prop3}).params();
		let destroy = database.entities.entityOne.delete({prop1, prop2, prop3}).params();
		let update = database.entities.entityOne.update({prop1, prop2, prop3}).set({prop4, prop5, prop6, prop7, prop8, prop9}).params();
		// let collection = database.collections.collectionD({prop7, prop8, prop9}).params();

		function testKeys(pk, sk) {
			if (!pk.startsWith("$electrotest_1#prop1_")) {
				throw new Error("Invalid PK");
			}
			if (!sk.startsWith("$collectiona#entityone#prop2")) {
				throw new Error("Invalid SK");
			}
		}

		// expect(collection.FilterExpression).to.equal("(#__edb_e___entityOne = :__edb_e___entityOne AND #__edb_v___entityOne = :__edb_v___entityOne)");
		testKeys(query.ExpressionAttributeValues[":pk"], query.ExpressionAttributeValues[":sk1"]);
		testKeys(scan.ExpressionAttributeValues[":pk"], scan.ExpressionAttributeValues[":sk"]);
		testKeys(get.Key.pk, get.Key.sk);
		testKeys(destroy.Key.pk, destroy.Key.sk);
		testKeys(update.Key.pk, update.Key.sk);
	});
});

describe("Sub Collections", () => {
	const entityWithMultipleCollections1 = new Entity({
		model: {
			entity: "abc",
			service: "myservice",
			version: "myversion"
		},
		attributes: {
			attr1: {
				type: "string",
			},
			attr2: {
				type: "string",
			},
			attr3: {
				type: "string"
			}
		},
		indexes: {
			myIndex: {
				collection: ["outercollection", "innercollection"],
				pk: {
					field: "pk",
					composite: ["attr1"]
				},
				sk: {
					field: "sk",
					composite: ["attr2"]
				}
			},
		}
	})

	const entityWithMultipleCollections2 = new Entity({
		model: {
			entity: "abc",
			service: "myservice",
			version: "myversion"
		},
		attributes: {
			attr1: {
				type: "string",
			},
			attr2: {
				type: "string",
			},
			attr3: {
				type: "string"
			}
		},
		indexes: {
			myIndex: {
				collection: ["outercollection", "innercollection"],
				pk: {
					field: "pk",
					composite: ["attr1"]
				},
				sk: {
					field: "sk",
					composite: ["attr2"]
				}
			},
			myIndex2: {
				index: "index2",
				collection: ["extracollection", "superextracollection"],
				pk: {
					field: "index2pk",
					composite: ["attr2"]
				},
				sk: {
					field: "index2sk",
					composite: ["attr3"]
				}
			},
		}
	});

	const entityWithMultipleCollections3 = new Entity({
		model: {
			entity: "abc",
			service: "myservice",
			version: "myversion"
		},
		attributes: {
			attr1: {
				type: "string",
			},
			attr2: {
				type: "string",
			},
			attr3: {
				type: "string"
			}
		},
		indexes: {
			myIndex: {
				collection: "outercollection",
				pk: {
					field: "pk",
					composite: ["attr1"]
				},
				sk: {
					field: "sk",
					composite: ["attr2"]
				}
			},
			myIndex2: {
				index: "index2",
				collection: "extracollection",
				pk: {
					field: "index2pk",
					composite: ["attr2"]
				},
				sk: {
					field: "index2sk",
					composite: ["attr3"]
				}
			},
		}
	});

	const serviceWithMultipleCollections = new Service({entityWithMultipleCollections3, entityWithMultipleCollections1, entityWithMultipleCollections2}, {table: "subcollection_table"});

	it("Should have all collections across all entities", () => {
		expect(Object.keys(serviceWithMultipleCollections.collections)).to.deep.equal([
			"outercollection",
			"extracollection",
			"innercollection",
			"superextracollection",
		]);
	});
	it("Should create collections based on presence in array", () => {
		const tests = [
			{
				input: {attr1: "abc"},
				collection: "outercollection",
				output: {
					KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
					TableName: 'subcollection_table',
					ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
					ExpressionAttributeValues: { ':pk': '$myservice#attr1_abc', ':sk1': '$outercollection' }
				}
			},
			{
				input: {attr1: "abc"},
				collection: "innercollection",
				output: {
					KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
					TableName: 'subcollection_table',
					ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
					ExpressionAttributeValues: {
						':pk': '$myservice#attr1_abc',
						':sk1': '$outercollection#innercollection'
					}
				}
			},
			{
				input: {attr2: "def"},
				collection: "extracollection",
				output: {
					KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
					TableName: 'subcollection_table',
					ExpressionAttributeNames: { '#pk': 'index2pk', '#sk1': 'index2sk' },
					ExpressionAttributeValues: { ':pk': '$myservice#attr2_def', ':sk1': '$extracollection' },
					IndexName: 'index2'
				}
			},
			{
				input: {attr2: "def"},
				collection: "superextracollection",
				output: {
					KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
					TableName: 'subcollection_table',
					ExpressionAttributeNames: { '#pk': 'index2pk', '#sk1': 'index2sk' },
					ExpressionAttributeValues: {
						':pk': '$myservice#attr2_def',
						':sk1': '$extracollection#superextracollection'
					},
					IndexName: 'index2'
				}
			}
		];
		for (const test of tests) {
			let params = serviceWithMultipleCollections.collections[test.collection]({...test.input}).params();
			expect(params).to.deep.equal(test.output)
		}
	});

	it("Should validate collections match between entities", () => {
		const tests = [
			{
				input: [
					"collectionA",
					"collectionA",
					"my_entity",
					"collectionA"
				],
				output: 0,
				success: true
			},
			{
				input: [
					"collectionA",
					"collectionB",
					"my_entity",
					"collectionA"
				],
				output: `Collection "collectionA" does not exist on Entity "my_entity".`,
				success: false
			},
			{
				input: [
					"collectionA",
					undefined,
					"my_entity",
					"collectionA"
				],
				output: `Collection "collectionA" does not exist on Entity "my_entity".`,
				success: false
			},
			{
				input: [
					"collectionA",
					["collectionA", "collectionB"],
					"my_entity",
					"collectionA"
				],
				output: 0,
				success: true
			},
			{
				input: [
					["collectionA", "collectionB"],
					"collectionA",
					"my_entity",
					"collectionA"
				],
				output: 0,
				success: true
			},
			{
				input: [
					"collectionA",
					["collectionA", "collectionB"],
					"my_entity",
					"collectionB"
				],
				output: 1,
				success: true
			},
			{
				input: [
					"collectionA",
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionC"
				],
				output: 2,
				success: true
			},
			{
				input: [
					["collectionA", "collectionB"],
					["collectionA", "collectionB"],
					"my_entity",
					"collectionB"
				],
				output: 1,
				success: true
			},
			{
				input: [
					["collectionA", "collectionB"],
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionC"
				],
				output: 2,
				success: true
			},
			{
				input: [
					"collectionB",
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionC"
				],
				output: `The collection definition for Collection "collectionC", on Entity "my_entity", does not match the established sub-collection order for this service. The collection name provided in slot 1, "collectionA", on Entity "my_entity", does not match the established collection name in slot 1, "collectionB". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`,
				success: false
			},
			{
				input: [
					"collectionB",
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionA"
				],
				output: `The collection definition for Collection "collectionA", on Entity "my_entity", does not match the established sub-collection order for this service. The collection name provided in slot 1, "collectionA", on Entity "my_entity", does not match the established collection name in slot 1, "collectionB". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`,
				success: false
			},
			{
				input: [
					"collectionB",
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionB"
				],
				output: `he collection definition for Collection "collectionB", on Entity "my_entity", does not match the established sub-collection order for this service. The collection name provided in slot 2, "collectionA", on Entity "my_entity", does not match the established collection name in slot 1, "collectionB". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`,
				success: false
			},
			{
				input: [
					["collectionA", "collectionB", "collectionD", "collectionC"],
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionC"
				],
				output: `The collection definition for Collection "collectionC", on Entity "my_entity", does not match the established sub-collection order for this service. The collection name provided in slot 3, (not found), on Entity "my_entity", does not match the established collection name in slot 4, "collectionC". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`,
				success: false
			},
			{
				input: [
					["collectionA", "collectionD", "collectionC"],
					["collectionA", "collectionB", "collectionC"],
					"my_entity",
					"collectionC"
				],
				output: `The collection definition for Collection "collectionC", on Entity "my_entity", does not match the established sub-collection order for this service. The collection name provided in slot 2, "collectionB", on Entity "my_entity", does not match the established collection name in slot 2, "collectionD". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`,
				success: false
			},
			{
				input: [
					[],
					"collectionA",
					"my_entity",
					"collectionA"
				],
				output: 0,
				success: true
			},
		];
		for (const test of tests) {
			if (test.success) {
				let result = serviceWithMultipleCollections._processSubCollections(...test.input);
				expect(result).equals(test.output, JSON.stringify(test.input));
			} else {
				expect(() => {
					serviceWithMultipleCollections._processSubCollections(...test.input);
				}).to.throw(test.output, JSON.stringify(test.input));
			}
		}
	});

	it("Should validate that second slot collections require the first slot as well", () => {
		const entity1 = new Entity({
			model: {
				entity: "abc",
				service: "myservice",
				version: "myversion"
			},
			attributes: {
				attr1: {
					type: "string",
				},
				attr2: {
					type: "string",
				},
				attr3: {
					type: "string"
				}
			},
			indexes: {
				myIndex: {
					collection: ["outercollection", "innercollection"],
					pk: {
						field: "pk",
						composite: ["attr1"]
					},
					sk: {
						field: "sk",
						composite: ["attr2"]
					}
				},
			}
		});

		const entity2 = new Entity({
			model: {
				entity: "abc",
				service: "myservice",
				version: "myversion"
			},
			attributes: {
				attr1: {
					type: "string",
				},
				attr2: {
					type: "string",
				},
				attr3: {
					type: "string"
				}
			},
			indexes: {
				myIndex: {
					collection: ["innercollection"],
					pk: {
						field: "pk",
						composite: ["attr1"]
					},
					sk: {
						field: "sk",
						composite: ["attr2"]
					}
				},
			}
		});

		expect(() => new Service({entity1, entity2})).to.throw(`The collection definition for Collection "innercollection", on Entity "entity2", does not match the established sub-collection order for this service. The collection name provided in slot 1, (not found), on Entity "entity2", does not match the established collection name in slot 2, "innercollection". When using sub-collections, all Entities within a Service must must implement the same order for all preceding sub-collections.`);
	});
})


