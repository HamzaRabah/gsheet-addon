export interface BerlinCityTaxRowItemModel {
    channelCode: string,
    cityTaxWithoutVat: number,
    cityTaxWithVat: number,
    netAccommodationRevenue: number
}

export interface HamburgCityTaxRowItemModel {
    cityTaxAmount: number,
    correctedNumberOfGuests: number,
    label: string
}

export enum CityTax { BERLIN = 'BERLIN', HAMBURG = 'HAMBURG'}