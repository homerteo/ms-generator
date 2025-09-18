"use strict";

let mongoDB = undefined;
const { map, mapTo, catchError } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

const { CustomError } = require("@nebulae/backend-node-tools").error;

const CollectionName = "Vehicles";

class VehiclesDA {
  static start$(mongoDbInstance) {
    return Observable.create((observer) => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next(`${this.name} using given mongo instance`);
      } else {
        mongoDB = require("../../../tools/mongo-db/MongoDB").singleton();
        observer.next(
          `${this.name} using singleton system-wide mongo instance`
        );
      }
      observer.next(`${this.name} started`);
      observer.complete();
    });
  }

  /**
   * Gets an user by its username
   */
  static getVehicles$(id, organizationId) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id,
      organizationId,
    };
    return defer(() => collection.findOne(query)).pipe(
      map((res) => {
        return res !== null ? { ...res, id: res._id } : {};
      })
    );
  }

  static generateListingQuery(filter) {
    const query = {};
    if (filter.name) {
      query["name"] = { $regex: filter.name, $options: "i" };
    }
    if (filter.organizationId) {
      query["organizationId"] = filter.organizationId;
    }
    if (filter.active !== undefined) {
      query["active"] = filter.active;
    }
    return query;
  }

  static getVehiclesList$(filter = {}, pagination = {}, sortInput) {
    const collection = mongoDB.db.collection(CollectionName);
    const { page = 0, count = 10 } = pagination;

    const query = this.generateListingQuery(filter);
    const projection = { name: 1, active: 1 };

    let cursor = collection
      .find(query, { projection })
      .skip(count * page)
      .limit(count);

    const sort = {};
    if (sortInput) {
      sort[sortInput.field] = sortInput.asc ? 1 : -1;
    } else {
      sort["metadata.createdAt"] = -1;
    }
    cursor = cursor.sort(sort);

    return mongoDB
      .extractAllFromMongoCursor$(cursor)
      .pipe(map((res) => ({ ...res, id: res._id })));
  }

  static getVehiclesSize$(filter = {}) {
    const collection = mongoDB.db.collection(CollectionName);
    const query = this.generateListingQuery(filter);
    return defer(() => collection.countDocuments(query));
  }

  /**
   * creates a new Vehicles
   * @param {*} id Vehicles ID
   * @param {*} Vehicles properties
   */
  static createVehicles$(_id, properties, createdBy) {
    const metadata = {
      createdBy,
      createdAt: Date.now(),
      updatedBy: createdBy,
      updatedAt: Date.now(),
    };
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.insertOne({
        _id,
        ...properties,
        metadata,
      })
    ).pipe(
      map(({ insertedId }) => ({ id: insertedId, ...properties, metadata }))
    );
  }

  /**
   * modifies the Vehicles properties
   * @param {String} id  Vehicles ID
   * @param {*} Vehicles properties to update
   */
  static updateVehicles$(_id, properties, updatedBy) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...properties,
            "metadata.updatedBy": updatedBy,
            "metadata.updatedAt": Date.now(),
          },
        },
        {
          returnOriginal: false,
        }
      )
    ).pipe(
      map((result) =>
        result && result.value
          ? { ...result.value, id: result.value._id }
          : undefined
      )
    );
  }

  /**
   * modifies the Vehicles properties
   * @param {String} id  Vehicles ID
   * @param {*} Vehicles properties to update
   */
  static updateVehiclesFromRecovery$(_id, properties, av) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.updateOne(
        {
          _id,
        },
        { $set: { ...properties } },
        {
          returnOriginal: false,
          upsert: true,
        }
      )
    ).pipe(
      map((result) =>
        result && result.value
          ? { ...result.value, id: result.value._id }
          : undefined
      )
    );
  }

  /**
   * modifies the Vehicles properties
   * @param {String} id  Vehicles ID
   * @param {*} Vehicles properties to update
   */
  static replaceVehicles$(_id, properties) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.replaceOne({ _id }, properties)).pipe(
      mapTo({ id: _id, ...properties })
    );
  }

  /**
   * deletes an Vehicles
   * @param {*} _id  Vehicles ID
   */
  static deleteVehicles$(_id) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.deleteOne({ _id }));
  }

  /**
   * deletes multiple Vehicles at once
   * @param {*} _ids  Vehicles IDs array
   */
  static deleteVehicless$(_ids) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.deleteMany({ _id: { $in: _ids } })).pipe(
      map(({ deletedCount }) => deletedCount > 0)
    );
  }

  /**
   * creates a new Generated Vehicle (optimized for high frequency inserts)
   * @param {*} id Vehicle ID
   * @param {*} vehicleProperties Vehicle properties
   * @param {*} createdBy Creator
   */
  static createGeneratedVehicle$(_id, vehicleProperties, createdBy) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.insertOne({
        _id,
        ...vehicleProperties,
      })
    ).pipe(
      map(({ insertedId }) => ({
        id: insertedId,
        ...vehicleProperties,
      })),
      catchError((error) => {
        // Si hay error (ej: duplicate key), continuar sin interrumpir
        if (error.code === 11000) {
          // Duplicate key, ignorar y continuar
          return of({ id: _id, ...vehicleProperties });
        }
        throw error;
      })
    );
  }

    /**
   * Get generated vehicles with pagination
   * @param {*} filter 
   * @param {*} pagination 
   * @param {*} sortInput 
   */
  static getGeneratedVehiclesList$(filter = {}, pagination = {}, sortInput) {
    const collection = mongoDB.db.collection(CollectionName);
    const { page = 0, count = 100 } = pagination; // Más registros para vehículos generados

    // Filtro específico para vehículos generados
    const query = {
      organizationId: "generator-system",
      generatedAt: { $exists: true }
    };

    if (filter.type) {
      query["type"] = filter.type;
    }
    if (filter.powerSource) {
      query["powerSource"] = filter.powerSource;
    }

    const projection = { 
      type: 1, 
      powerSource: 1, 
      hp: 1, 
      year: 1, 
      topSpeed: 1,
      generatedAt: 1,
      active: 1 
    };

    let cursor = collection
      .find(query, { projection })
      .skip(count * page)
      .limit(count);

    const sort = {};
    if (sortInput) {
      sort[sortInput.field] = sortInput.asc ? 1 : -1;
    } else {
      sort["generatedAt"] = -1; // Más recientes primero
    }
    cursor = cursor.sort(sort);

    return mongoDB.extractAllFromMongoCursor$(cursor).pipe(
      map(res => ({ ...res, id: res._id }))
    );
  }

  /**
   * Get count of generated vehicles
   */
  static getGeneratedVehiclesSize$(filter = {}) {
    const collection = mongoDB.db.collection(CollectionName);
    const query = {
      organizationId: "generator-system",
      generatedAt: { $exists: true }
    };

    if (filter.type) {
      query["type"] = filter.type;
    }
    if (filter.powerSource) {
      query["powerSource"] = filter.powerSource;
    }

    return defer(() => collection.countDocuments(query));
  }
}
/**
 * @returns {VehiclesDA}
 */
module.exports = VehiclesDA;
