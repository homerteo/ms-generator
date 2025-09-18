"use strict";

const { iif, of } = require("rxjs");
const { tap, map } = require("rxjs/operators");
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;

const VehiclesDA = require("./data-access/VehiclesDA");
/**
 * Singleton instance
 * @type { VehiclesES }
 */
let instance;

class VehiclesES {
  constructor() {}

  /**
   * Generates and returns an object that defines the Event-Sourcing events handlers.
   *
   * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   *
   * ## Example
   *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
   */
  generateEventProcessorMap() {
    return {
      Vehicle: { 
        Generated: { fn: instance.handleVehicleGenerated$, instance },
      },
      Vehicles: { // ← Mantener este para VehiclesModified
        VehiclesModified: {
          fn: instance.handleVehiclesModified$,
          instance,
          processOnlyOnSync: true,
        },
      },
    };
  }

  /**
   * Using the VehiclesModified events restores the MaterializedView
   * This is just a recovery strategy
   * @param {*} VehiclesModifiedEvent Vehicles Modified Event
   */
  handleVehiclesModified$({ etv, aid, av, data, user, timestamp }) {
    const aggregateDataMapper = [
      /*etv=0 mapper*/ () => {
        throw new Error("etv 0 is not an option");
      },
      /*etv=1 mapper*/ (eventData) => {
        return { ...eventData, modType: undefined };
      },
    ];
    delete aggregateDataMapper.modType;
    const aggregateData = aggregateDataMapper[etv](data);
    return iif(
      () => data.modType === "DELETE",
      VehiclesDA.deleteVehicles$(aid),
      VehiclesDA.updateVehiclesFromRecovery$(aid, aggregateData, av)
    ).pipe(
      tap(() =>
        ConsoleLogger.i(
          `VehiclesES.handleVehiclesModified: ${data.modType}: aid=${aid}, timestamp=${timestamp}`
        )
      )
    );
  }

  /**
   * Handle VehicleGenerated event
   * @param {*} vehicleGeneratedEvent
   */
  handleVehicleGenerated$({ etv, aid, av, data, user, timestamp }) {
    ConsoleLogger.d(
      `VehiclesES.handleVehicleGenerated$: Processing vehicle generated event for ${aid}`
    );

    return of(data).pipe(
      tap(() => ConsoleLogger.d(`Vehicle generated: ${JSON.stringify(data)}`)),
      map(() => ({ processed: true, aid, timestamp }))
    );
  }
}

/**
 * @returns {VehiclesES}
 */
module.exports = () => {
  if (!instance) {
    instance = new VehiclesES();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
