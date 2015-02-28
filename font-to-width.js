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
 * 2014-03-31 Initial release: minLetterSpace option; errs on the side of narrow spacing
 *
 */

;(function() {
'use strict';

function hyphenToCamel (hyphen) {
    switch (typeof hyphen) {
    case "object":
        $.each(hyphen, function(key, val) {
            var newKey = hyphenToCamel(key);
            if (key != newKey) {
                hyphen[newKey] = val;
                delete hyphen[key];
            }
        });
        return hyphen;
    
    case "string":
        return hyphen.replace(/-([a-z])/g, function(x, letter) { return letter.toUpperCase() });
    
    default:
        return hyphen;
    }
}


/**
 * @param  options
 * @param  options.fonts                    A list of font-family names or sets of CSS style parameters
 * @param [options.elements=".ftw"]         A CSS selector or jQuery object specifying which elements should apply FTW
 * @param [options.minLetterSpace=-0.04]    A very small, probably negative number indicating degree of allowed tightening
 */
 
var FontToWidth = function(options) {

    // in case we were not called with "new"
    if (!(this instanceof FontToWidth)) {
        console.log("shame");
        return new FontToWidth(options);
    }

    if (!options.fonts) {
        throw "Missing required options 'fonts'";
    }

    //fill out fonts CSS with default settings
    $.each(options.fonts, function(i, font) {
        if (typeof font == "string") {
            options.fonts[i] = font = { fontFamily: font };
        }
        hyphenToCamel(font);
        font.fontWeight = font.fontWeight || 'normal';
        font.fontStyle = font.fontStyle || 'normal';
        if (font.fontSize) delete font.fontSize;
    });

    options.elements = options.elements || '.ftw, .font-to-width, .fonttowidth';
    options.minLetterSpace = options.minLetterSpace || -0.04;

    this.initialized = false;
    this.integerLetterSpacing = false;
    this.ready = false;
    this.options = options;
    this.fontwidths = new Array(options.fonts.length);
    this.allTheElements = $(options.elements);

    this.allTheElements.wrapInner("<span contenteditable='false'></span>");

    $($.proxy(this.measureFonts,this)); 
};

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
};

FontToWidth.prototype.measureFonts = function() {
    var ftw = this;
    ftw.ready = false;

    //create a hidden element to measure the relative widths of all the fonts
    var div = ftw.measure_div = $("<div style='position:absolute;top:0px;display:block;'></div>");
    div.append("<div id='ftw_measure_letter_spacing' style='letter-spacing:0.4px'></div>");

    $.each(ftw.options.fonts, function(i, font) {
        var span = $('<span>AVAWJMI LT wi mj</span>');
        span.css({
            'font-size': '36px',
            'display': 'inline',
        });
        span.css(font);
        
        div.append(span);
        div.append("<br>");
    });
    
    $('body').append(div);

    //see if browser support subpixel letter-spacing
    ftw.integerLetterSpacing = (parseFloat($('#ftw_measure_letter_spacing').css('letter-spacing')) == 0);

    //keep re-measuring the widths until they're all different, on the assumption that same-width means the font hasn't loaded yet.
    // this assumes that all the fonts actually are different widths
    var tries = 60;
    var spans = ftw.measure_div.children('span');
    var measurefunc = function() {

        if (--tries < 0) {
            console.log("Giving up!");
            clearInterval(ftw.measuretimeout);
            return;
        }

        spans.each(function(i) {
            var span = $(this);
            ftw.fontwidths[i] = span.width();
        });

        console.log("Measured", Date.now()/1000, ftw.fontwidths);
        
        var i, mywidth, uniquewidths = [], alldifferent = true;
        $.each(ftw.fontwidths, function(i, mywidth) {
            if ($.inArray(mywidth,uniquewidths) >= 0) {
                alldifferent = false;
                return false;
            }
            uniquewidths.push(mywidth);
        });

        if (alldifferent) {
            ftw.ready = true;
            clearInterval(ftw.measuretimeout);

            //sort the font list widest first
            var font2width = new Array(ftw.options.fonts.length);
            $.each(ftw.fontwidths, function(i, mywidth) {
                font2width[i] = {index: i, width: mywidth};
            });
            
            font2width.sort(function(b,a) { 
                if (a.width < b.width)
                    return -1;
                if (a.width > b.width)
                    return 1;
                return 0;
            });
            
            var newfonts = new Array(font2width.length);
            $.each(font2width, function(i, font) {
                newfonts[i] = ftw.options.fonts[font.index];
            });
            
            ftw.options.fonts = newfonts;

            ftw.measure_div.remove();

            ftw.startTheBallRolling();
        }
        
    };
    
    ftw.measuretimeout = setInterval(measurefunc, 500);
    measurefunc();
};

FontToWidth.prototype.startTheBallRolling = function() {
    var ftw = this;

    //only do this stuff once
    if (ftw.initialized)
        return;
        
    ftw.initialized = true;
    
    //add space spans for integer-pixel browsers
    if (ftw.integerLetterSpacing) {
        ftw.allTheElements.children('span').each(function() {
            var span = $(this);
            span.html(span.text().replace(/ /g, "<span style='display:inline-block'>&nbsp;</span>"));
        });
    }
    
    var updatewidths = $.proxy(ftw.updateWidths, ftw);
    
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
    ftw.allTheElements.on('keyup',function() {
        //similar to updateWidths() below, but different enough to implement separately
        var cell = $(this);
        cell.removeClass('ftw_done');
        
        if (ftw.integerLetterSpacing)
            cell.find('span span').css('width','');
        
        var i, fontfamily;
        for (i in ftw.options.fonts) { 
            fontfamily = ftw.options.fonts[i];
    
            cell.css({'font-family': fontfamily, 'letter-spacing': ''});
            cell.each(ftw.updateSingleWidth);
            if (cell.hasClass('ftw_done')) {
                break;
            }
        }
    });
    */
};

FontToWidth.prototype.resetFont = function(el,font) {
    $(el).css({'font-family': font || this.options.fonts[0].fontFamily, 'letter-spacing': ''});
};

FontToWidth.prototype.updateWidths = function() {
    var ftw = this;
    
    if (!ftw.ready) return;
    
    ftw.ready = false;

    ftw.stillToDo = $(ftw.allTheElements).removeClass('ftw_done');

    if (ftw.integerLetterSpacing)
        ftw.stillToDo.find('> span > span').css('width','');

    //doing this in waves is much faster, since we update all the fonts at once, then do only one repaint per font
    // as opposed to one repaint for every element
    
    //ftw.fonts is sorted widest first; once we get to a font that fits, we remove that element from the list
    var updateSingleWidthBound = $.proxy(ftw.updateSingleWidth,ftw);
    $.each(ftw.options.fonts, function(i, font) { 
        ftw.stillToDo.css(font).css('letter-spacing', '');
        ftw.stillToDo.each(updateSingleWidthBound);
        
        ftw.stillToDo = ftw.stillToDo.not('.ftw_done');
        
        console.log(font, ftw.stillToDo.length + " left.");
        
        if (!ftw.stillToDo.length) {
            return false;
        }
    });
    
    ftw.ready = true;
};

FontToWidth.prototype.updateSingleWidth = function(i,el) {
    var ftw = this;
    var cell = $(el);
    var span = cell.children('span');

    var fullwidth = cell.width();
    var textwidth = span.outerWidth();
    var lettercount = span.text().length-1; //this will probably get confused with fancy unicode text
    var fontsize = parseFloat(cell.css('font-size'));

    var letterspace = (fullwidth-textwidth)/lettercount/fontsize;
    var spaces, spacewidth;

    if (letterspace >= ftw.options.minLetterSpace) {
        //adjust letter spacing to fill the width
        cell.css('letter-spacing', letterspace + 'em');
        
        //deal with browsers (SAFARI) that only do integer-pixel letterspacing
        if (ftw.integerLetterSpacing) {
            //pump up the word space to fit the width as exactly as possible
            spaces = span.children('span');
            if (spaces.length) {
                spaces.width(0); //measure with no spaces at all
                spacewidth = (fullwidth-span.outerWidth())/spaces.length;
                //console.log("GOING THE DISTANCE", span.text(), span.outerWidth(), fullwidth, spacewidth);
                spaces.width(spacewidth);
            }
        }

        cell.addClass('ftw_done');
    }
};



//FontToWidth.prototype.addGoogleWebfontLoader(); //do this ASAP

window.FontToWidth = FontToWidth;

})();
