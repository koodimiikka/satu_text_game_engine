import { storageAvailable } from './'

export default class Utils {

	constructor() {

		this.storage = storageAvailable('localStorage');
	}

	/* Game */

	getScreen() {

		let id  = this.state.screen_id,
			lvl = this.game.screens[id].level_id,
			scr = Object.assign({}, this.game.levels[lvl].screens[id]);

		scr.theme_id = this.game.levels[lvl].theme;
		return scr;
	}

	getTheme(id) {

		return Object.assign({}, this.game.themes[id]);
	}

	/* ACTIONS */

	getAction(id) {

		if(id) {

			// Selection action
			return this.game.actions[id];

		} else {

			let scr  = this.getScreen(),
				stt  = this.state,
				ids  = [],
				acts = null,
				items = stt.sel_items.reduce((t, o) => { t.push(o.id); return t; }, []),
				self_ = this;

			acts = [...scr.actions, ...scr.selections].map((act) => {

				let is_action = true, disabled = false, is_select = false;

				if(typeof act.movement !== "undefined") {

					is_select = true;
					disabled = (act.disabled == 1);
					is_action = !(act.action == 0);
					act = act.action;
				}

				if(is_action && !disabled) {

					let action = self_.game.actions[act.id],
						correct_items = (action.required_items.length == 0) ? false : action.required_items.map((ri) => {

							return (items.indexOf(ri.id) !== -1)

						}).reduce((t, o) => { if(!o) { t = false; } return t; }, true);

					// Make sure no extra items is selected only the needed ones

					let extra_items = items.map((i) => {

						let f = false;

						action.required_items.map((ri) => {

							if(ri.id == i) {

								f = true;
							}
						});

						return f;

					}).reduce((t, o) => { if(!o) { t = true; } return t; }, false);

					if(correct_items && !extra_items) {

						let already = (!is_select) ? false : scr.actions.find((a) => { return (a.id == act.id) });
						already = (typeof already === "undefined") ? false : already;
						return (!already) ? act : null;
					}

				} else {

					return null;
				}

			}).reduce((t, o) => { if(o) { t.push(o); } return t; }, []);

			/* If multiple possible actions */

			if(acts.length > 1) {

				let done = [],
					not_done = [];

				acts.map((act) => {

					let times = (act.times) ? act.times : 0,
						d = false;

					stt.actions.map((sca) => {

						if(acts.id == sca.id && scr.id == sca.screen && sca.times >= times && times > 0) {

							d = true;
						}
					});

					(d) ? done.push(act) : not_done.push(act);
				});

				let res = [...this.shuffle(not_done), ...this.shuffle(done)];
				return [res[0], this.game.actions[res[0].id]];

			/* If just one action or no action */

			} else {

				return (acts.length == 0) ? false : [acts[0], this.game.actions[acts[0].id]];
			}
		}
	}

	addGainedItems(items) {

		let self_ = this;

		items.map((gi) => {

			let gained = (gi.amount) ? gi.amount : gi.gained,
				count = (!isNaN(gained)) ? parseInt(gained) : (() => {

					let btween = gained.split("-");
					return Math.floor(Math.random() * ((parseInt(btween[1]) - parseInt(btween[0])) + 1) + parseInt(btween[0]));

				}), exists = false;

			this.state.items = this.state.items.map((itm) => {

				if(itm.id == gi.id) {

					exists = true;
					itm.count += count;
				}

				return itm;
			});

			if(!exists) {

				this.state.items.push({

					id: gi.id,
					count: count
				});
			}

			if(gi.gained) { // If pickup then add pickup to all_items

				exists = false;

				this.state.all_items = this.state.all_items.map((itm) => {

					if(itm.id == gi.id && itm.screen_id == self_.state.screen_id) {

						exists = true;
						itm.times += 1;
					}

					return itm;
				});

				if(!exists) {

					this.state.all_items.push({

						id: gi.id,
						times: 1,
						screen_id: self_.state.screen_id
					});
				}
			}
		});
	}

	addPerformedAction(action) {

		let exists = false,
			self_  = this;

		this.state.actions = this.state.actions.map((a) => {

			if(a.id == action.id && a.screen_id == self_.state.screen_id) {

				exists = true;
				a.times += 1;
			}

			return a;
		});

		if(!exists) {

			this.state.actions.push({

				id: action.id,
				screen_id: this.state.screen_id,
				times: 1
			});
		}
	}

	getIsActionPerformed(act_id, strict) {

		let scr_id = this.state.screen_id,
			act	   = this.state.actions.find((a) => {

				return (strict) ? (scr_id == a.screen_id && act_id == a.id) : (act_id == a.id);
			});

		return (typeof act !== "undefined");
	}

	/* <-- ACTIONS */

	getMessage(type, target, t, t2, inventory) {

		t = (typeof t === "undefined") ? "" : t;
		t2 = (typeof t2 === "undefined") ? "" : t2;

		let text = (inventory) ? ((t != "") ? t : t2) : t2;
		return (text == "") ? ((target == "success") ? ((type == "action") ? "Action performed!" : "Pickup success!") : this.getFailMessage(type)) : text;
	}

	getFailMessage(type) {

		var section = (type == "action") ? "action_fail" : "pick_up_fail",
			scr = this.getScreen(),
			lvl = this.game.levels[this.game.screens[scr.id].level_id];

		if(scr[section] == "") {

			if(lvl[section] == "") {

				if(this.game[section] == "") {

					return (type == "action") ? "Action didn't work out" : "Pick-up didn't work out";

				} else {

					return this.game[section];
				}

			} else {

				return lvl[section];
			}

		} else {

			return scr[section];
		}
	}

	getHasItem(itm_id) {

		let scr_id = this.state.screen_id,
			items  = this.state.all_items.find((i) => {

				// (scr.id == self_.game.all_items[j].screen && tag_id == self_.game.all_items[j].id)
				// Items are not screen identified ??
				return (itm_id == i.id);
			});

		return (typeof items !== "undefined");
	}

	/* Parse tags for textarea */

	parseText(text) {

		let regex = /\[([^\]]+)]/g,
			match = null,
			tags  = [],
			tag   = {},
			self_ = this,
			scr   = this.getScreen(), i = 0;

		/* Parse tags from text */

		while((match = regex.exec(text))) {

			let expr = match[0].toLowerCase();

			if(i == 0 && expr.length >= 6) {

				let id = parseInt(expr.slice(2, -2));

				tag = {

					id: id,
					expr: match[0],
					type: (expr.charAt(1) == "a") ? "action" : "item",
					when: (expr.charAt(expr.length - 2) == "b") ? "before" : "after",
					err: !((expr.charAt(1) == "a" || expr.charAt(1) == "i") && (expr.charAt(expr.length - 2) == "b" || expr.charAt(expr.length - 2) == "a") && !isNaN(id)),
					start: tag.start = match.index
				};

				i += 1;

			} else if(i == 1) {

				tag.end = match.index + 4;

				if(expr.length == 4 && ((expr.charAt(2) == "a" && tag.type == "action" ) || (expr.charAt(2) == "i" && tag.type == "item" )) && !tag.err) {

					tag.err = false;
					tag.caption = text.slice(tag.start + tag.expr.length, match.index);
					tag.caption = tag.caption.trim();

				} else {

					tag.err = true;
				}

				tags.push(tag);
				tag = {};
				i = 0;
			}
		}

		/* Filter tags  */

		tags.map((tag) => {

			if(!tag.err) {

				let tag_id = tag.id - 88,
					done   = (tag.type == "action") ? self_.getIsActionPerformed(tag_id, false) : self_.getHasItem(tag_id), //  self_.getIsActionPerformed(tag_id, true) <-- pitää miettiä, nyt katsoo suorituksen vain ruudun tapahtuman mukaan, pitääkö editoriin laittaa jokin määritelmä, että globaali vai ei?
					str    = (tag.type == "action") ? "a" : "i", expr;

				str += tag.id;
				str += (tag.when == "before") ? "b" : "a";
				expr = (tag.type == "action") ? new RegExp('\\['+ str + '\\](.*?)\\[\\/a\\]') : new RegExp('\\['+ str + '\\](.*?)\\[\\/i\\]');
				done = (tag.when == "before") ? !done : done;

				text = (done) ? text.replace(expr, tag.caption) :  text.replace(expr, "");
			}
		});

		return text;
	}

	/* Parse visible selections */

	parseSelections(sels) {

		var self_ = this;

		return sels.map((sel) => {

			let s = Object.assign({}, sel);

			if(sel.action) {

				if(sel.action.remove_after) {

					if(this.getIsActionPerformed(sel.action.id, false)) {

						s.disabled = 1;
					}
				}
			}

			if(sel.requires_action) {

				if(!sel.requires_action.show_before) {

					if(!this.getIsActionPerformed(sel.requires_action.id, false)) {

						s.disabled = 1;
					}
				}
			}

			return s;
		});
	}

	/* Inventory */

	getInventory(no_offset) {

		let offset = (typeof no_offset !== "undefined") ? 0 : this.state.inventory.length,
			all_items = this.game.items,
			items = this.state.items.map((itm, i) => {

				if(i > offset || offset == 0) {

					return {
						id: itm.id,
						name: all_items[itm.id].name,
						unit: all_items[itm.id].unit,
						count: itm.count
					};
				}

			}).reduce((t, o) => { if(o) { t.push(o) } return t; }, []);

		return items;
	}

	/* Misc */

	onDragging(self_) {

		document.body.addEventListener("touchmove", () => {

			self_.dragging = true;
		});

		document.body.addEventListener("touchstart", () => {

			self_.dragging = false;
		});
	}

	clickEvent() {

		return 'click';
	}

	getElementOffset(e) {

		var obj = this.canvas.getBoundingClientRect(),
			pos = {

				x: obj.left + (document.body.scrollLeft || document.documentElement.scrollLeft),
				y: obj.top + (document.body.scrollTop || document.documentElement.scrollTop)
			};

		return {

			x: e.pageX - pos.x,
			y: e.pageY - pos.y
		};
	}

	shuffle(o) {

		if(o.length < 2) {
			return o;
		}

		for (let i = o.length - 1; i > 0; i -= 1) {

			const j = Math.floor(Math.random() * (i + 1));
			[o[i], o[j]] = [o[j], o[i]];
		}

		return o;
	}

	saveLocal(state, settings) {

		if(!settings.save || !this.storage) { return }
        localStorage.setItem(settings.id, JSON.stringify(state));
	}

	getLocal(settings) {

		if(!settings.save || !this.storage) { return }
		var s = localStorage.getItem(settings.id)

		return (!s) ? null : JSON.parse(s);
	}

	removeLocal(settings) {

		if(!settings.save || !this.storage) { return }
		var s = localStorage.getItem(settings.id);

		if(s) {

			localStorage.removeItem(settings.id);
		}
	}
}
