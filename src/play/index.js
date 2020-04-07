import InitialState from '../utils/state';
import Layout from '../layout';
import Loader from '../layout/loader';
import Utils from '../utils/play';

export default class Play extends Utils {

    /* Init */

    constructor(settings, loading) {

        super();

        this.settings = {
            save: (settings.save && settings.short),
            id: settings.short
        };

        let d = (typeof settings.data === "object") ? data : {};
        let save = super.getLocal(this.settings);

        this.game = settings.game;

        this.state  = (save) ? Object.assign(save, d) : Object.assign(InitialState(), d);

        this.canvas = settings.cnvs[1];
        this.layout = new Layout(settings.cnvs);

        this.loader = new Loader(settings.cnvs[2], settings.loader_text, settings.target);
        this.loader.show();
        this.loading = false;

        this.state.screen_id = (this.state.screen_id == 0) ? this.game.startup : this.state.screen_id;

        this.initEvents();
        this.drawScreen();
        this.loader.hide();
    }

    reset(settings) {

        this.settings = {
            save: (settings.save && settings.short),
            id: settings.short
        };

        let d = (typeof settings.data === "object") ? data : {};
        let save = super.getLocal(this.settings);
        this.game = settings.game;

        this.state  = (save) ? Object.assign(save, d) : Object.assign(InitialState(), d);

        delete this.layout;
        this.layout = new Layout(settings.cnvs);

        delete this.loader;
        this.loader = new Loader(settings.cnvs[2], settings.loader_text, settings.target);

        this.state.screen_id = (this.state.screen_id == 0) ? this.game.startup : this.state.screen_id;
        this.drawScreen();
        this.loader.hide();
        this.loading = false;
    }

    reload() {

        this.state = Object.assign(InitialState(), {});
        this.state.screen_id = this.game.startup;
        super.removeLocal(this.settings);
        this.drawScreen();
        this.loading = false;
    }

    pause() {

        this.loading = true;
    }

    /* Draw screen */

    drawScreen(type, data, res) {

        type = (typeof type === "undefined") ? ((this.state.screen_id == this.game.startup) ? 'main' : 'game') : type;
        res  = (typeof res !== "undefined");

        let scr   = super.getScreen(),
            theme = super.getTheme(scr.theme_id),
            ctx   = { name: this.game.name };

        theme.use_items = this.game.use_items;

        if(type == 'game' || type == 'main') {

            ctx.text = super.parseText(scr.text);
            ctx.selections = super.parseSelections(scr.selections)

        } else if(type == 'actions') {

            ctx.text = data;

        } else if(type == "inventory") {

            ctx.items = data;
        }

        if(res) {

            return this.layout.drawScreen(ctx, theme, type);

        } else {

            this.layout.drawScreen(ctx, theme, type);
        }
    }

    /* Listeners & Events */

    initEvents() {

        // Detect dragging & loading

        this.dragging = false;

        super.onDragging(this);

        // Click & Touch events

        let clickEvent = super.clickEvent(),
            self_ = this;

        this.canvas.addEventListener(clickEvent, (e) => {

            if(!self_.loading && !self_.dragging) {

                let pos = super.getElementOffset(e),
                    action = this.layout.getElement(pos);

                self_.onEvent(action);
                super.saveLocal(this.state, this.settings);
            }

        }, false);

        // Keyboard events

		window.addEventListener("keydown", (e) => {

			if(!self_.loading) {

				let action = this.layout.getKeyElement(e.key);
                self_.onEvent(action);
                super.saveLocal(this.state, this.settings);
            }
		});
    }

    onEvent(action) {

        switch(action.target) {

            case "selections":
                this.onMovement(action.ind);
            break;
            case "actions":
                if(this.state.move_after > 0) {

                    this.state.screen_id = this.state.move_after;
                    this.state.move_after = 0;
                }
                (this.state.inventory.length > 0) ? this.drawScreen("inventory", super.getInventory(true)) : this.drawScreen();
            break;
            case "pickup":
                this.onPickup();
            break;
            case "inventory":
                this.onInventory(action);
            break;
            case "use":
                this.state.action_on = true;
                this.onInventory(action);
            break;
            default:
                return;
        }
    }

    /* On movement */

    onMovement(ind) {

        let scr = super.getScreen(this.state.screen_id),
            sel = scr.selections[ind];

        if(sel.disabled == 0) {

            if(sel.movement && !sel.requires_action) {

                this.state.screen_id = sel.movement;
                this.drawScreen();

            } else if(sel.movement && sel.requires_action) {

                const perf = super.getIsActionPerformed(sel.requires_action.id, false);

                if(perf) {

                    this.state.screen_id = sel.movement;
                    this.drawScreen();
                }

            } else if(sel.action) {

                sel.action.ind = ind;
                this.onAction(sel.action, false);
            }
        }
    }

    /* On pickup */

    onPickup() {

        let scr   = super.getScreen(),
            self_ = this;

        if(scr.items.length == 999) {

            this.drawScreen("actions", "EI LÖYDY");
            return;
        }

        let items = scr.items.map((itm) => {

            let picked = self_.state.all_items.map((ai, i) => {

                return (ai.id == itm.id && ai.screen_id == self_.state.screen_id) ? ai : false;

            }).reduce((t, o) => { if(o) { t = o; } return t; }, { times: 0 });

            return {

                itm: itm,
                type: (itm.times == 0) ? 0 : ((picked.times == itm.times) ? 2 : 1)
            }
        });

        this.game.pickup_times = (typeof this.game.pickup_times === "undefined") ? 0 : this.game.pickup_times;

        let infinite = super.shuffle(items.filter((itm) => { return itm.type == 0 })),
            discrete = super.shuffle(items.filter((itm) => { return itm.type == 1 })),
            pickup   = ((this.game.pickup_times % 3 == 0) ? infinite.concat(discrete) : discrete.concat(infinite));

        pickup = (typeof pickup[0] === 'object') ? pickup[0].itm : null;
        this.game.pickup_times += 1;

        if(pickup !== null) {

            let potential  = (pickup.potential !== null) ? parseInt(pickup.potential) : 100,
                item       = this.game.items[pickup.id],
                change     = Math.floor(Math.random() * 100) + 1;

            if(potential >= change) {

                super.addGainedItems([pickup]);

                this.drawScreen("actions", super.getMessage("pickup", "success", pickup.pickup_text, item.pickup_text, true));

            } else {

                this.drawScreen("actions", super.getMessage("pickup", "fail", pickup.fail_text, item.fail_text, true));
            }

        } else {

            this.drawScreen("actions", super.getFailMessage("pickup"));
        }
    }

    /* On inventory */

    onInventory(action) {

        if(typeof action.elem === "undefined") { // First render

            let res = this.drawScreen("inventory", super.getInventory(), true);
            this.state.inventory = [...this.state.inventory, ...res];

        } else if(action.elem == "item") {

            if(this.state.action_on) {

                let selected = this.state.sel_items.find((itm) => {

                    return (itm.id == action.id)
                });

                if(selected) {

                    this.state.sel_items = this.state.sel_items.map((itm) => {

                        if(itm.id != action.id) {

                            return itm;
                        }

                    }).reduce((t, o) => { if(o) { t.push(o) } return t; }, []);
                    this.drawScreen("inventory", { id: action.id, selected: false });

                } else {

                    this.state.sel_items.push({ id: action.id, count: action.count });
                    this.drawScreen("inventory", {

                        id: action.id,
                        selected: true,
                        desc: this.game.items[action.id].description
                    });
                }

            } else {

                let desc = this.game.items[action.id].description;
                this.drawScreen("actions", desc);
            }

        } else {

            let items = super.getInventory();

            if(items.length == 0) {

                if(this.state.action_on) {

                    if(this.state.sel_items.length > 0) {

                        this.onAction(null, true);

                    } else {

                        this.state.action_on = false;
                        this.state.inventory = [];
                        this.drawScreen();
                    }

                } else {

                    this.drawScreen();
                    this.state.inventory = [];
                }

            } else {

                let res = this.drawScreen("inventory", items, true);
                this.state.inventory = [...this.state.inventory, ...res];
            }
        }
    }

    /* On action */

    onAction(act, inventory) {

        let action = (inventory) ? super.getAction(null) : super.getAction(act.id),
            self_  = this;

        if(act === null) {

            act = action[0];
            action = action[1];
        }

        if(!action) {

            this.state.inventory = [];
            this.state.sel_items = [];
            this.state.action_on = false;
            this.drawScreen("actions", super.getFailMessage("action"));
            return;
        }

        /* Has items? */

        const hasItems = (action.required_items.length == 0) ? true : action.required_items.map((itm) => {

            let target = (inventory) ? self_.state.sel_items : self_.state.items,
                f = target.find((t) => { return (t.id == itm.id && t.count >= itm.amount) });

            return (typeof f !== "undefined");

        }).reduce((total, k) => { if(!k) { total = false; } return total; }, true);

        /* Is performed? */

        const isPerformed = (!inventory) ? false : this.state.actions.map((sca) => {

            return (action.id == sca.id && sca.screen_id == self_.state.screen_id && sca.times <= act.times && act.times > 0);

        }).reduce((total, k) => { if(k) { total = true; } return total; }, false);


        /* Reset inv */

        this.state.inventory = [];
        this.state.sel_items = [];
        this.state.action_on = false;

        /* If all ok */

        if(hasItems && !isPerformed) {

            let lose_items = act.lose_items,
                potential  = (act.potential) ? parseInt(act.potential) : 100,
                change     = Math.floor(Math.random() * 100) + 1,
                times      = (act.times) ? act.times : 0,
                mv         = (act.move_after) ? act.move_after : 0;

            /* If we lose items */

            this.state.items = (!lose_items) ? this.state.items : this.state.items.map((itm) => {

                let req = action.required_items.find((am) => { return (am.id == itm.id); });

                if(typeof req !== "undefined") {

                    itm.count -= req.amount;
                    return (itm.count <= 0) ? null : itm;

                } else {

                    return itm;
                }

            }).reduce((total, k) => { if(k) { total.push(k); } return total; }, []);

            /* Success / Fail */

            if(potential >= change) {

                // Add gained items & performed action

                super.addGainedItems(action.gained_items);
                super.addPerformedAction(action);

                // moveAfter

                if(mv) {

                    this.state.move_after = mv;
                }

                this.drawScreen("actions", super.getMessage("action", "success", act.success_text, action.success_text, inventory));

            /* If fail */

            } else {

                this.drawScreen("actions", super.getMessage("action", "fail", act.fail_text, action.fail_text, inventory));
            }

        /* Lacks items */

        } else if(!hasItems && !isPerformed) {

            this.drawScreen("actions", super.getMessage("action", "fail", act.lacks_text, action.lacks_text, inventory));

        /* Already performed */

        } else if(hasItems && isPerformed) {

            this.drawScreen("actions", super.getMessage("action", "fail", ((act.fail_after != "") ? act.fail_after : act.fail_text), action.fail_text, inventory));
        }
    }
}
