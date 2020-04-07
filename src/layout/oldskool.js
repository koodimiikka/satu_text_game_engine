import { loadImage, generateRGB, generateLines } from '../utils';

export default class Oldskool  {

    constructor(cnvs) {

        this.cnvs = cnvs;
        this.ctxs = cnvs.map((canvas) => { return canvas.getContext("2d"); });

        this.ctxs[1].font = 'normal 16px fsex300';
        this.ctxs[1].textAlign = 'start';
        this.ctxs[1].textBaseline = 'top';

        this.margin = {

            left: (this.cnvs[0].width - 840) / 2,
            top: (this.cnvs[0].height - 560) / 2
        };

        this.inventory = {

            items: [],
            width: 182,
            height: 64,
            margin: 8
        };

        this.lineheight = 16;

        this.codes = [

            [0, 0, 0, 255],
            [170, 0, 0, 255],
            [0, 170, 0, 255],
            [170, 85, 0, 255],
            [0, 0, 170, 255],
            [170, 0, 170, 255],
            [0, 170, 170, 255],
            [170, 170, 170, 255],
            [85, 85, 85, 255],
            [255, 85, 85, 255],
            [85, 255, 85, 255],
            [255, 255, 85, 255],
            [85, 85, 255, 255],
            [255, 85, 255, 255],
            [85, 255, 255, 255],
            [255, 255, 255, 255]
        ];

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

            this.formatConfig(theme, section);
            this.drawBG();

        } else if (section != this.section) {

            let drawBG = !((this.section == "actions" && section == "inventory") || (this.section == "inventory" && section == "actions"));
            this.section = section;

            if(drawBG) {

                this.drawBG();

			} else {

				this.drawn.bg = true;

			}
        }

        switch(this.section) {

            case "main": case "game":
                this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, this.cnvs[1].height);
                this.drawTextarea(scr.text);
                this.drawSelections(scr.selections);
				this.drawn.ctx = true;
            break;
            case "actions":
                this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, this.cnvs[1].height);
                this.drawTextarea(scr.text);
				this.drawn.ctx = true;
            break;
            case "inventory":
				this.drawn.ctx = true;
                if(scr.preview) {

                    this.drawInventory(scr.items, scr.preview);

                } else {

                    return this.drawInventory(scr.items);
                }
            break;
            default:
                return;

        }
    }

    drawTextarea(text) {

        let section = this.config[((this.section == "inventory") ? 'actions' : this.section)],
            pos     = section.textarea,
            colors  = section.colors.text,
            left  = this.margin.left + pos[0],
            top   = this.margin.top + pos[1],
            lines = generateLines(this.ctxs[1], text, pos[2], pos[3]),
            fill  = generateRGB(colors[1]);

        this.ctxs[1].fillStyle = generateRGB(colors[0]);

        for(let i = 0, l = 0; i < lines.length; i += 1, l += this.lineheight) {

            if(fill !== null) {

                let m = this.ctxs[1].measureText(lines[i]);

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = fill;
                this.ctxs[1].fillRect(left, top + l - 2, m.width, this.lineheight);
                this.ctxs[1].restore();
            }

            this.ctxs[1].fillText(lines[i], left, top + l);
        }
    }

    drawSelections(sels) {

        sels = (typeof sels === "undefined") ? [] : sels;

        let section = this.config[this.section],
            pos     = section.selections,
            colors  = section.colors.selection,
            keys    = section.colors.key,
            fill    = generateRGB(colors[1]),
            kcol    = generateRGB(keys[0]),
            kfil    = generateRGB(keys[1]);

        this.ctxs[1].fillStyle = generateRGB(colors[0]);
        this.selections = [];

        for(let i = 0; i < sels.length; i += 1) {

            if(sels[i].disabled == 0) {

                let ln   = this.selections.length,
                    left = this.margin.left + pos[ln][0],
                    top  = this.margin.top + pos[ln][1];

                /* Key */

                let num = (ln + 1) + ".",
                    n = this.ctxs[1].measureText(num);

                n = n.width;

                if(kfil !== null) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = kfil;
                    this.ctxs[1].fillRect(left, top - 2, n, this.lineheight);
                    this.ctxs[1].restore();
                }

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = kcol;
                this.ctxs[1].fillText(num, left, top);
                this.ctxs[1].restore();

                /* Text */

                let lines = generateLines(this.ctxs[1], sels[i].text, (pos[ln][2] - n), pos[ln][3]);

                for(let j = 0, l = 0; j < lines.length; j += 1, l += this.lineheight) {

                    if(fill !== null) {

                        let m = this.ctxs[1].measureText(lines[j]);

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = fill;
                        this.ctxs[1].fillRect(left + n, top + l - 2, m.width + 16, this.lineheight);
                        this.ctxs[1].restore();
                    }

                    this.ctxs[1].fillText(lines[j], left + n + 8, top + l);
                }

                this.selections.push(i);
            }
        }
    }

    drawInventory(items, preview) {

        preview = (typeof preview !== "undefined") ? preview : false;

        if(items.length == 0 && Array.isArray(items)) {

            this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, this.cnvs[1].height);
            this.section = "actions";
            this.drawTextarea(this.config.empty_inventory);
            return [];
        }

        let inv  = this.config.actions.inventory,
            left = inv[0] + this.margin.left,
            top  = inv[1] + this.margin.top,
            c    = this.config.actions.colors,
            trgt = { id: 0 },
            colors = {
                key: {
                    s: generateRGB(c.key[0]),
                    f: generateRGB(c.key[1])
                },
                selection: {
                    s: generateRGB(c.selection[0]),
                    f: generateRGB(c.selection[1])
                },
                text: {
                    s: generateRGB(c.text[0]),
                    f: generateRGB(c.text[1])
                },
                selected: generateRGB(c.selected)
            },
            obj  = {
                w: this.inventory.width,
                h: this.inventory.height,
                m: this.inventory.margin
            },
            pos = {
                x: 0,
                y: 0,
                w: obj.w - obj.m * 2,
                t: obj.h - obj.m * 4
            },
            res = [];

        this.ctxs[1].fillStyle = colors.selection.s;

        if(items.id) {

            trgt = items;
            items = this.inventory.items;

            let p = this.config.actions.textarea;
            this.ctxs[1].clearRect(p[0], p[1], p[2], p[3]);

            if(trgt.desc) {

                this.drawTextarea(trgt.desc);
            }

        } else {

            this.ctxs[1].clearRect(0, 0, this.cnvs[1].width, this.cnvs[1].height);
            this.inventory.items = [];
        }

        for(let i = 0; i < items.length; i += 1) {

            pos.x  = ((pos.x + obj.w + obj.m + left > inv[2]) || i == 0) ? 0 : (pos.x + obj.w);
            pos.y += (pos.x == 0 && i > 0) ? (obj.h + obj.m) : 0;

            if(inv[3] >= (pos.y + obj.h + obj.m) && (trgt.id == 0 || (trgt.id > 0 && items[i].id == trgt.id))) {

                let t_top  = top + pos.y + 16,
                    t_left = left + pos.x + 8,
                    bg = ((trgt.id > 0 && trgt.selected) || (preview && items[i].selected)) ? colors.selected : colors.selection.f;

                /* Rectangle */

                if(trgt.id > 0 || preview) {

                    this.ctxs[1].clearRect(pos.x + left, pos.y + top, obj.w, obj.h);
                }

                if(bg !== null) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = bg;
                    this.ctxs[1].fillRect(pos.x + left, pos.y + top, obj.w, obj.h);
                    this.ctxs[1].restore();
                }

                /* Key */

                let num = (i + 1) + ".",
                    n = this.ctxs[1].measureText(num);

                n = n.width;

                if(colors.key.f !== null) {

                    this.ctxs[1].save();
                    this.ctxs[1].fillStyle = colors.key.f;
                    this.ctxs[1].fillRect(t_left, t_top, n, this.lineheight);
                    this.ctxs[1].restore();
                }

                this.ctxs[1].save();
                this.ctxs[1].fillStyle = colors.key.s;
                this.ctxs[1].fillText(num, t_left, t_top);
                this.ctxs[1].restore();

                /* Text */

                let lines = generateLines(this.ctxs[1], items[i].name, (pos.w - n), pos.h),
                    count = (lines.length > 2) ? 2 : lines.length,
                    l = 0;

                for(let j = 0; j < count; j += 1, l += this.lineheight) {

                    if(colors.text.f !== null) {

                        let m = this.ctxs[1].measureText(lines[j]);

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = colors.text.f;
                        this.ctxs[1].fillRect((t_left + n), (t_top + l), m.width, this.lineheight);
                        this.ctxs[1].restore();
                    }

                    this.ctxs[1].fillText(lines[j], (t_left + n), (t_top + l));
                }

                /* pcs */

                let unt = (items[i].unit != "" && typeof items[i].unit !== "undefined") ? " " + items[i].unit : "x",
                    pcs = (items[i].count > 1) ?  items[i].count + unt : ((unt == "x") ? "" : unt);

                if(pcs != "") {

                    if(colors.text.f !== null) {

                        let m = this.ctxs[1].measureText(pcs);

                        this.ctxs[1].save();
                        this.ctxs[1].fillStyle = colors.text.f;
                        this.ctxs[1].fillRect(t_left, (t_top + l), m.width, this.lineheight);
                        this.ctxs[1].restore();
                    }

                    this.ctxs[1].fillText(pcs, t_left, (t_top + l));
                }

                if(trgt.id == 0 && !preview) {

                    res.push(items[i]);
                    this.inventory.items.push({
                        id: items[i].id,
                        name: items[i].name,
                        unit: items[i].unit,
                        count: items[i].count,
                        x: pos.x + left,
                        y: pos.y + top
                    });
                }
            }
        }

        return res;
    }

    drawBG() {

        var self_ = this,
            section = this.config[((this.section == "inventory") ? 'actions' : this.section)];

        this.ctxs[0].clearRect(0, 0, this.cnvs[0].width, this.cnvs[0].height);
        this.ctxs[0].fillStyle = generateRGB(this.codes[section.background]);
        this.ctxs[0].fillRect(0, 0, this.cnvs[0].width, this.cnvs[0].height);

        if(section.img !== null) {

            loadImage(section.img).then((image) => {

                self_.ctxs[0].drawImage(image, self_.margin.left, self_.margin.top);
				self_.drawn.bg = true;

            }).catch((err) => { console.log("err"); })

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

            let target = (c == "inventory") ? self_.inventory.items : sc[c];
            target = (Array.isArray(target)) ? target : [];

            return target.map((s, i) => {

                let x, x2, y, y2;

                if(c == "inventory") {

                    x  = s.x;
                    x2 = s.x + self_.inventory.width;
                    y  = s.y;
                    y2 = s.y + self_.inventory.height;

                } else {

                    x  = s[0] + self_.margin.left;
                    x2 = s[0] + s[2] + self_.margin.left;
                    y  = s[1] + self_.margin.top;
                    y2 = s[1] + s[3] + self_.margin.top;
                }

                if(c == "selections") {

                    let ind = self_.selections[i];
                    ind = (typeof ind === "undefined") ? false : ind;
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
