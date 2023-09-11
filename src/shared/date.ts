import {__} from "lodash";

export class DateUtility {
    static addDays(date: string | Date, days: number) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static startOf(date: Date) {
        return date.toISOString().slice(0, 10) + "T00:00:00Z";
    }

    static endOf(date: Date) {
        return date.toISOString().slice(0, 10) + "T23:59:59Z";
    }

    static getDates(startDate: string, stopDate: string) {
        const dateArray = [];
        let currentDate = new Date(startDate);
        const endDate = new Date(stopDate);
        while (currentDate <= endDate) {
            dateArray.push(currentDate);
            currentDate = DateUtility.addDays(currentDate, 1);
        }
        return dateArray;
    }


    static lodash() {
        // @ts-ignore
        return LodashGS.load() as __;
    }
}
