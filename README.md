# Font-To-Width FTW

Font-To-Width if a small Javascript routine which fits text to the width of an element 
using multiple font styles of different widths.

© 2014–2015 [Chris Lewis] and [Nick Sherman]

Freely made available under the MIT license: http://opensource.org/licenses/MIT

### Usage

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

* Multiple FontToWidth instances can be created using different font lists and elements.
* Elements can be anything that is display:block or inline-block

### History

* 2015-02-28
 * Added ability to specify complete CSS spec for each font style
 * Support hyphenated-type or camelCaseType options
 * Bugfixes and safer coding style

* 2014-03-31 **Initial release**
 * Only option is 'min-letter-space'
 * Fitting errs on the side of tight spacing


[Chris Lewis]: http://chrissam42.com/
[Nick Sherman]: http://nicksherman.com/
