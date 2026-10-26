'use strict';
// Toosii-XD-Ultra entry point.
//
// This file exists so deployers can point their panel at either
// `node index.js` or `node launcher.js` — both start the bot. The real
// logic lives in launcher.js (bundle download, runtime swap, restart
// hook). Keep this shim tiny and never edit it.
require('./launcher.js');
