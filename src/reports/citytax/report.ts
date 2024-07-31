import {BerlinCityTaxRowItemModel, CityTax, HamburgCityTaxRowItemModel} from "./interfaces";
import {DateUtility, FormatUtility} from "shared";
import {BookingModels, FinanceModels} from "api/schema";
import {APIData} from "../../api/data";


export function generateCityTaxReport(city: CityTax, property: string, startDate: string, endDate: string) {
    const transactionStartDate = DateUtility.addDays(startDate, -60);
    const transactionEndDate = DateUtility.addDays(endDate, 60);
    const transactions = getTransactions(property, transactionStartDate, transactionEndDate, startDate, endDate);
    const reservations = APIData.getReservations(property, DateUtility.addDays(startDate, -120), DateUtility.addDays(startDate, 120));

    const sheet = createSheetWithReportInfo(city, property, endDate, startDate);

    switch (city) {
        case CityTax.BERLIN:
            generateBerlinCityTax(sheet, transactions, reservations);
            break;
        case CityTax.HAMBURG:
            generateHamburgCityTax(sheet, transactions, reservations);
            break;
    }
}

export function getCities() {
    return Object.keys(CityTax);
}

function generateBerlinCityTax(sheet: GoogleAppsScript.Spreadsheet.Sheet, transactions: FinanceModels["AccountingTransactionModel"][], reservations: BookingModels["ReservationItemModel"][]) {
    let rows: any[][] = [];

    const _ = DateUtility.lodash();

    const transactionsWithReservations = _.map(transactions, item => {
        return _.merge(item, _.find(reservations, function(reservation) { return reservation.id == item.reference || reservation.bookingId == item.reference; }));
    });
    const summarizedData = _(transactionsWithReservations)
        .groupBy(value => value.source ?? value.channelCode)
        .map((value, key) => {
            const totalWithoutVat = _.sumBy(value, 'amount.amount') ?? 0;
            const totalWithoutVatPercentage = 93;
            const totalWithVat = (totalWithoutVat / totalWithoutVatPercentage * 100) ?? 0;
            const totalWithVatPercentage = 5;
            const revenue = (totalWithVat / totalWithVatPercentage * 100) ?? 0;
            return {
                channelCode: key,
                cityTaxWithoutVat: totalWithoutVat,
                cityTaxWithVat: totalWithVat,
                netAccommodationRevenue: revenue
            } as BerlinCityTaxRowItemModel;
        })
        .value();

    for (const item of summarizedData) {
        rows.push([item.channelCode, item.cityTaxWithoutVat, item.cityTaxWithVat, item.netAccommodationRevenue]);
    }

    //set headers
    sheet.getRange(5, 1, 1, 4)
        .setValues([['Channel Source', 'City Tax excl. VAT', 'City Tax Incl. VAT', 'Net accommodation revenue']])
        .setFontWeight("bold");
    if (rows.length <= 0) return;
    const numberOfCols = rows[0].length;

    //set data
    sheet
        .getRange(6, 1, rows.length, numberOfCols)
        .setValues(rows)

    //format data
    sheet.getRange(6, 2, rows.length, numberOfCols - 1)
        .setNumberFormat("0.00");
}

function generateHamburgCityTax(sheet: GoogleAppsScript.Spreadsheet.Sheet, transactions: FinanceModels["AccountingTransactionModel"][], reservations: BookingModels["ReservationItemModel"][]) {
    let rows: any[][] = [];
    const _ = DateUtility.lodash();
    const transactionsWithReservations = _.map(transactions, item => {
        return _.merge(item, _.find(reservations, function(reservation) { return reservation.id == item.reference || reservation.bookingId == item.reference; }));
    });
    const summarizedData = _(transactionsWithReservations)
        .groupBy(value => value.amount.amount / value.adults)
        .map((value, key) => {
            const amount = Number(Utilities.formatString('%1.2f', Number(key)));
            let numberOfAdults = _.sumBy(value, 'adults') ?? 0;
            if (amount < 0) {
                numberOfAdults = numberOfAdults * -1;
            }
            return {
                cityTaxAmount: amount,
                correctedNumberOfGuests: numberOfAdults,
            } as HamburgCityTaxRowItemModel;
        })
        .groupBy(item => Math.abs(item.cityTaxAmount))
        .map((value, key) => {
            const amount = Number(key);
            const label = getAmountLabel(amount);
            const numberOfAdults = _.sumBy(value, 'correctedNumberOfGuests');
            return {
                cityTaxAmount: amount,
                correctedNumberOfGuests: numberOfAdults,
                label: label
            } as HamburgCityTaxRowItemModel
        })
        .sortBy('cityTaxAmount')
        .value();

    for (const item of summarizedData) {
        rows.push([item.cityTaxAmount, item.correctedNumberOfGuests, item.label]);
    }

    //set headers
    sheet.getRange(5, 1, 1, 3)
        .setValues([['City Tax Amount', 'Corrected # of Guests', 'Label']])
        .setFontWeight("bold");

    if (rows.length <= 0){
        return;
    }
    const numberOfCols = rows[0].length;

    //set data
    sheet
        .getRange(6, 1, rows.length, numberOfCols)
        .setValues(rows)

    //format data
    sheet.getRange(6, 1, rows.length, 1)
        .setNumberFormat("0.00");
}

function createSheetWithReportInfo(city: string, property: string, endDate: string, startDate: string) {
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const newSheetName = `citytax_${city}_${property}_${endDate}`;
    let datasheet = activeSpreadsheet.getSheetByName(newSheetName);
    if (!datasheet) {
        datasheet = activeSpreadsheet.insertSheet().setName(newSheetName);
    }
    datasheet.clear();
    datasheet.clearFormats();
    activeSpreadsheet.setActiveSheet(datasheet);

    const firstCell = datasheet.getRange(1, 1);
    firstCell.setValue("City Tax Report").setFontSize(18);
    datasheet
        .getRange(2, 1)
        .setValue(`for property ${property} from ${startDate} to ${endDate}`);
    datasheet
        .getRange(3, 1)
        .setValue("Executed: " + FormatUtility.formattedExecutionTime());

    return datasheet;
}

function getTransactions(property: string, transactionStartDate: Date, transactionEndDate: Date, startDate: string, endDate: string) {
    const transactions = APIData.getAccountTransactions(property, 'CityTax_Reduced:7.00', transactionStartDate, transactionEndDate);
    const reportDaysList = DateUtility.getDates(startDate, endDate).map(d => d.toISOString().slice(0, 10));
    return transactions.filter(transaction => transaction.command == "PostCharge" && reportDaysList.includes(transaction.date));
}


function getAmountLabel(amount: number) {

    const data = [{"Tax":0,"From":0,"To":10,"Label":"<10 Euro"},{"Tax":0.5,"From":11,"To":25,"Label":"<25 Euro"},{"Tax":1,"From":26,"To":50,"Label":"<50 Euro"},{"Tax":2,"From":51,"To":100,"Label":"<100 Euro"},{"Tax":3,"From":101,"To":150,"Label":"<150 Euro"},{"Tax":4,"From":151,"To":200,"Label":"<200 Euro"},{"Tax":5,"From":201,"To":250,"Label":"<250 Euro"},{"Tax":6,"From":251,"To":300,"Label":"<300 Euro"},{"Tax":7,"From":301,"To":350,"Label":"<350 Euro"},{"Tax":8,"From":351,"To":400,"Label":"<400 Euro"},{"Tax":9,"From":401,"To":450,"Label":"<450 Euro"},{"Tax":10,"From":451,"To":500,"Label":"<500 Euro"},{"Tax":11,"From":501,"To":550,"Label":"<550 Euro"},{"Tax":12,"From":551,"To":600,"Label":"<600 Euro"},{"Tax":13,"From":601,"To":650,"Label":"<650 Euro"},{"Tax":14,"From":651,"To":700,"Label":"<700 Euro"},{"Tax":15,"From":701,"To":750,"Label":"<750 Euro"},{"Tax":16,"From":751,"To":800,"Label":"<800 Euro"},{"Tax":17,"From":801,"To":850,"Label":"<850 Euro"},{"Tax":18,"From":851,"To":900,"Label":"<900 Euro"},{"Tax":19,"From":901,"To":950,"Label":"<950 Euro"},{"Tax":20,"From":951,"To":1000,"Label":"<1000 Euro"},{"Tax":21,"From":1001,"To":1050,"Label":"<1050 Euro"},{"Tax":22,"From":1051,"To":1100,"Label":"<1100 Euro"},{"Tax":23,"From":1101,"To":1150,"Label":"<1150 Euro"},{"Tax":24,"From":1151,"To":1200,"Label":"<1200 Euro"},{"Tax":25,"From":1201,"To":1250,"Label":"<1250 Euro"}];

    const label = data.find(item=> amount == item.Tax)?.Label ?? "";

    return label;
}
