const { Entity } = require("./src/entity");
const { Service } = require("./src/service");
const { createCustomAttribute, CustomAttributeType, createSchema } = require('./src/schema');
const { ElectroError, ElectroValidationError, ElectroUserValidationError, ElectroAttributeValidationError } = require('./src/errors');

module.exports = {
    Entity,
    Service,
    ElectroError,
    createSchema,
    CustomAttributeType,
    createCustomAttribute,
    ElectroValidationError,
};
