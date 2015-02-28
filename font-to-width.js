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
 * 2015-02-28 Allow arbitrary CSS styles for each font
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
 * @param [options.minFontSize=1.0]         Allow scaling of font-size to this ratio of original
 * @param [options.maxFontSize=1.0]         Allow scaling of font-size to this ratio of original
 * @param [options.preferredFit="tight"]    Whether to prefer "tight" or "loose" letterspacing
 * @param [options.preferredSize="large"]   Whether to prefer "large" or "small" font-size
 */
 
var FontToWidth = function(options) {

    // in case we were not called with "new"
    if (!(this instanceof FontToWidth)) {
        return new FontToWidth(options);
    }

    if (!options.fonts) {
        throw "Missing required options 'fonts'";
    }

    //OPTIONS 
    
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
    options.minLetterSpace = typeof options.minLetterSpace === "number" ? options.minLetterSpace : -0.04;
    options.minFontSize = options.minFontSize || 1.0;
    options.maxFontSize = options.maxFontSize || 1.0;
    options.preferredFit = options.preferredFit || "tight";
    options.preferredFit = options.preferredSize || "large";

    this.measuringText = 'AVAWJ wimper QUILT jousting';
    this.initialized = false;
    this.ready = false;
    this.options = options;
    this.fontwidths = new Array(options.fonts.length);
    this.allTheElements = $(options.elements);

    this.allTheElements.each(function() {
        var el = $(this);
        el.css('white-space', 'nowrap');
        el.data('ftw-original-style', el.attr('style'));
        el.wrapInner("<span contenteditable='false'></span>");
    });

    $($.proxy(this.measureFonts,this)); 
};

FontToWidth.prototype.measureFonts = function() {
    var ftw = this;
    ftw.ready = false;

    //create a hidden element to measure the relative widths of all the fonts
    var div = ftw.measure_div = $("<div style='position:absolute;top:0px;right:101%;display:block;white-space:nowrap;'></div>");
    div.append("<div id='ftw_measure_letter_spacing' style='letter-spacing:0.4px'></div>");

    $.each(ftw.options.fonts, function(i, font) {
        var span = $('<span>' + ftw.measuringText + '</span>');
        span.css({
            'font-size': '36px',
            'display': 'inline',
        });
        span.css(font);
        
        div.append(span);
        div.append("<br>");
    });
    
    $('body').append(div);

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

FontToWidth.prototype.updateWidths = function() {
    var ftw = this;
    
    if (!ftw.ready) return;
    
    ftw.options.avgFontSize = (ftw.options.maxFontSize + ftw.options.minFontSize)/2;
    
    var starttime = Date.now();
    
    ftw.ready = false;

    ftw.stillToDo = $(ftw.allTheElements).removeClass('ftw_done ftw_final ftw_onemore');

    //doing this in waves is much faster, since we update all the fonts at once, then do only one repaint per font
    // as opposed to one repaint for every element

    var updateSingleWidth = function(i, el) {
        var cell = $(el);
        var span = cell.children('span');

        var ontrial = cell.hasClass('ftw_onemore');
        var success = false;

        var fullwidth = cell.width();
        var textwidth = span.outerWidth();
        var lettercount = span.text().length-1; //this will probably get confused with fancy unicode text
        var fontsize = parseFloat(cell.css('font-size'));

        //if this is a borderline fit
        var onemore = false;

        //first try nudging the font size
        var newfontsize=fontsize, oldfontsize=fontsize, ratioToFit = fullwidth/textwidth;
        
        //for the widest font, we can max out the size
        if (i==0 && ratioToFit > ftw.options.maxFontSize) {
            ratioToFit = ftw.options.maxFontSize;
        }
        
        if (ratioToFit != 1 && ratioToFit >= ftw.options.minFontSize && ratioToFit <= ftw.options.maxFontSize) {
            //adjust the font size and then nudge letterspacing on top of that
            newfontsize = Math.round(fontsize * ratioToFit);
            cell.css('font-size', newfontsize + 'px');
            textwidth *= newfontsize/fontsize;
            fontsize = newfontsize;

            if (ratioToFit < ftw.options.avgFontSize) {
                if (ftw.options.preferredSize=="small") {
                    success = true;
                } else {
                    onemore = true;
                }
            } else {
                //if it grew we have to stop
                success = true;
            }
        }
    
        var letterspace = (fullwidth-textwidth)/lettercount/fontsize;

        if (letterspace >= ftw.options.minLetterSpace || newfontsize != oldfontsize || cell.hasClass('ftw_final')) {
            //adjust letter spacing to fill the width
            cell.css('letter-spacing', Math.max(letterspace, ftw.options.minLetterSpace) + 'em');

            if (letterspace < 0) {
                if (ftw.options.preferredFit=="tight") {
                    success = true;
                } else {
                    onemore = true;
                }
            } else {
                //if it expanded we have to stop
                success = true;
            }
        }
        
        if (onemore) {
            cell.addClass('ftw_onemore');
        } else if (ontrial || success) {
            cell.addClass('ftw_done');
        }
    };
    
    
    //ftw.fonts is sorted widest first; once we get to a font that fits, we remove that element from the list
    $.each(ftw.options.fonts, function(i, font) { 
        //first go through and update all the css without reading anything
        ftw.stillToDo.each(function() { 
            var el = $(this);
            el.attr('style', el.data('ftw-original-style'));
            el.css(font);
        })
        // and then start measuring
        .each(updateSingleWidth);
        
        ftw.stillToDo = ftw.stillToDo.not('.ftw_done');
        
        //console.log(font, ftw.stillToDo.length + " left.");
        
        if (!ftw.stillToDo.length) {
            return false;
        }
    });
    
    ftw.stillToDo.addClass('ftw_final').each(updateSingleWidth);
    
    ftw.ready = true;
    
    var endtime = Date.now();
    console.log("Widths updated in " + ((endtime-starttime)/1000) + "s");
};

window.FontToWidth = FontToWidth;

})();
