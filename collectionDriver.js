var ObjectID = require('mongodb').ObjectID;

CollectionDriver = function(db) {
  this.db = db;
};

CollectionDriver.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, collection) {
        if (error) {
            callback(error);
        } else {
            callback(null, collection);
        }
    });
};

CollectionDriver.prototype.findAll = function(collectionName, offset, limit, search, callback) {
    this.getCollection(collectionName, function(error, collection) {
        if (error) {
            callback(error)
        } else {
            if (search) { 
                collection.find({'text': {'$regex': search}}).skip(offset).limit(limit).toArray(function(error, results) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, results);
                    }
                });
            } else {
                collection.find().skip(offset).limit(limit).toArray(function(error, results) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, results);
                    }
                }); 
            }
        }
    });
};

CollectionDriver.prototype.save = function(collectionName, data, callback) {
    this.getCollection('tweets', function(error, collection) {
        if (error) {
            callback(error)
        } else {
            collection.insert(data, function() {
                console.log("Inserted document")
                callback(null, data);
            });
        }
    });
};

exports.CollectionDriver = CollectionDriver;