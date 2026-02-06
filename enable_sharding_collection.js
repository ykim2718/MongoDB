/*

y, enable_sharding_collection.js, 2018.9.25

Purpose
-------
1. enable a sharding database
2. create primary key for a collection
3. shard a collection with hashed index of sharding key

Usage
-----
mongo  --host 12.23.64.241 --port 28000 enable_sharding_collection.js

Reference
---------
[1] https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell
[2] https://docs.mongodb.com/manual/reference/method/sh.shardCollection
[3] https://docs.mongodb.com/manual/reference/command/shardCollection
[4] https://stackoverflow.com/questions/19942930/does-the-mongodb-shard-key-need-to-be-unique

You can only shard a collection once. [2]
Do not run more than one shardCollection command on the same collection at the same time. [2]
Hashed shard keys use a hashed index of a single field as the shard key. [2]

*/

_database = 'test_database';
_collection = 'test_collection';
primary_key = {'key1': 1, 'key2': 1};
shard_key = {'key1': 'hashed'};  // [2]

dotted_collection = _database + '.' + _collection;
print('>>', dotted_collection);

db = db.getSiblingDB(_database);
db.runCommand({'enableSharding': _database});
db[_collection].createIndex(primary_key, {'unique': 1, 'name': 'primary_key'});
db.adminCommand({'shardCollection': dotted_collection, 'key': shard_key, 'unique': 0});
db.getCollection(_collection).getShardDistribution();

