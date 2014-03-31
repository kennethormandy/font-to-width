/*
 * FONT-TO-WIDTH FTW
 *
 * Fits text to the width of an element using multiple font families of different widths.
 * 
 * Usage: 
 * <element>Text To Fit</element>
 * <script> new FontToWidth({fonts:["List","of","font","families"], elements:"CSS selector for elements"}); </script>
 *
 * Notes:
 * Multiple FontToWidth instances can be created using different font lists and elements.
 * Element can be any block or inline-block element.
 *
 * © 2014 Chris Lewis http://chrissam42.com and Nick Sherman http://nicksherman.com
 * Freely made available under the MIT license: http://opensource.org/licenses/MIT
 * 
 * CHANGELOG:
 * 2014-03-31 Initial release: min-letter-space option; errs on the side of narrow spacing
 *
 */

function FontToWidth(options, elements) {
	if (elements) {
		options = {
			'fonts': options,
			'elements': elements
		};
	}

	options['min-letter-space'] = options['min-letter-space'] || -0.04;

	console.log(options);

	if (!options.fonts || !options.elements)
		throw "Missing required options 'fonts' and 'elements'.";

	this.initialized = false;
	this.integerLetterSpacing = false;
	this.ready = false;
	this.options = options;
	this.fontwidths = {};
	this.allTheElements = $(options.elements);

	this.allTheElements.contents().wrap("<span contenteditable='false'></span>");

	$($.proxy(this.measureFonts,this));	
}

FontToWidth.prototype.addGoogleWebfontLoader = function() {
	var found = false;
	$('script').each(function() {
		if (/google.*webfont\.js/.test(this.src)) {
			found = true;
			return false;
		}
	});
	
	if (!found) {
		$('head').append("<script src='//ajax.googleapis.com/ajax/libs/webfont/1.5.2/webfont.js'></script>");
	}
}

FontToWidth.prototype.measureFonts = function() {
	var widther = this;
	widther.ready = false;

	//create a hidden element to measure the relative widths of all the fonts
	var div = widther.measure_div = $("<div style='position:absolute;top:0px;right:101%;display:block;'></div>");
	div.append("<div id='measure_letter_spacing' style='letter-spacing:0.4px'></div>");
	//div.append("<div style='position:fixed;top:0;right:0;bottom:0;left:0;background-color:rgba(16,16,16,0.9);color:white;font-size:32px;text-align:center;padding-top:40%;'>Loading fonts&hellip;</div>");
	var weights = [];

	//take into account different font-weight values that might be used by various elements
	this.allTheElements.each(function() {
		var w = $(this).css('font-weight');
		if (w && $.inArray(w,weights) < 0) {
			weights.push(w);
		}
	});

	var i, j;
	for (i in this.options.fonts) {
		for (j in weights) {
			div.append("<span style='font-family:\"" + this.options.fonts[i] + "\";font-weight:" + weights[j] + ";font-size:36px;display:inline;outline:1px solid red;'>AVAWJMILTwimj</span><br>");
		}
	}
	$('body').append(div);

	//see if browser support subpixel letter-spacing
	widther.integerLetterSpacing = (parseFloat($('#measure_letter_spacing').css('letter-spacing')) == 0);

	//keep re-measuring the widths until they're all different, on the assumption that same-width means the font hasn't loaded yet.
	// this assumes that all the fonts actually are different widths
	var tries = 60;
	var measurefunc = function() {

		if (--tries < 0) {
			console.log("Giving up!");
			clearInterval(widther.measuretimeout);
			return;
		}

		widther.measure_div.children('span').each(function() {
			var span = $(this);
			widther.fontwidths[span.css('font-family').replace(/['"]/g,'')] = span.width();
		});

		console.log("Measured", Date.now()/1000, widther.fontwidths);
		
		var i, mywidth, uniquewidths = [], alldifferent = true;
		for (i in widther.options.fonts) {
			mywidth = widther.fontwidths[widther.options.fonts[i]];
			if ($.inArray(mywidth,uniquewidths) >= 0) {
				alldifferent = false;
				break;
			}
			uniquewidths.push(mywidth);
		}

		if (alldifferent) {
			widther.ready = true;
			clearInterval(widther.measuretimeout);

			//sort the font list widest first
			widther.options.fonts.sort(function(b,a) { 
				if (widther.fontwidths[a] < widther.fontwidths[b])
					return -1;
				if (widther.fontwidths[a] > widther.fontwidths[b])
					return 1;
				return 0;
			});

			widther.measure_div.remove();

			widther.startTheBallRolling();
		}
		
	};
	
	widther.measuretimeout = setInterval(measurefunc, 500);
	measurefunc();
}

FontToWidth.prototype.startTheBallRolling = function() {
	widther = this;

	//only do this stuff once
	if (widther.initialized)
		return;
		
	widther.initialized = true;
	
	//add space spans for integer-pixel browsers
	if (widther.integerLetterSpacing) {
		this.allTheElements.children('span').each(function() {
			var span = $(this);
			span.html(span.text().replace(/ /g, "<span style='display:inline-block'>&nbsp;</span>"));
		});
	}
	
	var updatewidths = $.proxy(widther.updateWidths, widther);
	
	//update widths right now
	$(updatewidths);
	
	//update widths on window load and resize (delayed)
	var resizetimeout;
	$(window).on('load', updatewidths).on('resize', function() { 
		if (resizetimeout) 
			clearTimeout(resizetimeout);
		resizetimeout = setTimeout(updatewidths, 250);
	});

	//update on live text change
	/*
	widther.allTheElements.on('keyup',function() {
		//similar to updateWidths() below, but different enough to implement separately
		var cell = $(this);
		cell.removeClass('done');
		
		if (widther.integerLetterSpacing)
			cell.find('span span').css('width','');
		
		var i, fontfamily;
		for (i in widther.options.fonts) { 
			fontfamily = widther.options.fonts[i];
	
			cell.css({'font-family': fontfamily, 'letter-spacing': ''});
			cell.each(widther.updateSingleWidth);
			if (cell.hasClass('done')) {
				break;
			}
		}
	});
	*/
}

FontToWidth.prototype.resetFont = function(el,font) {
	$(el).css({'font-family': font || this.options.fonts[0], 'letter-spacing': ''});
}

FontToWidth.prototype.updateWidths = function() {
	if (!this.ready) return;
	
	this.ready = false;

	this.stillToDo = this.allTheElements;
	this.stillToDo.removeClass('done');

	if (this.integerLetterSpacing)
		this.stillToDo.find('span span').css('width','');

	//doing this in waves is much faster, since we update all the fonts at once, then do only one repaint per font
	// as opposed to one repaint for every element
	
	//this.fonts is sorted widest first; once we get to a font that fits, we remove that element from the list
	var i, fontfamily;
	var updateSingleWidthBound = $.proxy(this.updateSingleWidth,this);
	for (i in this.options.fonts) { 
		var fontfamily = this.options.fonts[i];

		this.stillToDo.css({'font-family': fontfamily, 'letter-spacing': ''});
		this.stillToDo.each(updateSingleWidthBound);
		
		this.stillToDo = this.stillToDo.not('.done');
		
		console.log(fontfamily, this.stillToDo.length + " left.");
		
		if (!this.stillToDo.length) {
			break;
		}
	}
	
	this.ready = true;
}

FontToWidth.prototype.updateSingleWidth = function(i,el) {
	var cell = $(el);
	var span = cell.children('span');

	var fullwidth = cell.width();
	var textwidth = span.outerWidth();
	var lettercount = span.text().length-1; //this will probably get confused with fancy unicode text
	var fontsize = parseFloat(cell.css('font-size'));

	var letterspace = (fullwidth-textwidth)/lettercount/fontsize;
	var spaces, spacewidth;

	if (letterspace >= this.options['min-letter-space']) {
		cell.addClass('done');
		
		//adjust letter spacing to fill the width
		cell.css('letter-spacing', letterspace + 'em');
		
		//deal with browsers (SAFARI) that only do integer-pixel letterspacing
		if (this.integerLetterSpacing) {
			//pump up the word space to fit the width as exactly as possible
			spaces = span.children('span');
			if (spaces.length) {
				spaces.width(0); //measure with no spaces at all
				spacewidth = (fullwidth-span.outerWidth())/spaces.length;
				//console.log("GOING THE DISTANCE", span.text(), span.outerWidth(), fullwidth, spacewidth);
				spaces.width(spacewidth);
			}
		}
	}
}



//FontToWidth.prototype.addGoogleWebfontLoader(); //do this ASAP
