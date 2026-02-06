/*

y, getShardDistribution.js, 2018.9.2

Reference
---------
    https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell

Usage
-----
    mongo  --h <host> --p <port> getShardDistribution.js
    mongo --host 12.23.64.241  --port 28000 getShardDistribution.js

*/

_database = "clone_db";
_collection = "dc";

db = db.getSiblingDB(_database);
db[_collection].getShardDistribution();

