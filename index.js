const { Entity } = require("./src/entity");
const { Service } = require("./src/service");
const { createCustomAttribute } = require('./src/schema');
const { ElectroError, ElectroValidationError, ElectroUserValidationError, ElectroAttributeValidationError } = require('./src/errors');

module.exports = {
    Entity,
    Service,
    createCustomAttribute,
    ElectroError,
    ElectroValidationError,
};
