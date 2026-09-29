import { registry } from "@web/core/registry";
import { Base } from "@point_of_sale/app/models/related_models";
import { PosConfig } from "@point_of_sale/app/models/pos_config";

export class AraPosReceiptTemplate extends Base {
    static pythonModel = "ara.pos.receipt.template";
}

registry.category("pos_available_models").add(AraPosReceiptTemplate.pythonModel, AraPosReceiptTemplate);

// Declare many2one relation on PosConfig so data_service connects records
PosConfig.extraFields = {
    ...(PosConfig.extraFields || {}),
    ara_receipt_template_id: {
        type: "many2one",
        relation: "ara.pos.receipt.template",
    },
};

