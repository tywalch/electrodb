let Validator = require('jsonschema').Validator;
Validator.prototype.customFormats.isFunction = function(input) {
    return typeof input === "function" || typeof input === "string";
};
Validator.prototype.customFormats.isFunctionOrString = function(input) {
    return typeof input === "function" || typeof input === "string";
};
Validator.prototype.customFormats.isFunctionOrRegexp = function(input) {
    return typeof input === "function" || input instanceof RegExp;
};

let v = new Validator();

const Attribute = {
    id: "/Attribute",
    type: "object",
    required: ["type"],
    properties: {
        type: {
            // todo: only specific values
            type: "string",
            enum: ["string", "number", "boolean", "enum"],
        },
        field: {
            type: "string"
        },
        label: {
            type: "string"
        },
        readOnly: {
            type: "boolean"
        },
        required: {
            type: "boolean"
        },
        cast: {
            type: "string",
            enum: ["string", "number"]
        },
        default: {
            type: "any",
            format: "isFunctionOrString"
        },
        validate: {
            type: "any",
            format: "isFunctionOrRegexp"
        },
        get: {
            type: "any",
            format: "isFunction"
        },
        set: {
            type: "any",
            format: "isFunction"
        }
    }
}

const Index = {
    id: "/Index",
    type: "object",
    properties: {
        pk: {
            type: "object",
            required: true,
            properties: {
                field: {
                    type: "string",
                    required: true
                },
                facets: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "string"
                    },
                    required: true
                }
            }
        },
        sk: {
            type: "object",
            required: ["field", "facets"],
            properties: {
                field: {
                    type: "string",
                    required: true,
                },
                facets: {
                    type: "array",
                    minItems: 1,
                    required: true,
                    items: {
                        type: "string"
                    }
                }
            }
        },
        index: {
            type: "string"
        }
    }
}


const Model = {
    type: "object",
    required: true,
    properties: {
        service: {
            type: "string",
            required: true
        },
        entity: {
            type: "string",
            required: true
        },
        table: {
            type: "string",
            required: true
        },
        version: {
            type: "string",
        },
        attributes: {
            type: "object",
            patternProperties: {
                ["."]: {$ref: "/Attribute"}
            } 
        },
        indexes: {
            type: "object",
            minProperties: 1,
            patternProperties: {
                ["."]: {$ref: "/Index"}
            } 
        }
    }
}

v.addSchema(Attribute, '/Attribute');
v.addSchema(Index, '/Index');
v.addSchema(Model, '/Model');

let schema = {
    service: "testing",
	entity: "tester",
	table: "TransactionsTestCreditOrg",
	version: "1",
    attributes: {
        id: {
            type: "string",
            get: (id, model) => {
                return id + "GETTT!"
            },
            set: (id, model) => {
                console.log("SETTING", id);
                console.log("DATE", model.date);
                model.date + "abd";
                console.log(model.date);
                return id + "SET!"
            },
            default: () => uuidv4()
        },
        date: {
            type: "string",
            default: () => moment.utc().format()
        }
    },
    indexes: {
        record: {
			pk: {
				field: "AccountID",
				facets: ["date"],
            },
            sk: {
                field: "Clnsd#Date#IsChk#ChkN#Merch#Cat#SubCat#TranID",
                facets: ["id"],
            }
		},
    }
};

console.log("errors", v.validate(schema, "/Model").errors);