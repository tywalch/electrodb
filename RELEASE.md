# Release Notes
Additional detail for changes/fixes/etc that we're too much for the [changelog](./CHANGELOG.md)

## [1.1.0]
### Fix Sparse Index Edge Case
If a record is created with a sparse GSI, the Partition and Sort Keys for that index will not be written onto the record. Additionally, if sparse key is later used, via an update to the composite attributes associated with that GSI, ElectroDB will update the index fields that we're impacted by the update. 

The edge-case comes from index fields that are made from an empty composite array. These never get written, meaning they cannot be queried through traditional ElectroDB queries. The fix will examine if an index PK is impacted by a change, determine that index is defined with an empty composite array, and then if both are true write the Entity's SK prefix to the SK field. 

## [1.1.0]
### Watch All Syntax
The approach for "Watch All" syntax for attributes (e.g. `{watch: "*"}`) weighed several factors in its design:
1. It was likely better to leave the array syntax to strictly contain attributes, and not create an exception for some attribute names like `"*"`, which hasn't yet been done on this project. The closest are the model "identifiers" (`__edb_e__`, `__edb_v__`) but work was done there to allow a user to customize those on the off chance they conflicted with user attributes.
2. An empty array was briefly considered to signify "Watch All", but for a property with significant consequences, it did not seem wise to use an indirect mechanism for defining that behaviour.
3. Since "Watch All" ultimately invalidates the need to specify any attributes, modeling the option as either an array or one static value made sense.
4. The future could see additional string values, for example: 
    - `"keys"` - update whenever a composite key changes
    - `"patch"`/`"update"`/`"query"/`"get"` - whenever a specific method is called
    - `"${accessPattern}"` - whenever a specific index is queried (violates the reasons laid out in #1 above but still worth considering)
5. When Complex Attributes are added, there needs to be consideration about how these properties will fall into the `watch`, `set`, and `get` syntax. That is a larger consideration, but in regard to `watch`, having a wildcard type character could be very powerful. Imagine the following examples:
    - `{ watch: ["myMapAttribute.*"] }` - Whenever any property of a Map attribute is updated/queried
    - `{ watch: ["myListAttribute[*].elementValue"] }` - Whenever any item of a List attribute, that contains Map attributes, is updated/queried
   
## [1.2.0]
### ExpressionAttributeValues Properties 
To prevent clashes between `update` values and filter conditions, a change was made to how the property names of `ExpressionAttributeValues` are constructed. This is not a breaking change but if you have tests to specifically compare param results against static JSON you will need to update that JSON. Changes to JSON query parameters is not considered a breaking major version change.

