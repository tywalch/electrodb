# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
## Change
- Bulk Operations to return the original object passed to the operation if that object was returned by DynamoDB as unprocessed.
- New Update API (non-breaking) to allow for more operations than just `set`.
- Complex Attribute support for "list", "set", and "map".

## [1.0.0] - 2021-06-27
### Added
- new `.match()` method to replace original Find method functionality [[read more]](./README.md#match-records)
- New `template` property on Model for building custom composite key templates. The `template` property also brings forward a new syntax similar to template literal syntax. [[read more]](./README.md#composite-attribute-templates)
- New custom composite key syntax using the `template` property. [[read more]](./README.md#composite-attribute-templates) 

### Changed
- Rename of `facets` property on Model to `composite` for arrays and `template` for string templates. [[read more]](./README.md#The-renaming-of-index-property-Facets-to-Composite-and-Template) 
- Get method now returns `null` when value is not found. Prior functionality returned an empty object. [[read more]](./README.md#get-record)
- Find method now does not add filters for values supplied, Find now only identifies an Index (if possible) and fulfills the Composite Attributes of that Index (if possible). [[read more]](./README.md#find-records)  
- Query Option `lastEvaluatedKeyRaw` when used with _pagination_ replaced Query Option `pager` with option values: `"raw"`, `"item"`, `"named"`. Default set to `"named"`. [[read more]](./README.md#pager-query-options)  
- Query Option `lastEvaluatedKeyRaw` when used with _bulk operations_ replaced Query Option `unprocessed` with option values: `"raw"`, `"item"`. Default set to `"item"`. [[read more]](./README.md#query-options)
- Strict enforcement of all SK composite attributes being present when performing `.get()`, `.put()`, `.create()`, `.delete()`, `.remove()`, `.update()`, `.patch()` operations.

### Deprecated
- Removing `facets` property from documentation, examples, and TypeScript typing. Replaced with `composite` property for arrays and `template` for string templates. [[read more]](./README.md#facets)
- Fully deprecated custom facet string format. Facet strings defined attributes with a prefixed `:` as in `:storeId` would resolve to `storeId`. This has been replaced by the `template` syntax, surrounding the attribute with `${...}`. [[read more]](./README.md#composite-attribute-templates)   