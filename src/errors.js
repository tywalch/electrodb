// # Errors:
// 1000 - Configuration Errors
// 2000 - Invalid Queries
// 3000 - User Defined Errors
// 4000 - DynamoDB Errors
// 5000 - Unexpected Errors

const ErrorCodes = {
  NoClientDefined: 1001,
};

class ElectroError extends Error {
  constructor(code = 'bar', ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ElectroError);
    }

    this.name = 'ElectroError';

    this.code = code;
    this.date = new Date()
  }
}

module.exports = {
  ElectroError,
  ErrorCodes
};
