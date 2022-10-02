import { Entity, Service } from '../';
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import {expect} from "chai";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

type DocClient = typeof client;

const table = "electro";

export function getPaddingEntities(options: {
    client?: DocClient;
    serviceName: string;
    table: string;
}) {
    const { client, serviceName, table } = options;
    const baseEntity = new Entity({
        model: {
            service: serviceName,
            entity: 'baseentity',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const baseEntity2 = new Entity({
        model: {
            service: serviceName,
            entity: 'baseentity2',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const actuallyHasPadding = new Entity({
        model: {
            service: serviceName,
            entity: 'actuallyHasPadding',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const incorrectPk = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectpk',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
        }
    }, {table, client});

    const incorrectSk = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectsk',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});
    const incorrectNonCollection = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectNonCollection',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly2',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly2',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded2']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded']
                },
            },
        }
    }, {table, client});

    return {
        baseEntity,
        baseEntity2,
        incorrectPk,
        incorrectSk,
        actuallyHasPadding,
        incorrectNonCollection,
    }
}

describe('padding validations', () => {
    const serviceName = 'paddingTest';
    const {
        baseEntity,
        baseEntity2,
        incorrectPk,
        incorrectSk,
        actuallyHasPadding,
        incorrectNonCollection
    } = getPaddingEntities({
        serviceName,
        table
    });

    it('should not throw when attributes used in a shared collection pk are defined with the same padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                baseEntity2,
            });
        }).to.not.throw();
    })

    it('should throw when attributes used in a shared collection pk are defined with differing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectPk,
            });
        }).to.throw('Inconsistent attribute(s) on the entity "incorrectPk". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "padded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://github.com/tywalch/electrodb#join');
    });

    it('should throw when attributes used in a shared collection pk are defined with missing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                actuallyHasPadding,
            });
        }).to.throw('Inconsistent attribute(s) on the entity "actuallyHasPadding". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "notPadded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://github.com/tywalch/electrodb#join');
    });

    it('should not throw when attributes used in a shared collection sk are defined with differing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectSk,
            });
        }).not.to.throw();
    });

    it('should not throw when pk attributes of the same name and index are defined with differing padding configurations but do not belong to the same collections', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectNonCollection,
            });
        }).not.to.throw();
    });
});