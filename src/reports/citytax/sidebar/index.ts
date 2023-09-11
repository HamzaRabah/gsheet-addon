import {Auth} from 'api/auth';

export class CityTaxReport {

    static openSidebar() {
        const service = Auth.getApaleoAuthService();

        const template = HtmlService.createTemplateFromFile("reports/citytax/sidebar/sidebar");
        template.isSignedIn = service.hasAccess();
        template.isCustomApp = !Auth.isApaleoApp();

        const sidebar = template
            .evaluate()
            .setTitle("City Tax Report")
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);

        SpreadsheetApp.getUi().showSidebar(sidebar);
    }

}