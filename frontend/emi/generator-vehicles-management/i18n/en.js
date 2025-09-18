export default {
  navigation: {
    'settings': 'Settings',
    'generator-vehicles-management': 'Vehicles Management',
  },
  vehicless: {
    vehicless: 'Vehicless',
    search: 'Quick search by name',
    add_new_vehicles: 'ADD NEW',
    add_new_vehicles_short: 'NEW',
    rows_per_page: 'Rows per page:',
    of: 'of',
    remove: 'Remove',
    table_colums: {
      name: 'Name',
      active: 'Active'
    },
    remove_dialog_title: "Do you want to delete the selected Vehicless??",
    remove_dialog_description: "This action can not be undone",
    remove_dialog_no: "No",
    remove_dialog_yes: "Yes",
    filters: {
      title: "Filters",
      active: "Active"
    }
  },
  vehicles: {
    vehicless: 'Vehicless',
    vehicles_detail: 'Vehicles detail',
    save: 'SAVE',
    basic_info: 'Basic Info',
    name: 'Name',
    description: 'Description',
    active: 'Active',
    metadata_tab: 'Metadata',
    metadata: {
      createdBy: 'Created by',
      createdAt: 'Created at',
      updatedBy: 'Modified by',
      updatedAt: 'Modified at',
    },
    not_found: 'Sorry but we could not find the entity you are looking for',
    internal_server_error: 'Internal Server Error',
    update_success: 'Vehicles has been updated',
    create_success: 'Vehicles has been created',
    form_validations: {
      name: {
        length: "Name must be at least {len} characters",
        required: "Name is required",
      }
    },
  },
    vehicle_generator: {
    title: 'FLEET VEHICLE GENERATOR',
    generator_tab: 'Vehicle Generator',
    controls: 'Controls',
    start_simulation: 'Start Simulation',
    stop_simulation: 'Stop Simulation',
    status: 'Status',
    running: 'Running',
    stopped: 'Stopped',
    vehicles_generated: 'Vehicles Generated',
    in_table: 'In Table',
    real_time_vehicles: 'Real-Time Generated Vehicles',
    no_vehicles_generated: 'No vehicles generated yet',
    start_simulation_to_see_data: 'Start the simulation to see real-time data',
    generation_started: 'Vehicle generation started successfully',
    generation_stopped: 'Vehicle generation stopped successfully',
    table: {
      year: 'Year',
      type: 'Type',
      horsepower: 'Power (HP)',
      top_speed: 'Top Speed (km/h)',
      power_source: 'Power Source',
      timestamp: 'Generated At'
    }
  },
};