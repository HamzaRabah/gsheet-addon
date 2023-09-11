import {MathUtility} from "./round";

export class FormatUtility {
    static format(timeInMs: number): string {
        if (timeInMs < 100) {
            return `${timeInMs}ms`;
        }
        if (timeInMs < 1000 * 60) {
            return `${MathUtility.round(timeInMs / 1000)}s`;
        }

        const mins = Math.floor(timeInMs / 1000 / 60);
        const diff = timeInMs - mins * 1000 * 60;

        return diff > 0 ? `${mins}m ${FormatUtility.format(diff)}` : `${mins}m`;
    }


    static formattedExecutionTime() {
        const spreadSheetTimezone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
        const timezone = spreadSheetTimezone ? spreadSheetTimezone : "GMT";
        const formattedDate = Utilities.formatDate(new Date(), timezone, "EEE, d MMM yyyy, HH:mm");

        return formattedDate + " (" + timezone + ")";
    }
}