export function loadImage(img) {

	var image = new Image();

	return new Promise(function(resolve, reject) {

		image.onload = () => {

			resolve(image);
		};

		image.onerror = (err) => {

			reject(err);
		}

		image.src = img;
	});
}

export function generateRGB(arr) {

	return (arr[0] === null) ? null : 'rgb(' + arr[0] + ', ' + arr[1] + ', ' + arr[2] + ')';
}

export function generateLines(ctx, str, width, height) {

	let words = str.split(" "),
		lines = [],
		txt   = [];

	for(let i = 0, h = 0; i < words.length; i += 1) {

		if(h > height) {

			break;
		}

		let p = Object.assign([], txt);
		p.push(words[i]);

		let c = p.join(" "),
			t = ctx.measureText(c);

		if(t.width >= width) {

			let d = txt.join(" ");
			lines.push(d);
			h += 16;
			txt = [];

			/* HUOM JOS KÄYDÄÄN VIKAA JA VIKALLA JÄÄ KIRJAIN NIIN LISÄTÄÄN SE */

			if(i + 1 == words.length) {

				lines.push(words[i]);
			}

			/* --- */

		} else if(i + 1 == words.length) {

			lines.push(c);
		}

		txt.push(words[i]);
	}

	return lines;
}

export function detectTransitionEnd() {

	var t, el = document.createElement('div'),
		transitions = {
			'transition':'transitionend',
			'OTransition':'oTransitionEnd',
			'MozTransition':'transitionend',
			'WebkitTransition':'webkitTransitionEnd'
	};

	for(t in transitions) {

		if(el.style[t] !== "undefined") {

			return transitions[t];
		}
	}
}

export function parseRGBA(color) {

	let pars = color.indexOf(','),
		repars = color.indexOf(',',pars+1);

	return {
		red:   parseInt(color.substr(5,pars)),
		green: parseInt(color.substr(pars+1,repars)),
		blue:  parseInt(color.substr(color.indexOf(',',pars+1)+1,color.indexOf(',',repars))),
		alpha: parseFloat(color.substr(color.indexOf(',',repars+1)+1,color.indexOf(')')))
	};
}

export function isVisible(color) {

	if(color.charAt(0) == "#") {

		return true;

	} else {

		let pars   = color.indexOf(','),
			repars = color.indexOf(',',pars + 1),
			alpha  = parseFloat(color.substr(color.indexOf(',', repars + 1) + 1 , color.indexOf(')')));

		return (isNaN(alpha)) ? true : (alpha != 0);
	}
}

export function drawRoundedRect(ctx, d) {

	ctx.beginPath();
	ctx.moveTo(d.x + d.r[3], d.y);
	ctx.arcTo(d.x + d.w, d.y, d.x + d.w, d.y + d.h, d.r[0]);
	ctx.arcTo(d.x + d.w, d.y + d.h, d.x, d.y + d.h, d.r[1]);
	ctx.arcTo(d.x, d.y + d.h, d.x, d.y, d.r[2]);
	ctx.arcTo(d.x, d.y, d.x + d.w, d.y, d.r[3]);
	ctx.closePath();
}

export function storageAvailable(type) {

    try {

        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }

    catch(e) {

        return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage.length !== 0;
    }
}

export function measureFontHeight(text, fontStyle, h) {

	var canvas = document.createElement("canvas");
	canvas.width = 960;
	canvas.height = 32;

    var context = canvas.getContext("2d");

	h = (typeof h === "undefined") ? 32 : h;

    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;

    context.font = fontStyle;
    context.textAlign = "start";
    context.textBaseline = "top";
    context.fillText(text, 0, 0);

    var data = context.getImageData(0, 0, sourceWidth, sourceHeight).data;

    var firstY = -1;
    var lastY = -1;

    // loop through each row
    for(let y = 0; y < sourceHeight; y += 1) {


        for(let x = 0; x < sourceWidth; x += 1) {

            let alpha = data[((sourceWidth * y) + x) * 4 + 3];

            if(alpha > 0) {

                firstY = y;
                break;
            }
        }

        if(firstY >= 0) {

            break;
        }
    }

    // loop through each row, this time beginning from the last row
    for(let y = sourceHeight; y > 0; y -= 1) {

        for(let x = 0; x < sourceWidth; x += 1) {

            let alpha = data[((sourceWidth * y) + x) * 4 + 3];

            if(alpha > 0) {

                lastY = y;
                break;
            }
        }

        if(lastY >= 0) {

            break;
        }
    }

    return {

        height: lastY - firstY,
        firstPixel: firstY,
        lastPixel: lastY,
		top: Math.floor((h - (lastY - firstY)) / 2 - firstY) //Math.floor((h - (lastY - firstY)) / 2) - firstY
    }
}
