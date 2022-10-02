process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity } from "../index";
import { expect } from "chai";
import {v4 as uuid} from "uuid";
import DynamoDB from "aws-sdk/clients/dynamodb";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});
const table = "electro_nosort";

describe('padding validation', () => {
    it ('should not allow partially defined padding', () => {
        expect(() => {
            new Entity({
                model: {
                    entity: 'ai',
                    service: 'test',
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string',
                        // @ts-ignore
                        padding: {
                            length: 2,
                        }
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1']
                        }
                    }
                }
            })
        }).to.throw('instance.attributes.prop1.padding requires property "char" - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-model');
        expect(() => {
            new Entity({
                model: {
                    entity: 'ai',
                    service: 'test',
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string',
                        padding: {
                            length: 10,
                            char: 'ab',
                        }
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1']
                        }
                    }
                }
            })
        }).to.throw('instance.attributes.prop1.padding.char does not meet maximum length of 1 - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-model');
        expect(() => {
            new Entity({
                model: {
                    entity: 'ai',
                    service: 'test',
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string',
                        padding: {
                            length: 10,
                            char: '',
                        }
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1']
                        }
                    }
                }
            })
        }).to.throw('instance.attributes.prop1.padding.char does not meet minimum length of 1 - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-model');
    })
    it('should not allow padding to be defined on an indexed attribute', () => {
        expect(() => new Entity({
            model: {
                entity: 'ai',
                service: 'test',
                version: '1'
            },
            attributes: {
                num: {
                    type: 'number',
                    padding: {
                        length: 5,
                        char: '0',
                    }
                },
                str: {
                    type: 'string'
                },
                num2: {
                    type: 'number'
                },
                str2: {
                    type: 'string'
                },
            },
            indexes: {
                index1: {
                    pk: {
                        field: 'num',
                        composite: ['num'],
                    },
                    sk: {
                        field: 'str2',
                        composite: ['str2'],
                    },
                },
                index2: {
                    index: '2',
                    pk: {
                        field: 'str',
                        composite: ['str'],
                    },
                    sk: {
                        field: 'num2',
                        composite: ['num2'],
                    },
                }
            }
        })).to.throw('Invalid padding definition for the attribute "num". Padding is not currently supported for attributes that are also defined as table indexes. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute-definition');
    });
})

describe("user attribute validation", () => {
    describe("root primitives user validation", () => {
        it("should interpret a true response value as an invalid attribute value", async () => {
            const prop1 = uuid();
            const prop2 = "value2";
            const invalidProp2 = "invalid_value";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "string",
                        validate: (value) => value === invalidProp2
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateResult.fields).to.have.length(1);
        });

        it("should interpret a string return value as a validation error message", async () => {
            const prop1 = uuid();
            const prop2 = "value2";
            const invalidProp2 = "invalid_value";
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "string",
                        validate: (value) => {
                            if (value === invalidProp2) {
                                return invalidValueMessage;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateResult.fields).to.have.length(1);
        });

        it("should wrap a thrown error in the user validation callback with an ElectroError and make it available on a 'causes' array", async () => {
            const prop1 = uuid();
            const prop2 = "value2";
            const invalidProp2 = "invalid_value";
            const invalidValueMessage = "Oh no! invalid value!";
            const error = new Error(invalidValueMessage);
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "string",
                        validate: (value) => {
                            if (value === invalidProp2) {
                                throw error;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(putResult.fields[0].cause).to.equal(error);
            expect(updateResult.fields).to.have.length(1);
            expect(updateResult.fields[0].cause).to.equal(error);
        });
    });
    describe("root maps user validation", () => {
        it("should interpret a true response value as an invalid attribute value", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop4: "value4"
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: "value4"
            };
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string"
                            },
                            prop4: {
                                type: "string"
                            },
                            prop5: {
                                type: "string"
                            },
                        },
                        validate: (value = {}) => {
                            const value3PresentButValue5IsNot = value.prop3 !== undefined && value.prop5 === undefined;
                            return value3PresentButValue5IsNot;
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateResult.fields).to.have.length(1);
        });

        it("should wrap a thrown error in the user validation callback for a map with an ElectroError and make it available on a 'causes' array", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop4: "value4"
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: "value4"
            };
            class MyCustomError extends Error {
                constructor(message: string) {
                    super(message);
                    this.name = 'MyCustomError';
                }
            }
            const message = "Oh no!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string"
                            },
                            prop4: {
                                type: "string"
                            },
                            prop5: {
                                type: "string"
                            },
                        },
                        validate: (value = {}) => {
                            if (value.prop3 !== undefined && value.prop5 === undefined){
                                throw new MyCustomError(message);
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(`${message} - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(`${message} - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
            expect(putResult.fields).to.have.length(1);
            expect(putResult.fields[0].cause.name).to.equal('MyCustomError');
            expect(putResult.fields[0].cause.message).to.equal(message);
            expect(putResult.fields[0].field).to.equal("prop2");
            expect(updateResult.fields).to.have.length(1);
            expect(updateResult.fields[0].cause.name).to.equal('MyCustomError');
            expect(updateResult.fields[0].cause.message).to.equal(message);
            expect(updateResult.fields[0].field).to.equal("prop2");
        });

        it("should interpret a string return value as a validation error message", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop4: "value4"
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: "value4"
            };
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string"
                            },
                            prop4: {
                                type: "string"
                            },
                            prop5: {
                                type: "string"
                            },
                        },
                        validate: (value = {}) => {
                            const value3PresentButValue5IsNot = value.prop3 !== undefined && value.prop5 === undefined;
                            if (value3PresentButValue5IsNot) {
                                return invalidValueMessage;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Oh no! invalid value! - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Oh no! invalid value! - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateResult.fields).to.have.length(1);
        });

        it("should validate a maps properties before itself", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop3: "value3",
                prop4: 12345,
                prop5: true
            };
            const validationExecutions: string[] = [];
            const validationExecutionTypes: string[] = [];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                }
                            },
                            prop4: {
                                type: "number",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                }
                            },
                            prop5: {
                                type: "boolean",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                }
                            },
                        },
                        validate: (value) => {
                            validationExecutions.push("map");
                            validationExecutionTypes.push(typeof value);
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            expect(validationExecutions).to.deep.equal([
                "property",
                "property",
                "property",
                "map",
                "property",
                "property",
                "property",
                "map"
            ]);
            expect(validationExecutionTypes).to.deep.equal([
                "string",
                "number",
                "boolean",
                "object",
                "string",
                "number",
                "boolean",
                "object"
            ]);
        });

        it("should interpret a true response value as an invalid attribute value on individual property values", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop3: "value4",
                prop4: 12345,
                prop5: true,
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: 12346,
                prop5: false,
            };
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string",
                                validate: (value) => {
                                    return value !== prop2.prop3
                                }
                            },
                            prop4: {
                                type: "number",
                                validate: (value) => {
                                    return value !== prop2.prop4
                                }
                            },
                            prop5: {
                                type: "boolean",
                                validate: (value) => {
                                    return !value
                                }
                            },
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided, Invalid value provided, Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided, Invalid value provided, Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(3);
            expect(updateResult.fields).to.have.length(3);
        });

        it("should interpret a string return value as a validation error message on individual property values", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop3: "value4",
                prop4: 12345,
                prop5: true,
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: 12346,
                prop5: false,
            };
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string",
                                validate: (value) => {
                                    if (value !== prop2.prop3) {
                                        return invalidValueMessage;
                                    }
                                }
                            },
                            prop4: {
                                type: "number",
                                validate: (value) => {
                                    if (value !== prop2.prop4) {
                                        return invalidValueMessage;
                                    }
                                }
                            },
                            prop5: {
                                type: "boolean",
                                validate: (value) => {
                                    if (value !== prop2.prop5) {
                                        return invalidValueMessage;
                                    }
                                }
                            },
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal([invalidValueMessage, invalidValueMessage, invalidValueMessage].join(", ") + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal([invalidValueMessage, invalidValueMessage, invalidValueMessage].join(", ") + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(3);
            expect(updateResult.fields).to.have.length(3);
        });

        it("should wrap a thrown error in the user validation callback with an ElectroError and make it available on a 'causes' array", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop3: "value4",
                prop4: 12345,
                prop5: true,
            };
            const invalidProp2 = {
                prop3: "value3",
                prop4: 12346,
                prop5: false,
            };
            const invalidValueMessage = "Oh no! invalid value!";
            const error = new Error(invalidValueMessage)
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string",
                                validate: (value) => {
                                    if (value !== prop2.prop3) {
                                        throw error;
                                    }
                                }
                            },
                            prop4: {
                                type: "number",
                                validate: (value) => {
                                    if (value !== prop2.prop4) {
                                        throw error;
                                    }
                                }
                            },
                            prop5: {
                                type: "boolean",
                                validate: (value) => {
                                    if (value !== prop2.prop5) {
                                        throw error;
                                    }
                                }
                            },
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal([invalidValueMessage, invalidValueMessage, invalidValueMessage].join(", ") + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal([invalidValueMessage, invalidValueMessage, invalidValueMessage].join(", ") + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(3);
            expect(putResult.fields[0].cause).to.equal(error);
            expect(putResult.fields[1].cause).to.equal(error);
            expect(putResult.fields[2].cause).to.equal(error);
            expect(updateResult.fields).to.have.length(3);
            expect(updateResult.fields[0].cause).to.equal(error);
            expect(updateResult.fields[1].cause).to.equal(error);
            expect(updateResult.fields[2].cause).to.equal(error);
        });
    });
    describe("root lists user validation", () => {
        it("should interpret a true response value as an invalid attribute value", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                        },
                        validate: (value: string[] = []) => {
                            return value.length === 1;
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateResult.fields).to.have.length(1);
        });

        it("should interpret a string return value as a validation error message", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string"
                        },
                        validate: (value: string[] = []) => {
                            if (value.length === 1) {
                                return invalidValueMessage;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.have.length(1);
            expect(updateResult.fields).to.have.length(1);
        });

        it("should validate a lists properties before itself", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const validationExecutions: string[] = [];
            const validationExecutionTypes: string[] = [];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                            validate: (value: string) => {
                                validationExecutions.push("property");
                                validationExecutionTypes.push(typeof value);
                            }
                        },
                        validate: (value: string[] | undefined) => {
                            validationExecutions.push("list");
                            validationExecutionTypes.push(Array.isArray(value) ? "array": typeof value);
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            expect(validationExecutions).to.deep.equal([
                "property",
                "property",
                "list",
                "property",
                "property",
                "list"
            ]);
            expect(validationExecutionTypes).to.deep.equal([
                "string",
                "string",
                "array",
                "string",
                "string",
                "array"
            ]);
        });

        it("tez should interpret a true response value as an invalid attribute value on individual item values", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value3", "value4", "value5"];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                            validate: (value: string) => {
                                return !prop2.find(val => val === value);
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided, Invalid value provided, Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided, Invalid value provided, Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.deep.equal([
                {
                    cause: undefined,
                    field: 'prop2[*]',
                    index: 0,
                    reason: 'Invalid value provided',
                    type: 'validation'
                },
                {
                    cause: undefined,
                    field: 'prop2[*]',
                    index: 1,
                    reason: 'Invalid value provided',
                    type: 'validation'
                },
                {
                    cause: undefined,
                    field: 'prop2[*]',
                    index: 2,
                    reason: 'Invalid value provided',
                    type: 'validation'
                }
            ]);
            expect(putResult.fields).to.have.length(3);
            expect(updateResult.fields).to.have.length(3);
        });

        it("should interpret a string return value as a validation error message on individual item values", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value3", "value4", "value5"];
            const invalidValueMessage = "Oh no! invalid value!";
            const invalidValueError = [invalidValueMessage, invalidValueMessage, invalidValueMessage].join(", ") + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                            validate: (value: string) => {
                                if (!prop2.find(val => val === value)) {
                                    return invalidValueMessage;
                                }
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message.trim()).to.equal(invalidValueError);
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueError);
        });

        it("should not validate a parent list of a nested property if the property fails", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const validationExecutions: string[] = [];
            const validationExecutionTypes: string[] = [];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                            validate: (value: string) => {
                                validationExecutions.push("property");
                                validationExecutionTypes.push(typeof value);
                                return true;
                            }
                        },
                        validate: (value: string[] | undefined) => {
                            validationExecutions.push("list");
                            validationExecutionTypes.push(Array.isArray(value) ? "array": typeof value);
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go().catch(err => err);
            await entity.update({prop1}).set({prop2}).go({response: "all_new"}).catch(err => err);
            expect(validationExecutions).to.deep.equal([
                "property",
                "property",
                "property",
                "property",
            ]);
            expect(validationExecutionTypes).to.deep.equal([
                "string",
                "string",
                "string",
                "string",
            ]);
        });

        it("should not validate a parent map of a nested property if the property fails", async () => {
            const prop1 = uuid();
            const prop2 = {
                prop3: "value3",
                prop4: 12345,
                prop5: true
            };
            const validationExecutions: string[] = [];
            const validationExecutionTypes: string[] = [];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "map",
                        properties: {
                            prop3: {
                                type: "string",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                    return true;
                                }
                            },
                            prop4: {
                                type: "number",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                    return true;
                                }
                            },
                            prop5: {
                                type: "boolean",
                                validate: (value) => {
                                    validationExecutions.push("property");
                                    validationExecutionTypes.push(typeof value);
                                    return true;
                                }
                            },
                        },
                        validate: (value) => {
                            validationExecutions.push("map");
                            validationExecutionTypes.push(typeof value);
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go().catch(err => err);
            await entity.update({prop1}).set({prop2}).go({response: "all_new"}).catch(err => err);
            expect(validationExecutions).to.deep.equal([
                "property",
                "property",
                "property",
                "property",
                "property",
                "property",
            ]);
            expect(validationExecutionTypes).to.deep.equal([
                "string",
                "number",
                "boolean",
                "string",
                "number",
                "boolean"
            ]);
        });

        it("should wrap a thrown error in the user validation callback with an ElectroError and make it available on a 'causes' array", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const message = "oh no!";
            const error = new Error(message);
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "list",
                        items: {
                            type: "string",
                        },
                        validate: (value: string[] = []) => {
                            if (value.length === 1) {
                                throw error;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(`${message} - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(`${message} - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
            expect(putResult.fields).to.have.length(1);
            expect(putResult.fields[0].cause).to.equal(error);
            expect(updateResult.fields).to.have.length(1);
            expect(updateResult.fields[0].cause).to.equal(error);
        });
    });


    describe("root set user validation", () => {
        it("should interpret a true response value as an invalid attribute value", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "set",
                        items: "string",
                        validate: (value: string[] = []) => {
                            return value.length === 1;
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal("Invalid value provided - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
        });

        it("should interpret a string return value as a validation error message", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "set",
                        items: "string",
                        validate: (value: string[] = []) => {
                            if (value.length === 1) {
                                return invalidValueMessage;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
        });

        it("should wrap a thrown error in the user validation callback with an ElectroError and make it available on a 'causes' array", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const invalidValueMessage = "Oh no! invalid value!";
            const error = new Error(invalidValueMessage);
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "set",
                        items: "string",
                        validate: (value: string[] = []) => {
                            if (value.length === 1) {
                                throw error;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(putResult.fields).to.be.an("array").with.length(1);
            expect(putResult.fields[0].cause).to.equal(error);
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateResult.fields).to.be.an("array").with.length(1);
            expect(updateResult.fields[0].cause).to.equal(error);
        });

        it("should interpret a string return value as a validation error message", async () => {
            const prop1 = uuid();
            const prop2 = ["value1", "value2"];
            const invalidProp2 = ["value1"];
            const invalidValueMessage = "Oh no! invalid value!";
            const entity = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "set",
                        items: "string",
                        validate: (value: string[] = []) => {
                            if (value.length === 1) {
                                return invalidValueMessage;
                            }
                        }
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "partition_key",
                            composite: ["prop1"]
                        }
                    }
                }
            }, {table, client});
            await entity.put({prop1, prop2}).go();
            await entity.update({prop1}).set({prop2}).go({response: "all_new"});
            const [putSuccess, putResult] = await entity
                .put({prop1, prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            const [updateSuccess, updateResult] = await entity
                .update({prop1})
                .set({prop2: invalidProp2})
                .go()
                .then(res => res.data)
                .then(data => [true, data])
                .catch(err => [false, err]);
            expect(putSuccess).to.be.false;
            expect(putResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
            expect(updateSuccess).to.be.false;
            expect(updateResult.message).to.equal(invalidValueMessage + " - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute");
        });
    });
});

describe('Index definition validations', function () {
    it('should allow for index field maps to be used multiple times across indexes', async () => {
        const table = "electro_localsecondaryindex";
        const entity = new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
            },
            attributes: {
                prop1: {
                    type: "string"
                },
                prop2: {
                    type: "string"
                },
                prop3: {
                    type: "string"
                },
                prop4: {
                    type: "string"
                },
                prop5: {
                    type: "string"
                },
                prop6: {
                    type: "string"
                },
                prop7: {
                    type: "string"
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
                local1: {
                    index: "lsi1pk-lsi1sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                },
                local2: {
                    index: "lsi2pk-lsi2sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi2sk",
                        composite: ["prop6"]
                    }
                },
                global1: {
                    index: "gsi1pk-lsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ["prop3", "prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                }
            }
        }, {table, client});


        const prop1 = uuid();
        const prop2 = "def";
        const prop3 = "hij";
        const prop4 = "klm";
        const prop5 = "nop";
        const prop6 = "qrs";
        const prop7 = "tuv";

        const item = {
            prop1,
            prop2,
            prop3,
            prop4,
            prop5,
            prop6,
            prop7,
        }

        const putParams = entity.put(item).params();

        expect(putParams).to.deep.equal({
            "Item": {
                "prop1": prop1,
                "prop2": "def",
                "prop3": "hij",
                "prop4": "klm",
                "prop5": "nop",
                "prop6": "qrs",
                "prop7": "tuv",
                "pk": `$service#prop1_${prop1}`,
                "sk": "$entity_1#prop2_def",
                "lsi1sk": "$entity_1#prop5_nop#prop2_def",
                "lsi2sk": "$entity_1#prop6_qrs",
                "gsi1pk": `$service#prop3_hij#prop1_${prop1}`,
                "__edb_e__": "entity",
                "__edb_v__": "1"
            },
            "TableName": table
        });

        const put = await entity.put(item).go().then(res => res.data);

        expect(put).to.deep.equal(item);

        const queries = await Promise.all([
            entity.query.record({prop1}).go().then(res => res.data),
            entity.query.global1({prop3, prop1, prop5}).go().then(res => res.data),
            entity.query.local1({prop1, prop5}).go().then(res => res.data),
            entity.query.local2({prop1}).go().then(res => res.data),
        ]);

        expect(queries).to.deep.equal([
            [item],
            [item],
            [item],
            [item],
        ]);
    });

    it('should not allow a field to map to both an sort key and a partition key', async () => {
        const table = "electro_localsecondaryindex";
        const createEntity = () => new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
            },
            attributes: {
                prop1: {
                    type: "string"
                },
                prop2: {
                    type: "string"
                },
                prop3: {
                    type: "string"
                },
                prop4: {
                    type: "string"
                },
                prop5: {
                    type: "string"
                },
                prop6: {
                    type: "string"
                },
                prop7: {
                    type: "string"
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
                local1: {
                    index: "lsi1pk-lsi1sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                },
                local2: {
                    index: "lsi2pk-lsi2sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi2sk",
                        composite: ["prop6"]
                    }
                },
                global1: {
                    index: "gsi1pk-lsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ["prop3", "prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                },
                global2: {
                    index: "gsi2pk-gsi1pk-index",
                    pk: {
                        field: "gsi2pk",
                        composite: ["prop7"]
                    },
                    sk: {
                        field: "gsi1pk",
                        composite: ["prop3", "prop1"]
                    }
                }
            }
        }, {table, client});

        expect(createEntity).to.throw("The Sort Key (sk) on Access Pattern 'global2' references the field 'gsi2pk' which is already referenced by the Access Pattern(s) 'global1' as a Partition Key. Fields mapped to Partition Keys cannot be also mapped to Sort Keys. - For more detail on this error reference: https://github.com/tywalch/electrodb#inconsistent-index-definition");
    });

    it('enforce pk field definitions in cases where a field is used in multiple indexes', async () => {
        const table = "electro_localsecondaryindex";
        const createEntity = () => new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
            },
            attributes: {
                prop1: {
                    type: "string"
                },
                prop2: {
                    type: "string"
                },
                prop3: {
                    type: "string"
                },
                prop4: {
                    type: "string"
                },
                prop5: {
                    type: "string"
                },
                prop6: {
                    type: "string"
                },
                prop7: {
                    type: "string"
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
                local1: {
                    index: "lsi1pk-lsi1sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                },
                local2: {
                    index: "lsi2pk-lsi2sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1", "prop7"]
                    },
                    sk: {
                        field: "lsi2sk",
                        composite: ["prop6"]
                    }
                },
                global1: {
                    index: "gsi1pk-lsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ["prop3", "prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                }
            }
        }, {table, client});

        expect(createEntity).to.throw(`Partition Key (pk) on Access Pattern 'local2' is defined with the composite attribute(s) "prop1", "prop7", but the accessPattern '(Primary Index)' defines this field with the composite attributes "prop1"'. Key fields must have the same composite attribute definitions across all indexes they are involved with - For more detail on this error reference: https://github.com/tywalch/electrodb#inconsistent-index-definition`);
    });

    it('enforce sk field definitions in cases where a field is used in multiple indexes', async () => {
        const table = "electro_localsecondaryindex";
        const createEntity = () => new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
            },
            attributes: {
                prop1: {
                    type: "string"
                },
                prop2: {
                    type: "string"
                },
                prop3: {
                    type: "string"
                },
                prop4: {
                    type: "string"
                },
                prop5: {
                    type: "string"
                },
                prop6: {
                    type: "string"
                },
                prop7: {
                    type: "string"
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
                local1: {
                    index: "lsi1pk-lsi1sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop5", "prop2"]
                    }
                },
                local2: {
                    index: "lsi2pk-lsi2sk-index",
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "lsi2sk",
                        composite: ["prop6"]
                    }
                },
                global1: {
                    index: "gsi1pk-lsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ["prop3", "prop1"]
                    },
                    sk: {
                        field: "lsi1sk",
                        composite: ["prop6", "prop7"]
                    }
                },
            }
        }, {table, client});

        expect(createEntity).to.throw("Sort Key (sk) on Access Pattern 'global1' is defined with the composite attribute(s) \"prop6\", \"prop7\", but the accessPattern 'lsi1pk-lsi1sk-index' defines this field with the composite attributes \"prop5\", \"prop2\"'. Key fields must have the same composite attribute definitions across all indexes they are involved with - For more detail on this error reference: https://github.com/tywalch/electrodb#duplicate-index-fields");
    });
});