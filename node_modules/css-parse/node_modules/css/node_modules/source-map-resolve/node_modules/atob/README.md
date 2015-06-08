atob
===

Uses `Buffer` to emulate the exact functionality of the browser's atob.

Note: Unicode may be handled incorrectly (like the browser).

It turns base64-encoded **a**scii data back **to** **b**inary.

    (function () {
      "use strict";
      
      var atob = require('atob')
        , b64 = "SGVsbG8gV29ybGQ="
        , bin = atob(b64)
        ;

      console.log(bin); // "Hello World"
    }());

Copyright and license
===

Code and documentation copyright 2012-2014 AJ ONeal Tech, LLC.

Code released under the [Apache license](https://github.com/node-browser-compat/atob/blob/master/LICENSE).

Docs released under [Creative Commons](https://github.com/node-browser-compat/atob/blob/master/LICENSE.DOCS).
