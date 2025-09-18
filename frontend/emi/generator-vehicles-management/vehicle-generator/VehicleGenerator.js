import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paper,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Icon,
  Chip,
} from "@material-ui/core";
import { FuseAnimate } from "@fuse";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { makeStyles } from "@material-ui/styles";
import { MDText } from "i18n-react";
import i18n from "../i18n";
import * as AppActions from "app/store/actions";
import VehicleGeneratorTable from "./VehicleGeneratorTable";
import {
  GeneratorStartVehicleGeneration,
  GeneratorStopVehicleGeneration,
  GeneratorGeneratedVehiclesListing,
} from "../gql/Vehicles";

const useStyles = makeStyles((theme) => ({
  // ... existing styles ...
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },
  controlCard: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
  },
  statusCard: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  startButton: {
    backgroundColor: "#4caf50",
    color: "white",
    "&:hover": {
      backgroundColor: "#45a049",
    },
  },
  stopButton: {
    backgroundColor: "#f44336",
    color: "white",
    "&:hover": {
      backgroundColor: "#da190b",
    },
  },
  statusRunning: {
    color: "#4caf50",
    fontWeight: "bold",
  },
  statusStopped: {
    color: "#f44336",
    fontWeight: "bold",
  },
  statsChip: {
    margin: theme.spacing(0.5),
    fontWeight: "bold",
  },
}));

function VehicleGenerator() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = useSelector(({ auth }) => auth.user);
  const T = new MDText(i18n.get(user.locale));

  // Estado local
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVehicles, setGeneratedVehicles] = useState([]);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [lastVehicleId, setLastVehicleId] = useState(null);
  const [debugInfo, setDebugInfo] = useState("Esperando datos...");

  // GraphQL mutations
  const [startGeneration, startGenerationResult] = useMutation(
    GeneratorStartVehicleGeneration({}).mutation
  );
  const [stopGeneration, stopGenerationResult] = useMutation(
    GeneratorStopVehicleGeneration({}).mutation
  );

  // Query para obtener vehículos con polling - SIN filtro organizationId
  const { data: vehiclesData, refetch, loading, error } = useQuery(
    GeneratorGeneratedVehiclesListing({
      filterInput: {}, // ← QUITAR organizationId completamente
      paginationInput: { page: 0, count: 100 },
      sortInput: { field: "generatedAt", asc: false },
    }).query,
    {
      variables: {
        filterInput: {}, // ← QUITAR organizationId completamente
        paginationInput: { page: 0, count: 100 },
        sortInput: { field: "generatedAt", asc: false },
      },
      pollInterval: isGenerating ? 500 : 0, // ← Aumentar a 500ms para ver mejor
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        console.log("=== QUERY COMPLETED ===");
        console.log("Full query response:", JSON.stringify(data, null, 2));
        
        setDebugInfo(`Query completada: ${JSON.stringify(data)}`);
        
        if (data?.GeneratorGeneratedVehiclesListing?.listing) {
          const vehicles = data.GeneratorGeneratedVehiclesListing.listing;
          console.log("Vehicles found:", vehicles.length);
          console.log("Raw vehicles from database:", vehicles);

          // Transformar datos para la tabla
          const transformedVehicles = vehicles.map((vehicle) => {
            console.log("Processing vehicle:", vehicle);
            return {
              id: vehicle.id,
              timestamp: vehicle.generatedAt || new Date().toISOString(),
              plate: vehicle.plate || `GEN${Math.floor(Math.random() * 1000)}`,
              type: vehicle.type || "Unknown",
              powerSource: vehicle.powerSource || "Unknown",
              hp: vehicle.hp || 0,
              year: vehicle.year || 0,
              topSpeed: vehicle.topSpeed || 0,
            };
          });

          console.log("Transformed vehicles:", transformedVehicles);
          
          setGeneratedVehicles(transformedVehicles);
          setVehicleCount(transformedVehicles.length);

          // Detectar nuevos vehículos
          if (
            transformedVehicles.length > 0 &&
            transformedVehicles[0].id !== lastVehicleId
          ) {
            console.log("New vehicle detected:", transformedVehicles[0]);
            setLastVehicleId(transformedVehicles[0].id);
          }
        } else {
          console.log("No vehicles listing found in response");
          setDebugInfo("No hay datos en GeneratorGeneratedVehiclesListing.listing");
        }
      },
      onError: (error) => {
        console.error("=== QUERY ERROR ===");
        console.error("GraphQL Error:", error);
        setDebugInfo(`Error: ${error.message}`);
      },
    }
  );

  // Log del estado del query
  useEffect(() => {
    console.log("=== QUERY STATUS ===");
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Data:", vehiclesData);
  }, [loading, error, vehiclesData]);

  // Manejar inicio de generación
  const handleStartGeneration = useCallback(() => {
    console.log("Starting vehicle generation...");
    setGeneratedVehicles([]);
    setVehicleCount(0);
    setLastVehicleId(null);
    setDebugInfo("Iniciando generación...");
    
    startGeneration();
  }, [startGeneration]);

  // Manejar detención de generación
  const handleStopGeneration = useCallback(() => {
    console.log("Stopping vehicle generation...");
    setDebugInfo("Deteniendo generación...");
    stopGeneration();
  }, [stopGeneration]);

  // Manejar respuesta de inicio de generación
  useEffect(() => {
    if (
      startGenerationResult.data &&
      startGenerationResult.data.GeneratorStartVehicleGeneration
    ) {
      const { code, message } =
        startGenerationResult.data.GeneratorStartVehicleGeneration;
      console.log("Start generation response:", { code, message });

      if (code === 200) {
        setIsGenerating(true);
        setDebugInfo("Generación iniciada, esperando datos...");
        dispatch(
          AppActions.showMessage({
            message: "Generación de vehículos iniciada",
            variant: "success",
          })
        );
      } else {
        setDebugInfo(`Error al iniciar: ${message}`);
        dispatch(
          AppActions.showMessage({
            message: message,
            variant: "error",
          })
        );
      }
    }
  }, [startGenerationResult.data, dispatch]);

  // Manejar respuesta de detención de generación
  useEffect(() => {
    if (
      stopGenerationResult.data &&
      stopGenerationResult.data.GeneratorStopVehicleGeneration
    ) {
      const { code, message } =
        stopGenerationResult.data.GeneratorStopVehicleGeneration;
      console.log("Stop generation response:", { code, message });

      if (code === 200) {
        setIsGenerating(false);
        setDebugInfo("Generación detenida");
        dispatch(
          AppActions.showMessage({
            message: "Generación de vehículos detenida",
            variant: "success",
          })
        );
      } else {
        setDebugInfo(`Error al detener: ${message}`);
        dispatch(
          AppActions.showMessage({
            message: message,
            variant: "error",
          })
        );
      }
    }
  }, [stopGenerationResult.data, dispatch]);

  // Manejar errores de mutations
  useEffect(() => {
    const error = startGenerationResult.error || stopGenerationResult.error;
    if (error) {
      console.error("GraphQL error:", error);
      const errMessage =
        error.graphQLErrors && error.graphQLErrors.length > 0
          ? error.graphQLErrors[0].message
          : error.message;
      setDebugInfo(`Error GraphQL: ${errMessage}`);
      dispatch(
        AppActions.showMessage({
          message: errMessage,
          variant: "error",
        })
      );
    }
  }, [startGenerationResult.error, stopGenerationResult.error, dispatch]);

  return (
    <div className="p-16 sm:p-24">
      <FuseAnimate animation="transition.slideUpIn" delay={200}>
        <Card className={classes.controlCard}>
          <CardContent>
            <Typography variant="h6" className="mb-16">
              🔧 Generador de Vehículos - Modo Debug
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Button
                  variant="contained"
                  className={classes.startButton}
                  startIcon={<Icon>play_arrow</Icon>}
                  onClick={handleStartGeneration}
                  disabled={isGenerating || startGenerationResult.loading}
                >
                  Iniciar Simulación
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  className={classes.stopButton}
                  startIcon={<Icon>stop</Icon>}
                  onClick={handleStopGeneration}
                  disabled={!isGenerating || stopGenerationResult.loading}
                >
                  Detener Simulación
                </Button>
              </Grid>
              <Grid item>
                <Chip
                  icon={<Icon>{isGenerating ? "autorenew" : "pause"}</Icon>}
                  label={`Polling: ${isGenerating ? "Activo" : "Inactivo"}`}
                  color={isGenerating ? "primary" : "default"}
                  size="small"
                />
              </Grid>
            </Grid>
            
          </CardContent>
        </Card>
      </FuseAnimate>

      <FuseAnimate animation="transition.slideUpIn" delay={400}>
        <Card className={classes.statusCard}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" className="mb-8">
                  Estado:
                  <span
                    className={
                      isGenerating
                        ? classes.statusRunning
                        : classes.statusStopped
                    }
                  >
                    {isGenerating ? " Corriendo..." : " Detenido"}
                  </span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <div className="flex flex-wrap justify-end">
                  <Chip
                    icon={<Icon>timeline</Icon>}
                    label={`Vehículos generados: ${vehicleCount.toLocaleString()}`}
                    className={classes.statsChip}
                    color="primary"
                  />
                  <Chip
                    icon={<Icon>storage</Icon>}
                    label={`En tabla: ${generatedVehicles.length.toLocaleString()}`}
                    className={classes.statsChip}
                    color="secondary"
                  />
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </FuseAnimate>

      <FuseAnimate animation="transition.slideUpIn" delay={600}>
        <Paper className="mt-24">
          <div className="p-16">
            <Typography variant="h6" className="mb-16">
              Vehículos en Tiempo Real ({generatedVehicles.length})
            </Typography>
            <VehicleGeneratorTable
              vehicles={generatedVehicles}
              isGenerating={isGenerating}
            />
          </div>
        </Paper>
      </FuseAnimate>
    </div>
  );
}

export default VehicleGenerator;