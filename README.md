# Font-To-Width FTW

Font-To-Width is a small JavaScript routine which fits text to the width of an element using multiple font styles of different widths.

Originally by [Chris Lewis](http://chrissam42.com/) & [Nick Sherman](http://nicksherman.com/), this version has been modified by [Kenneth Ormandy](http://kennethormandy.com) to remove the dependency on jQuery.

## Install

To install the module through [npm](https://npmjs.org), run the following command:

```sh
npm install --save font-to-width
```

Then, within your project, require Font to Width:

```js
var FontToWidth = require('font-to-width')

var ftw = new FontToWidth({
	elements: '.js-ftw', // The class name to apply Font to Width to
	fonts: [
		{ fontFamily: 'Hardware Regular' },
		{ fontFamily: 'Hardware Condensed' },
		{ fontFamily: 'Hardware Compressed' }
	]
})
```

Alternatively, you can include the [font-to-width](/font-to-width.js) file in your build process manually, or even reference the file directly:

```html
<script src="https://cdn.rawgit.com/kennethormandy/font-to-width/master/font-to-width.js"></script>
```

Note you’ll probably want to replace `master` with a specific version number if you take this approach

## Usage

	<div class="ftw">Text To Fit</div>
	<script>
		new FontToWidth({
			fonts: [
				'Font Family Name String',
				{ fontFamily: 'Complete CSS Spec', fontWeight: 'normal', fontStyle: 'italic' },
				…
			];
			elements: ".ftw, .css-selector-or-jQuery-object"
		});
	</script>

### Notes

* ~~jQuery is required and must be present in the page before any FTW instances are created~~ The jQuery dependency has been removed from this version.
* Multiple FontToWidth instances can be created using different font lists and elements.
* Elements can be anything that is `display: block` or `inline-block`
* If no fonts are specified, behaviour reverts to a simple scale-to-width system

### Options

All options are optional.

Name            | Default                               | Description
----------------|---------------------------------------|----------------------------------------------------------------------------------
 fonts          |                                       |  A list of font-family names or sets of CSS style parameters. If empty, existing fonts are scaled to fit
 elements       | ".ftw, .font-to-width, .fonttowidth"  |  A CSS selector or jQuery object specifying which elements should apply FTW
 minLetterSpace | -0.04                                 |  A very small, probably negative number indicating degree of allowed tightening
 minFontSize    | 1.0                                   |  Allow scaling of font-size to this ratio of original
 maxFontSize    | 1.0                                   |  Allow scaling of font-size to this ratio of original
 preferredFit   | "tight"                               |  Whether to prefer "tight" or "loose" letterspacing
 preferredSize  | "large"                               |  Whether to prefer "large" or "small" font-size

## History

* 2016-05-23
 * Removed jQuery dependency
 * Exported for module systems (Browserify, Webpack, etc.)

* 2015-03-04
 * Added no-fonts scale-to-width behaviour

* 2015-02-28
 * Added ability to specify complete CSS spec for each font style
 * Added min/maxFontSize, preferredFit/Size options
 * Added demo.html for usage hints
 * Support hyphenated-type or camelCaseType options
 * Bugfixes and safer coding style

* 2014-03-31 **Initial release**
 * Only option is 'min-letter-space'
 * Fitting errs on the side of tight spacing

## License

[The MIT License (MIT)](LICENSE.md)

Copyright © 2016 [Kenneth Ormandy](http://kennethormandy.com)<br />
Copyright © 2014–2015 [Chris Lewis](http://chrissam42.com/) and [Nick Sherman](http://nicksherman.com/)
