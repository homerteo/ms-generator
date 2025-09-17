import React, {useRef} from 'react';
import {FusePageCarded} from '@fuse';
import { useSelector } from 'react-redux';
import withReducer from 'app/store/withReducer';
import VehiclessTable from './VehiclessTable';
import VehiclessHeader from './VehiclessHeader';
import reducer from '../store/reducers';
import {FuseLoading} from '@fuse';

import VehiclessFilterHeader from './VehiclessFilterHeader';
import VehiclessFilterContent from './VehiclessFilterContent';

function Vehicless()
{
    const user = useSelector(({ auth }) => auth.user);
    const pageLayout = useRef(null);

    
    if(!user.selectedOrganization){
        return (<FuseLoading />);
    }

    return (
        <FusePageCarded
            classes={{
                content: "flex",
                //header : "min-h-72 h-72 sm:h-136 sm:min-h-136" // default tall/short header
                header: "min-h-72 h-72 sm:h-72 sm:min-h-72" // short header always
            }}
            header={
                <VehiclessHeader pageLayout={pageLayout} />
            }
            content={
                <VehiclessTable/>
            }

            leftSidebarHeader={
                <VehiclessFilterHeader/>
            }
            leftSidebarContent={
                <VehiclessFilterContent/>
            }
            ref={pageLayout}
            innerScroll
            leftSidebarVariant='permanent'
        />
    );
}

export default withReducer('VehiclesManagement', reducer)(Vehicless);
