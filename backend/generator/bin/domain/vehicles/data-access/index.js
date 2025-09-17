"use strict";

const Rx = require('rxjs');

const VehiclesDA = require("./VehiclesDA");

module.exports = {
  /**
   * Data-Access start workflow
   */
  start$: Rx.concat(VehiclesDA.start$()),
  /**
   * @returns {VehiclesDA}
   */
  VehiclesDA: VehiclesDA,
};
