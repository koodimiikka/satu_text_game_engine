import Oldskool from './oldskool';
import Traditional from './traditional';

export default class Layout {

    constructor(cnvs) {

        this.oldskool = new Oldskool(cnvs);
        this.traditional = new Traditional(cnvs);
        this.type = 0;
    }

    drawScreen(ctx, theme, section) {

        this.type = theme.type;
        return (this.type == 1) ? this.traditional.draw(ctx, theme, section) : this.oldskool.draw(ctx, theme, section);
    }

    getElement(pos) {

        return (this.type == 1) ? this.traditional.getElement(pos) : this.oldskool.getElement(pos);
    }

	isDrawn() {

		const pointer = (this.type == 1) ? this.traditional : this.oldskool;
		return (pointer.drawn.ctx && pointer.drawn.bg);
	}

	getKeyElement(key) {

		let pointer = (this.type == 1) ? this.traditional : this.oldskool;

		if(pointer.section == "actions") {

            return { target: "actions" };
        }

		let config = pointer.config;
		let section = pointer.section;

		const type = this.type;
		const keys = (type == 2) ? config.keys : config.keys.map((k) => { return k[1]});

        let sc = config[section],
            sels = (section == 'inventory') ? ['inventory'] : ['selections', 'actions'];

        let matches = sels.map((c, i) => {

			let target = [];

			if(type == 1) {

				switch(c) {

					case "selections":
						target = pointer.selections;
					break;
					case "actions":
						target = pointer.actions;
					break;
					case "inventory":
						target = pointer.inventory;
					break;
					default:
						target = [];
				}

			} else {

				target = (c == "inventory") ? pointer.inventory.items : sc[c];
				target = (Array.isArray(target)) ? target : [];
			}

            return target.map((s, i) => {

                if(c == "selections") {

                    let ind = pointer.selections[i];

                    ind = (type == 2) ? ((typeof ind === "undefined") ? false : ind) : (typeof s.ind === "undefined") ? false : s.ind;
                    return (key == (i+1) && ind !== false) ? { ind: ind, target: c } : null;

                } else if(c == "actions") {

                    let t = (i == 0) ? 'pickup' : ((i == 1) ? 'inventory' : 'use');
					let k = keys[i];
                    return (key == k) ? { ind: i, target: t } : null;

                } else if(c == "inventory") {

                    let id = (key == (i+1)) ? s.id : null,
                        elem = (id !== null) ? 'item' : null,
                        count = (id !== null) ? s.count : null;

                    return (id) ? { elem: elem, id: id, count: count, target: "inventory" } : null;
                }

            }).reduce((total, k) => { if(k) { total = k; } return total; }, null);

        }).reduce((total, k) => { if(k) { total = k; } return total; }, { target: null });

        if(section == 'inventory' && matches.target === null) {

            matches.target = "inventory";
            matches.elem = null;
        }

        return matches;
	}
}
