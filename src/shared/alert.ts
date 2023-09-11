export function alert(msg: string) {
    Browser.msgBox(msg, Browser.Buttons.OK);
}

export class AlertUtility {
    static alert(msg: string) {
        alert(msg);
    }
}