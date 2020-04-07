import WebFont from 'webfontloader';
import Layout from './layout';
import Play from './play';

export default class SATUEngine {

    constructor(settings) {

        /* canvas init */

        var cnvs = [],
            target = document.querySelector(settings.target),
            self_  = this;

        this.loading = true;
        target.style.overflow = "hidden";

        for(let i = 0; i < 3; i += 1) {

            let c = document.createElement("canvas");

            c.width = 960;
            c.height = 640;
            c.style.cssText = (i == 0) ? 'display: block; position: relative; z-index: 2;' : 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 3;';

            if(i == 2) {

                c.style.background = 'radial-gradient(ellipse at center,#fcfcfc 0%,#e9e9e9 100%)';

                if(!settings.autoplay) {

                    c.style.display = "none";
                }
            }

            target.appendChild(c);
            cnvs.push(c);
        }

        settings.autoplay = (typeof settings.autoplay !== "undefined") ? settings.autoplay : true;
        settings.fonts = (typeof settings.fonts !== "undefined") ? settings.fonts : 'fonts/fonts.css';
        settings.preload = (typeof settings.preload !== "undefined") ? settings.preload : true;
        settings.save = (typeof settings.save !== "undefined") ? settings.save : false;

        this.target = target;
        this.cnvs = cnvs;
        this.settings = settings;
        this.loadedFonts = [];

        /* Start */

        if(settings.autoplay && settings.game) {

            this.play(settings.game);

        } else {

            this.loading = false;
        }
    }

    initFonts(game, callback) {

        let ids   = [],
            fonts = [],
            path  = this.settings.fonts;

        var self_ = this;

        const tradfonts = {

            actions: ["header_font", "items_font", "text_font"],
            game: ["actions_font", "header_font", "selections_font", "text_font"],
            main: ["header_font", "selections_font", "text_font"]
        };

        const noload = ["TimesNewRoman", "Arial", "Georgia", "ComicSansMS", "PalatinoLinotype", "LucidaSans"];

        for(let l in game.levels) {

            let id = game.levels[l].theme;

            if(!ids.includes(id)) {

                ids.push(id);
            }
        }

        ids.map((id) => {

            let theme = game.themes[id];

            if(theme.type == 1) { // Trad

                for(let t in tradfonts) {

                    tradfonts[t].map((font) => {

                        if(!noload.includes(theme[t][font])) {

                            if(!fonts.includes(theme[t][font]) && !self_.loadedFonts.includes(theme[t][font])) {

                                fonts.push(theme[t][font]);
                                self_.loadedFonts.push(theme[t][font]);
                            }
                        }
                    });
                }

            } else if(!fonts.includes("fsex300") && !self_.loadedFonts.includes("fsex300")) {

                fonts.push("fsex300");
                self_.loadedFonts.push("fsex300");
            }
        });

        (fonts.length > 0 && this.settings.preload) ?

        WebFont.load({

            custom: {
                families: fonts,
                urls: [path]
            },
            active() { callback(); }
        })

        : callback();
    }

    normalizeData(data) {

        data.screens = {}

        const toHashmap = (d) => {

            var obj = {};

            d.map((o) => {

                if(o.screens) {

                    o.screens.map((s) => { data.screens[s.id] = { level_id: o.id }; })
                    o.screens = toHashmap(o.screens);
                }

                obj[o.id] = o;
            });

            return obj;
        };

        ['actions', 'items', 'levels', 'themes'].forEach((k) => {

            data[k] = ((d) => {

                return toHashmap(d);

            })(data[k]);
        });

        return data;
    }

    play(game) {

        let cnvs  = this.cnvs,
            self_ = this;

        game = this.normalizeData(game);
        game.short = (typeof game.short === "undefined") ? null : game.short;
        this.loading = true;

        this.initFonts(game, () => {

            let gamedata = {

                game: game,
                cnvs: cnvs,
                target: self_.target,
                save: self_.settings.save,
                short: game.short
            };

            if(!self_.game) {

                self_.game = new Play(Object.assign({}, gamedata));

            } else {

                self_.game.reset(Object.assign({}, gamedata));
            }

            self_.loading = false;
        });
    }

    pause() {

        if(this.game) {

            this.game.pause();
        }
    }

    reload() {

        if(this.game) {

            this.game.reload();
        }
    }

    preview(ctx, theme, section) {

        if(this.loading) {

            return;
        }

        let layout = new Layout(this.cnvs),
            fonts  = [],
            self_  = this;

        if(section == "actions" && theme.type == 2) {

            section = "inventory";
        }

        let game_engine = document.querySelector("#game_engine");

        function onPrevClick() {

            if(!self_.loading) {

                if(section == "actions" && theme.type == 1) {

                    section = "inventory";
                    layout.drawScreen(ctx, theme, section);

                } else {

                    preview_div.removeEventListener("click", onPrevClick);
                    preview_div.parentNode.removeChild(preview_div);
                    game_engine.style.display = "none";
                }
            }
        }

        let preview_div = document.createElement("div");
        preview_div.style.cssText = 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 4;';
        preview_div.addEventListener("click", onPrevClick, false);
        this.target.appendChild(preview_div);

        ctx.preview = true;
        layout.drawScreen(ctx, theme, section);

        game_engine.style.display = "block";
        self_.loading = false;
    }

	generateGameImage(game) {

		var self_ = this;

		return new Promise((res, rej) => {

			try {

				let cnvs  = self_.cnvs;
				let layout = new Layout(self_.cnvs);

				game = self_.normalizeData(game);
				game.short = (typeof game.short === "undefined") ? null : game.short;
				self_.loading = true;

				this.initFonts(game, () => {

					let id = game.startup;
					let lvl = game.screens[id].level_id;
					let scr = Object.assign({}, game.levels[lvl].screens[id]);
					let theme_id = game.levels[lvl].theme;
					let theme = Object.assign({}, game.themes[theme_id]);

					let context = { name: game.name };
					theme.use_items = game.use_items;
					context.text = scr.text;
					context.selections = scr.selections;

					layout.drawScreen(context, theme, "main");

					(function loadimg() {

						if(layout.isDrawn()) {

							let output = document.createElement("canvas");

							output.width = 960;
							output.height = 640;

							let ctx = output.getContext("2d");

							ctx.drawImage(cnvs[0], 0, 0);
							ctx.drawImage(cnvs[1], 0, 0);

							const image = output.toDataURL("image/png");
							self_.loading = false;
							res(image);

						} else {

							setTimeout((e) => {

								loadimg();

							}, 100);
						}

					})();
				});

			} catch(err) {

				self_.loading = false;
				rej(err);
			}
		});
	}
}

window.SATUEngine = SATUEngine;
