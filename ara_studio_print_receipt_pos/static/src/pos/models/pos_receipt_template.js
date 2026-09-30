/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Base } from "@point_of_sale/app/models/related_models";

export class AraPosReceiptTemplate extends Base {
    static pythonModel = "ara.pos.receipt.template";
}

registry.category("pos_available_models").add(AraPosReceiptTemplate.pythonModel, AraPosReceiptTemplate);

