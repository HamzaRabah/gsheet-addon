import {Auth} from 'api/auth';

export class ORLReport {
    static openSidebar() {
        const service = Auth.getApaleoAuthService();

        const template = HtmlService.createTemplateFromFile("reports/orl/sidebar/sidebar");
        template.isSignedIn = service.hasAccess();
        template.isCustomApp = !Auth.isApaleoApp();

        const sidebar = template
            .evaluate()
            .setTitle("Open Receivables & Liabilities")
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);

        SpreadsheetApp.getUi().showSidebar(sidebar);
    }

}
