import React, { memo, useMemo, useRef } from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { 
    Paper,
    Chip,
    Typography,
    TableHead,
    TableRow,
    TableCell,
    Table
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useSelector } from 'react-redux';
import { MDText } from 'i18n-react';
import i18n from "../i18n";

const useStyles = makeStyles(theme => ({
    tableContainer: {
        height: 500,
        width: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius
    },
    headerContainer: {
        backgroundColor: theme.palette.grey[100],
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1),
        height: 56
    },
    listContainer: {
        height: 'calc(100% - 56px)', // Subtract header height
        '& .ReactVirtualized__List': {
            outline: 'none'
        }
    },
    rowContainer: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(0.5, 1),
        '&:hover': {
            backgroundColor: theme.palette.action.hover
        }
    },
    evenRow: {
        backgroundColor: theme.palette.background.default
    },
    oddRow: {
        backgroundColor: theme.palette.background.paper
    },
    cell: {
        flex: 1,
        padding: theme.spacing(0.5),
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    plateCell: {
        fontFamily: 'monospace',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    },
    powerSourceChip: {
        fontSize: '0.75rem',
        height: 24,
        minWidth: 80
    },
    typeChip: {
        fontSize: '0.75rem',
        height: 24,
        minWidth: 60
    },
    noData: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: theme.palette.text.secondary
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: '0.875rem',
        textAlign: 'center'
    }
}));

// Memoized row component with timestamp control
const VehicleRow = memo(({ vehicle, index, style, classes }) => {
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
        <div 
            style={style}
            className={`${classes.rowContainer} ${index % 2 === 0 ? classes.evenRow : classes.oddRow}`}
        >
            <div className={`${classes.cell} ${classes.plateCell}`}>
                {vehicle.plate || 'N/A'}
            </div>
            <div className={classes.cell}>
                <Typography variant="body2">{vehicle.year}</Typography>
            </div>
            <div className={classes.cell}>
                <Chip 
                    label={vehicle.type} 
                    size="small" 
                    color={getTypeColor(vehicle.type)}
                    className={classes.typeChip}
                />
            </div>
            <div className={classes.cell}>
                <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                    {vehicle.hp} HP
                </Typography>
            </div>
            <div className={classes.cell}>
                <Typography variant="body2">
                    {vehicle.topSpeed} km/h
                </Typography>
            </div>
            <div className={classes.cell}>
                <Chip 
                    label={vehicle.powerSource} 
                    size="small" 
                    color={getPowerSourceColor(vehicle.powerSource)}
                    className={classes.powerSourceChip}
                />
            </div>
            <div className={classes.cell}>
                <Typography variant="caption" style={{ color: '#666' }}>
                    {new Date(vehicle.timestamp).toLocaleTimeString()}
                </Typography>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
        prevProps.vehicle.id === nextProps.vehicle.id &&
        prevProps.vehicle.timestamp === nextProps.vehicle.timestamp &&
        prevProps.index === nextProps.index
    );
});

VehicleRow.displayName = 'VehicleRow';

// Header component
const TableHeader = memo(({ classes, T }) => (
    <div className={classes.headerContainer}>
        <div className={classes.rowContainer} style={{ borderBottom: 'none' }}>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.plate")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.year")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.type")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.horsepower")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.top_speed")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.power_source")}
            </div>
            <div className={classes.headerCell}>
                {T.translate("vehicle_generator.table.timestamp")}
            </div>
        </div>
    </div>
));

TableHeader.displayName = 'TableHeader';

// Main virtualized table component with render control
function VehicleVirtualizedTable({ vehicles, isGenerating }) {
    const classes = useStyles();
    const user = useSelector(({ auth }) => auth.user);
    const T = new MDText(i18n.get(user.locale));
    
    // Ref to store last render timestamp
    const lastRenderRef = useRef(0);
    
    // Memoize vehicles data with performance optimization
    const displayVehicles = useMemo(() => {
        return vehicles ? vehicles.slice(0, 200) : []; // Increased to 200 for better virtualization
    }, [vehicles]);

    // Row renderer function
    const rowRenderer = ({ index, style }) => {
        const vehicle = displayVehicles[index];
        return (
            <VehicleRow 
                key={vehicle.id || index}
                vehicle={vehicle}
                index={index}
                style={style}
                classes={classes}
            />
        );
    };

    if (!vehicles || vehicles.length === 0) {
        return (
            <Paper className={classes.tableContainer}>
                <div className={classes.noData}>
                    <Typography variant="h6">
                        {isGenerating ? 
                            T.translate("vehicle_generator.generating_vehicles") :
                            T.translate("vehicle_generator.no_vehicles_generated")
                        }
                    </Typography>
                    <Typography variant="body2">
                        {!isGenerating && T.translate("vehicle_generator.start_simulation_to_see_data")}
                    </Typography>
                </div>
            </Paper>
        );
    }

    return (
        <Paper className={classes.tableContainer}>
            <TableHeader classes={classes} T={T} />
            <div className={classes.listContainer}>
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            height={height}
                            width={width}
                            rowCount={displayVehicles.length}
                            rowHeight={50} // Fixed row height for performance
                            rowRenderer={rowRenderer}
                            overscanRowCount={5} // Render 5 extra rows for smooth scrolling
                            scrollToAlignment="start"
                        />
                    )}
                </AutoSizer>
            </div>
        </Paper>
    );
}

// Export with controlled re-rendering based on timestamp
export default memo(VehicleVirtualizedTable, (prevProps, nextProps) => {
    // If not generating, allow immediate updates
    if (!nextProps.isGenerating && !prevProps.isGenerating) {
        return false; // Always re-render when not generating
    }
    
    // If just started or stopped generating, allow immediate update
    if (prevProps.isGenerating !== nextProps.isGenerating) {
        return false; // Re-render on state change
    }
    
    // If generating, check timestamp control
    if (nextProps.isGenerating) {
        const now = Date.now();
        const lastRender = VehicleVirtualizedTable.lastRenderTime || 0;
        
        // Only re-render if more than 1 second has passed
        if (now - lastRender > 1000) {
            VehicleVirtualizedTable.lastRenderTime = now;
            return false; // Re-render
        }
        
        return true; // Skip re-render
    }
    
    // Default: check if vehicles data actually changed
    return (
        prevProps.vehicles === nextProps.vehicles &&
        prevProps.isGenerating === nextProps.isGenerating
    );
});

// Static property to store last render time
VehicleVirtualizedTable.lastRenderTime = 0;