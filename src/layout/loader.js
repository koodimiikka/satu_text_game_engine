import { loadImage, detectTransitionEnd } from '../utils';
import Logo from '../logo';

export default class Loader {

    constructor(canvas, text, target) {

        text = (typeof text !== "undefined") ? text : 'Loading, please wait..';
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.text = text;
        this.reset();
        this.target = target;
    }

    reset() {

        this.canvas.style.opacity = 1;
        this.canvas.style.WebkitTransition = 'opacity .6s, transform .6s';
        this.canvas.style.transition = 'opacity .6s, transform .6s';
        this.canvas.style.WebkitTransform = 'scale3d(1, 1, 1)';
        this.canvas.style.WebkitTransformOrigin = 'center center';
        this.canvas.style.transform = 'scale3d(1, 1, 1)';
        this.canvas.style.transformOrigin = 'center center';
        this.canvas.style.display = 'block';
    }

    show() {

        let self_ = this;

        this.loading = true;
        this.ctx.font = 'normal 16px fsex300';
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'top';

        loadImage(Logo).then((image) => {

            let w  = self_.canvas.width / 2,
                h  = self_.canvas.height / 2,
                l  = w - image.width / 2,
                t  = h - image.height,
                m  = self_.ctx.measureText(self_.text),
                tl = w - m.width / 2,
                tt = h + 40,
                opacity = 0;

            (function fadeIn() {

                opacity += 0.04;

                self_.ctx.globalAlpha = opacity;
                self_.ctx.clearRect(0, 0, self_.canvas.width, self_.canvas.height);
                self_.ctx.drawImage(image, l, t);
                self_.ctx.fillText(self_.text, tl, tt);

                if(opacity < 1) {

                    window.requestAnimationFrame(fadeIn);

                } else {

                    self_.loading = false;
                    self_.target.style.background = "#000";
                }

            })();

        }).catch((err) => { console.log(err); });

    }

    hide() {

        let self_ = this,
            transend = detectTransitionEnd();

        function removeLoader(e) {

            if(/opacity/i.test(e.propertyName)) {

                self_.canvas.removeEventListener(transend, removeLoader);               
                self_.canvas.style.display = "none";
            }
        }

        if(this.loading) {

            setTimeout(() => { this.hide(); }, 200);

        } else {

            self_.canvas.addEventListener(transend, removeLoader);

            setTimeout(() => {

                self_.canvas.style.transform = 'scale3d(1.4, 1.4, 1)';
                self_.canvas.style.opacity = 0;

            }, 200);
        }
    }
}
