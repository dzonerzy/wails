/*
 _	   __	  _ __
| |	 / /___ _(_) /____
| | /| / / __ `/ / / ___/
| |/ |/ / /_/ / / (__  )
|__/|__/\__,_/_/_/____/
The electron alternative for Go
(c) Lea Anthony 2019-present
*/

import {setupContextMenus} from "../@wailsio/runtime/src/contextmenu";
import {setupDrag} from "../@wailsio/runtime/src/drag";
import {setupEventCallbacks} from "../@wailsio/runtime/src/events";
import {Reload} from '../@wailsio/runtime/src/wml';
import {debugLog} from "../@wailsio/runtime/src/log";

setupContextMenus();
setupDrag();
setupEventCallbacks();
Reload();

if(DEBUG) {
    debugLog("Wails Core Loaded");
}