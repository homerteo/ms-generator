import React, { useState, useRef } from 'react';
import { FusePageCarded } from '@fuse';
import withReducer from 'app/store/withReducer';
import { Tabs, Tab } from '@material-ui/core';
import { useSelector } from 'react-redux'; 
import { MDText } from 'i18n-react'; 
import i18n from "../i18n";
import VehiclessHeader from './VehiclessHeader';
import VehiclessTable from './VehiclessTable';
import VehiclessFilterContent from './VehiclessFilterContent';
import VehiclessFilterHeader from './VehiclessFilterHeader';
import VehicleGenerator from '../vehicle-generator/VehicleGenerator';
import reducer from '../store/reducers';


function Vehicless() {
    const pageLayout = useRef(null);
    const [tabValue, setTabValue] = useState(0);
    const user = useSelector(({ auth }) => auth.user);
    const T = new MDText(i18n.get(user.locale));

    function handleChangeTab(event, newValue) {
        setTabValue(newValue);
    }

    return (
        <FusePageCarded
            classes={{
                contentToolbar: "p-0 sm:p-24",
                content: "flex",
                contentCard: "overflow-hidden",
                header: "min-h-72 h-72 sm:h-136 sm:min-h-136"
            }}
            header={tabValue === 0 ? (
                <VehiclessHeader pageLayout={pageLayout} />
            ) : (
                <div className="flex flex-1 w-full items-center justify-center">
                    <span className="text-24 font-bold">
                        {T.translate("vehicle_generator.title")}
                    </span>
                </div>
            )}
            contentToolbar={
                <Tabs
                    value={tabValue}
                    onChange={handleChangeTab}
                    indicatorColor="secondary"
                    textColor="secondary"
                    variant="standard"
                    classes={{ root: "w-full h-64" }}
                >
                    <Tab 
                        className="h-64 normal-case" 
                        label={T.translate("vehicless.vehicless")} 
                    />
                    <Tab 
                        className="h-64 normal-case" 
                        label={T.translate("vehicle_generator.generator_tab")} 
                    />
                </Tabs>
            }
            content={
                <div className="w-full">
                    {tabValue === 0 ? (
                        <VehiclessTable />
                    ) : (
                        <VehicleGenerator />
                    )}
                </div>
            }
            leftSidebarHeader={tabValue === 0 ? <VehiclessFilterHeader /> : null}
            leftSidebarContent={tabValue === 0 ? <VehiclessFilterContent /> : null}
            sidebarInner
            ref={pageLayout}
            innerScroll
        />
    );
}

export default withReducer('VehiclesManagement', reducer)(Vehicless);