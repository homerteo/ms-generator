import React, { memo, useMemo } from 'react';
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useSelector } from 'react-redux';
import { MDText } from 'i18n-react';
import i18n from "../i18n";

const useStyles = makeStyles(theme => ({
    tableContainer: {
        maxHeight: 500,
        overflow: 'auto'
    },
    tableHeader: {
        backgroundColor: theme.palette.grey[100],
        fontWeight: 'bold'
    },
    evenRow: {
        backgroundColor: theme.palette.background.default
    },
    oddRow: {
        backgroundColor: theme.palette.background.paper
    },
    powerSourceChip: {
        fontSize: '0.75rem',
        height: 24
    },
    typeChip: {
        fontSize: '0.75rem',
        height: 24
    },
    noData: {
        textAlign: 'center',
        padding: theme.spacing(4),
        color: theme.palette.text.secondary
    }
}));

// Componente de fila memoizado
const VehicleRow = memo(({ vehicle, index, classes }) => {
    const getPowerSourceColor = (powerSource) => {
        switch (powerSource) {
            case 'Electric': return 'primary';
            case 'Hybrid': return 'secondary';
            case 'Gasoline': return 'default';
            case 'Diesel': return 'default';
            default: return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'SUV': return 'primary';
            case 'Sedan': return 'secondary';
            case 'Hatchback': return 'default';
            case 'Truck': return 'default';
            case 'Van': return 'default';
            default: return 'default';
        }
    };

    return (
        <TableRow 
            key={vehicle.id}
            className={index % 2 === 0 ? classes.evenRow : classes.oddRow}
        >
            <TableCell align="center">
                <Typography variant="body2">{vehicle.year}</Typography>
            </TableCell>
            <TableCell align="center">
                <Chip 
                    label={vehicle.type} 
                    size="small" 
                    color={getTypeColor(vehicle.type)}
                    className={classes.typeChip}
                />
            </TableCell>
            <TableCell align="center">
                <Typography variant="body2" className="font-semibold">
                    {vehicle.hp} HP
                </Typography>
            </TableCell>
            <TableCell align="center">
                <Typography variant="body2">
                    {vehicle.topSpeed} km/h
                </Typography>
            </TableCell>
            <TableCell align="center">
                <Chip 
                    label={vehicle.powerSource} 
                    size="small" 
                    color={getPowerSourceColor(vehicle.powerSource)}
                    className={classes.powerSourceChip}
                />
            </TableCell>
            <TableCell align="center">
                <Typography variant="caption" className="text-gray-500">
                    {new Date(vehicle.timestamp).toLocaleTimeString()}
                </Typography>
            </TableCell>
        </TableRow>
    );
});

VehicleRow.displayName = 'VehicleRow';

function VehicleGeneratorTable({ vehicles }) {
    const classes = useStyles();
    const user = useSelector(({ auth }) => auth.user);
    const T = new MDText(i18n.get(user.locale));

    // Solo mostrar los últimos 100 vehículos para rendimiento
    const displayVehicles = useMemo(() => {
        return vehicles.slice(0, 100);
    }, [vehicles]);

    if (!vehicles || vehicles.length === 0) {
        return (
            <div className={classes.noData}>
                <Typography variant="h6">
                    {T.translate("vehicle_generator.no_vehicles_generated")}
                </Typography>
                <Typography variant="body2">
                    {T.translate("vehicle_generator.start_simulation_to_see_data")}
                </Typography>
            </div>
        );
    }

    return (
        <Paper className={classes.tableContainer}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow className={classes.tableHeader}>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.year")}
                        </TableCell>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.type")}
                        </TableCell>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.horsepower")}
                        </TableCell>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.top_speed")}
                        </TableCell>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.power_source")}
                        </TableCell>
                        <TableCell align="center" className="font-bold">
                            {T.translate("vehicle_generator.table.timestamp")}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayVehicles.map((vehicle, index) => (
                        <VehicleRow 
                            key={vehicle.id || index}
                            vehicle={vehicle} 
                            index={index} 
                            classes={classes}
                        />
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
}

export default memo(VehicleGeneratorTable);