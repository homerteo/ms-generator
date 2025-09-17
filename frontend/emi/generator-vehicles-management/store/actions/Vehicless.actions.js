import { defer } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';

import graphqlService from '../../../../services/graphqlService';
import { GeneratorVehiclesListing, GeneratorDeleteVehicles } from '../../gql/Vehicles';

export const SET_VEHICLESS = '[VEHICLES_MNG] SET VEHICLESS';
export const SET_VEHICLESS_PAGE = '[VEHICLES_MNG] SET VEHICLESS PAGE';
export const SET_VEHICLESS_ROWS_PER_PAGE = '[VEHICLES_MNG] SET VEHICLESS ROWS PER PAGE';
export const SET_VEHICLESS_ORDER = '[VEHICLES_MNG] SET VEHICLESS ORDER';
export const SET_VEHICLESS_FILTERS_ORGANIZATION_ID = '[VEHICLES_MNG] SET VEHICLESS FILTERS ORGANIZATION_ID';
export const SET_VEHICLESS_FILTERS_NAME = '[VEHICLES_MNG] SET VEHICLESS FILTERS NAME';
export const SET_VEHICLESS_FILTERS_ACTIVE = '[VEHICLES_MNG] SET VEHICLESS FILTERS ACTIVE';

/**
 * Common function to generate the arguments for the GeneratorVehiclesListing query based on the user input
 * @param {Object} queryParams 
 */
function getListingQueryArguments({ filters: { name, organizationId, active }, order, page, rowsPerPage }) {
    const args = {
        "filterInput": { organizationId },
        "paginationInput": { "page": page, "count": rowsPerPage, "queryTotalResultCount": (page === 0) },
        "sortInput": order.id ? { "field": order.id, "asc": order.direction === "asc" } : undefined
    };
    if (name.trim().length > 0) {
        args.filterInput.name = name;
    }
    if (active !== null) {
        args.filterInput.active = active;
    }
    return args;
}

/**
 * Queries the Vehicles Listing based on selected filters, page and order
 * @param {{ filters, order, page, rowsPerPage }} queryParams
 */
export function getVehicless({ filters, order, page, rowsPerPage }) {
    const args = getListingQueryArguments({ filters, order, page, rowsPerPage });    
    return (dispatch) => graphqlService.client.query(GeneratorVehiclesListing(args)).then(result => {
        return dispatch({
            type: SET_VEHICLESS,
            payload: result.data.GeneratorVehiclesListing
        });
    })
}

/**
 * Executes the mutation to remove the selected rows
 * @param {*} selectedForRemovalIds 
 * @param {*} param1 
 */
export function removeVehicless(selectedForRemovalIds, { filters, order, page, rowsPerPage }) {
    const deleteArgs = { ids: selectedForRemovalIds };
    const listingArgs = getListingQueryArguments({ filters, order, page, rowsPerPage });
    return (dispatch) => defer(() => graphqlService.client.mutate(GeneratorDeleteVehicles(deleteArgs))).pipe(
        mergeMap(() => defer(() => graphqlService.client.query(GeneratorVehiclesListing(listingArgs)))),
        map((result) =>
            dispatch({
                type: SET_VEHICLESS,
                payload: result.data.GeneratorVehiclesListing
            })
        )
    ).toPromise();
}

/**
 * Set the listing page
 * @param {int} page 
 */
export function setVehiclessPage(page) {
    return {
        type: SET_VEHICLESS_PAGE,
        page
    }
}

/**
 * Set the number of rows to see per page
 * @param {*} rowsPerPage 
 */
export function setVehiclessRowsPerPage(rowsPerPage) {
    return {
        type: SET_VEHICLESS_ROWS_PER_PAGE,
        rowsPerPage
    }
}

/**
 * Set the table-column order
 * @param {*} order 
 */
export function setVehiclessOrder(order) {
    return {
        type: SET_VEHICLESS_ORDER,
        order
    }
}

/**
 * Set the name filter
 * @param {string} name 
 */
export function setVehiclessFilterName(name) {    
    return {
        type: SET_VEHICLESS_FILTERS_NAME,
        name
    }
}

/**
 * Set the filter active flag on/off/both
 * @param {boolean} active 
 */
export function setVehiclessFilterActive(active) {
    return {
        type: SET_VEHICLESS_FILTERS_ACTIVE,
        active
    }
}

/**
 * set the organizationId filter
 * @param {string} organizationId 
 */
export function setVehiclessFilterOrganizationId(organizationId) {    
    return {
        type: SET_VEHICLESS_FILTERS_ORGANIZATION_ID,
        organizationId
    }
}



