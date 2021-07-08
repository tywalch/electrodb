# Release Notes
Additional detail for changes/fixes/etc that we're too much for the [changelog](./CHANGELOG.md)

## [1.1.0]
### Fix Sparse Index Edge Case
If a record is created with a sparse GSI, the Partition and Sort Keys for that index will not be written onto the record. Additionally, if sparse key is later used, via an update to the composite attributes associated with that GSI, ElectroDB will update the index fields that we're impacted by the update. 

The edge-case comes from index fields that are made from an empty composite array. These never get written, meaning they cannot be queried through traditional ElectroDB queries. The fix will examine if an index PK is impacted by a change, determine that index is defined with an empty composite array, and then if both are true write the Entity's SK prefix to the SK field. 
