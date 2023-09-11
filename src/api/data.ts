import {IdentityModels, InventoryModels, ReportsModels, FinanceModels, BookingModels} from "./schema";
import {DateUtility} from "../shared";
import {Auth} from "./auth";
import {APIUtility} from "./utils";

const apaleoApiUrl = "https://api.apaleo.com";

const defaultOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get", muteHttpExceptions: true,
};

export class APIData {

    static getGrossTransactions(property: string, startDate: string, endDate: string) {
        const endpointUrl = apaleoApiUrl + "/reports/v0-nsfw/reports/gross-transactions";

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            ...defaultOptions, method: "post",
        };

        const queryParams = ["propertyId=" + property, "datefilter=" + "gte_" + startDate + "," + "lte_" + endDate,];

        const client = Auth.getClient();
        const url = endpointUrl + "?" + queryParams.join("&");
        const body = APIUtility.getResponseBody<ReportsModels["TransactionsGrossExportListModel"]>(client.fetch(url, options));

        return (body && body.transactions) || [];
    }

    static getAccountTransactions(property: string, accountCode: string, startDate: Date, endDate: Date) {
        const endpointUrl = apaleoApiUrl + "/finance/v1/accounts/export";

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            ...defaultOptions, method: "post",
        };

        const queryParams = ["propertyId=" + property, "accountNumber=" + accountCode, "from=" + DateUtility.startOf(startDate), "to=" + DateUtility.endOf(endDate)];

        const client = Auth.getClient();
        const url = endpointUrl + "?" + queryParams.join("&");
        const body = APIUtility.getResponseBody<FinanceModels["AccountingTransactionListModel"]>(client.fetch(url, options));

        return (body && body.transactions) || [];
    }

    static getReservations(property: string, stayStartDate?: Date, stayEndDate?: Date) {
        const endpointUrl = apaleoApiUrl + "/booking/v1/reservations";

        const queryParams = ["propertyId=" + property];
        if (stayStartDate || stayEndDate) {
            queryParams.push('dateFilter=Stay');
        }
        if (stayStartDate) {
            queryParams.push('from=' + DateUtility.startOf(stayStartDate));
        }
        if (stayEndDate) {
            queryParams.push('to=' + DateUtility.endOf(stayEndDate));
        }
        const client = Auth.getClient();
        const url = endpointUrl + "?" + queryParams.join("&");
        const body = APIUtility.getResponseBody<BookingModels["ReservationListModel"]>(client.fetch(url, defaultOptions));

        return (body && body.reservations) || [];
    }

}

/**
 * Returns info about current user
 */
export function getCurrentUserInfo() {
    const identityUrl = "https://identity.apaleo.com";

    const client = Auth.getClient();
    const user = APIUtility.getResponseBody(client.fetch(`${identityUrl}/connect/userinfo`, defaultOptions));

    if (!user || !user.sub) {
        throw new Error("User not found");
    }

    const detailsUrl = `${identityUrl}/api/v1/users/${user.sub}`;

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        ...defaultOptions, headers: {
            Accept: "application/json",
        },
    };

    return APIUtility.getResponseBody<IdentityModels["UserModel"]>(client.fetch(detailsUrl, options));
}

export function getPropertyList() {
    const url = apaleoApiUrl + "/inventory/v1/properties";

    const client = Auth.getClient();
    const body = APIUtility.getResponseBody<InventoryModels["PropertyListModel"]>(client.fetch(url, defaultOptions));

    return (body && body.properties) || [];
}

