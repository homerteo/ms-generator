import React from 'react';
import { Redirect } from 'react-router-dom';
import i18n from './i18n'

const auth = ["VEHICLES_READ"];

export const MicroFrontendConfig = {
    settings: {
        layout: {}
    },
    auth,
    routes: [
        { 
            path: '/vehicles-mng/vehicless/:vehiclesId/:vehiclesHandle?',
            component: React.lazy(() => import('./vehicles/Vehicles'))
        },
        {
            path: '/vehicles-mng/vehicless',
            component: React.lazy(() => import('./vehicless/Vehicless'))
        },
        {
            path: '/vehicles-mng',
            component: () => <Redirect to="/vehicles-mng/vehicless" />
        }
    ],
    navigationConfig: [
        {
            'id': 'settings',
            'type': 'collapse',
            'icon': 'settings',
            'priority': 100,
            children: [{
                'id': 'generator-vehicles-management',
                'type': 'item',
                'icon': 'business',
                'url': '/vehicles-mng',
                'priority': 2000,
                auth
            }]
        }
    ],
    i18nLocales: i18n.locales
};

