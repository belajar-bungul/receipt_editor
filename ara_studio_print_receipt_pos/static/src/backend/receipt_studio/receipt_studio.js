/** @odoo-module **/

import { Component, useState, onWillStart, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class AraReceiptStudio extends Component {
    static template = "ara_studio_print_receipt_pos.ReceiptStudio";
    static props = ["*"];

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notification = useService("notification");
        this.dialog = useService("dialog");

        this.state = useState({
            templateId: null,
            template: {},
            blocks: [],
            selectedBlockId: null,
            paperWidth: "80mm",
            useSampleData: true,
            isSaving: false,
            saveState: "idle", // "idle" | "saving" | "success"
            showSyncToast: false,
            resetState: "idle", // "idle" | "resetting" | "success"
            showResetToast: false,
            templatesList: [],
            posConfigs: [],
            selectedConfigIds: [],
            draggedPaletteType: null,
            draggedCanvasIndex: null,
            dropTargetIndex: null,
            dropPosition: null, // "top" or "bottom"
        });

        onWillUnmount(() => {
            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
            }
            if (this._resetTimer) {
                clearTimeout(this._resetTimer);
            }
        });

        // Available Palette Component Blocks
        this.paletteBlocks = [
            {
                type: "header",
                title: _t("Header & Logo"),
                desc: _t("Store Logo, Business Name, Address, Contact, & Tax ID"),
                iconClass: "fa-building-o",
                iconBgClass: "icon-header",
            },
            {
                type: "order_info",
                title: _t("Transaction Info"),
                desc: _t("Receipt No, Date/Time, Cashier, Table, & Customer"),
                iconClass: "fa-info-circle",
                iconBgClass: "icon-order",
            },
            {
                type: "orderlines",
                title: _t("Items List"),
                desc: _t("Products List, Qty, Unit Price, Discount, & Line Total"),
                iconClass: "fa-list-alt",
                iconBgClass: "icon-table",
            },
            {
                type: "totals",
                title: _t("Totals & Summary"),
                desc: _t("Subtotal, Tax Details, Discounts, Grand Total, Payments, Change"),
                iconClass: "fa-calculator",
                iconBgClass: "icon-total",
            },
            {
                type: "divider",
                title: _t("Divider Line"),
                desc: _t("Dashed, Solid, Double, Stars, or Empty Gap"),
                iconClass: "fa-minus",
                iconBgClass: "icon-divider",
            },
            {
                type: "custom_text",
                title: _t("Custom Text"),
                desc: _t("Free Message, Store Policy, Warranty, or Notes"),
                iconClass: "fa-font",
                iconBgClass: "icon-text",
            },
            {
                type: "custom_html",
                title: _t("Custom HTML Block"),
                desc: _t("Raw HTML Code, Custom Badges, Icons, or Promo Tables"),
                iconClass: "fa-code",
                iconBgClass: "icon-html",
            },
            {
                type: "barcode",
                title: _t("Receipt Barcode"),
                desc: _t("Code128 Barcode Generated from Order Reference"),
                iconClass: "fa-barcode",
                iconBgClass: "icon-barcode",
            },
            {
                type: "qr_code",
                title: _t("E-Invoice QR Code"),
                desc: _t("Ticket Validation Portal QR / Custom Promo URL"),
                iconClass: "fa-qrcode",
                iconBgClass: "icon-qr",
            },
            {
                type: "social_media",
                title: _t("Social Media & Promo"),
                desc: _t("Instagram, WhatsApp, Website, & Coupon Banner"),
                iconClass: "fa-share-alt",
                iconBgClass: "icon-social",
            },
            {
                type: "footer",
                title: _t("Footer & WiFi"),
                desc: _t("Thank You Message, Free WiFi Info & Password"),
                iconClass: "fa-heart",
                iconBgClass: "icon-footer",
            },
        ];

        // Sample Data for Real-Time Live Preview
        this.sampleData = {
            company: {
                name: "Ara Artisan Coffee & Bakery",
                street: "120 Broadway Avenue, Suite 400",
                city: "New York, NY 10005",
                phone: "+1 (555) 234-5678",
                email: "hello@aracoffee.com",
                website: "www.aracoffee.com",
                vat: "US-987654321",
                logoUrl: "/web/static/img/placeholder.png",
            },
            order: {
                title: "SALES RECEIPT",
                ref: "POS/2026/09/0089",
                date: "Sep 29, 2026 14:35:12",
                cashier: "Alex Morgan",
                customer: "Jessica Tan (555-0192)",
                table: "Table 05 (Floor 2)",
                lines: [
                    {
                        name: "Caramel Macchiato",
                        qty: 2,
                        price: 4.5,
                        discount: 0,
                        total: 9.0,
                        note: "Oat milk, extra shot",
                    },
                    {
                        name: "Almond Butter Croissant",
                        qty: 1,
                        price: 5.0,
                        discount: 0,
                        total: 5.0,
                        note: "Warmed",
                    },
                    {
                        name: "Matcha Green Tea Latte",
                        qty: 1,
                        price: 5.5,
                        discount: 10,
                        total: 4.95,
                        note: "",
                    },
                    {
                        name: "Sparkling Water 500ml",
                        qty: 2,
                        price: 2.5,
                        discount: 0,
                        total: 5.0,
                        note: "",
                    },
                ],
                subtotal: 23.95,
                taxes: [
                    { name: "State Sales Tax (8.25%)", amount: 1.98 },
                ],
                discount: 0.55,
                rounding: 0.02,
                grandTotal: 25.95,
                payments: [
                    { name: "Card (Visa)", amount: 20.0 },
                    { name: "Cash", amount: 10.0 },
                ],
                change: 4.05,
                qrCodeUrl: "https://arasoft.id/pos/ticket/sample",
            },
        };

        onWillStart(async () => {
            const initialId =
                (this.props.action && this.props.action.params && this.props.action.params.template_id) ||
                (this.props.action && this.props.action.context && this.props.action.context.active_template_id) ||
                null;

            await Promise.all([this.loadTemplatesList(), this.loadPosConfigs()]);
            if (initialId) {
                await this.loadTemplate(initialId);
            } else if (this.state.templatesList.length > 0) {
                await this.loadTemplate(this.state.templatesList[0].id);
            }
        });
    }

    async loadTemplatesList() {
        try {
            const list = await this.orm.searchRead(
                "ara.pos.receipt.template",
                [],
                ["id", "name", "paper_width"]
            );
            this.state.templatesList = list;
        } catch (err) {
            console.error("Failed to load templates list:", err);
        }
    }

    async loadPosConfigs() {
        try {
            const configs = await this.orm.searchRead(
                "pos.config",
                [],
                ["id", "name", "ara_receipt_template_id"]
            );
            this.state.posConfigs = configs || [];
            this.updateSelectedConfigIds();
        } catch (err) {
            console.error("Failed to load POS configs:", err);
            this.state.posConfigs = [];
        }
    }

    updateSelectedConfigIds() {
        if (!this.state.templateId || !this.state.posConfigs) {
            this.state.selectedConfigIds = [];
            return;
        }
        this.state.selectedConfigIds = this.state.posConfigs
            .filter((c) => {
                const tmpl = c.ara_receipt_template_id;
                const tmplId = typeof tmpl === "object" ? tmpl[0] : tmpl;
                return tmplId === this.state.templateId;
            })
            .map((c) => c.id);
    }

    isConfigSelected(configId) {
        return (this.state.selectedConfigIds || []).includes(configId);
    }

    toggleConfigSelection(configId, checked) {
        if (!this.state.selectedConfigIds) {
            this.state.selectedConfigIds = [];
        }
        if (checked) {
            if (!this.state.selectedConfigIds.includes(configId)) {
                this.state.selectedConfigIds.push(configId);
            }
        } else {
            this.state.selectedConfigIds = this.state.selectedConfigIds.filter((id) => id !== configId);
        }
    }

    applyToAllConfigs() {
        if (this.state.posConfigs) {
            this.state.selectedConfigIds = this.state.posConfigs.map((c) => c.id);
        }
    }

    async loadTemplate(templateId) {
        try {
            const [tmpl] = await this.orm.read(
                "ara.pos.receipt.template",
                [templateId],
                [
                    "id",
                    "name",
                    "paper_width",
                    "font_family",
                    "font_size_base",
                    "line_spacing",
                    "show_logo",
                    "logo_width",
                    "custom_css",
                    "layout_json",
                ]
            );
            if (tmpl) {
                this.state.templateId = tmpl.id;
                this.state.template = tmpl;
                this.state.paperWidth = tmpl.paper_width || "80mm";

                // Parse layout_json
                let parsedBlocks = [];
                try {
                    parsedBlocks = JSON.parse(tmpl.layout_json || "[]");
                } catch (e) {
                    console.error("Error parsing template JSON, initializing empty:", e);
                }
                this.state.blocks = parsedBlocks;
                this.state.selectedBlockId = parsedBlocks.length > 0 ? parsedBlocks[0].id : null;
                this.updateSelectedConfigIds();
            }
        } catch (err) {
            this.notification.add(_t("Failed to load receipt template: ") + (err.message || err), {
                type: "danger",
            });
        }
    }

    async saveTemplate() {
        if (!this.state.templateId) return;
        this.state.isSaving = true;
        this.state.saveState = "saving";

        try {
            const payload = {
                name: this.state.template.name,
                paper_width: this.state.paperWidth,
                font_family: this.state.template.font_family,
                font_size_base: this.state.template.font_size_base,
                line_spacing: this.state.template.line_spacing,
                show_logo: this.state.template.show_logo,
                logo_width: parseInt(this.state.template.logo_width || 120, 10),
                custom_css: this.state.template.custom_css,
                layout_json: JSON.stringify(this.state.blocks, null, 2),
            };

            await this.orm.write("ara.pos.receipt.template", [this.state.templateId], payload);

            // Update linked POS configurations
            if (this.state.selectedConfigIds && this.state.selectedConfigIds.length > 0) {
                await this.orm.write("pos.config", this.state.selectedConfigIds, {
                    ara_receipt_template_id: this.state.templateId,
                });
                // Unlink configs that were deselected
                if (this.state.posConfigs) {
                    const toUnlink = this.state.posConfigs
                        .filter((c) => {
                            const tmpl = c.ara_receipt_template_id;
                            const tmplId = typeof tmpl === "object" ? tmpl[0] : tmpl;
                            return tmplId === this.state.templateId && !this.state.selectedConfigIds.includes(c.id);
                        })
                        .map((c) => c.id);
                    if (toUnlink.length > 0) {
                        await this.orm.write("pos.config", toUnlink, {
                            ara_receipt_template_id: false,
                        });
                    }
                }
            } else {
                // Automatically link current pos_config if opened from POS settings
                const posConfigId =
                    this.props.action?.params?.pos_config_id ||
                    this.props.action?.context?.active_pos_config_id;
                if (posConfigId) {
                    await this.orm.write("pos.config", [posConfigId], {
                        ara_receipt_template_id: this.state.templateId,
                    });
                }
            }

            // Real-Time Cross-Tab Synchronization Object
            const templateData = {
                id: this.state.templateId,
                name: this.state.template.name,
                paper_width: this.state.paperWidth,
                font_family: this.state.template.font_family,
                font_size_base: this.state.template.font_size_base,
                line_spacing: this.state.template.line_spacing,
                show_logo: this.state.template.show_logo,
                logo_width: parseInt(this.state.template.logo_width || 120, 10),
                custom_css: this.state.template.custom_css,
                layout_json: JSON.stringify(this.state.blocks),
                updated_at: Date.now(),
            };

            // 1. Save to localStorage for instant reload bypass of IndexedDB cache
            try {
                window.localStorage.setItem("ara_pos_latest_receipt_template", JSON.stringify(templateData));
                window.localStorage.setItem(`ara_pos_template_${this.state.templateId}`, JSON.stringify(templateData));
            } catch (e) {
                console.warn("Could not save template to localStorage", e);
            }

            // 2. Real-Time BroadcastChannel to any open POS tab in the same browser
            try {
                if (typeof window !== "undefined" && window.BroadcastChannel) {
                    const channel = new BroadcastChannel("ara_receipt_studio_channel");
                    channel.postMessage({
                        type: "RECEIPT_TEMPLATE_UPDATED",
                        template: templateData,
                        posConfigIds: this.state.selectedConfigIds,
                    });
                    channel.close();
                }
            } catch (e) {
                console.warn("Could not broadcast template update", e);
            }

            await Promise.all([this.loadTemplatesList(), this.loadPosConfigs()]);

            // Trigger WOW Animation States!
            this.state.saveState = "success";
            this.state.showSyncToast = true;

            if (this._saveTimer) {
                clearTimeout(this._saveTimer);
            }
            this._saveTimer = setTimeout(() => {
                this.state.saveState = "idle";
                this.state.isSaving = false;
                this.state.showSyncToast = false;
            }, 2600);

        } catch (err) {
            this.state.saveState = "idle";
            this.state.isSaving = false;
            this.state.showSyncToast = false;
            this.notification.add(_t("Failed to save receipt design: ") + (err.message || err), {
                type: "danger",
            });
        }
    }

    // --- Block Manipulation ---

    getDefaultSettings(type) {
        switch (type) {
            case "header":
                return {
                    show_logo: true,
                    logo_width: 120,
                    show_company_name: true,
                    company_name_size: "large",
                    company_name_bold: true,
                    show_address: true,
                    show_phone: true,
                    show_email: false,
                    show_website: false,
                    show_vat: true,
                    header_text: "Welcome to Our Store!",
                    align: "center",
                    margin_bottom: "small",
                };
            case "order_info":
                return {
                    receipt_title: "SALES RECEIPT",
                    show_title: true,
                    show_ref: true,
                    show_date: true,
                    show_cashier: true,
                    cashier_prefix: "Cashier: ",
                    show_customer: true,
                    show_table: true,
                    align: "left",
                    margin_bottom: "small",
                };
            case "orderlines":
                return {
                    layout: "detailed",
                    show_qty: true,
                    show_unit_price: true,
                    show_discount: true,
                    show_total: true,
                    show_notes: true,
                    show_tax_label: false,
                    show_item_divider: true,
                    margin_bottom: "small",
                };
            case "totals":
                return {
                    show_subtotal: true,
                    show_taxes: true,
                    show_discount: true,
                    show_rounding: true,
                    total_label: "TOTAL",
                    total_size: "large",
                    total_bold: true,
                    show_payments: true,
                    show_change: true,
                    change_label: "Change",
                    margin_bottom: "small",
                };
            case "divider":
                return {
                    style: "dashed",
                    margin: "small",
                };
            case "custom_text":
                return {
                    content: "Items purchased cannot be returned or exchanged without the original receipt.",
                    align: "center",
                    font_size: "small",
                    bold: false,
                    italic: false,
                    border_box: false,
                    margin_bottom: "small",
                };
            case "custom_html":
                return {
                    html_content: "<div style='text-align: center; padding: 4px; background: #f0f0f0; border-radius: 4px; font-weight: bold;'>🎉 COLLECT 10 STAMPS FOR A FREE COFFEE! 🎉</div>",
                    margin_bottom: "small",
                };
            case "barcode":
                return {
                    source: "order_ref",
                    barcode_type: "Code128",
                    height: 40,
                    show_human_readable: true,
                    align: "center",
                    margin_bottom: "small",
                };
            case "qr_code":
                return {
                    source: "portal_url",
                    custom_url: "",
                    label: "Scan for digital receipt & tax invoice",
                    size: 110,
                    align: "center",
                    margin_bottom: "small",
                };
            case "social_media":
                return {
                    instagram: "@ourstore.official",
                    whatsapp: "+1 (555) 234-5678",
                    website: "",
                    promo_box: "Show this receipt to get a 10% discount on your next visit!",
                    align: "center",
                    margin_bottom: "small",
                };
            case "footer":
                return {
                    thank_you: "Thank You for Shopping With Us!",
                    wifi_info: "Free WiFi: ARA-GUEST | Pass: welcome123",
                    show_powered_by: false,
                    align: "center",
                    margin_bottom: "none",
                };
            default:
                return {};
        }
    }

    addBlock(type, targetIndex = -1) {
        const titleMap = {
            header: "Header & Store Logo",
            order_info: "Transaction Info",
            orderlines: "Items List",
            totals: "Totals & Summary",
            divider: "Divider Line",
            custom_text: "Custom Text",
            custom_html: "Custom HTML Block",
            barcode: "Receipt Barcode",
            qr_code: "E-Invoice QR Code",
            social_media: "Social Media & Promo",
            footer: "Receipt Footer",
        };

        const newBlock = {
            id: `blk_${type}_${Date.now()}`,
            type: type,
            enabled: true,
            title: titleMap[type] || "Custom Block",
            settings: this.getDefaultSettings(type),
        };

        if (targetIndex >= 0 && targetIndex < this.state.blocks.length) {
            this.state.blocks.splice(targetIndex, 0, newBlock);
        } else {
            this.state.blocks.push(newBlock);
        }

        this.state.selectedBlockId = newBlock.id;
    }

    duplicateBlock(blockId) {
        const index = this.state.blocks.findIndex((b) => b.id === blockId);
        if (index === -1) return;

        const original = this.state.blocks[index];
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = `blk_${copy.type}_${Date.now()}`;
        copy.title = `${copy.title} (Copy)`;

        this.state.blocks.splice(index + 1, 0, copy);
        this.state.selectedBlockId = copy.id;
    }

    deleteBlock(blockId) {
        const index = this.state.blocks.findIndex((b) => b.id === blockId);
        if (index === -1) return;

        this.state.blocks.splice(index, 1);
        if (this.state.selectedBlockId === blockId) {
            this.state.selectedBlockId = this.state.blocks.length > 0 ? this.state.blocks[0].id : null;
        }
    }

    moveBlock(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.state.blocks.length) return;

        const item = this.state.blocks.splice(index, 1)[0];
        this.state.blocks.splice(newIndex, 0, item);
    }

    toggleBlock(blockId) {
        const block = this.state.blocks.find((b) => b.id === blockId);
        if (block) {
            block.enabled = !block.enabled;
        }
    }

    selectBlock(blockId) {
        this.state.selectedBlockId = blockId;
    }

    get selectedBlock() {
        return this.state.blocks.find((b) => b.id === this.state.selectedBlockId) || null;
    }

    // --- Drag and Drop Handlers ---

    onDragStartPalette(ev, type) {
        this.state.draggedPaletteType = type;
        this.state.draggedCanvasIndex = null;
        ev.dataTransfer.setData("text/plain", type);
        ev.dataTransfer.effectAllowed = "copy";
    }

    onDragStartCanvas(ev, index) {
        this.state.draggedPaletteType = null;
        this.state.draggedCanvasIndex = index;
        ev.dataTransfer.setData("text/plain", index.toString());
        ev.dataTransfer.effectAllowed = "move";
    }

    onDragOverCanvas(ev, index) {
        ev.preventDefault();
        const rect = ev.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const pos = ev.clientY < midY ? "top" : "bottom";

        this.state.dropTargetIndex = index;
        this.state.dropPosition = pos;
    }

    onDropCanvas(ev, targetIndex) {
        ev.preventDefault();
        const pos = this.state.dropPosition;
        let insertIndex = pos === "bottom" ? targetIndex + 1 : targetIndex;

        if (this.state.draggedPaletteType) {
            // Drop from palette
            this.addBlock(this.state.draggedPaletteType, insertIndex);
        } else if (this.state.draggedCanvasIndex !== null) {
            // Reorder inside canvas
            const fromIndex = this.state.draggedCanvasIndex;
            if (fromIndex !== insertIndex && fromIndex !== insertIndex - 1) {
                const item = this.state.blocks.splice(fromIndex, 1)[0];
                if (fromIndex < insertIndex) insertIndex--;
                this.state.blocks.splice(insertIndex, 0, item);
            }
        }

        this.cleanupDrag();
    }

    cleanupDrag() {
        this.state.draggedPaletteType = null;
        this.state.draggedCanvasIndex = null;
        this.state.dropTargetIndex = null;
        this.state.dropPosition = null;
    }

    // --- Formatters & Helpers ---

    formatCurrency(amount) {
        if (typeof amount !== "number") return amount;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    }

    printTestReceipt() {
        window.print();
    }

    async resetToDefault() {
        if (!confirm(_t("Are you sure you want to reset the receipt layout to default settings? Unsaved changes will be lost."))) {
            return;
        }

        this.state.resetState = "resetting";

        try {
            await this.orm.call("ara.pos.receipt.template", "action_reset_to_default", [[this.state.templateId]]);
            await this.loadTemplate(this.state.templateId);

            // Synchronize with POS in real-time
            const templateData = {
                id: this.state.templateId,
                name: this.state.template.name,
                paper_width: this.state.paperWidth,
                font_family: this.state.template.font_family,
                font_size_base: this.state.template.font_size_base,
                line_spacing: this.state.template.line_spacing,
                show_logo: this.state.template.show_logo,
                logo_width: parseInt(this.state.template.logo_width || 120, 10),
                custom_css: this.state.template.custom_css,
                layout_json: JSON.stringify(this.state.blocks),
                updated_at: Date.now(),
            };
            try {
                window.localStorage.setItem("ara_pos_latest_receipt_template", JSON.stringify(templateData));
                if (window.BroadcastChannel) {
                    const channel = new BroadcastChannel("ara_receipt_studio_channel");
                    channel.postMessage({
                        type: "RECEIPT_TEMPLATE_UPDATED",
                        template: templateData,
                        posConfigIds: this.state.selectedConfigIds,
                    });
                    channel.close();
                }
            } catch (e) {
                console.warn("BroadcastChannel reset error:", e);
            }

            // Trigger WOW Reset Animation States!
            this.state.resetState = "success";
            this.state.showResetToast = true;

            if (this._resetTimer) {
                clearTimeout(this._resetTimer);
            }
            this._resetTimer = setTimeout(() => {
                this.state.resetState = "idle";
                this.state.showResetToast = false;
            }, 2500);

        } catch (err) {
            this.state.resetState = "idle";
            this.state.showResetToast = false;
            this.notification.add(_t("Failed to reset: ") + (err.message || err), {
                type: "danger",
            });
        }
    }

    backToTemplates() {
        if (this.state.templateId) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "ara.pos.receipt.template",
                res_id: this.state.templateId,
                views: [
                    [false, "form"],
                    [false, "list"],
                ],
                view_mode: "form",
                target: "current",
            });
        } else {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "ara.pos.receipt.template",
                views: [
                    [false, "list"],
                    [false, "form"],
                ],
                view_mode: "list",
                target: "current",
            });
        }
    }
}

registry.category("actions").add("ara_studio_receipt_designer", AraReceiptStudio);
