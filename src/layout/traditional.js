import { loadImage, generateLines, isVisible, parseRGBA, drawRoundedRect, measureFontHeight } from '../utils';

export default class Traditional  {

    constructor(cnvs) {

        this.cnvs = cnvs;
        this.ctxs = cnvs.map((canvas) => { return canvas.getContext("2d"); });
        this.ctxs[1].textAlign = 'start';
        this.ctxs[1].textBaseline = 'top';

        this.margin = {

            left: 10,
            top: 10
        };

        this.inventory = [];
        this.lineheight = 24;
        this.radius = 2;
        this.config = {

            id: null
        };

        this.section = null;

		this.drawn = {
			ctx: false,
			bg: false
		}
    }

    draw(scr, theme, section) {

		this.drawn.ctx = false;
		this.drawn.bg = false;

        if(this.config.id != theme.id) {

            let oldsection = (this.section) ? this.section : null;

            this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, this.cnvs[1].height);

            this.formatConfig(theme, section);
            this.drawBG(oldsection, true);
            this.drawBorders();
            this.drawHeader(scr.name);


        } else if (section != this.section) {

            let drawBG = !((this.section == "actions" && section == "inventory") || (this.section == "inventory" && section == "actions")),
                oldsection = (this.section) ? this.section : null;

            this.section = section;

            if(drawBG) {

                this.drawBG(oldsection);
                this.drawBorders();
                this.drawHeader(scr.name);

            } else {

				this.drawn.bg = true;
			}
        }

        switch(this.section) {

            case "main":
                this.drawTextarea(scr.text);
                this.drawSelections(scr.selections);
                this.clearActions();
				this.drawn.ctx = true;
            break;
            case "game":
                this.drawTextarea(scr.text);
                this.drawSelections(scr.selections);
                this.drawActions();
				this.drawn.ctx = true;
			break;
            case "actions":
                this.drawTextarea(scr.text);
                this.clearSelections();
                this.clearActions();
				this.drawn.ctx = true;
            break;
            case "inventory":
                //this.clearSelections();
                //this.clearActions();
                //this.clearTextarea();
				this.drawn.ctx = true;
				return this.drawInventory(scr.items);

            default:
                return;

        }
    }

    drawBorders() {

        let section = this.config[((this.section == "inventory") ? 'actions' : this.section)],
            all = [49, 220, 588],
            pos = (this.section == "game") ? [49, 220, 588] : [49, 588],
            self_ = this;

        for(let i = 0; i < all.length; i += 1) {

            this.ctxs[1].clearRect(0, all[i], this.cnvs[1].width, 10);
        }

        // Myös headerin puhdistus
        this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, 79);

        for(let i = 0; i < pos.length; i += 1) {

            let n = "border_" + (i+1);

            if(typeof section[n] !== "undefined") {

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section[n];
                this.ctxs[1].fillRect(this.margin.left, pos[i], (this.cnvs[1].width - this.margin.left * 2), 3);
                this.ctxs[1].restore();
            }
        }
    }

    drawHeader(text) {

        let section = this.config[((this.section == "inventory") ? 'actions' : this.section)],
            padding = 8,
            w = this.cnvs[1].width - padding * 2 - this.margin.left * 2,
            h = 24;

        let text_co = isVisible(section.header),
            text_bg = isVisible(section.header_bg),
            text_shadow = isVisible(section.header_font_shadow);

        // Tehdään puhdistus drawBorders osiossa
        //this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, 49);

        if(text_co) {

            this.ctxs[1].save();
            this.ctxs[1].font = 'normal 24px/1 ' + section.header_font;

            let lines = generateLines(this.ctxs[1], text, w, h),
                m     = this.ctxs[1].measureText(lines[0]);

            this.ctxs[1].restore();

            let pos = {

                top: (section.header_location == "at_line") ? 37 : 14
            };

            if(section.header_align == "middle" && m.width < w) {

                pos.left = (w / 2) - m.width / 2;

            } else if(section.header_align == "right") {

                pos.left = w + padding;

            } else {

                pos.left = this.margin.left + padding;
            }

            if(text_bg) {

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.header_bg;

                drawRoundedRect(this.ctxs[1], {

                    x: (section.header_align == "right") ? pos.left - 8 - m.width : pos.left - 8,
                    y: pos.top - 4,
                    w: m.width + 19,
                    h: 32,
                    r: [this.radius, this.radius, this.radius, this.radius]
                });

                this.ctxs[1].fill();
                this.ctxs[1].restore();
            }

            const th = measureFontHeight(lines[0], 'normal 24px/1 ' + section.header_font);

            this.ctxs[1].save();
            this.ctxs[1].fillStyle = section.header;
            this.ctxs[1].textAlign = (section.header_align == "left") ? "start" : ((section.header_align == "right") ? "end" : "middle");
            this.ctxs[1].font = 'normal 24px/1 ' + section.header_font;

            if(text_shadow) {

                this.ctxs[1].shadowOffsetX = 0;
                this.ctxs[1].shadowOffsetY = 0;
                this.ctxs[1].shadowColor = section.header_font_shadow;
                this.ctxs[1].shadowBlur = 5;
            }

            this.ctxs[1].fillText(lines[0], pos.left, pos.top - 4 + th.top);
            this.ctxs[1].restore();
        }
    }

    drawTextarea(text) {


        let section = this.config[((this.section == "inventory") ? 'actions' : this.section)],
            padding = 12,
            w       = this.cnvs[1].width - (padding * 2) - (this.margin.left * 2),
            h       = 80,
            lws     = [],
            self_   = this;


        this.clearTextarea();

        if(section.text_display == "no") {
            return;
        }

        let text_bg = isVisible(section.text_bg),
            text_shadow = isVisible(section.text_font_shadow);

        // Calculate lines

        this.ctxs[1].save();
        this.ctxs[1].font = 'normal 16px/1 ' + section.text_font;

        let lines = generateLines(this.ctxs[1], text, w, h);

        for(let i = 0; i < lines.length; i += 1) {

            let m = this.ctxs[1].measureText(lines[i]);
            lws.push(m.width);
        }

        this.ctxs[1].restore();

        // Text bg

        if(text_bg) {

            this.ctxs[1].save();
            this.ctxs[1].fillStyle = section.text_bg;

            drawRoundedRect(this.ctxs[1], {

                x: this.margin.left + padding - 8, //left - 8,
                y: h - 8,
                w: w + 19,
                h: (lines.length * 24) + 12,
                r: [this.radius, this.radius, this.radius, this.radius]
            });

            this.ctxs[1].fill();
            this.ctxs[1].restore();
        }

        // Lines loop

        for(let i = 0; i < lines.length; i += 1) {

            let left = 0,
                top  = h + 24 * i,
                m = lws[i];

            if(section.text_align == "center" && m < w) {

                left = (self_.cnvs[1].width / 2) - m / 2;

            } else if(section.text_align == "right") {

                left = w + padding;

            } else {

                left = this.margin.left + padding;
            }

            //const th = measureFontHeight(lines[i], 'normal 16px/1 ' + section.text_font, 24);

            /*// Text bg

            if(text_bg) {

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.text_bg;

                drawRoundedRect(this.ctxs[1], {

                    x: this.margin.left + padding - 8, //left - 8,
                    y: top - 6,
                    w: w + 19,
                    h: (i + 1 == lines.length || i == 0) ? 32 : 24,
                    r: (i == 0) ? [this.radius, 0, 0 , this.radius] : (((i + 1) == lines.length) ? [0, this.radius, this.radius, 0] : [0, 0, 0, 0])
                });

                this.ctxs[1].fill();
                this.ctxs[1].restore();
            }*/

            // Text color

            this.ctxs[1].save();
            this.ctxs[1].fillStyle = section.text;
            this.ctxs[1].textAlign = (section.text_align == "left") ? "start" : ((section.text_align == "right") ? "end" : "middle");
            this.ctxs[1].font = 'normal 16px/1 ' + section.text_font;

            if(text_shadow) {

                this.ctxs[1].shadowOffsetX = 0;
                this.ctxs[1].shadowOffsetY = 0;
                this.ctxs[1].shadowColor = section.text_font_shadow;
                this.ctxs[1].shadowBlur = 5;
            }

            this.ctxs[1].fillText(lines[i], left, top);
            this.ctxs[1].restore();
        }
    }

    clearTextarea() {

        this.ctxs[1].clearRect(0, 72, this.cnvs[1].width, 148);
    }

    drawSelections(sels) {

        let section = this.config[this.section],
            pos     = section.selections,
            padding = 12,
            top     = 257,
            left    = 141,
            w       = 678,
            h       = 48,
            kw      = 28,
            lws     = 0;

        this.clearSelections();
        this.selections = [];

        let text_bg = isVisible(section.selections_bg),
            key_bg = isVisible(section.selections_key_bg),
            text_shadow = isVisible(section.selections_font_shadow);

        // Count background width

        this.ctxs[1].save();
        this.ctxs[1].font = 'normal 16px/1 ' + section.selections_font;

        for(let i = 0; i < sels.length; i += 1) {

            let lines = generateLines(this.ctxs[1], sels[i].text, w - kw, h);

            for(let i = 0; i < lines.length; i += 1) {

                let m = this.ctxs[1].measureText(lines[i]);

                if(m.width > lws) {

                    lws = m.width;
                }
            }
        }

        this.ctxs[1].restore();

        // Selections loop

        for(let i = 0; i < sels.length; i += 1) {

            if(sels[i].disabled == 0) {

                // Text

                this.ctxs[1].save();
                this.ctxs[1].font = 'normal 16px/1 ' + section.selections_font;

                let ln = this.selections.length,
                    num = (ln + 1) + ".",
                    lines = generateLines(this.ctxs[1], sels[i].text, w - kw, h),
                    lh = (lines.length > 2) ? 2 : lines.length,
                    l = 0;

                this.ctxs[1].restore();

                if(section.text_align == "center") {

                    left = this.cnvs[0].width / 2 - (lws + kw + 20) / 2;

                } else if(section.text_align == "right") {

                    left = this.cnvs[1].width - padding;

                } else {

                    left = this.margin.left + padding;
                }

                // Key bg

                if(key_bg) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.selections_key_bg;

                    let r  = (section.text_align == "right") ? (!text_bg) ? 0 : this.radius : this.radius,
                        r2 = (section.text_align == "right") ? this.radius : (!text_bg) ? this.radius : 0;

                    drawRoundedRect(this.ctxs[1], {

                        x: (section.text_align == "right") ? left - kw : left,
                        y: top - 10,
                        w: 28,
                        h: 32,
                        r: [r2, r2, r, r]
                    });

                    this.ctxs[1].fill();
                    this.ctxs[1].restore();
                }

                // Key

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.selections_key;
                this.ctxs[1].textAlign = "start";
                this.ctxs[1].font = 'bold 16px/1 ' + section.selections_font;

                if(text_shadow) {

                    this.ctxs[1].shadowOffsetX = 0;
                    this.ctxs[1].shadowOffsetY = 0;
                    this.ctxs[1].shadowColor = section.selections_font_shadow;
                    this.ctxs[1].shadowBlur = 5;
                }

                const th_key = measureFontHeight(num, 'bold 16px/1 ' + section.selections_font);

                this.ctxs[1].fillText(num, (section.text_align == "right") ? left - padding - 8 : left + 8, (top - 10) + th_key.top, kw, 24);
                this.ctxs[1].restore();

                // Text

                for(let j = 0; j < lh; j += 1, l += 32) {

                    // Text bg

                    if(text_bg) {

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = section.selections_bg;

                        let r  = (section.text_align == "right") ? this.radius : (key_bg) ? 0 : this.radius,
                            r2 = (section.text_align == "right") ? (key_bg) ? 0 : this.radius : this.radius;

                        drawRoundedRect(this.ctxs[1], {

                            x: (section.text_align == "right") ? left - kw - lws - padding - 8 : left + kw,
                            y: (top + l) - 10,
                            w: lws + 19,
                            h: 32,
                            r: [r2, r2, r, r]
                        });

                        this.ctxs[1].fill();
                        this.ctxs[1].restore();
                    }

                    const th = measureFontHeight(lines[j], 'normal 16px/1 ' + section.selections_font);

                    // Text

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.selections;
                    this.ctxs[1].textAlign = (section.text_align == "left") ? "start" : ((section.text_align == "right") ? "end" : "middle");
                    this.ctxs[1].font = 'normal 16px/1 ' + section.selections_font;

                    if(text_shadow) {

                        this.ctxs[1].shadowOffsetX = 0;
                        this.ctxs[1].shadowOffsetY = 0;
                        this.ctxs[1].shadowColor = section.selections_font_shadow;
                        this.ctxs[1].shadowBlur = 5;
                    }

                    this.ctxs[1].fillText(lines[j], (section.text_align == "right") ? left - 38 : left + 38, (top + l) - 10 + th.top);
                    this.ctxs[1].restore();
                }

                this.selections.push({
                    ind: i,
                    pos: [left, top - 10, lws + 19 + kw, l]
                });

                top += l + 18;
            }
        }
    }

    clearSelections() {

        this.selections = [];
        this.ctxs[1].clearRect(0, 247, this.cnvs[1].width, 336);
    }

    drawActions() {

        if(!this.config.use_items) {

            return;
        }

        let section = this.config[this.section],
            pos     = section.selections,
            padding = 12,
            top     = 548,
            left    = 0,
            w       = 678,
            h       = 48,
            kw      = 28,
            tw      = 0,
            lws     = [],
            l       = 0;

        this.clearActions();

        let text_bg = isVisible(section.actions_bg),
            key_bg = isVisible(section.actions_key_bg),
            text_shadow = isVisible(section.actions_font_shadow);

        // Measure widths

        this.ctxs[1].save();
        this.ctxs[1].font = 'normal 16px/1 ' + section.actions_font;

        for(let i = 0; i < this.config.keys.length; i += 1) {

            if(this.config.keys[i][0] != "") {

                let m = this.ctxs[1].measureText(this.config.keys[i][0]);
                lws.push(m.width);
                tw += m.width + 38 + 19;
            }
        }

        this.ctxs[1].restore();

        tw += 40 * 2;
        left = this.cnvs[1].width / 2 - tw / 2;

        // Actions loop

        this.actions = [];

        for(let i = 0; i < this.config.keys.length; i += 1) {

            if(this.config.keys[i][0] != "") {

                l += (i == 0) ? 0 : lws[(i-1)] + 102;

                // Key bg

                if(key_bg) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.actions_key_bg;

                    let r  = this.radius,
                        r2 = (!text_bg) ? this.radius : 0;

                    drawRoundedRect(this.ctxs[1], {

                        x: left + l,
                        y: top - 10,
                        w: 28,
                        h: 32,
                        r: [r2, r2, r, r]
                    });

                    this.ctxs[1].fill();
                    this.ctxs[1].restore();
                }

                // Key

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.actions_key;
                this.ctxs[1].textAlign = "start";
                this.ctxs[1].font = 'bold 16px/1 ' + section.actions_font;

                const th = measureFontHeight(this.config.keys[i][1] + ".", 'bold 16px/1 ' + section.actions_font);

                if(text_shadow) {

                    this.ctxs[1].shadowOffsetX = 0;
                    this.ctxs[1].shadowOffsetY = 0;
                    this.ctxs[1].shadowColor = section.actions_font_shadow;
                    this.ctxs[1].shadowBlur = 5;
                }

                this.ctxs[1].fillText(this.config.keys[i][1] + ".", left + 8 + l, (top - 10) + th.top, kw, 24);
                this.ctxs[1].restore();

                // Text bg

                if(text_bg) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.actions_bg;

                    let r  = (key_bg) ? 0 : this.radius,
                        r2 = this.radius;

                    drawRoundedRect(this.ctxs[1], {

                        x: left + l + kw,
						y: top - 10,
                        w: lws[i] + 19,
                        h: 32,
                        r: [r2, r2, r, r]
                    });

                    this.ctxs[1].fill();
                    this.ctxs[1].restore();
                }

                // Text

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.actions;
                this.ctxs[1].textAlign = "start";
                this.ctxs[1].font = 'normal 16px/1 ' + section.actions_font;

                if(text_shadow) {

                    this.ctxs[1].shadowOffsetX = 0;
                    this.ctxs[1].shadowOffsetY = 0;
                    this.ctxs[1].shadowColor = section.actions_font_shadow;
                    this.ctxs[1].shadowBlur = 5;
                }

                const th_txt = measureFontHeight(this.config.keys[i][0], 'normal 16px/1 ' + section.actions_font);

                this.ctxs[1].fillText(this.config.keys[i][0], left + l + 38, (top - 10) + th_txt.top);
                this.ctxs[1].restore();

                this.actions.push({
                    ind: i,
                    pos: [left + l, top - 10, lws[i] + kw + 19, 32]
                });
            }
        }
    }

    clearActions() {

        this.actions = [];
        this.ctxs[1].clearRect(0, 546, this.cnvs[1].width, 42);
    }

    drawInventory(items) {

        if(items.length == 0 && Array.isArray(items)) {

            this.clearInventory();
            this.section = "actions";
            this.drawTextarea(this.config.empty_inventory);
            return [];
        }

        let section = this.config.actions,
            top = 120,
            left = 80,
            pos = {
                top: 0,
                left: 0,
                line: 1
            },
            elem = {
                w: 236,
                h: 56
            },
            kw = 28,
            padding = 12,
            selected = section.selected_items,
            trgt = { id: 0 },
            res = [];

        if(items.id) {

            trgt = items;
            items = this.inventory;

        } else {

            this.clearSelections();
            this.clearActions();
            this.clearTextarea();
            this.clearInventory();
            this.inventory = [];
        }

        /* Backgrounds & shadows */

        let text_bg = isVisible(section.items_bg),
            key_bg = isVisible(section.items_key_bg),
            text_shadow = isVisible(section.items_font_shadow);

        /* Loop items */

        let row_height = 0;

        for(let i = 0; i < items.length; i += 1) {

            if(pos.line <= 3 && (trgt.id == 0 || (trgt.id > 0 && items[i].id == trgt.id))) {

                // Measure line widths

                this.ctxs[1].save();
                this.ctxs[1].font = 'normal 16px/1 ' + section.items_font;

                let lines = generateLines(this.ctxs[1], items[i].name, elem.w - elem.padding * 2 - kw - 16, 48),
                    count = (lines.length > 2) ? 2 : lines.length;

                this.ctxs[1].restore();

                // Item position

                let item_top  = top + pos.top - 10,
                    item_left = left + pos.left;

                // Has item count

                let unt = (items[i].unit != "" && typeof items[i].unit !== "undefined") ? " " + items[i].unit : "x",
                    pcs = (items[i].count > 1) ?  items[i].count + unt : ((unt == "x") ? "" : unt);

                // Item height

                let item_height = (count > 1) ? elem.h + 32 : elem.h;
                item_height = (pcs != "") ? elem.h + 32 : elem.h;

                if(row_height < item_height) {

                    row_height = item_height;
                }

                // Clear

                if(trgt.id > 0) {

                    this.ctxs[1].clearRect(item_left, item_top, elem.w, item_height);
                }

                // Items selected bg

                if(trgt.id > 0 && trgt.selected || items[i].selected) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = selected;

                    drawRoundedRect(this.ctxs[1], {

                        x: item_left,
                        y: item_top,
                        w: elem.w,
                        h: item_height,
                        r: [this.radius, this.radius, this.radius, this.radius]
                    });

                    this.ctxs[1].fill();
                    this.ctxs[1].restore();
                }

                // Key bg

                if(key_bg) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.items_key_bg;

                    let r = this.radius,
                        r2 = (!text_bg) ? this.radius : 0;

                    drawRoundedRect(this.ctxs[1], {

                        x: item_left + padding,
                        y: item_top + padding,
                        w: 28,
                        h: 32,
                        r: [r2, r2, r, r]
                    });

                    this.ctxs[1].fill();
                    this.ctxs[1].restore();
                }

                // Key

                let num = (i + 1) + ".";

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = section.items_key;
                this.ctxs[1].textAlign = "start";
                this.ctxs[1].font = 'bold 16px/1 ' + section.items_font;

                if(text_shadow) {

                    this.ctxs[1].shadowOffsetX = 0;
                    this.ctxs[1].shadowOffsetY = 0;
                    this.ctxs[1].shadowColor = section.items_font_shadow;
                    this.ctxs[1].shadowBlur = 5;
                }

                const th_key = measureFontHeight(num, 'bold 16px/1 ' + section.items_font);

                this.ctxs[1].fillText(num, item_left + padding + 8, item_top + padding + th_key.top, kw, 24);
                this.ctxs[1].restore();

                // Text loop

                let l = 0;

                for(let j = 0; j < count; j += 1, l += 32) {

                    // Text bg

                    if(text_bg) {

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = section.items_bg;

                        let r = (key_bg) ? 0 : this.radius,
                            r2 = this.radius;

                        drawRoundedRect(this.ctxs[1], {

                            x: item_left + padding + kw,
                            y: item_top + padding,
                            w: elem.w - padding * 2 - kw,
                            h: 32,
                            r: [r2, r2, r, r]
                        });

                        this.ctxs[1].fill();
                        this.ctxs[1].restore();
                    }

                    // Text

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.items;
                    this.ctxs[1].textAlign = "start";
                    this.ctxs[1].font = 'normal 16px/1 ' + section.items_font;

                    const th = measureFontHeight(lines[j], 'normal 16px/1 ' + section.items_font);

                    if(text_shadow) {

                        this.ctxs[1].shadowOffsetX = 0;
                        this.ctxs[1].shadowOffsetY = 0;
                        this.ctxs[1].shadowColor = section.items_font_shadow;
                        this.ctxs[1].shadowBlur = 5;
                    }

                    this.ctxs[1].fillText(lines[j], item_left + padding + kw + 8, item_top + padding + l + th.top);
                    this.ctxs[1].restore();
                }

                // Item count

                if(pcs != "") {

                    // Item count bg

                    if(text_bg) {

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = section.items_bg;
                        this.ctxs[1].textAlign = "start";
                        this.ctxs[1].font = 'normal 16px/1 ' + section.items_font;

                        let m = this.ctxs[1].measureText(pcs);

                        drawRoundedRect(this.ctxs[1], {

                            x: item_left + padding + kw,
                            y: item_top + l + padding,
                            w: m.width + 16,
                            h: 32,
                            r: [0, this.radius, this.radius, 0]
                        });

                        this.ctxs[1].fill();
                        this.ctxs[1].restore();
                    }

                    // Item count text

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = section.items;
                    this.ctxs[1].textAlign = "start";
                    this.ctxs[1].font = 'normal 16px/1 ' + section.items_font;

                    if(text_shadow) {

                        this.ctxs[1].shadowOffsetX = 0;
                        this.ctxs[1].shadowOffsetY = 0;
                        this.ctxs[1].shadowColor = section.selections_font_shadow;
                        this.ctxs[1].shadowBlur = 5;
                    }

                    const th_pcs = measureFontHeight(pcs, 'normal 16px/1 ' + section.items_font);

                    this.ctxs[1].fillText(pcs, item_left + padding + kw + 8, item_top + padding + l + th_pcs.top);
                    this.ctxs[1].restore();
                }

                if(trgt.id == 0) {

                    res.push(items[i]);

                    this.inventory.push({

                        id: items[i].id,
                        name: items[i].name,
                        unit: items[i].unit,
                        count: items[i].count,
                        x: item_left,
                        y: item_top,
                        w: elem.w,
                        h: item_height
                    });
                }
            }

            // Set position

            if(pos.left > 2 * elem.w) {

                pos.left = 0;
                pos.top += row_height + 40;
                pos.line += 1;
                row_height = 0;

            } else {

                pos.left += elem.w + 40;
            }
        }

        return res;
    }

    clearInventory() {

        this.ctxs[1].clearRect(0, 223, this.cnvs[1].width, 365);
    }

    drawBG(oldsection, force) {

        var self_ = this,
            section = this.config[((this.section == "inventory") ? "actions" : this.section)];

        force = (typeof force !== "undefined");
		var no_old = (!oldsection) ? null : oldsection;
        oldsection = (oldsection == "inventory") ? "actions" : oldsection;
        oldsection = (oldsection) ? this.config[oldsection] : {};

        if((oldsection.background_img != section.background_img && section.background_img !== null) || !no_old) {

			this.ctxs[0].clearRect(0, 0, this.cnvs[0].width, this.cnvs[0].height);
            this.ctxs[0].fillStyle = (section.background !== null) ? section.background : "none";
            this.ctxs[0].fillRect(0, 0, this.cnvs[0].width, this.cnvs[0].height);
        }

        if((section.background_img !== null && oldsection.background_img != section.background_img) || (force && section.background_img !== null)) {

            loadImage(section.background_img).then((image) => {

                let opacity = 0;

                (function fadeIn() {

                    opacity += 0.05;

                    self_.ctxs[0].globalAlpha = opacity;
                    self_.ctxs[0].clearRect(0, 0, self_.cnvs[0].width, self_.cnvs[0].height);
                    self_.ctxs[0].fillStyle = "#000";
                    self_.ctxs[0].drawImage(image, 0, 0);

                    if(opacity < 1) {

                        window.requestAnimationFrame(fadeIn);

                    } else {

                        self_.loading = false;
						self_.drawn.bg = true;
                    }

                })();

            }).catch((err) => { console.log(err); })
        } else {
			self_.drawn.bg = true;
		}
    }

    formatConfig(settings, section) {

        this.config = ['game', 'main', 'actions'].reduce((o, k) => { o[k] = settings[k]; return o; }, {});
        this.config.empty_inventory = settings.empty_inventory;
        this.config.use_items = settings.use_items;
        this.config.keys = [settings.pickup, settings.inventory, settings.use];
        this.config.inventory = false;
        this.config.id = settings.id;
        this.section = section;
    }

    /* Get position */

    getElement(pos) {

        if(this.section == "actions") {

            return { target: "actions" };
        }

        let sc = this.config[this.section],
            mu = {
                w: this.cnvs[1].getAttribute("width") / this.cnvs[1].offsetWidth,
                h: this.cnvs[1].getAttribute("height") / this.cnvs[1].offsetHeight
            },
            self_ = this,
            sels  = (this.section == 'inventory') ? ['inventory'] : ['selections', 'actions'];

        pos.x *= mu.w;
        pos.y *= mu.h;

        let matches = sels.map((c, i) => {

            let target = [];

            switch(c) {

                case "selections":
                    target = self_.selections;
                break;
                case "actions":
                    target = self_.actions;
                break;
                case "inventory":
                    target = self_.inventory;
                break;
                default:
                    target = [];
            }

            return target.map((s, i) => {

                let x, x2, y, y2;

                if(c == "inventory") {

                    x  = s.x;
                    x2 = s.x + s.w;
                    y  = s.y;
                    y2 = s.y + s.h;

                } else {

                    x  = s.pos[0];
                    x2 = s.pos[0] + s.pos[2];
                    y  = s.pos[1];
                    y2 = s.pos[1] + s.pos[3];
                }

                if(c == "selections") {

                    let ind = self_.selections[i];
                    ind = (typeof s.ind === "undefined") ? false : s.ind;
                    return (pos.x >= x && pos.x < x2 && pos.y >= y && pos.y < y2 && ind !== false) ? { ind: ind, target: c } : null;

                } else if(c == "actions") {

                    let t = (i == 0) ? 'pickup' : ((i == 1) ? 'inventory' : 'use');
                    return (pos.x >= x && pos.x < x2 && pos.y >= y && pos.y < y2) ? { ind: i, target: t } : null;

                } else if(c == "inventory") {

                    let id = (pos.x >= x && pos.x < x2 && pos.y >= y && pos.y < y2) ? s.id : null,
                        elem = (id !== null) ? 'item' : null,
                        count = (id !== null) ? s.count : null;

                    return (id) ? { elem: elem, id: id, count: count, target: "inventory" } : null;
                }

            }).reduce((total, k) => { if(k) { total = k; } return total; }, null);

        }).reduce((total, k) => { if(k) { total = k; } return total; }, { target: null });

        if(this.section == 'inventory' && matches.target === null) {

            matches.target = "inventory";
            matches.elem = null;
        }

        return matches;
    }
}
