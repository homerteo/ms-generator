import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';

export const GeneratorVehiclesListing = (variables) => ({
    query: gql`
            query GeneratorVehiclesListing($filterInput:GeneratorVehiclesFilterInput ,$paginationInput:GeneratorVehiclesPaginationInput,$sortInput:GeneratorVehiclesSortInput){
                GeneratorVehiclesListing(filterInput:$filterInput,paginationInput:$paginationInput,sortInput:$sortInput){
                    listing{
                       id,name,active,
                    },
                    queryTotalResultCount
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})

export const GeneratorVehicles = (variables) => ({
    query: gql`
            query GeneratorVehicles($id: ID!, $organizationId: String!){
                GeneratorVehicles(id:$id, organizationId:$organizationId){
                    id,name,description,active,organizationId,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})


export const GeneratorCreateVehicles = (variables) => ({
    mutation: gql`
            mutation  GeneratorCreateVehicles($input: GeneratorVehiclesInput!){
                GeneratorCreateVehicles(input: $input){
                    id,name,description,active,organizationId,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables
})

export const GeneratorDeleteVehicles = (variables) => ({
    mutation: gql`
            mutation GeneratorVehiclesListing($ids: [ID]!){
                GeneratorDeleteVehicless(ids: $ids){
                    code,message
                }
            }`,
    variables
})

export const GeneratorUpdateVehicles = (variables) => ({
    mutation: gql`
            mutation  GeneratorUpdateVehicles($id: ID!,$input: GeneratorVehiclesInput!, $merge: Boolean!){
                GeneratorUpdateVehicles(id:$id, input: $input, merge:$merge ){
                    id,organizationId,name,description,active
                }
            }`,
    variables
})

export const onGeneratorVehiclesModified = (variables) => ([
    gql`subscription onGeneratorVehiclesModified($id:ID!){
            GeneratorVehiclesModified(id:$id){    
                id,organizationId,name,description,active,
                metadata{ createdBy, createdAt, updatedBy, updatedAt }
            }
    }`,
    { variables }
])

export const GeneratorStartVehicleGeneration = (variables) => ({
    mutation: gql`
            mutation GeneratorStartVehicleGeneration{
                GeneratorStartVehicleGeneration{
                    code,message
                }
            }`,
    variables
})

export const GeneratorStopVehicleGeneration = (variables) => ({
    mutation: gql`
            mutation GeneratorStopVehicleGeneration{
                GeneratorStopVehicleGeneration{
                    code,message
                }
            }`,
    variables
})

export const GeneratorGeneratedVehiclesListing = (variables) => ({
    query: gql`
        query GeneratorGeneratedVehiclesListing($filterInput: GeneratorVehiclesFilterInput, $paginationInput: GeneratorVehiclesPaginationInput, $sortInput: GeneratorVehiclesSortInput) {
            GeneratorGeneratedVehiclesListing(filterInput: $filterInput, paginationInput: $paginationInput, sortInput: $sortInput) {
                listing {
                    id
                    plate
                    type
                    powerSource
                    hp
                    year
                    topSpeed
                    generatedAt
                    name
                    description
                    active
                }
                queryTotalResultCount
            }
        }
    `,
    variables,
    fetchPolicy: 'network-only',
});

export const VehicleGeneratedSubscription = gql`
    subscription VehicleGenerated {
        VehicleGenerated {
            aid
            timestamp
            data {
                plate
                type
                powerSource
                hp
                year
                topSpeed
            }
        }
    }
`;

export function onVehicleGenerated() {
    return [VehicleGeneratedSubscription];
}