export default {
  navigation: {
    'settings': 'Configuraciones',
    'generator-vehicles-management': 'Gestión de Vehículos',
  },
  vehicless: {
    vehicless: 'Vehicless',
    search: 'Búsqueda rápida por nombre',
    add_new_vehicles: 'Agregar Nueva',
    add_new_vehicles_short: 'Agregar',
    rows_per_page: 'Filas por página:',
    of: 'de',
    remove: 'Eliminar',
    table_colums: {
      name: 'Nombre',
      active: 'Activo'
    },
    remove_dialog_title: "¿Desea eliminar las vehicless seleccionadas?",
    remove_dialog_description: "Esta acción no se puede deshacer",
    remove_dialog_no: "No",
    remove_dialog_yes: "Si",
    filters: {
      title: "Filtros",
      active: "Activo"
    }
  },
  vehicles: {
    vehicless: 'Vehicless',
    vehicles_detail: 'Detalle de la Vehicles',
    save: 'GUARDAR',
    basic_info: 'Información Básica',
    name: 'Nombre',
    description: 'Descripción',
    active: 'Activo',
    metadata_tab: 'Metadatos',
    metadata: {
      createdBy: 'Creado por',
      createdAt: 'Creado el',
      updatedBy: 'Modificado por',
      updatedAt: 'Modificado el',
    },
    not_found: 'Lo sentimos pero no pudimos encontrar la entidad que busca',
    internal_server_error: 'Error Interno del Servidor',
    update_success: 'Vehicles ha sido actualizado',
    create_success: 'Vehicles ha sido creado',
    form_validations: {
      name: {
        length: "El nombre debe tener al menos {len} caracteres",
        required: "El nombre es requerido",
      }
    },
  },
    vehicle_generator: {
    title: 'GENERADOR DE FLOTA VEHICULAR',
    generator_tab: 'Generador de Vehículos',
    controls: 'Controles',
    start_simulation: 'Iniciar Simulación',
    stop_simulation: 'Detener Simulación',
    status: 'Estado',
    running: 'Ejecutándose',
    stopped: 'Detenido',
    vehicles_generated: 'Vehículos Generados',
    in_table: 'En Tabla',
    real_time_vehicles: 'Vehículos Generados en Tiempo Real',
    no_vehicles_generated: 'Aún no se han generado vehículos',
    start_simulation_to_see_data: 'Inicia la simulación para ver datos en tiempo real',
    generation_started: 'Generación de vehículos iniciada exitosamente',
    generation_stopped: 'Generación de vehículos detenida exitosamente',
    table: {
      year: 'Año',
      type: 'Tipo',
      horsepower: 'Potencia (HP)',
      top_speed: 'Vel. Máxima (km/h)',
      power_source: 'Fuente de Energía',
      timestamp: 'Generado'
    }
  },
};