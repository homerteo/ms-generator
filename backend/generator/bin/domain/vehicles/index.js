"use strict";

const { empty, Observable } = require("rxjs");

const VehiclesCRUD = require("./VehiclesCRUD")();
const VehiclesES = require("./VehiclesES")();
const DataAcess = require("./data-access/");

module.exports = {
  /**
   * domain start workflow
   */
  start$: DataAcess.start$,
  /**
   * start for syncing workflow
   * @returns {Observable}
   */
  startForSyncing$: DataAcess.start$,
  /**
   * start for getting ready workflow
   * @returns {Observable}
   */
  startForGettingReady$: empty(),
  /**
   * Stop workflow
   * @returns {Observable}
   */
  stop$: DataAcess.stop$,
  /**
   * @returns {VehiclesCRUD}
   */
  VehiclesCRUD: VehiclesCRUD,
  /**
   * CRUD request processors Map
   */
  cqrsRequestProcessorMap: VehiclesCRUD.generateRequestProcessorMap(),
  /**
   * @returns {VehiclesES}
   */
  VehiclesES,
  /**
   * EventSoircing event processors Map
   */
  eventSourcingProcessorMap: VehiclesES.generateEventProcessorMap(),
};
