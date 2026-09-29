/** @odoo-module **/

import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { AraCustomReceipt } from "../ara_custom_receipt/ara_custom_receipt";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";
import { useState, onWillUnmount } from "@odoo/owl";

patch(OrderReceipt.prototype, {
    setup() {
        super.setup(...arguments);
        try {
            this.pos = usePos();
        } catch (e) {
            // Pos hook might not be available in standalone print contexts
        }

        // Reactive state for real-time live synchronization with Receipt Studio
        this.araReceiptState = useState({
            liveTemplate: this._getLatestSavedTemplate(),
            updateTick: 0,
        });

        // Cross-tab BroadcastChannel listener for zero-delay live updates
        if (typeof window !== "undefined" && window.BroadcastChannel) {
            this._studioChannel = new BroadcastChannel("ara_receipt_studio_channel");
            this._studioChannel.onmessage = (event) => {
                if (event.data && event.data.type === "RECEIPT_TEMPLATE_UPDATED") {
                    const updatedTmpl = event.data.template;
                    const config = this.order?.config || this.pos?.config;
                    const currentConfigId = config?.id;

                    // If posConfigIds are specified, check if this POS is targeted
                    if (event.data.posConfigIds && event.data.posConfigIds.length > 0) {
                        if (currentConfigId && !event.data.posConfigIds.includes(currentConfigId)) {
                            return; // Update intended for other shops
                        }
                    }

                    // Update in-memory Odoo POS model if available
                    const templateModel =
                        this.pos?.models?.["ara.pos.receipt.template"] ||
                        this.pos?.data?.models?.["ara.pos.receipt.template"];
                    if (templateModel && updatedTmpl?.id) {
                        const existing = templateModel.get(updatedTmpl.id);
                        if (existing) {
                            Object.assign(existing, updatedTmpl);
                        } else {
                            try {
                                templateModel.insert([updatedTmpl]);
                            } catch (e) {}
                        }
                    }

                    // Instantly trigger re-render of the receipt screen
                    this.araReceiptState.liveTemplate = updatedTmpl;
                    this.araReceiptState.updateTick++;
                }
            };

            onWillUnmount(() => {
                try {
                    this._studioChannel?.close();
                } catch (e) {}
            });
        }
    },

    _getLatestSavedTemplate() {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                const raw = window.localStorage.getItem("ara_pos_latest_receipt_template");
                if (raw) {
                    return JSON.parse(raw);
                }
            }
        } catch (e) {}
        return null;
    },

    hasCustomReceipt() {
        return Boolean(this.customTemplate);
    },

    get customTemplate() {
        // Track reactivity
        const _tick = this.araReceiptState?.updateTick;
        const liveTmpl = this.araReceiptState?.liveTemplate || this._getLatestSavedTemplate();

        const config = this.order?.config || this.pos?.config;
        const templateModel =
            this.pos?.models?.["ara.pos.receipt.template"] ||
            this.pos?.data?.models?.["ara.pos.receipt.template"];

        const templateRef = config?.ara_receipt_template_id;
        const templateId = templateRef ? (typeof templateRef === "object" ? templateRef.id : templateRef) : null;

        // 1. If we have a live template freshly saved from Studio:
        if (liveTmpl) {
            // If this POS specifically uses this template ID, or has no explicit template assigned:
            if (!templateId || liveTmpl.id === templateId) {
                return liveTmpl;
            }
        }

        // 2. Case: templateRef is already an AraPosReceiptTemplate instance
        if (templateRef) {
            if (typeof templateRef === "object" && templateRef.layout_json) {
                return templateRef;
            }
            if (templateModel && templateId) {
                const tmpl = templateModel.get(templateId);
                if (tmpl) return tmpl;
            }
        }

        // 3. Fallback: If config has no explicit template assigned,
        // automatically use live template if available, else first active template
        if (liveTmpl) {
            return liveTmpl;
        }

        if (templateModel) {
            const tmpl = templateModel.getFirst();
            if (tmpl) return tmpl;
        }

        return null;
    },
});

// Register custom receipt component
Object.assign(OrderReceipt.components, { AraCustomReceipt });
