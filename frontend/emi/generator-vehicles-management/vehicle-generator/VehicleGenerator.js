import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Paper, 
    Button, 
    Typography, 
    Grid, 
    Card, 
    CardContent,
    Icon,
    Chip
} from '@material-ui/core';
import { FuseAnimate, FusePageCarded } from '@fuse';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useSubscription } from "@apollo/react-hooks";
import { makeStyles } from '@material-ui/styles';
import { MDText } from 'i18n-react';
import i18n from "../i18n";
import * as AppActions from 'app/store/actions';
import VehicleGeneratorTable from './VehicleGeneratorTable';
import { 
    GeneratorStartVehicleGeneration,
    GeneratorStopVehicleGeneration,
    onVehicleGenerated 
} from "../gql/Vehicles";

const useStyles = makeStyles(theme => ({
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
    },
    controlCard: {
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2)
    },
    statusCard: {
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.default
    },
    startButton: {
        backgroundColor: '#4caf50',
        color: 'white',
        '&:hover': {
            backgroundColor: '#45a049'
        }
    },
    stopButton: {
        backgroundColor: '#f44336',
        color: 'white',
        '&:hover': {
            backgroundColor: '#da190b'
        }
    },
    statusRunning: {
        color: '#4caf50',
        fontWeight: 'bold'
    },
    statusStopped: {
        color: '#f44336',
        fontWeight: 'bold'
    },
    statsChip: {
        margin: theme.spacing(0.5),
        fontWeight: 'bold'
    }
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
    const lastRenderTime = useRef(Date.now());
    const vehicleBuffer = useRef([]);

    // GraphQL mutations
    const [startGeneration, startGenerationResult] = useMutation(GeneratorStartVehicleGeneration({}).mutation);
    const [stopGeneration, stopGenerationResult] = useMutation(GeneratorStopVehicleGeneration({}).mutation);

    // WebSocket subscription para recibir vehículos generados
    const vehicleGeneratedSubscription = useSubscription(...onVehicleGenerated({}));

    // Manejar inicio de generación
    const handleStartGeneration = useCallback(() => {
        startGeneration();
    }, [startGeneration]);

    // Manejar detención de generación
    const handleStopGeneration = useCallback(() => {
        stopGeneration();
    }, [stopGeneration]);

    // Manejar respuesta de inicio de generación
    useEffect(() => {
        if (startGenerationResult.data && startGenerationResult.data.GeneratorStartVehicleGeneration) {
            const { code, message } = startGenerationResult.data.GeneratorStartVehicleGeneration;
            if (code === 200) {
                setIsGenerating(true);
                dispatch(AppActions.showMessage({ 
                    message: T.translate("vehicle_generator.generation_started"), 
                    variant: 'success' 
                }));
            } else {
                dispatch(AppActions.showMessage({ 
                    message: message, 
                    variant: 'error' 
                }));
            }
        }
    }, [startGenerationResult.data, dispatch, T]);

    // Manejar respuesta de detención de generación
    useEffect(() => {
        if (stopGenerationResult.data && stopGenerationResult.data.GeneratorStopVehicleGeneration) {
            const { code, message } = stopGenerationResult.data.GeneratorStopVehicleGeneration;
            if (code === 200) {
                setIsGenerating(false);
                dispatch(AppActions.showMessage({ 
                    message: T.translate("vehicle_generator.generation_stopped"), 
                    variant: 'success' 
                }));
            } else {
                dispatch(AppActions.showMessage({ 
                    message: message, 
                    variant: 'error' 
                }));
            }
        }
    }, [stopGenerationResult.data, dispatch, T]);

    // Manejar errores de mutations
    useEffect(() => {
        const error = startGenerationResult.error || stopGenerationResult.error;
        if (error) {
            const errMessage = error.graphQLErrors && error.graphQLErrors.length > 0 
                ? error.graphQLErrors[0].message 
                : error.message;
            dispatch(AppActions.showMessage({
                message: errMessage,
                variant: 'error'
            }));
        }
    }, [startGenerationResult.error, stopGenerationResult.error, dispatch]);

    // Procesar vehículos recibidos vía WebSocket
    useEffect(() => {
        if (vehicleGeneratedSubscription.data && vehicleGeneratedSubscription.data.VehicleGenerated) {
            const vehicleEvent = vehicleGeneratedSubscription.data.VehicleGenerated;
            const newVehicle = {
                id: vehicleEvent.aid,
                timestamp: vehicleEvent.timestamp,
                ...vehicleEvent.data
            };

            // Agregar al buffer
            vehicleBuffer.current.push(newVehicle);
            setVehicleCount(prev => prev + 1);

            // Actualizar la tabla solo si ha pasado más de 1 segundo
            const now = Date.now();
            if (now - lastRenderTime.current > 1000) {
                setGeneratedVehicles(prev => [...vehicleBuffer.current, ...prev].slice(0, 1000));
                vehicleBuffer.current = [];
                lastRenderTime.current = now;
            }
        }
    }, [vehicleGeneratedSubscription.data]);

    // Limpiar datos al cambiar estado de generación
    useEffect(() => {
        if (!isGenerating) {
            if (vehicleBuffer.current.length > 0) {
                setGeneratedVehicles(prev => [...vehicleBuffer.current, ...prev].slice(0, 1000));
                vehicleBuffer.current = [];
                lastRenderTime.current = Date.now();
            }
        }
    }, [isGenerating]);

    return (
        <div className="p-16 sm:p-24">
            <FuseAnimate animation="transition.slideUpIn" delay={200}>
                <Card className={classes.controlCard}>
                    <CardContent>
                        <Typography variant="h6" className="mb-16">
                            {T.translate("vehicle_generator.controls")}
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
                                    {T.translate("vehicle_generator.start_simulation")}
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
                                    {T.translate("vehicle_generator.stop_simulation")}
                                </Button>
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
                                    {T.translate("vehicle_generator.status")}:
                                    <span className={isGenerating ? classes.statusRunning : classes.statusStopped}>
                                        {isGenerating 
                                            ? ` ${T.translate("vehicle_generator.running")}...`
                                            : ` ${T.translate("vehicle_generator.stopped")}`
                                        }
                                    </span>
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <div className="flex flex-wrap justify-end">
                                    <Chip 
                                        icon={<Icon>timeline</Icon>}
                                        label={`${T.translate("vehicle_generator.vehicles_generated")}: ${vehicleCount.toLocaleString()}`}
                                        className={classes.statsChip}
                                        color="primary"
                                    />
                                    <Chip 
                                        icon={<Icon>storage</Icon>}
                                        label={`${T.translate("vehicle_generator.in_table")}: ${generatedVehicles.length.toLocaleString()}`}
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
                            {T.translate("vehicle_generator.real_time_vehicles")}
                        </Typography>
                        <VehicleGeneratorTable vehicles={generatedVehicles} />
                    </div>
                </Paper>
            </FuseAnimate>
        </div>
    );
}

export default VehicleGenerator;