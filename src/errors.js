// # Errors:
// 1000 - Configuration Errors
// 2000 - Invalid Queries
// 3000 - User Defined Errors
// 4000 - DynamoDB Errors
// 5000 - Unexpected Errors

function getHelpLink(section) {
  section = section || "unknown-error-5001";
  return `https://github.com/tywalch/electrodb#${section}`;
}

const ErrorCode = Symbol("error-code");

const ErrorCodes = {
  NoClientDefined: {
    code: 1001,
    section: "no-client-defined-on-model",
    name: "NoClientDefined",
    sym: ErrorCode,
  },
  InvalidIdentifier: {
    code: 1002,
    section: "invalid-identifier",
    name: "InvalidIdentifier",
    sym: ErrorCode,
  },
  InvalidKeyFacetTemplate: {
    code: 1003,
    section: "invalid-key-facet-template",
    name: "InvalidKeyFacetTemplate",
    sym: ErrorCode,
  },
  DuplicateIndexes: {
    code: 1004,
    section: "duplicate-indexes",
    name: "DuplicateIndexes",
    sym: ErrorCode,
  },
  CollectionNoSK: {
    code: 1005,
    section: "collection-without-an-sk",
    name: "CollectionNoSK",
    sym: ErrorCode,
  },
  DuplicateCollections: {
    code: 1006,
    section: "duplicate-collections",
    name: "DuplicateCollections",
    sym: ErrorCode,
  },
  MissingPrimaryIndex: {
    code: 1007,
    section: "missing-primary-index",
    name: "MissingPrimaryIndex",
    sym: ErrorCode,
  },
  InvalidAttributeDefinition: {
    code: 1008,
    section: "invalid-attribute-definition",
    name: "InvalidAttributeDefinition",
    sym: ErrorCode,
  },
  InvalidModel: {
    code: 1009,
    section: "invalid-model",
    name: "InvalidModel",
    sym: ErrorCode
  },
  InvalidOptions: {
    code: 1010,
    section: "invalid-options",
    name: "InvalidOptions",
    sym: ErrorCode
  },
  InvalidFilter: {
    code: 1011,
    section: "filters",
    name: "InvalidFilter",
    sym: ErrorCode
  },
  InvalidWhere: {
    code: 1012,
    section: "where",
    name: "InvalidWhere",
    sym: ErrorCode
  },
  InvalidJoin: {
    code: 1013,
    section: "join",
    name: "InvalidJoin",
    sym: ErrorCode
  },
  DuplicateIndexFields: {
    code: 1014,
    section: "duplicate-index-fields",
    name: "DuplicateIndexField",
    sym: ErrorCode,
  },
  DuplicateIndexFacets: {
    code: 1015,
    section: "duplicate-index-facets",
    name: "DuplicateIndexFacets",
    sym: ErrorCode,
  },
  InvalidAttributeWatchDefinition: {
    code: 1016,
    section: "invalid-attribute-watch-definition",
    name: "InvalidAttributeWatchDefinition",
    sym: ErrorCode
  },
  MissingAttribute: {
    code: 2001,
    section: "missing-attribute",
    name: "MissingAttribute",
    sym: ErrorCode,
  },
  IncompleteFacets: {
    code: 2002,
    section: "incomplete-facets",
    name: "IncompleteFacets",
    sym: ErrorCode,
  },
  MissingTable: {
    code: 2003,
    section: "missing-table",
    name: "MissingTable",
    sym: ErrorCode
  },
  InvalidConcurrencyOption: {
    code: 2004,
    section: "invalid-concurrency-option",
    name: "InvalidConcurrencyOption",
    sym: ErrorCode
  },
  InvalidAttribute: {
    code: 3001,
    section: "invalid-attribute",
    name: "InvalidAttribute",
    sym: ErrorCode
  },
  AWSError: {
    code: 4001,
    section: "aws-error",
    name: "AWSError",
    sym: ErrorCode,
  },
  UnknownError: {
    code: 5001,
    section: "unknown-error",
    name: "UnknownError",
    sym: ErrorCode,
  },
  GeneralError: {
    code: 5002,
    section: "",
    name: "GeneralError",
    sym: ErrorCode
  },
  LastEvaluatedKey: {
    code: 5003,
    section: "invalid-last-evaluated-key",
    name: "LastEvaluatedKey",
    sym: ErrorCode,
  },
  NoOwnerForPager: {
    code: 5004,
    section: "no-owner-for-pager",
    name: "NoOwnerForPager",
    sym: ErrorCode,
  },
  PagerNotUnique: {
    code: 5005,
    section: "no-owner-for-pager",
    name: "NoOwnerForPager",
    sym: ErrorCode,
  },
};

class ElectroError extends Error {
  constructor(err, message) {
    super(message);
    let detail = ErrorCodes.UnknownError;
    if (err && err.sym === ErrorCode) {
      detail = err
    }
    this.message = `${message} - For more detail on this error reference: ${getHelpLink(detail.section)}`;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ElectroError);
    }

    this.name = 'ElectroError';
    this.ref = err;
    this.code = detail.code;
    this.date = new Date();
    this.isElectroError = true;
  }
}

module.exports = {
  ElectroError,
  ErrorCodes
};
