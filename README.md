font-to-width
=============

Font-To-Width if a small Javascript routine which fits text to the width of an element 
using multiple font families of different widths.

Usage: 
<element>Text To Fit</element>
<script> new FontToWidth({fonts:["List","of","font","families"], elements:"CSS selector for elements"}); </script>

Notes:
Multiple FontToWidth instances can be created using different font lists and elements.
Element can be any block or inline-block element.

© 2014 Chris Lewis http://chrissam42.com and Nick Sherman http://nicksherman.com
Freely made available under the MIT license: http://opensource.org/licenses/MIT

CHANGELOG:

2014-03-31 
Initial release
Only option is 'min-letter-space'
Fitting errs on the side of tight spacing



