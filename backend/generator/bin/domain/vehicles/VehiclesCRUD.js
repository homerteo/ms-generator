"use strict";

const uuidv4 = require("uuid/v4");
const { of, forkJoin, from, iif, throwError } = require("rxjs");
const {
  mergeMap,
  catchError,
  map,
  toArray,
  pluck,
  takeUntil,
  switchMap,
} = require("rxjs/operators");
const { Subject, interval, EMPTY } = require("rxjs");
const crypto = require("crypto");

const Event = require("@nebulae/event-store").Event;
const { CqrsResponseHelper } = require("@nebulae/backend-node-tools").cqrs;
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;
const { CustomError, INTERNAL_SERVER_ERROR_CODE, PERMISSION_DENIED } =
  require("@nebulae/backend-node-tools").error;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const broker = brokerFactory();
const eventSourcing = require("../../tools/event-sourcing").eventSourcing;
const VehiclesDA = require("./data-access/VehiclesDA");

const READ_ROLES = ["VEHICLES_READ"];
const WRITE_ROLES = ["VEHICLES_WRITE"];
const REQUIRED_ATTRIBUTES = [];
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

/**
 * Singleton instance
 * @type { VehiclesCRUD }
 */
let instance;

class VehiclesCRUD {
  constructor() {
    this.stopGeneration$ = new Subject();
    this.isGenerating = false;
    this.generationSubscription = null;
  }

  /**
   * Generates and returns an object that defines the CQRS request handlers.
   *
   * The map is a relationship of: AGGREGATE_TYPE VS { MESSAGE_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   *
   * ## Example
   *  { "CreateUser" : { "somegateway.someprotocol.mutation.CreateUser" : {fn: createUser$, instance: classInstance } } }
   */
  generateRequestProcessorMap() {
    return {
      Vehicles: {
        "emigateway.graphql.query.GeneratorVehiclesListing": {
          fn: instance.getGeneratorVehiclesListing$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.query.GeneratorVehicles": {
          fn: instance.getVehicles$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.mutation.GeneratorCreateVehicles": {
          fn: instance.createVehicles$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.GeneratorUpdateVehicles": {
          fn: instance.updateVehicles$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.GeneratorDeleteVehicless": {
          fn: instance.deleteVehicless$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.GeneratorStartVehicleGeneration": {
          fn: instance.startVehicleGeneration$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.GeneratorStopVehicleGeneration": {
          fn: instance.stopVehicleGeneration$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
      },
    };
  }

  /**
   * Gets the Vehicles list
   *
   * @param {*} args args
   */
  getGeneratorVehiclesListing$({ args }, authToken) {
    const { filterInput, paginationInput, sortInput } = args;
    const { queryTotalResultCount = false } = paginationInput || {};

    return forkJoin(
      VehiclesDA.getVehiclesList$(filterInput, paginationInput, sortInput).pipe(
        toArray()
      ),
      queryTotalResultCount
        ? VehiclesDA.getVehiclesSize$(filterInput)
        : of(undefined)
    ).pipe(
      map(([listing, queryTotalResultCount]) => ({
        listing,
        queryTotalResultCount,
      })),
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * Gets the get Vehicles by id
   *
   * @param {*} args args
   */
  getVehicles$({ args }, authToken) {
    const { id, organizationId } = args;
    return VehiclesDA.getVehicles$(id, organizationId).pipe(
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * Create a Vehicles
   */
  createVehicles$({ root, args, jwt }, authToken) {
    const aggregateId = uuidv4();
    const input = {
      active: false,
      ...args.input,
    };

    return VehiclesDA.createVehicles$(
      aggregateId,
      input,
      authToken.preferred_username
    ).pipe(
      mergeMap((aggregate) =>
        forkJoin(
          CqrsResponseHelper.buildSuccessResponse$(aggregate),
          eventSourcing.emitEvent$(
            instance.buildAggregateMofifiedEvent(
              "CREATE",
              "Vehicles",
              aggregateId,
              authToken,
              aggregate
            ),
            { autoAcknowledgeKey: process.env.MICROBACKEND_KEY }
          ),
          broker.send$(
            MATERIALIZED_VIEW_TOPIC,
            `GeneratorVehiclesModified`,
            aggregate
          )
        )
      ),
      map(([sucessResponse]) => sucessResponse),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * updates an Vehicles
   */
  updateVehicles$({ root, args, jwt }, authToken) {
    const { id, input, merge } = args;

    return (merge ? VehiclesDA.updateVehicles$ : VehiclesDA.replaceVehicles$)(
      id,
      input,
      authToken.preferred_username
    ).pipe(
      mergeMap((aggregate) =>
        forkJoin(
          CqrsResponseHelper.buildSuccessResponse$(aggregate),
          eventSourcing.emitEvent$(
            instance.buildAggregateMofifiedEvent(
              merge ? "UPDATE_MERGE" : "UPDATE_REPLACE",
              "Vehicles",
              id,
              authToken,
              aggregate
            ),
            { autoAcknowledgeKey: process.env.MICROBACKEND_KEY }
          ),
          broker.send$(
            MATERIALIZED_VIEW_TOPIC,
            `GeneratorVehiclesModified`,
            aggregate
          )
        )
      ),
      map(([sucessResponse]) => sucessResponse),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * deletes an Vehicles
   */
  deleteVehicless$({ root, args, jwt }, authToken) {
    const { ids } = args;
    return forkJoin(
      VehiclesDA.deleteVehicless$(ids),
      from(ids).pipe(
        mergeMap((id) =>
          eventSourcing.emitEvent$(
            instance.buildAggregateMofifiedEvent(
              "DELETE",
              "Vehicles",
              id,
              authToken,
              {}
            ),
            { autoAcknowledgeKey: process.env.MICROBACKEND_KEY }
          )
        ),
        toArray()
      )
    ).pipe(
      map(([ok, esResps]) => ({
        code: ok ? 200 : 400,
        message: `Vehicles with id:s ${JSON.stringify(ids)} ${
          ok ? "has been deleted" : "not found for deletion"
        }`,
      })),
      mergeMap((r) =>
        forkJoin(
          CqrsResponseHelper.buildSuccessResponse$(r),
          broker.send$(MATERIALIZED_VIEW_TOPIC, `GeneratorVehiclesModified`, {
            id: "deleted",
            name: "",
            active: false,
            description: "",
          })
        )
      ),
      map(([cqrsResponse, brokerRes]) => cqrsResponse),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * Generate an Modified event
   * @param {string} modType 'CREATE' | 'UPDATE' | 'DELETE'
   * @param {*} aggregateType
   * @param {*} aggregateId
   * @param {*} authToken
   * @param {*} data
   * @returns {Event}
   */
  buildAggregateMofifiedEvent(
    modType,
    aggregateType,
    aggregateId,
    authToken,
    data
  ) {
    return new Event({
      eventType: `${aggregateType}Modified`,
      eventTypeVersion: 1,
      aggregateType: aggregateType,
      aggregateId,
      data: {
        modType,
        ...data,
      },
      user: authToken.preferred_username,
    });
  }

  /**
   * Start vehicle generation process
   * @param {*} param0
   */
  startVehicleGeneration$({ root, args, jwt }, authToken) {
    return of({}).pipe(
      map(() => {
        if (this.isGenerating) {
          throw new CustomError(
            "Generation already running",
            "VehiclesCRUD.startVehicleGeneration$",
            INTERNAL_SERVER_ERROR_CODE,
            "Vehicle generation is already in progress"
          );
        }

        this.isGenerating = true;
        this.stopGeneration$ = new Subject();

        // Start the generation process
        this.startGenerationProcess();

        return { message: "Vehicle generation started" };
      }),
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) => {
        ConsoleLogger.e("VehiclesCRUD.startVehicleGeneration$ ERROR: ", err);
        return CqrsResponseHelper.handleError$(err);
      })
    );
  }

  /**
   * Stop vehicle generation process
   * @param {*} param0
   */
  stopVehicleGeneration$({ root, args, jwt }, authToken) {
    return of({}).pipe(
      map(() => {
        if (!this.isGenerating) {
          throw new CustomError(
            "No generation running",
            "VehiclesCRUD.stopVehicleGeneration$",
            INTERNAL_SERVER_ERROR_CODE,
            "No vehicle generation is currently running"
          );
        }

        this.isGenerating = false;
        this.stopGeneration$.next();
        this.stopGeneration$.complete();

        // Cleanup subscription if exists
        if (this.generationSubscription) {
          this.generationSubscription.unsubscribe();
          this.generationSubscription = null;
        }

        return { message: "Vehicle generation stopped" };
      }),
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) => {
        ConsoleLogger.e("VehiclesCRUD.stopVehicleGeneration$ ERROR: ", err);
        return CqrsResponseHelper.handleError$(err);
      })
    );
  }

  /**
   * Start the actual generation process using RxJS
   */
  startGenerationProcess() {
    this.generationSubscription = interval(50)
      .pipe(
        takeUntil(this.stopGeneration$),
        map(() => this.generateRandomVehicle()),
        switchMap((vehicleData) =>
          this.publishVehicleGeneratedEvent(vehicleData)
        )
      )
      .subscribe(
        () => {}, // success handler
        (error) => {
          ConsoleLogger.e("Vehicle generation error:", error);
          this.isGenerating = false;
        },
        () => {
          ConsoleLogger.i("Vehicle generation completed");
          this.isGenerating = false;
          this.generationSubscription = null;
        }
      );
  }

  /**
   * Generate random vehicle data
   */
  generateRandomVehicle() {
    const types = ["SUV", "Sedan", "Hatchback", "Truck", "Van"];
    const powerSources = ["Electric", "Gasoline", "Hybrid", "Diesel"];

    const vehicleData = {
      type: types[Math.floor(Math.random() * types.length)],
      powerSource:
        powerSources[Math.floor(Math.random() * powerSources.length)],
      hp: Math.floor(Math.random() * (500 - 100) + 100),
      year: Math.floor(Math.random() * (2025 - 2015) + 2015),
      topSpeed: Math.floor(Math.random() * (300 - 120) + 120),
    };

    return vehicleData;
  }

  /**
   * Generate deterministic hash for vehicle data
   */
  generateVehicleHash(vehicleData) {
    const dataString = JSON.stringify(
      vehicleData,
      Object.keys(vehicleData).sort()
    );
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Publish VehicleGenerated event to Event Store
   */
  publishVehicleGeneratedEvent(vehicleData) {
    const aid = this.generateVehicleHash(vehicleData);
    const timestamp = new Date().toISOString();

    const event = new Event({
      aggregateType: "Vehicle",
      aggregateId: aid,
      eventType: "Generated",
      eventTypeVersion: 1,
      user: "SYSTEM",
      data: vehicleData,
    });

    return eventSourcing.eventStore.emitEvent$(event).pipe(
      mergeMap(() =>
        broker.send$("fleet/vehicles/generated", "VehicleGenerated", {
          at: "Vehicle",
          et: "Generated",
          aid: aid,
          timestamp: timestamp,
          data: vehicleData,
        })
      )
    );
  }
}

/**
 * @returns {VehiclesCRUD}
 */
module.exports = () => {
  if (!instance) {
    instance = new VehiclesCRUD();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
