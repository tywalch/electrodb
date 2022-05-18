# Changelog
All notable changes to this project will be documented in this file. Breaking changes to feature functionality will trigger a new Major Version increase. Significant feature improvements and major bug fixes will trigger Minor Version increases. Small, maintenance and additive changes will trigger Patch Version increases.     

## [Unreleased]
## Changing
- Bulk Operations to return the original object passed to the operation if that object was returned by DynamoDB as unprocessed.

## [1.0.0] - 2021-06-27
### Added
- new `.match()` method to replace original Find method functionality. [[read more]](./README.md#match-records)
- New `template` property on Model for building custom composite key templates. The `template` property also brings forward a new syntax similar to template literal syntax. [[read more]](./README.md#composite-attribute-templates)
- New custom composite key syntax using the `template` property. [[read more]](./README.md#composite-attribute-templates)
- Numeric table keys now possible. Before PK and SK values could only be strings, Numeric Keys are now supported through the `templates` index property. [[read more]](./README.md#numeric-keys) 

### Changed
- Rename of `facets` property on Model to `composite` for arrays and `template` for string templates. [[read more]](./README.md#the-renaming-of-index-property-facets-to-composite-and-template) 
- Get method now returns `null` when value is not found. Prior functionality returned an empty object. [[read more]](./README.md#get-record)
- Strict enforcement of all SK composite attributes being present when performing `.get()`, `.put()`, `.create()`, `.delete()`, `.remove()`, `.update()`, `.patch()` operations.
- Find method now does not add filters for values supplied, Find now only identifies an Index (if possible) and fulfills the Composite Attributes of that Index (if possible). [[read more]](./README.md#find-records)
- Query Option `lastEvaluatedKeyRaw` when used with _pagination_ replaced Query Option `pager` with option values: `"raw"`, `"item"`, `"named"`. Default set to `"named"`. [[read more]](./README.md#pager-query-options)  
- Query Option `lastEvaluatedKeyRaw` when used with _bulk operations_ replaced Query Option `unprocessed` with option values: `"raw"`, `"item"`. Default set to `"item"`. [[read more]](./README.md#query-options)

### Deprecated
- Removing `facets` property from documentation, examples, and TypeScript typing. Replaced with `composite` property for arrays and `template` for string templates. [[read more]](./README.md#facets)
- Fully deprecated custom facet string format. Facet strings defined attributes with a prefixed `:` as in `:storeId` would resolve to `storeId`. This has been replaced by the `template` syntax, surrounding the attribute with `${...}`. [[read more]](./README.md#composite-attribute-templates)
  
## [1.1.0] - 2021-07-07
### Added
- Expanding "collection" concept to include sub-collections. Sub-collections will allow for more precise cross-entity queries to be modeled. [[read more]](./README.md#sub-collections) 

### Fixed
- Addressed edge-case when modeling sparse indexes that would leave unable to be queried via secondary index. [[read more]](./RELEASE.md#fix-sparse-index-edge-case)

## [1.1.1] - 2021-07-07
### Added
- Added new syntax for Attribute Property `watch` to trigger whenever any attribute is updated/retrieved. [[read more]](./README.md#attribute-watching-watch-all)

### Changed
- The Attribute Property `readOnly` is now enforced _before_ `watch` properties are evaluated. This allows properties that use the Attribute Property `watch` to deliberately circumnavigate `readOnly` enforcement. [[read more]](./README.md#createdat-and-updatedat-attributes)
  
## [1.2.0] - 2021-07-31
### Added
- Added new update methods `append`, `add`, `subtract`, `data`, `remove`, `delete`, and `data` for improved support of all DynamoDB update methods. [[read more]](./README.md#update-record)

### Changed
- The property names of `ExpressionAttributeValues` underwent some change in this release due to the addition of new update operations. This is not a breaking change but if you have tests to match on the exact params returned from ElectroDB these will likely break. [[read more]](./RELEASE.md#expressionattributevalues-properties)
  
## [1.3.0] - 2021-08-09
### Added
- New Attribute types `map`, `list`, `set`. [[read more]](./README.md#expanded-syntax)
- New Query Options, and support for, `ReturnValues` as requested in Issue#71. [[read more]](./README.md#query-options) 
- New type definitions for recently released update methods `append`, `add`, `subtract`, `data`, `remove`, and `delete`. [[read more]](./README.md#exported-types) 

### Changed
- Attributes that have been flagged as `required` are now not possible to be removed (using the update method `remove()`) from a stored Item. This was an oversight from the last release.
- Attributes that have been flagged as `hidden` now skips invoking that attribute's getter method.  

### Fixed
- Issues that prevented the nesting of update `value()` operation.
- TypeScript type definitions for `get()` method now incorporate potential for `null` response.
- Type definitions for `value()` and `name()` where clause operations.  

## [1.3.1] - 2021-08-09
### Added
- New entity method `parse()` to expose ElectroDB formatting for values retrieved outside of ElectroDB. [[read more]](./README.md#parse)

## [1.3.2] - 2021-08-11
### Fixed
- Newly added method `parse()` had critical typo. Method now has an improved api, and appropriate tests [[read more]](./README.md#parse)

## [1.4.0] - 2021-08-22
### Added 
- Added support for choosing the case ElectroDB will use when modeling a Partition or Sort Key. [[read more]](./README.md#using-electrodb-with-existing-data)
- Added support for indexes to use fields that are shared with attribute fields. This should help users leverage ElectroDB with existing tables. [[read more]](./README.md#using-electrodb-with-existing-data)
- Added Query Option `ignoreOwnership` to bypass ElectroDB checks/interrogations for ownership of an item before returning it. [[read more]](./README.md#query-options)

## [1.4.1] - 2021-08-25
### Added
- Typedef support for RegExp validation on string attributes

### Fixed
- RegExp validation issue resulting in undefined (but not required) values being tested.

## [1.4.2] - 2021-09-09
### Fixed
- Typing for `.page()` method pager. Now includes the destructured keys associated with the index being queried. [[read more]](./README.md#page)
- Adding documentation, and expanding typing for the query option `limit`, for use in `.params()` calls. [[read more]](./README.md#query-options)

## [1.4.3] - 2021-10-03
### Fixed
- ElectroDB would throw when an `undefined` property was passed to query. This has been changed to not throw if a partial query on that index can be accomplished with the data provided.

## [1.4.4] - 2021-10-16
### Added
- Updates did not include composite attributes involved in primary index. Though these values cannot be changed, they should be `set` on update method calls in case the update results in an item insert. [[read more]](./README.md#updates-to-composite-attributes)

## [0.11.1] - 2021-10-17
### Patched
- Updates did not include composite attributes involved in primary index. Though these values cannot be changed, they should be `set` on update method calls in case the update results in an item insert. [[read more]](./README.md#updates-to-composite-attributes)

## [1.4.5] - 2021-10-17
### Fixed
- Improved .npmignore to remove playground oriented files, and created official directory to keep playground in sync with library changes.

## [1.4.6] - 2021-10-20
### Added, Fixed
- Adding Entity identifiers to all update operations. When primary index composite attributes were added in 1.4.4, entities were written properly but did not include the identifiers. This resulted in entities being written but not being readable without the query option `ignoreOwnership` being used.

## [1.4.7] - 2021-10-20
### Changed
- Using `add()` update mutation now resolves to `ADD #prop :prop` update expression instead of a `SET #prop = #prop + :prop`

### Fixed
- Fixed param naming conflict during updates, when map attribute shares a name with another (separate) attribute.

## [1.4.8] - 2021-11-01
### Fixed
- Addressed issue#90 to flip batchGet's response tuple type definition.

## [1.5.0] - 2021-11-07
### Changed
- Queries will now fully paginate all responses. Prior to this change, ElectroDB would only return items from a single ElectroDB query result. Now ElectroDB will paginate through all query results. This will impact both uses of entity queries and service collections. [[read more](./README.md#query-method)]
- The query option `limit` has an extended meaning with the change to automatically paginate records on query. The option `limit` now represents a target for the number of items to return from DynamoDB. If this option is passed, Queries on entities and through collections will paginate DynamoDB until this limit is reached or all items for that query have been returned. [[read more](./README.md#query-options)]

### Added
- A new query option `pages` has been added to coincide with the change to automatically paginate all records when queried. The `pages` option sets a max number of pagination iterations ElectroDB will perform on a query. When this option is paired with `limit`, ElectroDB will respect the first condition reached. [[read more](./README.md#query-options)]

## [1.6.0] - 2021-11-21
### Added
- Exporting TypeScript interfaces for `ElectroError` and `ElectroValidationError`
- Errors thrown within an attribute's validate callback are now wrapped and accessible after being thrown. Prior to this change, only the `message` of the error thrown by a validation function was persisted back through to the user, now the error itself is also accessible. Reference the exported interface typedef for `ElectroValidationError` [here](./index.d.ts) to see the new properties available on a thrown validation error.

### Changed
- As a byproduct of enhancing validation errors, the format of message text on a validation error has changed. This could be breaking if your app had a hardcoded dependency on the exact text of a thrown validation error.

### Fixed
- For Set attributes, the callback functions `get`, `set`, and `validate` are now consistently given an Array of values. These functions would sometimes (incorrectly) be called with a DynamoDB DocClient Set.

## [1.6.1] - 2021-12-05
### Fixed
- In some cases the `find()` and `match()` methods would incorrectly select an index without a complete partition key. This would result in validation exceptions preventing the user from querying if an index definition and provided attribute object aligned improperly. This was fixed and a slightly more robust mechanism for ranking indexes was made.

## [1.6.2] - 2022-01-27
### Changed
- The methods `create`, `patch`, and `remove` will now refer to primary table keys through parameters via ExpressionAttributeNames when using `attribute_exists()`/`attribute_not_exists()` DynamoDB conditions. Prior to this they were referenced directly which would fail in cases where key names include illegal characters. Parameter implementation change only, non-breaking.

## [1.6.3] - 2022-02-22
### Added
- Add `data` update operation `ifNotExists` to allow for use of the UpdateExpression function "if_not_exists()".

## [1.7.0] - 2022-03-13
### Added
- New feature: "Listeners". Listeners open the door to some really cool tooling that was not possible because of how ElectroDB augments raw DynamoDB responses and did not provide easy access to raw DyanmoDB parameters. [[read more](./README.md#listeners)]

## [1.7.1] - 2022-03-19
### Added
- Adding support for the v3 DyanmoDBClient. This change also brings in a new ElectroDB dependency [@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb). [[read more](./README.md#aws-dynamodb-client)]

## [1.7.2] - 2022-03-27
### Fixed
- Fixed issue#111, `update` method specific query option typing no longer lost when using a `where` method in a query chain
- Fixing incorrect typing for exposed `UpdateEntityItem` type. Exported type was missing composite key attributes

## [1.8.0] - 2022-03-28
### Added
- Expected typings for the injected v2 client now include methods for `transactWrite` and `transactGet`
### Changed
- Map attributes will now always resolve to least an empty object on a `create` and `put` methods (instead of just the root map)
- In the past, default values for property attributes on maps only resolves when a user provided an object to place the values on. Now default values within maps attributes will now always resolve onto the object on `create` and `put` methods.

## [1.8.1] - 2022-03-29
### Fixed
- Solidifying default application methodology: default values for nested properties will be applied up until an undefined default occurs or default callback returns undefined

## [1.8.2] - 2022-05-13
### Fixed
- Issue impacting the successful propagation loggers and listeners from a Service definition to Entity children

## [1.8.3] - 2022-05-14
### Changed
- Removing validation that requires at least one attribute to be provided in a PK composite. This opens the door to static PKs if the user so chooses