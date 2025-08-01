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

- New entity method `parse()` to expose ElectroDB formatting for values retrieved outside ElectroDB. [[read more]](./README.md#parse)

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
- New feature: "Listeners". Listeners open the door to some really cool tooling that was not possible because of how ElectroDB augments raw DynamoDB responses and did not provide easy access to raw DynamoDB parameters. [[read more](./README.md#listeners)]

## [1.7.1] - 2022-03-19
### Added
- Adding support for the v3 DynamoDBClient. This change also brings in a new ElectroDB dependency [@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb). [[read more](./README.md#aws-dynamodb-client)]

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

## [1.8.4] - 2022-05-18
### Changed
- Removing validation that an attribute used for one index cannot be used by another. ElectroDB will now simply validate that all composite attributes associated with an indexed field are identical, and that a field is not used as both a PK and SK in separate indexes. This change allows for LSIs to be used with ElectroDB

## [1.9.0] - 2022-06-18
### Added
- Add new batchGet query option, `preserveBatchOrder`, which will ensure the order returned by a batchGet will be the same as the order provided. [[read more](./README.md#query-options)]

## [1.10.0] - 2022-06-29
### Fixed
- TypeScript 4.7 introduced changes that caused type inference issues with the Entity, Service, and exposed types. A re-vamp of some typing was done to rectify these issues, new tests and existing tests were made work with the latest versions of TypeScript and tsd.

### Changed
- Project now is more deliberate about the types exposed via the package. This is because I have moved away from a single type definition file (which by default exports all types). If you had a dependency on a type that used to be exposed, open a ticket and I can expose it. In the future exposed types will be the only types officially supported by semver.

## [1.10.1] - 2022-06-30
### Fixed
- Exported additional types

## [1.10.2] - 2022-07-02
### Fixed
- Reorganizing type definition files into single file again to appease the frontend dependency overlords in https://electrodb.fun

## [1.11.0] - 2022-07-04
### Added
- Adding support for "ProjectionExpressions" via the Query Option: `attributes` [[read more](./README#query-options)]

## [1.11.1] - 2022-07-06
### Fixed
- Sort keys for queries will now match on equality when all sort key composite attributes are provided in full. Prior to this release, ElectroDB would use `begins_with(...)` which could potentially result in data leakages if a sort key's value was the starting prefix to another sort key value. [[read more](./README.md#begins-with-queries)]

## [1.12.0] - 2022-08-11
### Added
- Added support for attribute types "enum string set" and "enum number set". This will allow users to define a finite list of values (strings or numbers ) supported for a set [[read more](./README#set-attributes)]
- TypeScript support for "Custom Attributes", bring your own types to express complex attributes. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#custom-attributes)]

## [2.0.0] - 2022-09-19 [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#version-2-migration)]

### Added
- Additional exported types to match new response structures. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#custom-attributes)]

### Changed
- Changing response structure on all methods to be an object with query results on a `data` property. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#version-2-migration)]
- Pagination is now performed via the `.go()` terminal method, and the LastEvaluatedKey is now returned a string `cursor`. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#cursor-pagination)]
- The `go()` terminal method now only queries one page by default. To auto-page (to match functionality prior to this change), pass the query option `pages` with a value of `'all'`. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#unified-pagination-apis)]

### Deprecated
- The boolean query option `raw` and `returnKeys` have been deprecated (still accepted for the time being) and replaced with the query option `data`, which accepts the values `'raw'`, `'includeKeys'`, `'attributes'` or `undefined`.

### Removed
- `.page()` terminal method. All pagination is now done through the `.go()` method. Queries and scans now return a `cursor` property (of type "string") to be passed on subsequent pagination requests. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#unified-pagination-apis)]

## [2.1.0] - 2022-10-02
### Added
- Added a new attribute property `padding` to aid with zero padding patterns. [[read more](#attribute-definition)]

## [2.1.1] - 2022-10-09
### Fixed
- Defect with sort key composition that would treat falsely values as absent attributes.

## [2.1.2] - 2022-10-16
### Added
- Now exporting `ElectroValidationError` and `ElectroError` as classes, so they can be more easily interrogated/triaged by user error handling.

### Fixed
- On `update` and `patch` operations, the `data` method did not properly apply mutation constraints for `required` and `readOnly`. Data will now correctly throw in a similar manner the to individual mutation methods.

## [2.2.0] - 2022-10-31
### Added
- A BIG addition to the library: Clustered Indexes. Clustered indexes allow for Collections to be composed of more similar, homogenous data.
- The addition of new Entity and Service methods: `setTableName`, `getTableName`, `setClient`, `getClient`.

## [2.2.1] - 2022-11-02
### Fixed
- Addressed GitHub issue #144, root map attributes would set an empty object regardless if the user supplied it.

## [2.2.2] - 2022-11-04
### Added
- (since rolled back) ~The return type from an update/patch call now returns an Entity item when `all_new` or `all_old` response options are passed~

## [2.2.3] - 2022-11-05
### Remove
- Backed out the response typing change added in `2.2.2`. The type of record coming back from an update is more complex than one might expect. Because update operations can result in a record insert, the response type is not necessarily a TableItem. I am backing out this change for now until I can be more sure of an appropriate typing.

### Added
- New function to help with Custom Types: CustomAttributeType. This replaces `createCustomAttribute` (now depreciated) because of the unfortunate widening caused by the initial implementation. [[read more](https://github.com/tywalch/electrodb/blob/master/README.md#custom-attributes))]

### Deprecated
- The function `createCustomAttribute` is now deprecated. The function still operates as it did, though any changes related to Custom Attribute types will see development focused on `CustomAttributeType` rather than this function.

## [2.2.4] - 2022-11-06
### Fixed
- Addressed issue#162: attribute validation functions were not invoked when updating through the `data` method.
- Conditional filters can now be added to `get` operations. DynamoDB `get` does not allow for filtering but the TransactWrite/TransactGet methods allow for `ConditionCheck` which is essentially `get` + `conditions`.

## [2.2.5] - 2022-11-09
### Fixed
- Addressed [issue#172](https://github.com/tywalch/electrodb/issues/172), where clause mishandling of nested attribute references

## [2.2.6] - 2022-11-10
### Fixed
- Addressed issue where scans would incorrectly accumulate filters across usages

## [2.3.0] - 2022-11-22
### Added
- Adding new update method: `upsert`. Upsert is similar to `put` in that it will create a record if one does not exist, except `upsert` perform an update if that record already exists.

## [2.3.1] - 2022-11-23
### Fixed
- Address issue#179, the query option `table` was not correctly propagated, resulting a failure for that declared the table name was "missing"

## [2.3.2] - 2022-11-23
### Fixed
- Upsert method would silently disregard `where` clause usage, and would not add condition expression to parameters.

## [2.3.3] - 2022-11-28
### Fixed
- Issue #182: Addressed inconsistency with `remove` and `delete` functionality between `update` and `patch` methods.

## [2.3.4] - 2022-12-17
### Milestone
- First code contribution by user @NoahDavey (via [PR-197](https://github.com/tywalch/electrodb/pull/197)). Fixes boolean evaluation during upsert

## [2.3.5] - 2022-12-18
### Fixed
- Fixes issue that resulted in provided undefined values from becoming involuntarily set via updates
- Updated documentation links in error message to direct traffic to https://electrodb.dev

## [2.4.0] - 2022-01-19
### Added
- Adds the new filter expression methods: `size()`, `type()` and `escape`. Addresses Issue#208 [[read more]](https://electrodb.dev/en/queries/filters/#operations)
- Adds the `createSchema()` function for helping create and type ElectroDB schemas without instantiating an Entity. Addresses Issue#167. [[read more]](https://electrodb.dev/en/reference/typscript/#createSchema)

## [2.4.1] - 2023-01-20
### Fixed
- Recently added `createSchema()` function would validate but not return the schema object provided

## [2.4.2] - 2023-03-03
### Fixed
- Restores `ignoreOwnership` execution option. Addresses [Issue #194](https://github.com/tywalch/electrodb/issues/194) which calls out regression with `ignoreOwnership`. This flag is now appropriately applied to "query", "get", and "scan" operations.

## [2.5.0] - 2023-03-19
### Added
- Adds transaction functionality: `get` and `write` transactions are now supported in ElectroDB via [transact write](https://electrodb.dev/en/mutations/transact-write) and [transact get](https://electrodb.dev/en/queries/transact-get) methods.

## [2.5.1] - 2023-03-22
### Fixed
- The previous version exported typings directly from the AWS dynamodb client package which, because it was so large, caused the playground to take a massive performance hit. Instead, the library now expose a simplistic version of those types instead.

## [2.6.0] - 2023-05-22
### Added
- Adds new query execution option `hydrate`. When a GSI uses a `KEYS_ONLY` projection, the `hydrate` option will perform the query and then a subsequent `batchGet` to "hydrate" the results.
- Adds new `conversion` methods to help transform values between "composite attributes", "keys", and "cursors".
- Adds improved return typing for `patch` operations. The response type for `patch` now returns an Entity item when passed the execution options `{ response: 'all_new' }` or `{ response: 'all_old' }`.

### Fixed
- A common issue amongst new users, was unexpected errors when using a terminal method twice on a query chain. This would often come up when a user called `.params()` to log out parameters and then call `.go()` on the same chain. The fix was to prevent duplicative side effects from occurring on each subsequent terminal method call.
- Fixes typing issue with transactGet api that would type `response.data` as `never` when the transaction included more than one element.

## [2.6.1] - 2023-06-09
### Added
- For queries, ElectroDB now trims the ExclusiveStartKey object to only include the keys associated with the index provided. DynamoDB currently rejects queries when properties not associated with the keys of the queried index are provided on the ExclusiveStartKey. By removing irrelevant properties, ElectroDB offers users more flexibility and opportunities for dynamic querying.

## [2.7.0] - 2023-07-01

### Fixed
- Fixes return typing for `delete`, `remove`, `update` and `upsert` operations. These types were incorrect and did not reflect the real values returned. Instead of breaking the APIs, changing response types to `T | null`, the new response type is now the Entity's key composite values by default. You can also now use the Execution Option `response` to get back the item as it exists in the table. This is the closed I could get to a non-breaking change that also fixes the incorrect return typing for these methods.
- Fixes typing for `contains` where conditions to accept collection element values (e.g., `set` and `list` type attributes).
- The exported type `UpdateEntityItem` was incorrectly typed, it now includes the correct typing as the values that can be passed to the `set` method

### Changed
- Upsert operations now take into consideration `readOnly` attributes when applying changes. If an attribute is configured as `readOnly` ElectroDB will apply the property with an `if_not_exists` set operation to prevent overwriting the existing value if one is set.

## [2.7.1] - 2023-07-03
### Fixed
- Upsert now only allies `if_not_exists()` if the attribute is not a composite attribute in an index.

## [2.7.2] - 2023-07-03
### Fixed
- Fixed bug reported via [Issue #271](https://github.com/tywalch/electrodb/issues/271): Root map object with required flag would not set empty object even when it was provided.

## [2.8.0] - 2023-08-06
### Adds
- Adds new `cast` option for indexes to allow users to cast index values to a different type than their composite attribute. This change comers from a user requested feature and addresses issue #237

### Fixed
- Fixed edge case when model defines an index without composites while using the template syntax that prevented `ignoreOwnership` from correctly gating return records

## [2.8.1] - 2023-08-06
### Fixed
- Fixes bug with creating sets when client is provided or changed after initial Entity construction

## [2.8.2] - 2023-08-19
### Fixed
- Fixes bug reported via [Issue #281](https://github.com/tywalch/electrodb/issues/281): ElectroDB failed to use an attribute's `field` name when it was updated via `watch`.
- Fixes bug reported via [Issue #229](https://github.com/tywalch/electrodb/issues/229): ElectroDB would generate empty string keys on item creating. This would occur only in cases where a key's field name matched an attribute's field name.

### Changed
- Relaxes validation surrounding the use of composite attributes appearing as composite attributes in both the partition and sort key for the same index. Reported in [Issue#265](https://github.com/tywalch/electrodb/issues/265), validation surrounding this pattern have been relaxed to only throw when a composite attribute in both the pk and sk AND the sk contains greater than one composite attribute. This constraint is critical for ElectroDB to reliably generate/format sort key values.

## [2.9.0]
### Added
- Addresses [Issue #277](https://github.com/tywalch/electrodb/issues/277) Introduces new `composite()` method for `update` and `patch` operations. The `composite` method is used to help electrodb complete and format keys when updating a subset of the key's composite attributes. Prior to this update, updating a key partially resulted in an [invalid query error](https://electrodb.dev/en/reference/errors/#missing-composite-attributes), which [caused difficulties](https://github.com/tywalch/electrodb/issues/277) when some composite attributes were flagged as readOnly. [[read more](https://electrodb.dev/en/mutations/patch#composite)]
- Adds more deliberate collection validation to ensure entity compatibility. This will allow for indexes defined with "template" be used with collections. This also might cause some existing implementations to now throw on service instantiation, however that would mean these services were never valid to begin with.

## [2.9.1]
### Fixed
- Version `2.9.0` was accidentally published without the dependency `@aws-sdk/lib-dynamodb`

## [2.9.2]
### Changed
- The `composite()` method for `update` and `patch` now adds a condition expression that allows for cases where the composite attribute doesn't exist. Prior to this change the condition used a strict equals check on the attribute value (e.g. `#prop1 = :prop1`). This change now revises that expression to `(#prop1 = :prop1 OR attribute_not_exists(#prop1))`.

## [2.9.3]
### Revert
- Reverts change in `2.9.2`. The `composite()` method no longer allows for `attribute_not_exists()`.

### Fixed
- Composite attributes that used the attribute option `watch`, and were not provided to the `create` or `put` methods, were not property applied to their composite keys. This addresses the issue brought forward in [discussion #292](https://github.com/tywalch/electrodb/discussions/292).

## [2.10.0]
### Added
- The `upsert` method now supports `add`, `subtract`, `append`, `set`, and `ifNotExists` operations. Addresses [Issue #286](https://github.com/tywalch/electrodb/issues/286).
- The `add` and `subtract` operations provided to the `data` callback operation with `update` and `patch` methods now supports a third parameter for supply a defaultValue. Addresses [Issue #297](https://github.com/tywalch/electrodb/issues/297).
- A condition expression operation called `field` that allows for references to raw field names as they exist in the table. This can be used with `escape` and `value` to create custom filter expressions.

## [2.10.1]
## Added
- Transact `upsert` now supports `add`, `subtract`, `append`, `set`, and `ifNotExists` operations. Addresses [Issue #301](https://github.com/tywalch/electrodb/issues/301).

## [2.10.2]
### Fixed 
- Addresses [Issue #308](https://github.com/tywalch/electrodb/issues/308) and [Issue #228](https://github.com/tywalch/electrodb/issues/228) 

## [2.10.3]
### Fixed
- Addresses edge case that filtered valid items when item lacked entity identifiers (created outside ElectroDB) when keys (pk or sk) were numeric.

## [2.10.4] - 2023-10-26
> NOTE: This version is deprecated, this version introduced code that significantly increased latency. That code was fixed in `2.10.7` 
### Added
- Adds `cause` property to `ElectroError`, currently populated when error originates from the AWS Client, to help with error triage. This also adds the ability to provide an error type to ElectroError<Error> to type the error located on `cause`.

## [2.10.5] - 2023-11-03
### Fixed
- Addresses bug in `patch` and `update` methods that caused key composite attributes to be set with their attribute name not their "field" name. This would impact users who both use the `update` method to create new items and use alternative field name definitions for their composite keys. All other users would likely be silently impacted by this issue. 

## [2.10.6] - 2023-11-04
### Fixed
- Addresses [Issue #321](https://github.com/tywalch/electrodb/issues/321), fixing expression attribute name and value formatting to remove non-alphanumeric and underscore characters.

## [2.10.7] - 2023-11-09
### Fixed
- Fixes latency issue introduced in `2.10.4` affecting all queries discovered and brought forward by Ross Gerbasi. Thank you, Ross Gerbasi!

## [2.11.0] - 2023-11-12
### Added
- Adds new property `scope` to index definitions, allowing users to further isolate partition keys beyond just `service` participation. This implements an RFC that was thoughtfully put forward by [@Sam3d](https://github.com/sam3d) in [Issue #290](https://github.com/tywalch/electrodb/issues/290). Thank you, Brooke for your contribution!

## [2.12.0] - 2023-11-27
### Added
- Adds support for nested usage of `any` and `CustomAttributeType` attribute types. Prior to this release, `any` and `CustomAttributeType` could only be used with root attributes. This change adds support for `CustomAttributeType` to be used with `map` attributes. 
- Adds new `condition` property [on index definitions](https://electrodb.dev/en/modeling/indexes#sparse-indexes) to prevent unnecessary GSI writes & hot partitions for certain data models. The provided `condition` callback will be invoked at query-time, passed all attributes set on that mutation, and if it returns `false` the index will not be written to your DynamoDB table. Addresses [Issue #330](https://github.com/tywalch/electrodb/issues/300).

## [2.12.1] - 2023-11-29
### Fixed
- Adds more sophisticated custom attribute type extraction. Patch provided by GitHub user @wentsul with an assist by @adriancooney via [PR #332](https://github.com/tywalch/electrodb/pull/334). Thank you both for this great addition!

## [2.12.2] - 2023-12-18
### Fixed
- Fixes bug where `scan` appended invalid filters if some cases. In cases where [attributes are used as keys](https://electrodb.dev/en/modeling/indexes/#attributes-as-indexes) or [composite templates contain no prefixes](https://electrodb.dev/en/modeling/indexes/#composite-attribute-templates) the `scan` operation would append invalid filters to parameters. This bug was identified by discord user @engi22, thank you!

## [2.12.3] - 2023-12-26
### Fixed
- Collection queries returned an `undefined` cursor (currently typed as `string | null`) when using the `raw:true` execution option. Fixed to return `null` instead of `undefined`.
- Removed superfluous and unused files, `./library-data.json` and `test.csv`, accidentally published in version `2.12.2`.

## [2.13.0] - 2023-12-28
### Added
- Adds new query execution option `count` which allows you to specify a specific item count to return from a query. This is useful for cases where you must return a specific/consistent number of items from a query, a deceptively difficult task with DynamoDB and Single Table Design.

## [2.13.1] - 2024-01-23
### Fixed
- Fixes custom attribute type extraction for union types with RecordItem. Patch provided by GitHub user @wentsul via [PR #346](https://github.com/tywalch/electrodb/pull/346). Thank you for another great addition! 

## [2.14.0] - 2024-04-29
### Fixed/Changed
- Addresses [Issue #366](https://github.com/tywalch/electrodb/issues/366) with unexpected outcomes from index `condition` usage. Discussion [inside the issue ticket](https://github.com/tywalch/electrodb/issues/366) revealed complexities associated with the implementation of the `condition` callback. Previously, a callback returning `false` would simply not write the fields associated with an index on update. Through discussion with [@sam3d](https://github.com/sam3d) and [@nonken](https://github.com/nonken), it was revealed that this behavior could lead to inconsistencies between indexes and attributes. Furthermore, this behavior did not align with user expectations/intuitions, which expected a `false` response to trigger the removal of the item from the index. To achieve this, it was discussed that the presence of a `condition` callback should add a _new_ runtime validation check on all mutations to verify all member attributes of the index must be provided if a mutation operation affects one of the attributes. Previously ElectroDB would validate only that composite members of an index field (a partition or sort key) within an index were fully provided; now, when a condition callback is present, it will validate that all members from both fields are provided. If you are unable to update/patch all member attributes, because some are readOnly, you can also use the [composite](https://electrodb.dev/en/mutations/patch#composite) method on [update](https://electrodb.dev/en/mutations/update#composite) and [patch](https://electrodb.dev/en/mutations/patch#composite). More information and the discussion around the reasoning behind this change can be found [here](https://github.com/tywalch/electrodb/issues/366). Failure to provide all attributes will result in an [Invalid Index Composite Attributes Provided Error](https://electrodb.dev/en/reference/errors#invalid-index-composite-attributes-provided).

## [2.14.1] - 2024-05-17
### Fixed
- Further fixes in service of [Issue #366](https://github.com/tywalch/electrodb/issues/366). A bug was discovered that the logic to validate the presence of an attribute was a simple falsey check instead of a check that the value was `undefined`. This caused empty strings, zero values, and the boolean value `false` to incorrectly be considered missing.  

## [2.14.2] - 2024-07-07
### Fixed
- Raised via [Issue #196](https://github.com/tywalch/electrodb/issues/196) and [Issue #390](https://github.com/tywalch/electrodb/issues/398), a breaking change was made to the project's dependency `@aws-sdk/lib-dynamodb`. The change resulted in the error `Error: Cannot find module '@aws-sdk/lib-dynamodb/dist-cjs/commands/utils'`. This change updates ElectroDB's dependency version to the static version `3.395.0`, a version known to be compadible. Thank you github users @miyamonz, @kevinlonigro, @srodriki, @pablote, @sargisshahinyan, and @arpadgabor!

## [2.14.3] - 2024-07-29
### Fixed
- Raised via [Issue #196](https://github.com/tywalch/electrodb/issues/412) and [Discussion 361](https://github.com/tywalch/electrodb/discussions/361); When using a clustered index with an empty composite array, `update` and `patch` methods would not correctly form the complete sort key value for the index. This would prevent impacted items from being queried via an Entity, though they could be queried via a collection on a Service. Thank you to github users @daniel7byte and @santiagomera for raising this issue!

## [2.15.0] - 2024-09-19
### Updated
- Updated `@aws-sdk/lib-dynamodb` dependency from pinned version `3.395.0` to latest release `^3.654.0`. This impacts users using the v3 aws-sdk.
- Adds dependency `@aws-sdk/util-dynamodb` for unmarshalling functionality.

## [2.15.1] - 2025-02-11
### Hotfix
- Fixed typing for "batchGet" where return type was not defined as a Promise in some cases. This change is the 2.0.0 hotfix, the corresponding 3.0.0 change was introduced in [3.2.0](#320).

## [3.0.0] 
### Changed
- ElectroDB is changing how it generates query parameters to give more control to users. Prior to `v3`, query operations that used the `gt`, `lte`, or `between` methods would incur additional post-processing, including additional filter expressions and some sort key hacks. The post-processing was an attempt to bridge an interface gap between attribute-level considerations and key-level considerations. Checkout the GitHub issue championed by @rcoundon and @PaulJNewell77 [here](https://github.com/tywalch/electrodb/issues/228) to learn more. With `v3`, ElectroDB will not apply post-processing to queries of any type and abstains from adding implicit/erroneous filter expressions to queries _by default_. This change should provide additional control to users to achieve more advanced queries, but also introduces some additional complexity. There are many factors related to sorting and using comparison queries that are not intuitive, and the simplest way to mitigate this is by using additional [filter expressions](https://electrodb.dev/en/queries/filters/) to ensure the items returned will match expectations. To ease migration and adoption, I have added a new execution option called `compare`; To recreate `v2` functionality without further changes, use the execution option `{ compare: "v2" }`. This value is marked as deprecated and will be removed at a later date, but should allow users to safely upgrade to `v3` and experiment with the impact of this change on their existing data. The new `compare` option has other values that will continue to see support, however; to learn more about this new option, checkout [Comparison Queries](https://electrodb.dev/en/queries/query#comparison-queries).
- The `validate` callback on attributes now expects a strict return type of `boolean`. Additionally, the semantic meaning of a boolean response has _flipped_. The callback should return `true` for "valid" values and `false` for "invalid" values. If your validation function throws an error, ElectroDB will still behave as it previously did in `v2`, by catching and wrapping the error.
- Providing the execution option `limit` on queries now _only_ applies a `Limit` parameter to its request to DynamoDB. Previously, the `limit` option would cause ElectroDB to effectively "seek" DynamoDB until the limit was _at least_ reached. The execution option `count` can be used in similar cases where `limit` was used, but performance may vary depending on your data and use case.
### Removed
- The execution options `includeKeys` and `raw` were deprecated in version `2.0.0` and have now been removed in favor of the execution option `data`. To migrate from `v2`, use the options `{ data: "includeKeys" }` and `{ data: "raw" }` respectively.
### Fixed
- Response typing and formatting logic for `delete` 

## [3.0.1]
### Fixed
- The execution option `{ compare: "attributes" }` used incorrect expression comparisons that impacted `lte` queries on indexes with a single composite key.   

## [3.1.0]
### Fixed
- [Issue #464](https://github.com/tywalch/electrodb/issues/464); When specifying return attributes on retrieval methods, ElectroDB would unexpectedly return null or missing values if the options chosen resulted in an empty object being returned. This behavior could be confused with no results being found. ElectroDB now returns the empty object in these cases.

### Added
- ElectroDB Error objects no contain a `params()` method. If your operation resulted in an error thrown by the DynamoDB client, you can call the `params()` method to get the compiled parameters sent to DynamoDB. This can be helpful for debugging. Note, that if the error was thrown prior to parameter creation (validation errors, invalid query errors, etc) then the `params()` method will return the value `null`. 

## [3.2.0]
### Fixed
- When updating an item with a map attribute, if you attempt to set multiple keys that are identical after removing non-word characters `(\w)`, Electro will generate the same expression attribute name for both keys. This occurs even though the original keys are different, leading to conflicts in the update operation. This update introduces a new change that ensures that each key will generate a unique expression attribute name. Contribution provided by [@anatolzak](https://github.com/anatolzak) via [PR #461](https://github.com/tywalch/electrodb/pull/461). Thank you for your contribution!

## [3.3.0]
- Fixed typing for "batchGet" where return type was not defined as a Promise in some cases.

### Added
- [Issue #416](https://github.com/tywalch/electrodb/issues/416); You can now use reverse indexes on keys defined with a `template`. Previously, ElectroDB would throw if your entity definition used a `pk` field as an `sk` field (and vice versa) across two indexes. This constraint has been lifted _if_ the impacted keys are defined with a `template`. Eventually I would like to allow this for indexes without the use of `template`, but until then, this change should help some users who have been impacted by this constraint.

## [3.4.0]
### Added
- [Issue #416](https://github.com/tywalch/electrodb/issues/416); You can now use reverse indexes without the use of `template`.

## [3.4.1]
### Fixed
- [Issue #475](https://github.com/tywalch/electrodb/issues/475); Fixes issue where some users reported errors exporting entities and/or types when using the `CustomAttributeType` function. They would receive an error similar to `Exported variable '...' has or is using name 'OpaquePrimitiveSymbol' from external module "..." but cannot be named.`.  

## [3.4.2]
### Fixed
- [Issue #483](https://github.com/tywalch/electrodb/issues/483): This fix addresses the problem where ElectroDB returned an empty object when the get method was called for a non-existent item and the `attributes` parameter was specified. It now correctly returns `null` as expected.

## [3.4.3]
### Fixed
- [Issue #439](https://github.com/tywalch/electrodb/issues/439); Fixed missing TypeScript types for `attributes` property on `scan`, `find`, and `match` methods.

## [3.4.4]
### Fixed
- [Issue #516](https://github.com/tywalch/electrodb/issues/516); Fixed the missing ProjectionExpression parameter when performing a batchGet with specific attributes to return.