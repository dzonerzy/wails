(() => {
  // node_modules/nanoid/non-secure/index.js
  var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
  var nanoid = (size2 = 21) => {
    let id = "";
    let i = size2;
    while (i--) {
      id += urlAlphabet[Math.random() * 64 | 0];
    }
    return id;
  };

  // desktop/@wailsio/runtime/src/runtime.js
  var runtimeURL = window.location.origin + "/wails/runtime";
  var objectNames = {
    Call: 0,
    Clipboard: 1,
    Application: 2,
    Events: 3,
    ContextMenu: 4,
    Dialog: 5,
    Window: 6,
    Screens: 7,
    System: 8,
    Browser: 9
  };
  var clientId = nanoid();
  function newRuntimeCallerWithID(object, windowName) {
    return function(method, args = null) {
      return runtimeCallWithID(object, method, windowName, args);
    };
  }
  function runtimeCallWithID(objectID, method, windowName, args) {
    let url = new URL(runtimeURL);
    url.searchParams.append("object", objectID);
    url.searchParams.append("method", method);
    let fetchOptions = {
      headers: {}
    };
    if (windowName) {
      fetchOptions.headers["x-wails-window-name"] = windowName;
    }
    if (args) {
      url.searchParams.append("args", JSON.stringify(args));
    }
    fetchOptions.headers["x-wails-client-id"] = clientId;
    return new Promise((resolve, reject) => {
      fetch(url, fetchOptions).then((response) => {
        if (response.ok) {
          if (response.headers.get("Content-Type") && response.headers.get("Content-Type").indexOf("application/json") !== -1) {
            return response.json();
          } else {
            return response.text();
          }
        }
        reject(Error(response.statusText));
      }).then((data) => resolve(data)).catch((error) => reject(error));
    });
  }

  // desktop/@wailsio/runtime/src/system.js
  var call = newRuntimeCallerWithID(objectNames.System, "");
  function IsWindows() {
    return window._wails.environment.OS === "windows";
  }
  function IsDebug() {
    return window._wails.environment.Debug === true;
  }

  // desktop/@wailsio/runtime/src/contextmenu.js
  var call2 = newRuntimeCallerWithID(objectNames.ContextMenu, "");
  var ContextMenuOpen = 0;
  function openContextMenu(id, x, y, data) {
    void call2(ContextMenuOpen, { id, x, y, data });
  }
  function setupContextMenus() {
    window.addEventListener("contextmenu", contextMenuHandler);
  }
  function contextMenuHandler(event) {
    let element = event.target;
    let customContextMenu = window.getComputedStyle(element).getPropertyValue("--custom-contextmenu");
    customContextMenu = customContextMenu ? customContextMenu.trim() : "";
    if (customContextMenu) {
      event.preventDefault();
      let customContextMenuData = window.getComputedStyle(element).getPropertyValue("--custom-contextmenu-data");
      openContextMenu(customContextMenu, event.clientX, event.clientY, customContextMenuData);
      return;
    }
    processDefaultContextMenu(event);
  }
  function processDefaultContextMenu(event) {
    if (IsDebug()) {
      return;
    }
    const element = event.target;
    const computedStyle = window.getComputedStyle(element);
    const defaultContextMenuAction = computedStyle.getPropertyValue("--default-contextmenu").trim();
    switch (defaultContextMenuAction) {
      case "show":
        return;
      case "hide":
        event.preventDefault();
        return;
      default:
        if (element.isContentEditable) {
          return;
        }
        const selection = window.getSelection();
        const hasSelection = selection.toString().length > 0;
        if (hasSelection) {
          for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const rects = range.getClientRects();
            for (let j = 0; j < rects.length; j++) {
              const rect = rects[j];
              if (document.elementFromPoint(rect.left, rect.top) === element) {
                return;
              }
            }
          }
        }
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          if (hasSelection || !element.readOnly && !element.disabled) {
            return;
          }
        }
        event.preventDefault();
    }
  }

  // desktop/@wailsio/runtime/src/flags.js
  var flags = /* @__PURE__ */ new Map();
  function convertToMap(obj) {
    const map = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        map.set(key, convertToMap(value));
      } else {
        map.set(key, value);
      }
    }
    return map;
  }
  fetch("/wails/flags").then((response) => {
    response.json().then((data) => {
      flags = convertToMap(data);
    });
  });
  function getValueFromMap(keyString) {
    const keys = keyString.split(".");
    let value = flags;
    for (const key of keys) {
      if (value instanceof Map) {
        value = value.get(key);
      } else {
        value = value[key];
      }
      if (value === void 0) {
        break;
      }
    }
    return value;
  }
  function GetFlag(keyString) {
    return getValueFromMap(keyString);
  }

  // desktop/@wailsio/runtime/src/drag.js
  var shouldDrag = false;
  var resizeEdge = null;
  var resizable = false;
  var defaultCursor = "auto";
  window._wails = window._wails || {};
  window._wails.setResizable = setResizable;
  window._wails.endDrag = endDrag;
  function dragTest(e) {
    let val = window.getComputedStyle(e.target).getPropertyValue("--webkit-app-region");
    if (!val || val === "" || val.trim() !== "drag" || e.buttons !== 1) {
      return false;
    }
    return e.detail === 1;
  }
  function setupDrag() {
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
  function setResizable(value) {
    resizable = value;
  }
  function endDrag() {
    document.body.style.cursor = "default";
    shouldDrag = false;
  }
  function testResize() {
    if (resizeEdge) {
      window._wails.invoke(`resize:${resizeEdge}`);
      return true;
    }
    return false;
  }
  function onMouseDown(e) {
    if (IsWindows() && testResize() || dragTest(e)) {
      shouldDrag = !!isValidDrag(e);
    }
  }
  function isValidDrag(e) {
    return !(e.offsetX > e.target.clientWidth || e.offsetY > e.target.clientHeight);
  }
  function onMouseUp(e) {
    let mousePressed = e.buttons !== void 0 ? e.buttons : e.which;
    if (mousePressed > 0) {
      endDrag();
    }
  }
  function setResize(cursor = defaultCursor) {
    document.documentElement.style.cursor = cursor;
    resizeEdge = cursor;
  }
  function onMouseMove(e) {
    shouldDrag = checkDrag(e);
    if (IsWindows() && resizable) {
      handleResize(e);
    }
  }
  function checkDrag(e) {
    let mousePressed = e.buttons !== void 0 ? e.buttons : e.which;
    if (shouldDrag && mousePressed > 0) {
      window._wails.invoke("drag");
      return false;
    }
    return shouldDrag;
  }
  function handleResize(e) {
    let resizeHandleHeight = GetFlag("system.resizeHandleHeight") || 5;
    let resizeHandleWidth = GetFlag("system.resizeHandleWidth") || 5;
    let cornerExtra = GetFlag("resizeCornerExtra") || 10;
    let rightBorder = window.outerWidth - e.clientX < resizeHandleWidth;
    let leftBorder = e.clientX < resizeHandleWidth;
    let topBorder = e.clientY < resizeHandleHeight;
    let bottomBorder = window.outerHeight - e.clientY < resizeHandleHeight;
    let rightCorner = window.outerWidth - e.clientX < resizeHandleWidth + cornerExtra;
    let leftCorner = e.clientX < resizeHandleWidth + cornerExtra;
    let topCorner = e.clientY < resizeHandleHeight + cornerExtra;
    let bottomCorner = window.outerHeight - e.clientY < resizeHandleHeight + cornerExtra;
    if (!leftBorder && !rightBorder && !topBorder && !bottomBorder && resizeEdge !== void 0) {
      setResize();
    } else if (rightCorner && bottomCorner)
      setResize("se-resize");
    else if (leftCorner && bottomCorner)
      setResize("sw-resize");
    else if (leftCorner && topCorner)
      setResize("nw-resize");
    else if (topCorner && rightCorner)
      setResize("ne-resize");
    else if (leftBorder)
      setResize("w-resize");
    else if (topBorder)
      setResize("n-resize");
    else if (bottomBorder)
      setResize("s-resize");
    else if (rightBorder)
      setResize("e-resize");
  }

  // desktop/@wailsio/runtime/src/events.js
  var call3 = newRuntimeCallerWithID(objectNames.Events, "");
  var EmitMethod = 0;
  var eventListeners = /* @__PURE__ */ new Map();
  var WailsEvent = class {
    constructor(name, data = null) {
      this.name = name;
      this.data = data;
    }
  };
  function setupEventCallbacks() {
    window._wails = window._wails || {};
    window._wails.dispatchWailsEvent = dispatchWailsEvent;
  }
  function dispatchWailsEvent(event) {
    let listeners = eventListeners.get(event.name);
    if (listeners) {
      let toRemove = listeners.filter((listener) => {
        let remove = listener.Callback(event);
        if (remove)
          return true;
      });
      if (toRemove.length > 0) {
        listeners = listeners.filter((l) => !toRemove.includes(l));
        if (listeners.length === 0)
          eventListeners.delete(event.name);
        else
          eventListeners.set(event.name, listeners);
      }
    }
  }
  function Emit(event) {
    return call3(EmitMethod, event);
  }

  // desktop/@wailsio/runtime/src/dialogs.js
  var DialogQuestion = 3;
  var call4 = newRuntimeCallerWithID(objectNames.Dialog, "");
  var dialogResponses = /* @__PURE__ */ new Map();
  function generateID() {
    let result;
    do {
      result = nanoid();
    } while (dialogResponses.has(result));
    return result;
  }
  function dialog(type, options = {}) {
    const id = generateID();
    options["dialog-id"] = id;
    return new Promise((resolve, reject) => {
      dialogResponses.set(id, { resolve, reject });
      call4(type, options).catch((error) => {
        reject(error);
        dialogResponses.delete(id);
      });
    });
  }
  window._wails = window._wails || {};
  window._wails.dialogErrorCallback = dialogErrorCallback;
  window._wails.dialogResultCallback = dialogResultCallback;
  function dialogResultCallback(id, data, isJSON) {
    let p = dialogResponses.get(id);
    if (p) {
      if (isJSON) {
        p.resolve(JSON.parse(data));
      } else {
        p.resolve(data);
      }
      dialogResponses.delete(id);
    }
  }
  function dialogErrorCallback(id, message) {
    let p = dialogResponses.get(id);
    if (p) {
      p.reject(message);
      dialogResponses.delete(id);
    }
  }
  var Question = (options) => dialog(DialogQuestion, options);

  // desktop/@wailsio/runtime/src/window.js
  var center = 0;
  var setTitle = 1;
  var fullscreen = 2;
  var unFullscreen = 3;
  var setSize = 4;
  var size = 5;
  var setMaxSize = 6;
  var setMinSize = 7;
  var setAlwaysOnTop = 8;
  var setRelativePosition = 9;
  var relativePosition = 10;
  var screen = 11;
  var hide = 12;
  var maximise = 13;
  var unMaximise = 14;
  var toggleMaximise = 15;
  var minimise = 16;
  var unMinimise = 17;
  var restore = 18;
  var show = 19;
  var close = 20;
  var setBackgroundColour = 21;
  var setResizable2 = 22;
  var width = 23;
  var height = 24;
  var zoomIn = 25;
  var zoomOut = 26;
  var zoomReset = 27;
  var getZoomLevel = 28;
  var setZoomLevel = 29;
  var thisWindow = Get("");
  function createWindow(call6) {
    return {
      Get: (windowName) => createWindow(newRuntimeCallerWithID(objectNames.Window, windowName)),
      Center: () => call6(center),
      SetTitle: (title) => call6(setTitle, { title }),
      Fullscreen: () => call6(fullscreen),
      UnFullscreen: () => call6(unFullscreen),
      SetSize: (width2, height2) => call6(setSize, { width: width2, height: height2 }),
      Size: () => call6(size),
      SetMaxSize: (width2, height2) => call6(setMaxSize, { width: width2, height: height2 }),
      SetMinSize: (width2, height2) => call6(setMinSize, { width: width2, height: height2 }),
      SetAlwaysOnTop: (onTop) => call6(setAlwaysOnTop, { alwaysOnTop: onTop }),
      SetRelativePosition: (x, y) => call6(setRelativePosition, { x, y }),
      RelativePosition: () => call6(relativePosition),
      Screen: () => call6(screen),
      Hide: () => call6(hide),
      Maximise: () => call6(maximise),
      UnMaximise: () => call6(unMaximise),
      ToggleMaximise: () => call6(toggleMaximise),
      Minimise: () => call6(minimise),
      UnMinimise: () => call6(unMinimise),
      Restore: () => call6(restore),
      Show: () => call6(show),
      Close: () => call6(close),
      SetBackgroundColour: (r, g, b, a) => call6(setBackgroundColour, { r, g, b, a }),
      SetResizable: (resizable2) => call6(setResizable2, { resizable: resizable2 }),
      Width: () => call6(width),
      Height: () => call6(height),
      ZoomIn: () => call6(zoomIn),
      ZoomOut: () => call6(zoomOut),
      ZoomReset: () => call6(zoomReset),
      GetZoomLevel: () => call6(getZoomLevel),
      SetZoomLevel: (zoomLevel) => call6(setZoomLevel, { zoomLevel })
    };
  }
  function Get(windowName) {
    return createWindow(newRuntimeCallerWithID(objectNames.Window, windowName));
  }

  // desktop/@wailsio/runtime/src/browser.js
  var call5 = newRuntimeCallerWithID(objectNames.Browser, "");
  var BrowserOpenURL = 0;
  function OpenURL(url) {
    return call5(BrowserOpenURL, { url });
  }

  // desktop/@wailsio/runtime/src/log.js
  function debugLog(message) {
    console.log(
      "%c wails3 %c " + message + " ",
      "background: #aa0000; color: #fff; border-radius: 3px 0px 0px 3px; padding: 1px; font-size: 0.7rem",
      "background: #009900; color: #fff; border-radius: 0px 3px 3px 0px; padding: 1px; font-size: 0.7rem"
    );
  }

  // desktop/@wailsio/runtime/src/wml.js
  function sendEvent(eventName, data = null) {
    let event = new WailsEvent(eventName, data);
    Emit(event);
  }
  function addWMLEventListeners() {
    const elements = document.querySelectorAll("[wml-event]");
    elements.forEach(function(element) {
      const eventType = element.getAttribute("wml-event");
      const confirm = element.getAttribute("wml-confirm");
      const trigger = element.getAttribute("wml-trigger") || "click";
      let callback = function() {
        if (confirm) {
          Question({ Title: "Confirm", Message: confirm, Detached: false, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
            if (result !== "No") {
              sendEvent(eventType);
            }
          });
          return;
        }
        sendEvent(eventType);
      };
      element.removeEventListener(trigger, callback);
      element.addEventListener(trigger, callback);
    });
  }
  function callWindowMethod(windowName, method) {
    let targetWindow = Get(windowName);
    let methodMap = WindowMethods(targetWindow);
    if (!methodMap.has(method)) {
      console.log("Window method " + method + " not found");
    }
    try {
      methodMap.get(method)();
    } catch (e) {
      console.error("Error calling window method '" + method + "': " + e);
    }
  }
  function addWMLWindowListeners() {
    const elements = document.querySelectorAll("[wml-window]");
    elements.forEach(function(element) {
      const windowMethod = element.getAttribute("wml-window");
      const confirm = element.getAttribute("wml-confirm");
      const trigger = element.getAttribute("wml-trigger") || "click";
      const targetWindow = element.getAttribute("wml-target-window") || "";
      let callback = function() {
        if (confirm) {
          Question({ Title: "Confirm", Message: confirm, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
            if (result !== "No") {
              callWindowMethod(targetWindow, windowMethod);
            }
          });
          return;
        }
        callWindowMethod(targetWindow, windowMethod);
      };
      element.removeEventListener(trigger, callback);
      element.addEventListener(trigger, callback);
    });
  }
  function addWMLOpenBrowserListener() {
    const elements = document.querySelectorAll("[wml-openurl]");
    elements.forEach(function(element) {
      const url = element.getAttribute("wml-openurl");
      const confirm = element.getAttribute("wml-confirm");
      const trigger = element.getAttribute("wml-trigger") || "click";
      let callback = function() {
        if (confirm) {
          Question({ Title: "Confirm", Message: confirm, Buttons: [{ Label: "Yes" }, { Label: "No", IsDefault: true }] }).then(function(result) {
            if (result !== "No") {
              void OpenURL(url);
            }
          });
          return;
        }
        void OpenURL(url);
      };
      element.removeEventListener(trigger, callback);
      element.addEventListener(trigger, callback);
    });
  }
  function Reload() {
    addWMLEventListeners();
    addWMLWindowListeners();
    addWMLOpenBrowserListener();
    if (true) {
      debugLog("Reloaded WML");
    }
  }
  function WindowMethods(targetWindow) {
    let result = /* @__PURE__ */ new Map();
    for (let method in targetWindow) {
      if (typeof targetWindow[method] === "function") {
        result.set(method, targetWindow[method]);
      }
    }
    return result;
  }

  // desktop/core/main.js
  setupContextMenus();
  setupDrag();
  setupEventCallbacks();
  Reload();
  if (true) {
    debugLog("Wails Core Loaded");
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibm9kZV9tb2R1bGVzL25hbm9pZC9ub24tc2VjdXJlL2luZGV4LmpzIiwgImRlc2t0b3AvQHdhaWxzaW8vcnVudGltZS9zcmMvcnVudGltZS5qcyIsICJkZXNrdG9wL0B3YWlsc2lvL3J1bnRpbWUvc3JjL3N5c3RlbS5qcyIsICJkZXNrdG9wL0B3YWlsc2lvL3J1bnRpbWUvc3JjL2NvbnRleHRtZW51LmpzIiwgImRlc2t0b3AvQHdhaWxzaW8vcnVudGltZS9zcmMvZmxhZ3MuanMiLCAiZGVza3RvcC9Ad2FpbHNpby9ydW50aW1lL3NyYy9kcmFnLmpzIiwgImRlc2t0b3AvQHdhaWxzaW8vcnVudGltZS9zcmMvZXZlbnRzLmpzIiwgImRlc2t0b3AvQHdhaWxzaW8vcnVudGltZS9zcmMvZGlhbG9ncy5qcyIsICJkZXNrdG9wL0B3YWlsc2lvL3J1bnRpbWUvc3JjL3dpbmRvdy5qcyIsICJkZXNrdG9wL0B3YWlsc2lvL3J1bnRpbWUvc3JjL2Jyb3dzZXIuanMiLCAiZGVza3RvcC9Ad2FpbHNpby9ydW50aW1lL3NyYy9sb2cuanMiLCAiZGVza3RvcC9Ad2FpbHNpby9ydW50aW1lL3NyYy93bWwuanMiLCAiZGVza3RvcC9jb3JlL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImxldCB1cmxBbHBoYWJldCA9XG4gICd1c2VhbmRvbS0yNlQxOTgzNDBQWDc1cHhKQUNLVkVSWU1JTkRCVVNIV09MRl9HUVpiZmdoamtscXZ3eXpyaWN0J1xuZXhwb3J0IGxldCBjdXN0b21BbHBoYWJldCA9IChhbHBoYWJldCwgZGVmYXVsdFNpemUgPSAyMSkgPT4ge1xuICByZXR1cm4gKHNpemUgPSBkZWZhdWx0U2l6ZSkgPT4ge1xuICAgIGxldCBpZCA9ICcnXG4gICAgbGV0IGkgPSBzaXplXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWQgKz0gYWxwaGFiZXRbKE1hdGgucmFuZG9tKCkgKiBhbHBoYWJldC5sZW5ndGgpIHwgMF1cbiAgICB9XG4gICAgcmV0dXJuIGlkXG4gIH1cbn1cbmV4cG9ydCBsZXQgbmFub2lkID0gKHNpemUgPSAyMSkgPT4ge1xuICBsZXQgaWQgPSAnJ1xuICBsZXQgaSA9IHNpemVcbiAgd2hpbGUgKGktLSkge1xuICAgIGlkICs9IHVybEFscGhhYmV0WyhNYXRoLnJhbmRvbSgpICogNjQpIHwgMF1cbiAgfVxuICByZXR1cm4gaWRcbn1cbiIsICIvKlxyXG4gXyAgICAgX18gICAgIF8gX19cclxufCB8ICAvIC9fX18gXyhfKSAvX19fX1xyXG58IHwgL3wgLyAvIF9fIGAvIC8gLyBfX18vXHJcbnwgfC8gfC8gLyAvXy8gLyAvIChfXyAgKVxyXG58X18vfF9fL1xcX18sXy9fL18vX19fXy9cclxuVGhlIGVsZWN0cm9uIGFsdGVybmF0aXZlIGZvciBHb1xyXG4oYykgTGVhIEFudGhvbnkgMjAxOS1wcmVzZW50XHJcbiovXHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA5ICovXHJcbmltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ25hbm9pZC9ub24tc2VjdXJlJztcclxuXHJcbmNvbnN0IHJ1bnRpbWVVUkwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgXCIvd2FpbHMvcnVudGltZVwiO1xyXG5cclxuLy8gT2JqZWN0IE5hbWVzXHJcbmV4cG9ydCBjb25zdCBvYmplY3ROYW1lcyA9IHtcclxuICAgIENhbGw6IDAsXHJcbiAgICBDbGlwYm9hcmQ6IDEsXHJcbiAgICBBcHBsaWNhdGlvbjogMixcclxuICAgIEV2ZW50czogMyxcclxuICAgIENvbnRleHRNZW51OiA0LFxyXG4gICAgRGlhbG9nOiA1LFxyXG4gICAgV2luZG93OiA2LFxyXG4gICAgU2NyZWVuczogNyxcclxuICAgIFN5c3RlbTogOCxcclxuICAgIEJyb3dzZXI6IDksXHJcbn1cclxuZXhwb3J0IGxldCBjbGllbnRJZCA9IG5hbm9pZCgpO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBydW50aW1lIGNhbGxlciBmdW5jdGlvbiB0aGF0IGludm9rZXMgYSBzcGVjaWZpZWQgbWV0aG9kIG9uIGEgZ2l2ZW4gb2JqZWN0IHdpdGhpbiBhIHNwZWNpZmllZCB3aW5kb3cgY29udGV4dC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCAtIFRoZSBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGhvZCBpcyB0byBiZSBpbnZva2VkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gd2luZG93TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB3aW5kb3cgY29udGV4dCBpbiB3aGljaCB0aGUgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQuXHJcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBydW50aW1lIGNhbGxlciBmdW5jdGlvbiB0aGF0IHRha2VzIHRoZSBtZXRob2QgbmFtZSBhbmQgb3B0aW9uYWxseSBhcmd1bWVudHMgYW5kIGludm9rZXMgdGhlIG1ldGhvZCB3aXRoaW4gdGhlIHNwZWNpZmllZCB3aW5kb3cgY29udGV4dC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBuZXdSdW50aW1lQ2FsbGVyKG9iamVjdCwgd2luZG93TmFtZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtZXRob2QsIGFyZ3M9bnVsbCkge1xyXG4gICAgICAgIHJldHVybiBydW50aW1lQ2FsbChvYmplY3QgKyBcIi5cIiArIG1ldGhvZCwgd2luZG93TmFtZSwgYXJncyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBydW50aW1lIGNhbGxlciB3aXRoIHNwZWNpZmllZCBJRC5cclxuICpcclxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gaW52b2tlIHRoZSBtZXRob2Qgb24uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB3aW5kb3dOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHdpbmRvdy5cclxuICogQHJldHVybiB7RnVuY3Rpb259IC0gVGhlIG5ldyBydW50aW1lIGNhbGxlciBmdW5jdGlvbi5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBuZXdSdW50aW1lQ2FsbGVyV2l0aElEKG9iamVjdCwgd2luZG93TmFtZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtZXRob2QsIGFyZ3M9bnVsbCkge1xyXG4gICAgICAgIHJldHVybiBydW50aW1lQ2FsbFdpdGhJRChvYmplY3QsIG1ldGhvZCwgd2luZG93TmFtZSwgYXJncyk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gcnVudGltZUNhbGwobWV0aG9kLCB3aW5kb3dOYW1lLCBhcmdzKSB7XHJcbiAgICBsZXQgdXJsID0gbmV3IFVSTChydW50aW1lVVJMKTtcclxuICAgIGlmKCBtZXRob2QgKSB7XHJcbiAgICAgICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoXCJtZXRob2RcIiwgbWV0aG9kKTtcclxuICAgIH1cclxuICAgIGxldCBmZXRjaE9wdGlvbnMgPSB7XHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICB9O1xyXG4gICAgaWYgKHdpbmRvd05hbWUpIHtcclxuICAgICAgICBmZXRjaE9wdGlvbnMuaGVhZGVyc1tcIngtd2FpbHMtd2luZG93LW5hbWVcIl0gPSB3aW5kb3dOYW1lO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyZ3MpIHtcclxuICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChcImFyZ3NcIiwgSlNPTi5zdHJpbmdpZnkoYXJncykpO1xyXG4gICAgfVxyXG4gICAgZmV0Y2hPcHRpb25zLmhlYWRlcnNbXCJ4LXdhaWxzLWNsaWVudC1pZFwiXSA9IGNsaWVudElkO1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgZmV0Y2godXJsLCBmZXRjaE9wdGlvbnMpXHJcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGNvbnRlbnQgdHlwZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtVHlwZVwiKSAmJiByZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtVHlwZVwiKS5pbmRleE9mKFwiYXBwbGljYXRpb24vanNvblwiKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlamVjdChFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4gcmVzb2x2ZShkYXRhKSlcclxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHJlamVjdChlcnJvcikpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJ1bnRpbWVDYWxsV2l0aElEKG9iamVjdElELCBtZXRob2QsIHdpbmRvd05hbWUsIGFyZ3MpIHtcclxuICAgIGxldCB1cmwgPSBuZXcgVVJMKHJ1bnRpbWVVUkwpO1xyXG4gICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoXCJvYmplY3RcIiwgb2JqZWN0SUQpO1xyXG4gICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoXCJtZXRob2RcIiwgbWV0aG9kKTtcclxuICAgIGxldCBmZXRjaE9wdGlvbnMgPSB7XHJcbiAgICAgICAgaGVhZGVyczoge30sXHJcbiAgICB9O1xyXG4gICAgaWYgKHdpbmRvd05hbWUpIHtcclxuICAgICAgICBmZXRjaE9wdGlvbnMuaGVhZGVyc1tcIngtd2FpbHMtd2luZG93LW5hbWVcIl0gPSB3aW5kb3dOYW1lO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyZ3MpIHtcclxuICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLmFwcGVuZChcImFyZ3NcIiwgSlNPTi5zdHJpbmdpZnkoYXJncykpO1xyXG4gICAgfVxyXG4gICAgZmV0Y2hPcHRpb25zLmhlYWRlcnNbXCJ4LXdhaWxzLWNsaWVudC1pZFwiXSA9IGNsaWVudElkO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBmZXRjaCh1cmwsIGZldGNoT3B0aW9ucylcclxuICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgY29udGVudCB0eXBlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiQ29udGVudC1UeXBlXCIpICYmIHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiQ29udGVudC1UeXBlXCIpLmluZGV4T2YoXCJhcHBsaWNhdGlvbi9qc29uXCIpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KEVycm9yKHJlc3BvbnNlLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiByZXNvbHZlKGRhdGEpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4gcmVqZWN0KGVycm9yKSk7XHJcbiAgICB9KTtcclxufVxyXG4iLCAiLypcclxuIF9cdCAgIF9fXHQgIF8gX19cclxufCB8XHQgLyAvX19fIF8oXykgL19fX19cclxufCB8IC98IC8gLyBfXyBgLyAvIC8gX19fL1xyXG58IHwvIHwvIC8gL18vIC8gLyAoX18gIClcclxufF9fL3xfXy9cXF9fLF8vXy9fL19fX18vXHJcblRoZSBlbGVjdHJvbiBhbHRlcm5hdGl2ZSBmb3IgR29cclxuKGMpIExlYSBBbnRob255IDIwMTktcHJlc2VudFxyXG4qL1xyXG5cclxuLyoganNoaW50IGVzdmVyc2lvbjogOSAqL1xyXG5cclxuaW1wb3J0IHtuZXdSdW50aW1lQ2FsbGVyV2l0aElELCBvYmplY3ROYW1lc30gZnJvbSBcIi4vcnVudGltZVwiO1xyXG5sZXQgY2FsbCA9IG5ld1J1bnRpbWVDYWxsZXJXaXRoSUQob2JqZWN0TmFtZXMuU3lzdGVtLCAnJyk7XHJcbmNvbnN0IHN5c3RlbUlzRGFya01vZGUgPSAwO1xyXG5cclxuLyoqXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBSZXRyaWV2ZXMgdGhlIHN5c3RlbSBkYXJrIG1vZGUgc3RhdHVzLlxyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxib29sZWFuPn0gLSBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIGJvb2xlYW4gdmFsdWUgaW5kaWNhdGluZyBpZiB0aGUgc3lzdGVtIGlzIGluIGRhcmsgbW9kZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBJc0RhcmtNb2RlKCkge1xyXG4gICAgcmV0dXJuIGNhbGwoc3lzdGVtSXNEYXJrTW9kZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2hlcyB0aGUgY2FwYWJpbGl0aWVzIG9mIHRoZSBhcHBsaWNhdGlvbiBmcm9tIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBhc3luY1xyXG4gKiBAZnVuY3Rpb24gQ2FwYWJpbGl0aWVzXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjYXBhYmlsaXRpZXMuXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gQ2FwYWJpbGl0aWVzKCkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0gZmV0Y2goXCIvd2FpbHMvY2FwYWJpbGl0aWVzXCIpO1xyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBvcGVyYXRpbmcgc3lzdGVtIGlzIFdpbmRvd3MuXHJcbiAqXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIG9wZXJhdGluZyBzeXN0ZW0gaXMgV2luZG93cywgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIElzV2luZG93cygpIHtcclxuICAgIHJldHVybiB3aW5kb3cuX3dhaWxzLmVudmlyb25tZW50Lk9TID09PSBcIndpbmRvd3NcIjtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBvcGVyYXRpbmcgc3lzdGVtIGlzIExpbnV4LlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBjdXJyZW50IG9wZXJhdGluZyBzeXN0ZW0gaXMgTGludXgsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBJc0xpbnV4KCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5fd2FpbHMuZW52aXJvbm1lbnQuT1MgPT09IFwibGludXhcIjtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIG1hY09TIG9wZXJhdGluZyBzeXN0ZW0uXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBlbnZpcm9ubWVudCBpcyBtYWNPUywgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIElzTWFjKCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5fd2FpbHMuZW52aXJvbm1lbnQuT1MgPT09IFwiZGFyd2luXCI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgYXJjaGl0ZWN0dXJlIGlzIEFNRDY0LlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBhcmNoaXRlY3R1cmUgaXMgQU1ENjQsIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBJc0FNRDY0KCkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5fd2FpbHMuZW52aXJvbm1lbnQuQXJjaCA9PT0gXCJhbWQ2NFwiO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBjdXJyZW50IGFyY2hpdGVjdHVyZSBpcyBBUk0uXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBjdXJyZW50IGFyY2hpdGVjdHVyZSBpcyBBUk0sIGZhbHNlIG90aGVyd2lzZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBJc0FSTSgpIHtcclxuICAgIHJldHVybiB3aW5kb3cuX3dhaWxzLmVudmlyb25tZW50LkFyY2ggPT09IFwiYXJtXCI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgaXMgQVJNNjQgYXJjaGl0ZWN0dXJlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBSZXR1cm5zIHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIEFSTTY0IGFyY2hpdGVjdHVyZSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gSXNBUk02NCgpIHtcclxuICAgIHJldHVybiB3aW5kb3cuX3dhaWxzLmVudmlyb25tZW50LkFyY2ggPT09IFwiYXJtNjRcIjtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgYXBwbGljYXRpb24gaXMgcnVubmluZyBpbiBkZWJ1ZyBtb2RlLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgYXBwbGljYXRpb24gaXMgcnVubmluZyBpbiBkZWJ1ZyBtb2RlLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gSXNEZWJ1ZygpIHtcclxuICAgIHJldHVybiB3aW5kb3cuX3dhaWxzLmVudmlyb25tZW50LkRlYnVnID09PSB0cnVlO1xyXG59IiwgIi8qXHJcbiBfXHQgICBfX1x0ICBfIF9fXHJcbnwgfFx0IC8gL19fXyBfKF8pIC9fX19fXHJcbnwgfCAvfCAvIC8gX18gYC8gLyAvIF9fXy9cclxufCB8LyB8LyAvIC9fLyAvIC8gKF9fICApXHJcbnxfXy98X18vXFxfXyxfL18vXy9fX19fL1xyXG5UaGUgZWxlY3Ryb24gYWx0ZXJuYXRpdmUgZm9yIEdvXHJcbihjKSBMZWEgQW50aG9ueSAyMDE5LXByZXNlbnRcclxuKi9cclxuXHJcbi8qIGpzaGludCBlc3ZlcnNpb246IDkgKi9cclxuXHJcbmltcG9ydCB7bmV3UnVudGltZUNhbGxlcldpdGhJRCwgb2JqZWN0TmFtZXN9IGZyb20gXCIuL3J1bnRpbWVcIjtcclxuaW1wb3J0IHtJc0RlYnVnfSBmcm9tIFwiLi9zeXN0ZW1cIjtcclxuXHJcbmNvbnN0IGNhbGwgPSBuZXdSdW50aW1lQ2FsbGVyV2l0aElEKG9iamVjdE5hbWVzLkNvbnRleHRNZW51LCAnJyk7XHJcbmNvbnN0IENvbnRleHRNZW51T3BlbiA9IDA7XHJcblxyXG5mdW5jdGlvbiBvcGVuQ29udGV4dE1lbnUoaWQsIHgsIHksIGRhdGEpIHtcclxuICAgIHZvaWQgY2FsbChDb250ZXh0TWVudU9wZW4sIHtpZCwgeCwgeSwgZGF0YX0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBDb250ZXh0TWVudXMoKSB7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBjb250ZXh0TWVudUhhbmRsZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb250ZXh0TWVudUhhbmRsZXIoZXZlbnQpIHtcclxuICAgIC8vIENoZWNrIGZvciBjdXN0b20gY29udGV4dCBtZW51XHJcbiAgICBsZXQgZWxlbWVudCA9IGV2ZW50LnRhcmdldDtcclxuICAgIGxldCBjdXN0b21Db250ZXh0TWVudSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLmdldFByb3BlcnR5VmFsdWUoXCItLWN1c3RvbS1jb250ZXh0bWVudVwiKTtcclxuICAgIGN1c3RvbUNvbnRleHRNZW51ID0gY3VzdG9tQ29udGV4dE1lbnUgPyBjdXN0b21Db250ZXh0TWVudS50cmltKCkgOiBcIlwiO1xyXG4gICAgaWYgKGN1c3RvbUNvbnRleHRNZW51KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBsZXQgY3VzdG9tQ29udGV4dE1lbnVEYXRhID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkuZ2V0UHJvcGVydHlWYWx1ZShcIi0tY3VzdG9tLWNvbnRleHRtZW51LWRhdGFcIik7XHJcbiAgICAgICAgb3BlbkNvbnRleHRNZW51KGN1c3RvbUNvbnRleHRNZW51LCBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZLCBjdXN0b21Db250ZXh0TWVudURhdGEpO1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NEZWZhdWx0Q29udGV4dE1lbnUoZXZlbnQpO1xyXG59XHJcblxyXG5cclxuLypcclxuLS1kZWZhdWx0LWNvbnRleHRtZW51OiBhdXRvOyAoZGVmYXVsdCkgd2lsbCBzaG93IHRoZSBkZWZhdWx0IGNvbnRleHQgbWVudSBpZiBjb250ZW50RWRpdGFibGUgaXMgdHJ1ZSBPUiB0ZXh0IGhhcyBiZWVuIHNlbGVjdGVkIE9SIGVsZW1lbnQgaXMgaW5wdXQgb3IgdGV4dGFyZWFcclxuLS1kZWZhdWx0LWNvbnRleHRtZW51OiBzaG93OyB3aWxsIGFsd2F5cyBzaG93IHRoZSBkZWZhdWx0IGNvbnRleHQgbWVudVxyXG4tLWRlZmF1bHQtY29udGV4dG1lbnU6IGhpZGU7IHdpbGwgYWx3YXlzIGhpZGUgdGhlIGRlZmF1bHQgY29udGV4dCBtZW51XHJcblxyXG5UaGlzIHJ1bGUgaXMgaW5oZXJpdGVkIGxpa2Ugbm9ybWFsIENTUyBydWxlcywgc28gbmVzdGluZyB3b3JrcyBhcyBleHBlY3RlZFxyXG4qL1xyXG5mdW5jdGlvbiBwcm9jZXNzRGVmYXVsdENvbnRleHRNZW51KGV2ZW50KSB7XHJcblxyXG4gICAgLy8gRGVidWcgYnVpbGRzIGFsd2F5cyBzaG93IHRoZSBtZW51XHJcbiAgICBpZiAoSXNEZWJ1ZygpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByb2Nlc3MgZGVmYXVsdCBjb250ZXh0IG1lbnVcclxuICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC50YXJnZXQ7XHJcbiAgICBjb25zdCBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XHJcbiAgICBjb25zdCBkZWZhdWx0Q29udGV4dE1lbnVBY3Rpb24gPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoXCItLWRlZmF1bHQtY29udGV4dG1lbnVcIikudHJpbSgpO1xyXG4gICAgc3dpdGNoIChkZWZhdWx0Q29udGV4dE1lbnVBY3Rpb24pIHtcclxuICAgICAgICBjYXNlIFwic2hvd1wiOlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY2FzZSBcImhpZGVcIjpcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGNvbnRlbnRFZGl0YWJsZSBpcyB0cnVlXHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmlzQ29udGVudEVkaXRhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRleHQgaGFzIGJlZW4gc2VsZWN0ZWRcclxuICAgICAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICBjb25zdCBoYXNTZWxlY3Rpb24gPSAoc2VsZWN0aW9uLnRvU3RyaW5nKCkubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgaWYgKGhhc1NlbGVjdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rpb24ucmFuZ2VDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdChpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN0cyA9IHJhbmdlLmdldENsaWVudFJlY3RzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByZWN0cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN0ID0gcmVjdHNbal07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHJlY3QubGVmdCwgcmVjdC50b3ApID09PSBlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGFnbmFtZSBpcyBpbnB1dCBvciB0ZXh0YXJlYVxyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC50YWdOYW1lID09PSBcIklOUFVUXCIgfHwgZWxlbWVudC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChoYXNTZWxlY3Rpb24gfHwgKCFlbGVtZW50LnJlYWRPbmx5ICYmICFlbGVtZW50LmRpc2FibGVkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaGlkZSBkZWZhdWx0IGNvbnRleHQgbWVudVxyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfVxyXG59XHJcbiIsICIvKlxyXG4gX1x0ICAgX19cdCAgXyBfX1xyXG58IHxcdCAvIC9fX18gXyhfKSAvX19fX1xyXG58IHwgL3wgLyAvIF9fIGAvIC8gLyBfX18vXHJcbnwgfC8gfC8gLyAvXy8gLyAvIChfXyAgKVxyXG58X18vfF9fL1xcX18sXy9fL18vX19fXy9cclxuVGhlIGVsZWN0cm9uIGFsdGVybmF0aXZlIGZvciBHb1xyXG4oYykgTGVhIEFudGhvbnkgMjAxOS1wcmVzZW50XHJcbiovXHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA5ICovXHJcblxyXG5sZXQgZmxhZ3MgPSBuZXcgTWFwKCk7XHJcblxyXG5mdW5jdGlvbiBjb252ZXJ0VG9NYXAob2JqKSB7XHJcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMob2JqKSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIG1hcC5zZXQoa2V5LCBjb252ZXJ0VG9NYXAodmFsdWUpKTsgLy8gUmVjdXJzaXZlbHkgY29udmVydCBuZXN0ZWQgb2JqZWN0XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWFwLnNldChrZXksIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1hcDtcclxufVxyXG5cclxuZmV0Y2goXCIvd2FpbHMvZmxhZ3NcIikudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgIHJlc3BvbnNlLmpzb24oKS50aGVuKChkYXRhKSA9PiB7XHJcbiAgICAgICAgZmxhZ3MgPSBjb252ZXJ0VG9NYXAoZGF0YSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5cclxuZnVuY3Rpb24gZ2V0VmFsdWVGcm9tTWFwKGtleVN0cmluZykge1xyXG4gICAgY29uc3Qga2V5cyA9IGtleVN0cmluZy5zcGxpdCgnLicpO1xyXG4gICAgbGV0IHZhbHVlID0gZmxhZ3M7XHJcblxyXG4gICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLmdldChrZXkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWVba2V5XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXRyaWV2ZXMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3BlY2lmaWVkIGtleSBmcm9tIHRoZSBmbGFnIG1hcC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleVN0cmluZyAtIFRoZSBrZXkgdG8gcmV0cmlldmUgdGhlIHZhbHVlIGZvci5cclxuICogQHJldHVybiB7Kn0gLSBUaGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBzcGVjaWZpZWQga2V5LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIEdldEZsYWcoa2V5U3RyaW5nKSB7XHJcbiAgICByZXR1cm4gZ2V0VmFsdWVGcm9tTWFwKGtleVN0cmluZyk7XHJcbn1cclxuIiwgIi8qXHJcbiBfXHQgICBfX1x0ICBfIF9fXHJcbnwgfFx0IC8gL19fXyBfKF8pIC9fX19fXHJcbnwgfCAvfCAvIC8gX18gYC8gLyAvIF9fXy9cclxufCB8LyB8LyAvIC9fLyAvIC8gKF9fICApXHJcbnxfXy98X18vXFxfXyxfL18vXy9fX19fL1xyXG5UaGUgZWxlY3Ryb24gYWx0ZXJuYXRpdmUgZm9yIEdvXHJcbihjKSBMZWEgQW50aG9ueSAyMDE5LXByZXNlbnRcclxuKi9cclxuXHJcbi8qIGpzaGludCBlc3ZlcnNpb246IDkgKi9cclxuXHJcbmltcG9ydCB7SXNXaW5kb3dzfSBmcm9tIFwiLi9zeXN0ZW1cIjtcclxuaW1wb3J0IHtHZXRGbGFnfSBmcm9tIFwiLi9mbGFnc1wiO1xyXG5cclxubGV0IHNob3VsZERyYWcgPSBmYWxzZTtcclxubGV0IHJlc2l6ZUVkZ2UgPSBudWxsO1xyXG5sZXQgcmVzaXphYmxlID0gZmFsc2U7XHJcbmxldCBkZWZhdWx0Q3Vyc29yID0gXCJhdXRvXCI7XHJcbndpbmRvdy5fd2FpbHMgPSB3aW5kb3cuX3dhaWxzIHx8IHt9O1xyXG53aW5kb3cuX3dhaWxzLnNldFJlc2l6YWJsZSA9IHNldFJlc2l6YWJsZTtcclxud2luZG93Ll93YWlscy5lbmREcmFnID0gZW5kRHJhZztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkcmFnVGVzdChlKSB7XHJcbiAgICBsZXQgdmFsID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZS50YXJnZXQpLmdldFByb3BlcnR5VmFsdWUoXCItLXdlYmtpdC1hcHAtcmVnaW9uXCIpO1xyXG4gICAgaWYgKCF2YWwgfHwgdmFsID09PSBcIlwiIHx8IHZhbC50cmltKCkgIT09IFwiZHJhZ1wiIHx8IGUuYnV0dG9ucyAhPT0gMSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiBlLmRldGFpbCA9PT0gMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwRHJhZygpIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBvbk1vdXNlVXApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0UmVzaXphYmxlKHZhbHVlKSB7XHJcbiAgICByZXNpemFibGUgPSB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVuZERyYWcoKSB7XHJcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcclxuICAgIHNob3VsZERyYWcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFJlc2l6ZSgpIHtcclxuICAgIGlmKCByZXNpemVFZGdlICkge1xyXG4gICAgICAgIHdpbmRvdy5fd2FpbHMuaW52b2tlKGByZXNpemU6JHtyZXNpemVFZGdlfWApO1xyXG4gICAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcclxuICAgIGlmKElzV2luZG93cygpICYmIHRlc3RSZXNpemUoKSB8fCBkcmFnVGVzdChlKSkge1xyXG4gICAgICAgIHNob3VsZERyYWcgPSAhIWlzVmFsaWREcmFnKGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc1ZhbGlkRHJhZyhlKSB7XHJcbiAgICAvLyBJZ25vcmUgZHJhZyBvbiBzY3JvbGxiYXJzXHJcbiAgICByZXR1cm4gIShlLm9mZnNldFggPiBlLnRhcmdldC5jbGllbnRXaWR0aCB8fCBlLm9mZnNldFkgPiBlLnRhcmdldC5jbGllbnRIZWlnaHQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbk1vdXNlVXAoZSkge1xyXG4gICAgbGV0IG1vdXNlUHJlc3NlZCA9IGUuYnV0dG9ucyAhPT0gdW5kZWZpbmVkID8gZS5idXR0b25zIDogZS53aGljaDtcclxuICAgIGlmIChtb3VzZVByZXNzZWQgPiAwKSB7XHJcbiAgICAgICAgZW5kRHJhZygpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRSZXNpemUoY3Vyc29yID0gZGVmYXVsdEN1cnNvcikge1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLmN1cnNvciA9IGN1cnNvcjtcclxuICAgIHJlc2l6ZUVkZ2UgPSBjdXJzb3I7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uTW91c2VNb3ZlKGUpIHtcclxuICAgIHNob3VsZERyYWcgPSBjaGVja0RyYWcoZSk7XHJcbiAgICBpZiAoSXNXaW5kb3dzKCkgJiYgcmVzaXphYmxlKSB7XHJcbiAgICAgICAgaGFuZGxlUmVzaXplKGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0RyYWcoZSkge1xyXG4gICAgbGV0IG1vdXNlUHJlc3NlZCA9IGUuYnV0dG9ucyAhPT0gdW5kZWZpbmVkID8gZS5idXR0b25zIDogZS53aGljaDtcclxuICAgIGlmKHNob3VsZERyYWcgJiYgbW91c2VQcmVzc2VkID4gMCkge1xyXG4gICAgICAgIHdpbmRvdy5fd2FpbHMuaW52b2tlKFwiZHJhZ1wiKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2hvdWxkRHJhZztcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlUmVzaXplKGUpIHtcclxuICAgIGxldCByZXNpemVIYW5kbGVIZWlnaHQgPSBHZXRGbGFnKFwic3lzdGVtLnJlc2l6ZUhhbmRsZUhlaWdodFwiKSB8fCA1O1xyXG4gICAgbGV0IHJlc2l6ZUhhbmRsZVdpZHRoID0gR2V0RmxhZyhcInN5c3RlbS5yZXNpemVIYW5kbGVXaWR0aFwiKSB8fCA1O1xyXG5cclxuICAgIC8vIEV4dHJhIHBpeGVscyBmb3IgdGhlIGNvcm5lciBhcmVhc1xyXG4gICAgbGV0IGNvcm5lckV4dHJhID0gR2V0RmxhZyhcInJlc2l6ZUNvcm5lckV4dHJhXCIpIHx8IDEwO1xyXG5cclxuICAgIGxldCByaWdodEJvcmRlciA9IHdpbmRvdy5vdXRlcldpZHRoIC0gZS5jbGllbnRYIDwgcmVzaXplSGFuZGxlV2lkdGg7XHJcbiAgICBsZXQgbGVmdEJvcmRlciA9IGUuY2xpZW50WCA8IHJlc2l6ZUhhbmRsZVdpZHRoO1xyXG4gICAgbGV0IHRvcEJvcmRlciA9IGUuY2xpZW50WSA8IHJlc2l6ZUhhbmRsZUhlaWdodDtcclxuICAgIGxldCBib3R0b21Cb3JkZXIgPSB3aW5kb3cub3V0ZXJIZWlnaHQgLSBlLmNsaWVudFkgPCByZXNpemVIYW5kbGVIZWlnaHQ7XHJcblxyXG4gICAgLy8gQWRqdXN0IGZvciBjb3JuZXJzXHJcbiAgICBsZXQgcmlnaHRDb3JuZXIgPSB3aW5kb3cub3V0ZXJXaWR0aCAtIGUuY2xpZW50WCA8IChyZXNpemVIYW5kbGVXaWR0aCArIGNvcm5lckV4dHJhKTtcclxuICAgIGxldCBsZWZ0Q29ybmVyID0gZS5jbGllbnRYIDwgKHJlc2l6ZUhhbmRsZVdpZHRoICsgY29ybmVyRXh0cmEpO1xyXG4gICAgbGV0IHRvcENvcm5lciA9IGUuY2xpZW50WSA8IChyZXNpemVIYW5kbGVIZWlnaHQgKyBjb3JuZXJFeHRyYSk7XHJcbiAgICBsZXQgYm90dG9tQ29ybmVyID0gd2luZG93Lm91dGVySGVpZ2h0IC0gZS5jbGllbnRZIDwgKHJlc2l6ZUhhbmRsZUhlaWdodCArIGNvcm5lckV4dHJhKTtcclxuXHJcbiAgICAvLyBJZiB3ZSBhcmVuJ3Qgb24gYW4gZWRnZSwgYnV0IHdlcmUsIHJlc2V0IHRoZSBjdXJzb3IgdG8gZGVmYXVsdFxyXG4gICAgaWYgKCFsZWZ0Qm9yZGVyICYmICFyaWdodEJvcmRlciAmJiAhdG9wQm9yZGVyICYmICFib3R0b21Cb3JkZXIgJiYgcmVzaXplRWRnZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgc2V0UmVzaXplKCk7XHJcbiAgICB9XHJcbiAgICAvLyBBZGp1c3RlZCBmb3IgY29ybmVyIGFyZWFzXHJcbiAgICBlbHNlIGlmIChyaWdodENvcm5lciAmJiBib3R0b21Db3JuZXIpIHNldFJlc2l6ZShcInNlLXJlc2l6ZVwiKTtcclxuICAgIGVsc2UgaWYgKGxlZnRDb3JuZXIgJiYgYm90dG9tQ29ybmVyKSBzZXRSZXNpemUoXCJzdy1yZXNpemVcIik7XHJcbiAgICBlbHNlIGlmIChsZWZ0Q29ybmVyICYmIHRvcENvcm5lcikgc2V0UmVzaXplKFwibnctcmVzaXplXCIpO1xyXG4gICAgZWxzZSBpZiAodG9wQ29ybmVyICYmIHJpZ2h0Q29ybmVyKSBzZXRSZXNpemUoXCJuZS1yZXNpemVcIik7XHJcbiAgICBlbHNlIGlmIChsZWZ0Qm9yZGVyKSBzZXRSZXNpemUoXCJ3LXJlc2l6ZVwiKTtcclxuICAgIGVsc2UgaWYgKHRvcEJvcmRlcikgc2V0UmVzaXplKFwibi1yZXNpemVcIik7XHJcbiAgICBlbHNlIGlmIChib3R0b21Cb3JkZXIpIHNldFJlc2l6ZShcInMtcmVzaXplXCIpO1xyXG4gICAgZWxzZSBpZiAocmlnaHRCb3JkZXIpIHNldFJlc2l6ZShcImUtcmVzaXplXCIpO1xyXG59XHJcbiIsICIvKlxyXG4gX1x0ICAgX19cdCAgXyBfX1xyXG58IHxcdCAvIC9fX18gXyhfKSAvX19fX1xyXG58IHwgL3wgLyAvIF9fIGAvIC8gLyBfX18vXHJcbnwgfC8gfC8gLyAvXy8gLyAvIChfXyAgKVxyXG58X18vfF9fL1xcX18sXy9fL18vX19fXy9cclxuVGhlIGVsZWN0cm9uIGFsdGVybmF0aXZlIGZvciBHb1xyXG4oYykgTGVhIEFudGhvbnkgMjAxOS1wcmVzZW50XHJcbiovXHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA5ICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge2ltcG9ydChcIi4vdHlwZXNcIikuV2FpbHNFdmVudH0gV2FpbHNFdmVudFxyXG4gKi9cclxuaW1wb3J0IHtuZXdSdW50aW1lQ2FsbGVyV2l0aElELCBvYmplY3ROYW1lc30gZnJvbSBcIi4vcnVudGltZVwiO1xyXG5cclxuaW1wb3J0IHtFdmVudFR5cGVzfSBmcm9tIFwiLi9ldmVudF90eXBlc1wiO1xyXG5leHBvcnQgY29uc3QgVHlwZXMgPSBFdmVudFR5cGVzO1xyXG5cclxuY29uc3QgY2FsbCA9IG5ld1J1bnRpbWVDYWxsZXJXaXRoSUQob2JqZWN0TmFtZXMuRXZlbnRzLCAnJyk7XHJcbmNvbnN0IEVtaXRNZXRob2QgPSAwO1xyXG5jb25zdCBldmVudExpc3RlbmVycyA9IG5ldyBNYXAoKTtcclxuXHJcbmNsYXNzIExpc3RlbmVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGV2ZW50TmFtZSwgY2FsbGJhY2ssIG1heENhbGxiYWNrcykge1xyXG4gICAgICAgIHRoaXMuZXZlbnROYW1lID0gZXZlbnROYW1lO1xyXG4gICAgICAgIHRoaXMubWF4Q2FsbGJhY2tzID0gbWF4Q2FsbGJhY2tzIHx8IC0xO1xyXG4gICAgICAgIHRoaXMuQ2FsbGJhY2sgPSAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4Q2FsbGJhY2tzID09PSAtMSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLm1heENhbGxiYWNrcyAtPSAxO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXhDYWxsYmFja3MgPT09IDA7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdhaWxzRXZlbnQge1xyXG4gICAgY29uc3RydWN0b3IobmFtZSwgZGF0YSA9IG51bGwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHVwIGV2ZW50IGNhbGxiYWNrcyBmb3IgV2FpbHMuXHJcbiAqXHJcbiAqIEBmdW5jdGlvbiBzZXR1cEV2ZW50Q2FsbGJhY2tzXHJcbiAqXHJcbiAqIEBkZXNjcmlwdGlvbiBUaGlzIG1ldGhvZCBpcyByZXNwb25zaWJsZSBmb3Igc2V0dGluZyB1cCBldmVudCBjYWxsYmFja3MgZm9yIFdhaWxzLiBJdCBjaGVja3MgaWYgdGhlIGdsb2JhbCBvYmplY3QgYF93YWlsc2AgZXhpc3RzIG9uIHRoZSBgd2luZG93YCBvYmplY3QsIGFuZCBpZiBub3QsIGluaXRpYWxpemVzIGl0XHJcbiAqLiBJdCB0aGVuIGFzc2lnbnMgdGhlIGBkaXNwYXRjaFdhaWxzRXZlbnRgIGZ1bmN0aW9uIGFzIGEgcHJvcGVydHkgb24gdGhlIGBfd2FpbHNgIG9iamVjdC5cclxuICpcclxuICogQHJldHVybnMge3VuZGVmaW5lZH0gUmV0dXJucyBub3RoaW5nLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwRXZlbnRDYWxsYmFja3MoKSB7XHJcbiAgICB3aW5kb3cuX3dhaWxzID0gd2luZG93Ll93YWlscyB8fCB7fTtcclxuICAgIHdpbmRvdy5fd2FpbHMuZGlzcGF0Y2hXYWlsc0V2ZW50ID0gZGlzcGF0Y2hXYWlsc0V2ZW50O1xyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwYXRjaFdhaWxzRXZlbnQoZXZlbnQpIHtcclxuICAgIGxldCBsaXN0ZW5lcnMgPSBldmVudExpc3RlbmVycy5nZXQoZXZlbnQubmFtZSk7XHJcbiAgICBpZiAobGlzdGVuZXJzKSB7XHJcbiAgICAgICAgbGV0IHRvUmVtb3ZlID0gbGlzdGVuZXJzLmZpbHRlcihsaXN0ZW5lciA9PiB7XHJcbiAgICAgICAgICAgIGxldCByZW1vdmUgPSBsaXN0ZW5lci5DYWxsYmFjayhldmVudCk7XHJcbiAgICAgICAgICAgIGlmIChyZW1vdmUpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmICh0b1JlbW92ZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5maWx0ZXIobCA9PiAhdG9SZW1vdmUuaW5jbHVkZXMobCkpO1xyXG4gICAgICAgICAgICBpZiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkgZXZlbnRMaXN0ZW5lcnMuZGVsZXRlKGV2ZW50Lm5hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIGV2ZW50TGlzdGVuZXJzLnNldChldmVudC5uYW1lLCBsaXN0ZW5lcnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGZvciBhIHNwZWNpZmljIGV2ZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBmb3IuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyB0cmlnZ2VyZWQuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhDYWxsYmFja3MgLSBUaGUgbWF4aW11bSBudW1iZXIgb2YgdGltZXMgdGhlIGNhbGxiYWNrIGNhbiBiZSBjYWxsZWQgZm9yIHRoZSBldmVudC4gT25jZSB0aGUgbWF4aW11bSBudW1iZXIgaXMgcmVhY2hlZCwgdGhlIGNhbGxiYWNrIHdpbGwgbm8gbG9uZ2VyIGJlIGNhbGxlZC5cclxuICpcclxuIEByZXR1cm4ge2Z1bmN0aW9ufSAtIEEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIHdpbGwgdW5yZWdpc3RlciB0aGUgY2FsbGJhY2sgZnJvbSB0aGUgZXZlbnQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gT25NdWx0aXBsZShldmVudE5hbWUsIGNhbGxiYWNrLCBtYXhDYWxsYmFja3MpIHtcclxuICAgIGxldCBsaXN0ZW5lcnMgPSBldmVudExpc3RlbmVycy5nZXQoZXZlbnROYW1lKSB8fCBbXTtcclxuICAgIGNvbnN0IHRoaXNMaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCBtYXhDYWxsYmFja3MpO1xyXG4gICAgbGlzdGVuZXJzLnB1c2godGhpc0xpc3RlbmVyKTtcclxuICAgIGV2ZW50TGlzdGVuZXJzLnNldChldmVudE5hbWUsIGxpc3RlbmVycyk7XHJcbiAgICByZXR1cm4gKCkgPT4gbGlzdGVuZXJPZmYodGhpc0xpc3RlbmVyKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHNwZWNpZmllZCBldmVudCBvY2N1cnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkLiBJdCB0YWtlcyBubyBwYXJhbWV0ZXJzLlxyXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gLSBBIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCB3aWxsIHVucmVnaXN0ZXIgdGhlIGNhbGxiYWNrIGZyb20gdGhlIGV2ZW50LiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gT24oZXZlbnROYW1lLCBjYWxsYmFjaykgeyByZXR1cm4gT25NdWx0aXBsZShldmVudE5hbWUsIGNhbGxiYWNrLCAtMSk7IH1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlcnMgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBleGVjdXRlZCBvbmx5IG9uY2UgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cclxuICogQHJldHVybiB7ZnVuY3Rpb259IC0gQSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgd2lsbCB1bnJlZ2lzdGVyIHRoZSBjYWxsYmFjayBmcm9tIHRoZSBldmVudC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBPbmNlKGV2ZW50TmFtZSwgY2FsbGJhY2spIHsgcmV0dXJuIE9uTXVsdGlwbGUoZXZlbnROYW1lLCBjYWxsYmFjaywgMSk7IH1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzIGNvbGxlY3Rpb24uXHJcbiAqIElmIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudCBhcmUgcmVtb3ZlZCwgdGhlIGV2ZW50IGtleSBpcyBkZWxldGVkIGZyb20gdGhlIGNvbGxlY3Rpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lciAtIFRoZSBsaXN0ZW5lciB0byBiZSByZW1vdmVkLlxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuZXJPZmYobGlzdGVuZXIpIHtcclxuICAgIGNvbnN0IGV2ZW50TmFtZSA9IGxpc3RlbmVyLmV2ZW50TmFtZTtcclxuICAgIGxldCBsaXN0ZW5lcnMgPSBldmVudExpc3RlbmVycy5nZXQoZXZlbnROYW1lKS5maWx0ZXIobCA9PiBsICE9PSBsaXN0ZW5lcik7XHJcbiAgICBpZiAobGlzdGVuZXJzLmxlbmd0aCA9PT0gMCkgZXZlbnRMaXN0ZW5lcnMuZGVsZXRlKGV2ZW50TmFtZSk7XHJcbiAgICBlbHNlIGV2ZW50TGlzdGVuZXJzLnNldChldmVudE5hbWUsIGxpc3RlbmVycyk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGxpc3RlbmVycyBmb3IuXHJcbiAqIEBwYXJhbSB7Li4uc3RyaW5nfSBhZGRpdGlvbmFsRXZlbnROYW1lcyAtIEFkZGl0aW9uYWwgZXZlbnQgbmFtZXMgdG8gcmVtb3ZlIGxpc3RlbmVycyBmb3IuXHJcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBPZmYoZXZlbnROYW1lLCAuLi5hZGRpdGlvbmFsRXZlbnROYW1lcykge1xyXG4gICAgbGV0IGV2ZW50c1RvUmVtb3ZlID0gW2V2ZW50TmFtZSwgLi4uYWRkaXRpb25hbEV2ZW50TmFtZXNdO1xyXG4gICAgZXZlbnRzVG9SZW1vdmUuZm9yRWFjaChldmVudE5hbWUgPT4gZXZlbnRMaXN0ZW5lcnMuZGVsZXRlKGV2ZW50TmFtZSkpO1xyXG59XHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBldmVudCBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBmdW5jdGlvbiBPZmZBbGxcclxuICogQHJldHVybnMge3ZvaWR9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gT2ZmQWxsKCkgeyBldmVudExpc3RlbmVycy5jbGVhcigpOyB9XHJcblxyXG4vKipcclxuICogRW1pdHMgYW4gZXZlbnQgdXNpbmcgdGhlIGdpdmVuIGV2ZW50IG5hbWUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7V2FpbHNFdmVudH0gZXZlbnQgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdC5cclxuICogQHJldHVybnMge2FueX0gLSBUaGUgcmVzdWx0IG9mIHRoZSBlbWl0dGVkIGV2ZW50LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIEVtaXQoZXZlbnQpIHsgcmV0dXJuIGNhbGwoRW1pdE1ldGhvZCwgZXZlbnQpOyB9XHJcbiIsICIvKlxyXG4gX1x0ICAgX19cdCAgXyBfX1xyXG58IHxcdCAvIC9fX18gXyhfKSAvX19fX1xyXG58IHwgL3wgLyAvIF9fIGAvIC8gLyBfX18vXHJcbnwgfC8gfC8gLyAvXy8gLyAvIChfXyAgKVxyXG58X18vfF9fL1xcX18sXy9fL18vX19fXy9cclxuVGhlIGVsZWN0cm9uIGFsdGVybmF0aXZlIGZvciBHb1xyXG4oYykgTGVhIEFudGhvbnkgMjAxOS1wcmVzZW50XHJcbiovXHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA5ICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge09iamVjdH0gT3BlbkZpbGVEaWFsb2dPcHRpb25zXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0NhbkNob29zZURpcmVjdG9yaWVzXSAtIEluZGljYXRlcyBpZiBkaXJlY3RvcmllcyBjYW4gYmUgY2hvc2VuLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtDYW5DaG9vc2VGaWxlc10gLSBJbmRpY2F0ZXMgaWYgZmlsZXMgY2FuIGJlIGNob3Nlbi5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbQ2FuQ3JlYXRlRGlyZWN0b3JpZXNdIC0gSW5kaWNhdGVzIGlmIGRpcmVjdG9yaWVzIGNhbiBiZSBjcmVhdGVkLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtTaG93SGlkZGVuRmlsZXNdIC0gSW5kaWNhdGVzIGlmIGhpZGRlbiBmaWxlcyBzaG91bGQgYmUgc2hvd24uXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW1Jlc29sdmVzQWxpYXNlc10gLSBJbmRpY2F0ZXMgaWYgYWxpYXNlcyBzaG91bGQgYmUgcmVzb2x2ZWQuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0FsbG93c011bHRpcGxlU2VsZWN0aW9uXSAtIEluZGljYXRlcyBpZiBtdWx0aXBsZSBzZWxlY3Rpb24gaXMgYWxsb3dlZC5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbSGlkZUV4dGVuc2lvbl0gLSBJbmRpY2F0ZXMgaWYgdGhlIGV4dGVuc2lvbiBzaG91bGQgYmUgaGlkZGVuLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtDYW5TZWxlY3RIaWRkZW5FeHRlbnNpb25dIC0gSW5kaWNhdGVzIGlmIGhpZGRlbiBleHRlbnNpb25zIGNhbiBiZSBzZWxlY3RlZC5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbVHJlYXRzRmlsZVBhY2thZ2VzQXNEaXJlY3Rvcmllc10gLSBJbmRpY2F0ZXMgaWYgZmlsZSBwYWNrYWdlcyBzaG91bGQgYmUgdHJlYXRlZCBhcyBkaXJlY3Rvcmllcy5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbQWxsb3dzT3RoZXJGaWxldHlwZXNdIC0gSW5kaWNhdGVzIGlmIG90aGVyIGZpbGUgdHlwZXMgYXJlIGFsbG93ZWQuXHJcbiAqIEBwcm9wZXJ0eSB7RmlsZUZpbHRlcltdfSBbRmlsdGVyc10gLSBBcnJheSBvZiBmaWxlIGZpbHRlcnMuXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbVGl0bGVdIC0gVGl0bGUgb2YgdGhlIGRpYWxvZy5cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtNZXNzYWdlXSAtIE1lc3NhZ2UgdG8gc2hvdyBpbiB0aGUgZGlhbG9nLlxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW0J1dHRvblRleHRdIC0gVGV4dCB0byBkaXNwbGF5IG9uIHRoZSBidXR0b24uXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbRGlyZWN0b3J5XSAtIERpcmVjdG9yeSB0byBvcGVuIGluIHRoZSBkaWFsb2cuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0RldGFjaGVkXSAtIEluZGljYXRlcyBpZiB0aGUgZGlhbG9nIHNob3VsZCBhcHBlYXIgZGV0YWNoZWQgZnJvbSB0aGUgbWFpbiB3aW5kb3cuXHJcbiAqL1xyXG5cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTYXZlRmlsZURpYWxvZ09wdGlvbnNcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtGaWxlbmFtZV0gLSBEZWZhdWx0IGZpbGVuYW1lIHRvIHVzZSBpbiB0aGUgZGlhbG9nLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtDYW5DaG9vc2VEaXJlY3Rvcmllc10gLSBJbmRpY2F0ZXMgaWYgZGlyZWN0b3JpZXMgY2FuIGJlIGNob3Nlbi5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbQ2FuQ2hvb3NlRmlsZXNdIC0gSW5kaWNhdGVzIGlmIGZpbGVzIGNhbiBiZSBjaG9zZW4uXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0NhbkNyZWF0ZURpcmVjdG9yaWVzXSAtIEluZGljYXRlcyBpZiBkaXJlY3RvcmllcyBjYW4gYmUgY3JlYXRlZC5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbU2hvd0hpZGRlbkZpbGVzXSAtIEluZGljYXRlcyBpZiBoaWRkZW4gZmlsZXMgc2hvdWxkIGJlIHNob3duLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtSZXNvbHZlc0FsaWFzZXNdIC0gSW5kaWNhdGVzIGlmIGFsaWFzZXMgc2hvdWxkIGJlIHJlc29sdmVkLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtBbGxvd3NNdWx0aXBsZVNlbGVjdGlvbl0gLSBJbmRpY2F0ZXMgaWYgbXVsdGlwbGUgc2VsZWN0aW9uIGlzIGFsbG93ZWQuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0hpZGVFeHRlbnNpb25dIC0gSW5kaWNhdGVzIGlmIHRoZSBleHRlbnNpb24gc2hvdWxkIGJlIGhpZGRlbi5cclxuICogQHByb3BlcnR5IHtib29sZWFufSBbQ2FuU2VsZWN0SGlkZGVuRXh0ZW5zaW9uXSAtIEluZGljYXRlcyBpZiBoaWRkZW4gZXh0ZW5zaW9ucyBjYW4gYmUgc2VsZWN0ZWQuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW1RyZWF0c0ZpbGVQYWNrYWdlc0FzRGlyZWN0b3JpZXNdIC0gSW5kaWNhdGVzIGlmIGZpbGUgcGFja2FnZXMgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgZGlyZWN0b3JpZXMuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0FsbG93c090aGVyRmlsZXR5cGVzXSAtIEluZGljYXRlcyBpZiBvdGhlciBmaWxlIHR5cGVzIGFyZSBhbGxvd2VkLlxyXG4gKiBAcHJvcGVydHkge0ZpbGVGaWx0ZXJbXX0gW0ZpbHRlcnNdIC0gQXJyYXkgb2YgZmlsZSBmaWx0ZXJzLlxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW1RpdGxlXSAtIFRpdGxlIG9mIHRoZSBkaWFsb2cuXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbTWVzc2FnZV0gLSBNZXNzYWdlIHRvIHNob3cgaW4gdGhlIGRpYWxvZy5cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtCdXR0b25UZXh0XSAtIFRleHQgdG8gZGlzcGxheSBvbiB0aGUgYnV0dG9uLlxyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW0RpcmVjdG9yeV0gLSBEaXJlY3RvcnkgdG8gb3BlbiBpbiB0aGUgZGlhbG9nLlxyXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtEZXRhY2hlZF0gLSBJbmRpY2F0ZXMgaWYgdGhlIGRpYWxvZyBzaG91bGQgYXBwZWFyIGRldGFjaGVkIGZyb20gdGhlIG1haW4gd2luZG93LlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBNZXNzYWdlRGlhbG9nT3B0aW9uc1xyXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW1RpdGxlXSAtIFRoZSB0aXRsZSBvZiB0aGUgZGlhbG9nIHdpbmRvdy5cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtNZXNzYWdlXSAtIFRoZSBtYWluIG1lc3NhZ2UgdG8gc2hvdyBpbiB0aGUgZGlhbG9nLlxyXG4gKiBAcHJvcGVydHkge0J1dHRvbltdfSBbQnV0dG9uc10gLSBBcnJheSBvZiBidXR0b24gb3B0aW9ucyB0byBzaG93IGluIHRoZSBkaWFsb2cuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0RldGFjaGVkXSAtIFRydWUgaWYgdGhlIGRpYWxvZyBzaG91bGQgYXBwZWFyIGRldGFjaGVkIGZyb20gdGhlIG1haW4gd2luZG93IChpZiBhcHBsaWNhYmxlKS5cclxuICovXHJcblxyXG4vKipcclxuICogQHR5cGVkZWYge09iamVjdH0gQnV0dG9uXHJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbTGFiZWxdIC0gVGV4dCB0aGF0IGFwcGVhcnMgd2l0aGluIHRoZSBidXR0b24uXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0lzQ2FuY2VsXSAtIFRydWUgaWYgdGhlIGJ1dHRvbiBzaG91bGQgY2FuY2VsIGFuIG9wZXJhdGlvbiB3aGVuIGNsaWNrZWQuXHJcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW0lzRGVmYXVsdF0gLSBUcnVlIGlmIHRoZSBidXR0b24gc2hvdWxkIGJlIHRoZSBkZWZhdWx0IGFjdGlvbiB3aGVuIHRoZSB1c2VyIHByZXNzZXMgZW50ZXIuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZpbGVGaWx0ZXJcclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtEaXNwbGF5TmFtZV0gLSBEaXNwbGF5IG5hbWUgZm9yIHRoZSBmaWx0ZXIsIGl0IGNvdWxkIGJlIFwiVGV4dCBGaWxlc1wiLCBcIkltYWdlc1wiIGV0Yy5cclxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtQYXR0ZXJuXSAtIFBhdHRlcm4gdG8gbWF0Y2ggZm9yIHRoZSBmaWx0ZXIsIGUuZy4gXCIqLnR4dDsqLm1kXCIgZm9yIHRleHQgbWFya2Rvd24gZmlsZXMuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHtuZXdSdW50aW1lQ2FsbGVyV2l0aElELCBvYmplY3ROYW1lc30gZnJvbSBcIi4vcnVudGltZVwiO1xyXG5cclxuaW1wb3J0IHsgbmFub2lkIH0gZnJvbSAnbmFub2lkL25vbi1zZWN1cmUnO1xyXG5cclxuLy8gRGVmaW5lIGNvbnN0YW50cyBmcm9tIHRoZSBgbWV0aG9kc2Agb2JqZWN0IGluIFRpdGxlIENhc2VcclxuY29uc3QgRGlhbG9nSW5mbyA9IDA7XHJcbmNvbnN0IERpYWxvZ1dhcm5pbmcgPSAxO1xyXG5jb25zdCBEaWFsb2dFcnJvciA9IDI7XHJcbmNvbnN0IERpYWxvZ1F1ZXN0aW9uID0gMztcclxuY29uc3QgRGlhbG9nT3BlbkZpbGUgPSA0O1xyXG5jb25zdCBEaWFsb2dTYXZlRmlsZSA9IDU7XHJcblxyXG5jb25zdCBjYWxsID0gbmV3UnVudGltZUNhbGxlcldpdGhJRChvYmplY3ROYW1lcy5EaWFsb2csICcnKTtcclxuY29uc3QgZGlhbG9nUmVzcG9uc2VzID0gbmV3IE1hcCgpO1xyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyBhIHVuaXF1ZSBpZCB0aGF0IGlzIG5vdCBwcmVzZW50IGluIGRpYWxvZ1Jlc3BvbnNlcy5cclxuICogQHJldHVybnMge3N0cmluZ30gdW5pcXVlIGlkXHJcbiAqL1xyXG5mdW5jdGlvbiBnZW5lcmF0ZUlEKCkge1xyXG4gICAgbGV0IHJlc3VsdDtcclxuICAgIGRvIHtcclxuICAgICAgICByZXN1bHQgPSBuYW5vaWQoKTtcclxuICAgIH0gd2hpbGUgKGRpYWxvZ1Jlc3BvbnNlcy5oYXMocmVzdWx0KSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2hvd3MgYSBkaWFsb2cgb2Ygc3BlY2lmaWVkIHR5cGUgd2l0aCB0aGUgZ2l2ZW4gb3B0aW9ucy5cclxuICogQHBhcmFtIHtudW1iZXJ9IHR5cGUgLSB0eXBlIG9mIGRpYWxvZ1xyXG4gKiBAcGFyYW0ge01lc3NhZ2VEaWFsb2dPcHRpb25zfE9wZW5GaWxlRGlhbG9nT3B0aW9uc3xTYXZlRmlsZURpYWxvZ09wdGlvbnN9IG9wdGlvbnMgLSBvcHRpb25zIGZvciB0aGUgZGlhbG9nXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCByZXN1bHQgb2YgZGlhbG9nXHJcbiAqL1xyXG5mdW5jdGlvbiBkaWFsb2codHlwZSwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBjb25zdCBpZCA9IGdlbmVyYXRlSUQoKTtcclxuICAgIG9wdGlvbnNbXCJkaWFsb2ctaWRcIl0gPSBpZDtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgZGlhbG9nUmVzcG9uc2VzLnNldChpZCwge3Jlc29sdmUsIHJlamVjdH0pO1xyXG4gICAgICAgIGNhbGwodHlwZSwgb3B0aW9ucykuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3BvbnNlcy5kZWxldGUoaWQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbndpbmRvdy5fd2FpbHMgPSB3aW5kb3cuX3dhaWxzIHx8IHt9O1xyXG53aW5kb3cuX3dhaWxzLmRpYWxvZ0Vycm9yQ2FsbGJhY2sgPSBkaWFsb2dFcnJvckNhbGxiYWNrO1xyXG53aW5kb3cuX3dhaWxzLmRpYWxvZ1Jlc3VsdENhbGxiYWNrID0gZGlhbG9nUmVzdWx0Q2FsbGJhY2s7XHJcblxyXG4vKipcclxuICogSGFuZGxlcyB0aGUgY2FsbGJhY2sgZnJvbSBhIGRpYWxvZy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIC0gVGhlIElEIG9mIHRoZSBkaWFsb2cgcmVzcG9uc2UuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhIC0gVGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSB0aGUgZGlhbG9nLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzSlNPTiAtIEZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBkYXRhIGlzIGluIEpTT04gZm9ybWF0LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBkaWFsb2dSZXN1bHRDYWxsYmFjayhpZCwgZGF0YSwgaXNKU09OKSB7XHJcbiAgICBsZXQgcCA9IGRpYWxvZ1Jlc3BvbnNlcy5nZXQoaWQpO1xyXG4gICAgaWYgKHApIHtcclxuICAgICAgICBpZiAoaXNKU09OKSB7XHJcbiAgICAgICAgICAgIHAucmVzb2x2ZShKU09OLnBhcnNlKGRhdGEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwLnJlc29sdmUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpYWxvZ1Jlc3BvbnNlcy5kZWxldGUoaWQpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2FsbGJhY2sgZnVuY3Rpb24gZm9yIGhhbmRsaW5nIGVycm9ycyBpbiBkaWFsb2cuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCAtIFRoZSBpZCBvZiB0aGUgZGlhbG9nIHJlc3BvbnNlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIFRoZSBlcnJvciBtZXNzYWdlLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt2b2lkfVxyXG4gKi9cclxuZnVuY3Rpb24gZGlhbG9nRXJyb3JDYWxsYmFjayhpZCwgbWVzc2FnZSkge1xyXG4gICAgbGV0IHAgPSBkaWFsb2dSZXNwb25zZXMuZ2V0KGlkKTtcclxuICAgIGlmIChwKSB7XHJcbiAgICAgICAgcC5yZWplY3QobWVzc2FnZSk7XHJcbiAgICAgICAgZGlhbG9nUmVzcG9uc2VzLmRlbGV0ZShpZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vLyBSZXBsYWNlIGBtZXRob2RzYCB3aXRoIGNvbnN0YW50cyBpbiBUaXRsZSBDYXNlXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtNZXNzYWdlRGlhbG9nT3B0aW9uc30gb3B0aW9ucyAtIERpYWxvZyBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59IC0gVGhlIGxhYmVsIG9mIHRoZSBidXR0b24gcHJlc3NlZFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IEluZm8gPSAob3B0aW9ucykgPT4gZGlhbG9nKERpYWxvZ0luZm8sIG9wdGlvbnMpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7TWVzc2FnZURpYWxvZ09wdGlvbnN9IG9wdGlvbnMgLSBEaWFsb2cgb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fSAtIFRoZSBsYWJlbCBvZiB0aGUgYnV0dG9uIHByZXNzZWRcclxuICovXHJcbmV4cG9ydCBjb25zdCBXYXJuaW5nID0gKG9wdGlvbnMpID0+IGRpYWxvZyhEaWFsb2dXYXJuaW5nLCBvcHRpb25zKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge01lc3NhZ2VEaWFsb2dPcHRpb25zfSBvcHRpb25zIC0gRGlhbG9nIG9wdGlvbnNcclxuICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nPn0gLSBUaGUgbGFiZWwgb2YgdGhlIGJ1dHRvbiBwcmVzc2VkXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgRXJyb3IgPSAob3B0aW9ucykgPT4gZGlhbG9nKERpYWxvZ0Vycm9yLCBvcHRpb25zKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge01lc3NhZ2VEaWFsb2dPcHRpb25zfSBvcHRpb25zIC0gRGlhbG9nIG9wdGlvbnNcclxuICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nPn0gLSBUaGUgbGFiZWwgb2YgdGhlIGJ1dHRvbiBwcmVzc2VkXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgUXVlc3Rpb24gPSAob3B0aW9ucykgPT4gZGlhbG9nKERpYWxvZ1F1ZXN0aW9uLCBvcHRpb25zKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge09wZW5GaWxlRGlhbG9nT3B0aW9uc30gb3B0aW9ucyAtIERpYWxvZyBvcHRpb25zXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZ1tdfHN0cmluZz59IFJldHVybnMgc2VsZWN0ZWQgZmlsZSBvciBsaXN0IG9mIGZpbGVzLiBSZXR1cm5zIGJsYW5rIHN0cmluZyBpZiBubyBmaWxlIGlzIHNlbGVjdGVkLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IE9wZW5GaWxlID0gKG9wdGlvbnMpID0+IGRpYWxvZyhEaWFsb2dPcGVuRmlsZSwgb3B0aW9ucyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtTYXZlRmlsZURpYWxvZ09wdGlvbnN9IG9wdGlvbnMgLSBEaWFsb2cgb3B0aW9uc1xyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmc+fSBSZXR1cm5zIHRoZSBzZWxlY3RlZCBmaWxlLiBSZXR1cm5zIGJsYW5rIHN0cmluZyBpZiBubyBmaWxlIGlzIHNlbGVjdGVkLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFNhdmVGaWxlID0gKG9wdGlvbnMpID0+IGRpYWxvZyhEaWFsb2dTYXZlRmlsZSwgb3B0aW9ucyk7XHJcbiIsICIvKlxyXG4gX1x0ICAgX19cdCAgXyBfX1xyXG58IHxcdCAvIC9fX18gXyhfKSAvX19fX1xyXG58IHwgL3wgLyAvIF9fIGAvIC8gLyBfX18vXHJcbnwgfC8gfC8gLyAvXy8gLyAvIChfXyAgKVxyXG58X18vfF9fL1xcX18sXy9fL18vX19fXy9cclxuVGhlIGVsZWN0cm9uIGFsdGVybmF0aXZlIGZvciBHb1xyXG4oYykgTGVhIEFudGhvbnkgMjAxOS1wcmVzZW50XHJcbiovXHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA5ICovXHJcblxyXG4vLyBJbXBvcnQgc2NyZWVuIGpzZG9jIGRlZmluaXRpb24gZnJvbSAuL3NjcmVlbnMuanNcclxuLyoqXHJcbiAqIEB0eXBlZGVmIHtpbXBvcnQoXCIuL3NjcmVlbnNcIikuU2NyZWVufSBTY3JlZW5cclxuICovXHJcblxyXG5pbXBvcnQge25ld1J1bnRpbWVDYWxsZXJXaXRoSUQsIG9iamVjdE5hbWVzfSBmcm9tIFwiLi9ydW50aW1lXCI7XHJcblxyXG5jb25zdCBjZW50ZXIgPSAwO1xyXG5jb25zdCBzZXRUaXRsZSA9IDE7XHJcbmNvbnN0IGZ1bGxzY3JlZW4gPSAyO1xyXG5jb25zdCB1bkZ1bGxzY3JlZW4gPSAzO1xyXG5jb25zdCBzZXRTaXplID0gNDtcclxuY29uc3Qgc2l6ZSA9IDU7XHJcbmNvbnN0IHNldE1heFNpemUgPSA2O1xyXG5jb25zdCBzZXRNaW5TaXplID0gNztcclxuY29uc3Qgc2V0QWx3YXlzT25Ub3AgPSA4O1xyXG5jb25zdCBzZXRSZWxhdGl2ZVBvc2l0aW9uID0gOTtcclxuY29uc3QgcmVsYXRpdmVQb3NpdGlvbiA9IDEwO1xyXG5jb25zdCBzY3JlZW4gPSAxMTtcclxuY29uc3QgaGlkZSA9IDEyO1xyXG5jb25zdCBtYXhpbWlzZSA9IDEzO1xyXG5jb25zdCB1bk1heGltaXNlID0gMTQ7XHJcbmNvbnN0IHRvZ2dsZU1heGltaXNlID0gMTU7XHJcbmNvbnN0IG1pbmltaXNlID0gMTY7XHJcbmNvbnN0IHVuTWluaW1pc2UgPSAxNztcclxuY29uc3QgcmVzdG9yZSA9IDE4O1xyXG5jb25zdCBzaG93ID0gMTk7XHJcbmNvbnN0IGNsb3NlID0gMjA7XHJcbmNvbnN0IHNldEJhY2tncm91bmRDb2xvdXIgPSAyMTtcclxuY29uc3Qgc2V0UmVzaXphYmxlID0gMjI7XHJcbmNvbnN0IHdpZHRoID0gMjM7XHJcbmNvbnN0IGhlaWdodCA9IDI0O1xyXG5jb25zdCB6b29tSW4gPSAyNTtcclxuY29uc3Qgem9vbU91dCA9IDI2O1xyXG5jb25zdCB6b29tUmVzZXQgPSAyNztcclxuY29uc3QgZ2V0Wm9vbUxldmVsID0gMjg7XHJcbmNvbnN0IHNldFpvb21MZXZlbCA9IDI5O1xyXG5cclxuY29uc3QgdGhpc1dpbmRvdyA9IEdldCgnJyk7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXaW5kb3coY2FsbCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBHZXQ6ICh3aW5kb3dOYW1lKSA9PiBjcmVhdGVXaW5kb3cobmV3UnVudGltZUNhbGxlcldpdGhJRChvYmplY3ROYW1lcy5XaW5kb3csIHdpbmRvd05hbWUpKSxcclxuICAgICAgICBDZW50ZXI6ICgpID0+IGNhbGwoY2VudGVyKSxcclxuICAgICAgICBTZXRUaXRsZTogKHRpdGxlKSA9PiBjYWxsKHNldFRpdGxlLCB7dGl0bGV9KSxcclxuICAgICAgICBGdWxsc2NyZWVuOiAoKSA9PiBjYWxsKGZ1bGxzY3JlZW4pLFxyXG4gICAgICAgIFVuRnVsbHNjcmVlbjogKCkgPT4gY2FsbCh1bkZ1bGxzY3JlZW4pLFxyXG4gICAgICAgIFNldFNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBjYWxsKHNldFNpemUsIHt3aWR0aCwgaGVpZ2h0fSksXHJcbiAgICAgICAgU2l6ZTogKCkgPT4gY2FsbChzaXplKSxcclxuICAgICAgICBTZXRNYXhTaXplOiAod2lkdGgsIGhlaWdodCkgPT4gY2FsbChzZXRNYXhTaXplLCB7d2lkdGgsIGhlaWdodH0pLFxyXG4gICAgICAgIFNldE1pblNpemU6ICh3aWR0aCwgaGVpZ2h0KSA9PiBjYWxsKHNldE1pblNpemUsIHt3aWR0aCwgaGVpZ2h0fSksXHJcbiAgICAgICAgU2V0QWx3YXlzT25Ub3A6IChvblRvcCkgPT4gY2FsbChzZXRBbHdheXNPblRvcCwge2Fsd2F5c09uVG9wOiBvblRvcH0pLFxyXG4gICAgICAgIFNldFJlbGF0aXZlUG9zaXRpb246ICh4LCB5KSA9PiBjYWxsKHNldFJlbGF0aXZlUG9zaXRpb24sIHt4LCB5fSksXHJcbiAgICAgICAgUmVsYXRpdmVQb3NpdGlvbjogKCkgPT4gY2FsbChyZWxhdGl2ZVBvc2l0aW9uKSxcclxuICAgICAgICBTY3JlZW46ICgpID0+IGNhbGwoc2NyZWVuKSxcclxuICAgICAgICBIaWRlOiAoKSA9PiBjYWxsKGhpZGUpLFxyXG4gICAgICAgIE1heGltaXNlOiAoKSA9PiBjYWxsKG1heGltaXNlKSxcclxuICAgICAgICBVbk1heGltaXNlOiAoKSA9PiBjYWxsKHVuTWF4aW1pc2UpLFxyXG4gICAgICAgIFRvZ2dsZU1heGltaXNlOiAoKSA9PiBjYWxsKHRvZ2dsZU1heGltaXNlKSxcclxuICAgICAgICBNaW5pbWlzZTogKCkgPT4gY2FsbChtaW5pbWlzZSksXHJcbiAgICAgICAgVW5NaW5pbWlzZTogKCkgPT4gY2FsbCh1bk1pbmltaXNlKSxcclxuICAgICAgICBSZXN0b3JlOiAoKSA9PiBjYWxsKHJlc3RvcmUpLFxyXG4gICAgICAgIFNob3c6ICgpID0+IGNhbGwoc2hvdyksXHJcbiAgICAgICAgQ2xvc2U6ICgpID0+IGNhbGwoY2xvc2UpLFxyXG4gICAgICAgIFNldEJhY2tncm91bmRDb2xvdXI6IChyLCBnLCBiLCBhKSA9PiBjYWxsKHNldEJhY2tncm91bmRDb2xvdXIsIHtyLCBnLCBiLCBhfSksXHJcbiAgICAgICAgU2V0UmVzaXphYmxlOiAocmVzaXphYmxlKSA9PiBjYWxsKHNldFJlc2l6YWJsZSwge3Jlc2l6YWJsZX0pLFxyXG4gICAgICAgIFdpZHRoOiAoKSA9PiBjYWxsKHdpZHRoKSxcclxuICAgICAgICBIZWlnaHQ6ICgpID0+IGNhbGwoaGVpZ2h0KSxcclxuICAgICAgICBab29tSW46ICgpID0+IGNhbGwoem9vbUluKSxcclxuICAgICAgICBab29tT3V0OiAoKSA9PiBjYWxsKHpvb21PdXQpLFxyXG4gICAgICAgIFpvb21SZXNldDogKCkgPT4gY2FsbCh6b29tUmVzZXQpLFxyXG4gICAgICAgIEdldFpvb21MZXZlbDogKCkgPT4gY2FsbChnZXRab29tTGV2ZWwpLFxyXG4gICAgICAgIFNldFpvb21MZXZlbDogKHpvb21MZXZlbCkgPT4gY2FsbChzZXRab29tTGV2ZWwsIHt6b29tTGV2ZWx9KSxcclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBzcGVjaWZpZWQgd2luZG93LlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gd2luZG93TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB3aW5kb3cgdG8gZ2V0LlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IC0gVGhlIHNwZWNpZmllZCB3aW5kb3cgb2JqZWN0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIEdldCh3aW5kb3dOYW1lKSB7XHJcbiAgICByZXR1cm4gY3JlYXRlV2luZG93KG5ld1J1bnRpbWVDYWxsZXJXaXRoSUQob2JqZWN0TmFtZXMuV2luZG93LCB3aW5kb3dOYW1lKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDZW50ZXJzIHRoZSB3aW5kb3cgb24gdGhlIHNjcmVlbi5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBDZW50ZXIoKSB7XHJcbiAgICB0aGlzV2luZG93LkNlbnRlcigpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgdGl0bGUgb2YgdGhlIHdpbmRvdy5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRpdGxlIC0gVGhlIHRpdGxlIHRvIHNldC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBTZXRUaXRsZSh0aXRsZSkge1xyXG4gICAgdGhpc1dpbmRvdy5TZXRUaXRsZSh0aXRsZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSB3aW5kb3cgdG8gZnVsbHNjcmVlbi5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBGdWxsc2NyZWVuKCkge1xyXG4gICAgdGhpc1dpbmRvdy5GdWxsc2NyZWVuKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBzaXplIG9mIHRoZSB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgd2luZG93LlxyXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFNldFNpemUod2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpc1dpbmRvdy5TZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFNpemUoKSB7XHJcbiAgICByZXR1cm4gdGhpc1dpbmRvdy5TaXplKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBtYXhpbXVtIHNpemUgb2YgdGhlIHdpbmRvdy5cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIG1heGltdW0gd2lkdGggb2YgdGhlIHdpbmRvdy5cclxuICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFNldE1heFNpemUod2lkdGgsIGhlaWdodCkge1xyXG4gICAgdGhpc1dpbmRvdy5TZXRNYXhTaXplKHdpZHRoLCBoZWlnaHQpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgbWluaW11bSBzaXplIG9mIHRoZSB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSBtaW5pbXVtIHdpZHRoIG9mIHRoZSB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgbWluaW11bSBoZWlnaHQgb2YgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBTZXRNaW5TaXplKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHRoaXNXaW5kb3cuU2V0TWluU2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHdpbmRvdyB0byBhbHdheXMgYmUgb24gdG9wLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9uVG9wIC0gV2hldGhlciB0aGUgd2luZG93IHNob3VsZCBhbHdheXMgYmUgb24gdG9wLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFNldEFsd2F5c09uVG9wKG9uVG9wKSB7XHJcbiAgICB0aGlzV2luZG93LlNldEFsd2F5c09uVG9wKG9uVG9wKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHJlbGF0aXZlIHBvc2l0aW9uIG9mIHRoZSB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgd2luZG93J3MgcG9zaXRpb24uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgd2luZG93J3MgcG9zaXRpb24uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gU2V0UmVsYXRpdmVQb3NpdGlvbih4LCB5KSB7XHJcbiAgICB0aGlzV2luZG93LlNldFJlbGF0aXZlUG9zaXRpb24oeCwgeSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSByZWxhdGl2ZSBwb3NpdGlvbiBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFJlbGF0aXZlUG9zaXRpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpc1dpbmRvdy5SZWxhdGl2ZVBvc2l0aW9uKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBzY3JlZW4gdGhhdCB0aGUgd2luZG93IGlzIG9uLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFNjcmVlbigpIHtcclxuICAgIHJldHVybiB0aGlzV2luZG93LlNjcmVlbigpO1xyXG59XHJcblxyXG4vKipcclxuICogSGlkZXMgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBIaWRlKCkge1xyXG4gICAgdGhpc1dpbmRvdy5IaWRlKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNYXhpbWlzZXMgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBNYXhpbWlzZSgpIHtcclxuICAgIHRoaXNXaW5kb3cuTWF4aW1pc2UoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFVuLW1heGltaXNlcyB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFVuTWF4aW1pc2UoKSB7XHJcbiAgICB0aGlzV2luZG93LlVuTWF4aW1pc2UoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZXMgdGhlIG1heGltaXNhdGlvbiBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFRvZ2dsZU1heGltaXNlKCkge1xyXG4gICAgdGhpc1dpbmRvdy5Ub2dnbGVNYXhpbWlzZSgpO1xyXG59XHJcblxyXG4vKipcclxuICogTWluaW1pc2VzIHRoZSB3aW5kb3cuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gTWluaW1pc2UoKSB7XHJcbiAgICB0aGlzV2luZG93Lk1pbmltaXNlKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVbi1taW5pbWlzZXMgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBVbk1pbmltaXNlKCkge1xyXG4gICAgdGhpc1dpbmRvdy5Vbk1pbmltaXNlKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXN0b3JlcyB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFJlc3RvcmUoKSB7XHJcbiAgICB0aGlzV2luZG93LlJlc3RvcmUoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNob3dzIHRoZSB3aW5kb3cuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gU2hvdygpIHtcclxuICAgIHRoaXNXaW5kb3cuU2hvdygpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2xvc2VzIHRoZSB3aW5kb3cuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gQ2xvc2UoKSB7XHJcbiAgICB0aGlzV2luZG93LkNsb3NlKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSBiYWNrZ3JvdW5kIGNvbG91ciBvZiB0aGUgd2luZG93LlxyXG4gKiBAcGFyYW0ge251bWJlcn0gciAtIFRoZSByZWQgY29tcG9uZW50IG9mIHRoZSBjb2xvdXIuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBnIC0gVGhlIGdyZWVuIGNvbXBvbmVudCBvZiB0aGUgY29sb3VyLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYiAtIFRoZSBibHVlIGNvbXBvbmVudCBvZiB0aGUgY29sb3VyLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYSAtIFRoZSBhbHBoYSBjb21wb25lbnQgb2YgdGhlIGNvbG91ci5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBTZXRCYWNrZ3JvdW5kQ29sb3VyKHIsIGcsIGIsIGEpIHtcclxuICAgIHRoaXNXaW5kb3cuU2V0QmFja2dyb3VuZENvbG91cihyLCBnLCBiLCBhKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHMgd2hldGhlciB0aGUgd2luZG93IGlzIHJlc2l6YWJsZS5cclxuICogQHBhcmFtIHtib29sZWFufSByZXNpemFibGUgLSBXaGV0aGVyIHRoZSB3aW5kb3cgc2hvdWxkIGJlIHJlc2l6YWJsZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBTZXRSZXNpemFibGUocmVzaXphYmxlKSB7XHJcbiAgICB0aGlzV2luZG93LlNldFJlc2l6YWJsZShyZXNpemFibGUpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgd2lkdGggb2YgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBXaWR0aCgpIHtcclxuICAgIHJldHVybiB0aGlzV2luZG93LldpZHRoKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBoZWlnaHQgb2YgdGhlIHdpbmRvdy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBIZWlnaHQoKSB7XHJcbiAgICByZXR1cm4gdGhpc1dpbmRvdy5IZWlnaHQoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFpvb21zIGluIHRoZSB3aW5kb3cuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gWm9vbUluKCkge1xyXG4gICAgdGhpc1dpbmRvdy5ab29tSW4oKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFpvb21zIG91dCB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFpvb21PdXQoKSB7XHJcbiAgICB0aGlzV2luZG93Llpvb21PdXQoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc2V0cyB0aGUgem9vbSBvZiB0aGUgd2luZG93LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFpvb21SZXNldCgpIHtcclxuICAgIHRoaXNXaW5kb3cuWm9vbVJlc2V0KCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSB6b29tIGxldmVsIG9mIHRoZSB3aW5kb3cuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gR2V0Wm9vbUxldmVsKCkge1xyXG4gICAgcmV0dXJuIHRoaXNXaW5kb3cuR2V0Wm9vbUxldmVsKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIHRoZSB6b29tIGxldmVsIG9mIHRoZSB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB6b29tTGV2ZWwgLSBUaGUgem9vbSBsZXZlbCB0byBzZXQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gU2V0Wm9vbUxldmVsKHpvb21MZXZlbCkge1xyXG4gICAgdGhpc1dpbmRvdy5TZXRab29tTGV2ZWwoem9vbUxldmVsKTtcclxufVxyXG4iLCAiLypcclxuIF9cdCAgIF9fXHQgIF8gX19cclxufCB8XHQgLyAvX19fIF8oXykgL19fX19cclxufCB8IC98IC8gLyBfXyBgLyAvIC8gX19fL1xyXG58IHwvIHwvIC8gL18vIC8gLyAoX18gIClcclxufF9fL3xfXy9cXF9fLF8vXy9fL19fX18vXHJcblRoZSBlbGVjdHJvbiBhbHRlcm5hdGl2ZSBmb3IgR29cclxuKGMpIExlYSBBbnRob255IDIwMTktcHJlc2VudFxyXG4qL1xyXG5cclxuLyoganNoaW50IGVzdmVyc2lvbjogOSAqL1xyXG5pbXBvcnQge25ld1J1bnRpbWVDYWxsZXJXaXRoSUQsIG9iamVjdE5hbWVzfSBmcm9tIFwiLi9ydW50aW1lXCI7XHJcblxyXG5jb25zdCBjYWxsID0gbmV3UnVudGltZUNhbGxlcldpdGhJRChvYmplY3ROYW1lcy5Ccm93c2VyLCAnJyk7XHJcbmNvbnN0IEJyb3dzZXJPcGVuVVJMID0gMDtcclxuXHJcbi8qKlxyXG4gKiBPcGVuIGEgYnJvd3NlciB3aW5kb3cgdG8gdGhlIGdpdmVuIFVSTFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIFVSTCB0byBvcGVuXHJcbiAqIEByZXR1cm5zIHtQcm9taXNlPHN0cmluZz59XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gT3BlblVSTCh1cmwpIHtcclxuICAgIHJldHVybiBjYWxsKEJyb3dzZXJPcGVuVVJMLCB7dXJsfSk7XHJcbn1cclxuIiwgIi8qKlxuICogTG9ncyBhIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgd2l0aCBjdXN0b20gZm9ybWF0dGluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gYmUgbG9nZ2VkLlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnTG9nKG1lc3NhZ2UpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgJyVjIHdhaWxzMyAlYyAnICsgbWVzc2FnZSArICcgJyxcbiAgICAgICAgJ2JhY2tncm91bmQ6ICNhYTAwMDA7IGNvbG9yOiAjZmZmOyBib3JkZXItcmFkaXVzOiAzcHggMHB4IDBweCAzcHg7IHBhZGRpbmc6IDFweDsgZm9udC1zaXplOiAwLjdyZW0nLFxuICAgICAgICAnYmFja2dyb3VuZDogIzAwOTkwMDsgY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDBweCAzcHggM3B4IDBweDsgcGFkZGluZzogMXB4OyBmb250LXNpemU6IDAuN3JlbSdcbiAgICApO1xufSIsICJcclxuaW1wb3J0IHtFbWl0LCBXYWlsc0V2ZW50fSBmcm9tIFwiLi9ldmVudHNcIjtcclxuaW1wb3J0IHtRdWVzdGlvbn0gZnJvbSBcIi4vZGlhbG9nc1wiO1xyXG5pbXBvcnQge0dldH0gZnJvbSBcIi4vd2luZG93XCI7XHJcbmltcG9ydCB7T3BlblVSTH0gZnJvbSBcIi4vYnJvd3NlclwiO1xyXG5pbXBvcnQge2RlYnVnTG9nfSBmcm9tIFwiLi9sb2dcIjtcclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhbiBldmVudCB3aXRoIHRoZSBnaXZlbiBuYW1lIGFuZCBvcHRpb25hbCBkYXRhLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHNlbmQuXHJcbiAqIEBwYXJhbSB7YW55fSBbZGF0YT1udWxsXSAtIE9wdGlvbmFsIGRhdGEgdG8gc2VuZCBhbG9uZyB3aXRoIHRoZSBldmVudC5cclxuICpcclxuICogQHJldHVybiB7dm9pZH1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmRFdmVudChldmVudE5hbWUsIGRhdGE9bnVsbCkge1xyXG4gICAgbGV0IGV2ZW50ID0gbmV3IFdhaWxzRXZlbnQoZXZlbnROYW1lLCBkYXRhKTtcclxuICAgIEVtaXQoZXZlbnQpO1xyXG59XHJcblxyXG4vKipcclxuICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gZWxlbWVudHMgd2l0aCBgd21sLWV2ZW50YCBhdHRyaWJ1dGUuXHJcbiAqXHJcbiAqIEByZXR1cm4ge3ZvaWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRXTUxFdmVudExpc3RlbmVycygpIHtcclxuICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3dtbC1ldmVudF0nKTtcclxuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBldmVudFR5cGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLWV2ZW50Jyk7XHJcbiAgICAgICAgY29uc3QgY29uZmlybSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd3bWwtY29uZmlybScpO1xyXG4gICAgICAgIGNvbnN0IHRyaWdnZXIgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLXRyaWdnZXInKSB8fCBcImNsaWNrXCI7XHJcblxyXG4gICAgICAgIGxldCBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKGNvbmZpcm0pIHtcclxuICAgICAgICAgICAgICAgIFF1ZXN0aW9uKHtUaXRsZTogXCJDb25maXJtXCIsIE1lc3NhZ2U6Y29uZmlybSwgRGV0YWNoZWQ6IGZhbHNlLCBCdXR0b25zOlt7TGFiZWw6XCJZZXNcIn0se0xhYmVsOlwiTm9cIiwgSXNEZWZhdWx0OnRydWV9XX0pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IFwiTm9cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kRXZlbnQoZXZlbnRUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZW5kRXZlbnQoZXZlbnRUeXBlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgZXhpc3RpbmcgbGlzdGVuZXJzXHJcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHRyaWdnZXIsIGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIG5ldyBsaXN0ZW5lclxyXG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0cmlnZ2VyLCBjYWxsYmFjayk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDYWxscyBhIG1ldGhvZCBvbiBhIHNwZWNpZmllZCB3aW5kb3cuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB3aW5kb3dOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHdpbmRvdyB0byBjYWxsIHRoZSBtZXRob2Qgb24uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWxsV2luZG93TWV0aG9kKHdpbmRvd05hbWUsIG1ldGhvZCkge1xyXG4gICAgbGV0IHRhcmdldFdpbmRvdyA9IEdldCh3aW5kb3dOYW1lKTtcclxuICAgIGxldCBtZXRob2RNYXAgPSBXaW5kb3dNZXRob2RzKHRhcmdldFdpbmRvdyk7XHJcbiAgICBpZiAoIW1ldGhvZE1hcC5oYXMobWV0aG9kKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiV2luZG93IG1ldGhvZCBcIiArIG1ldGhvZCArIFwiIG5vdCBmb3VuZFwiKTtcclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgICAgbWV0aG9kTWFwLmdldChtZXRob2QpKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgd2luZG93IG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIic6IFwiICsgZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBBZGRzIHdpbmRvdyBsaXN0ZW5lcnMgZm9yIGVsZW1lbnRzIHdpdGggdGhlICd3bWwtd2luZG93JyBhdHRyaWJ1dGUuXHJcbiAqIFJlbW92ZXMgYW55IGV4aXN0aW5nIGxpc3RlbmVycyBiZWZvcmUgYWRkaW5nIG5ldyBvbmVzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt2b2lkfVxyXG4gKi9cclxuZnVuY3Rpb24gYWRkV01MV2luZG93TGlzdGVuZXJzKCkge1xyXG4gICAgY29uc3QgZWxlbWVudHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbd21sLXdpbmRvd10nKTtcclxuICAgIGVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCB3aW5kb3dNZXRob2QgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLXdpbmRvdycpO1xyXG4gICAgICAgIGNvbnN0IGNvbmZpcm0gPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLWNvbmZpcm0nKTtcclxuICAgICAgICBjb25zdCB0cmlnZ2VyID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3dtbC10cmlnZ2VyJykgfHwgJ2NsaWNrJztcclxuICAgICAgICBjb25zdCB0YXJnZXRXaW5kb3cgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLXRhcmdldC13aW5kb3cnKSB8fCAnJztcclxuXHJcbiAgICAgICAgbGV0IGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoY29uZmlybSkge1xyXG4gICAgICAgICAgICAgICAgUXVlc3Rpb24oe1RpdGxlOiBcIkNvbmZpcm1cIiwgTWVzc2FnZTpjb25maXJtLCBCdXR0b25zOlt7TGFiZWw6XCJZZXNcIn0se0xhYmVsOlwiTm9cIiwgSXNEZWZhdWx0OnRydWV9XX0pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IFwiTm9cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsV2luZG93TWV0aG9kKHRhcmdldFdpbmRvdywgd2luZG93TWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYWxsV2luZG93TWV0aG9kKHRhcmdldFdpbmRvdywgd2luZG93TWV0aG9kKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgZXhpc3RpbmcgbGlzdGVuZXJzXHJcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHRyaWdnZXIsIGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIG5ldyBsaXN0ZW5lclxyXG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0cmlnZ2VyLCBjYWxsYmFjayk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBsaXN0ZW5lciB0byBlbGVtZW50cyB3aXRoIHRoZSAnd21sLW9wZW51cmwnIGF0dHJpYnV0ZS5cclxuICogV2hlbiB0aGUgc3BlY2lmaWVkIHRyaWdnZXIgZXZlbnQgaXMgZmlyZWQgb24gYW55IG9mIHRoZXNlIGVsZW1lbnRzLFxyXG4gKiB0aGUgbGlzdGVuZXIgd2lsbCBvcGVuIHRoZSBVUkwgc3BlY2lmaWVkIGJ5IHRoZSAnd21sLW9wZW51cmwnIGF0dHJpYnV0ZS5cclxuICogSWYgYSAnd21sLWNvbmZpcm0nIGF0dHJpYnV0ZSBpcyBwcm92aWRlZCwgYSBjb25maXJtYXRpb24gZGlhbG9nIHdpbGwgYmUgZGlzcGxheWVkLFxyXG4gKiBhbmQgdGhlIFVSTCB3aWxsIG9ubHkgYmUgb3BlbmVkIGlmIHRoZSB1c2VyIGNvbmZpcm1zLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt2b2lkfVxyXG4gKi9cclxuZnVuY3Rpb24gYWRkV01MT3BlbkJyb3dzZXJMaXN0ZW5lcigpIHtcclxuICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3dtbC1vcGVudXJsXScpO1xyXG4gICAgZWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd3bWwtb3BlbnVybCcpO1xyXG4gICAgICAgIGNvbnN0IGNvbmZpcm0gPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnd21sLWNvbmZpcm0nKTtcclxuICAgICAgICBjb25zdCB0cmlnZ2VyID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3dtbC10cmlnZ2VyJykgfHwgXCJjbGlja1wiO1xyXG5cclxuICAgICAgICBsZXQgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChjb25maXJtKSB7XHJcbiAgICAgICAgICAgICAgICBRdWVzdGlvbih7VGl0bGU6IFwiQ29uZmlybVwiLCBNZXNzYWdlOmNvbmZpcm0sIEJ1dHRvbnM6W3tMYWJlbDpcIlllc1wifSx7TGFiZWw6XCJOb1wiLCBJc0RlZmF1bHQ6dHJ1ZX1dfSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gXCJOb1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZvaWQgT3BlblVSTCh1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZvaWQgT3BlblVSTCh1cmwpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBleGlzdGluZyBsaXN0ZW5lcnNcclxuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodHJpZ2dlciwgY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAvLyBBZGQgbmV3IGxpc3RlbmVyXHJcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRyaWdnZXIsIGNhbGxiYWNrKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVsb2FkcyB0aGUgV01MIHBhZ2UgYnkgYWRkaW5nIG5lY2Vzc2FyeSBldmVudCBsaXN0ZW5lcnMgYW5kIGJyb3dzZXIgbGlzdGVuZXJzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHt2b2lkfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIFJlbG9hZCgpIHtcclxuICAgIGFkZFdNTEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgICBhZGRXTUxXaW5kb3dMaXN0ZW5lcnMoKTtcclxuICAgIGFkZFdNTE9wZW5Ccm93c2VyTGlzdGVuZXIoKTtcclxuICAgIGlmKERFQlVHKSB7XHJcbiAgICAgICAgZGVidWdMb2coXCJSZWxvYWRlZCBXTUxcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgbWFwIG9mIGFsbCBtZXRob2RzIGluIHRoZSBjdXJyZW50IHdpbmRvdy5cclxuICogQHJldHVybnMge01hcH0gLSBBIG1hcCBvZiB3aW5kb3cgbWV0aG9kcy5cclxuICovXHJcbmZ1bmN0aW9uIFdpbmRvd01ldGhvZHModGFyZ2V0V2luZG93KSB7XHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgbWFwIHRvIHN0b3JlIG1ldGhvZHNcclxuICAgIGxldCByZXN1bHQgPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBwcm9wZXJ0aWVzIG9mIHRoZSB3aW5kb3cgb2JqZWN0XHJcbiAgICBmb3IgKGxldCBtZXRob2QgaW4gdGFyZ2V0V2luZG93KSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHByb3BlcnR5IGlzIGluZGVlZCBhIG1ldGhvZCAoZnVuY3Rpb24pXHJcbiAgICAgICAgaWYodHlwZW9mIHRhcmdldFdpbmRvd1ttZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgbWV0aG9kIHRvIHRoZSBtYXBcclxuICAgICAgICAgICAgcmVzdWx0LnNldChtZXRob2QsIHRhcmdldFdpbmRvd1ttZXRob2RdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBtYXAgb2Ygd2luZG93IG1ldGhvZHNcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn0iLCAiLypcclxuIF9cdCAgIF9fXHQgIF8gX19cclxufCB8XHQgLyAvX19fIF8oXykgL19fX19cclxufCB8IC98IC8gLyBfXyBgLyAvIC8gX19fL1xyXG58IHwvIHwvIC8gL18vIC8gLyAoX18gIClcclxufF9fL3xfXy9cXF9fLF8vXy9fL19fX18vXHJcblRoZSBlbGVjdHJvbiBhbHRlcm5hdGl2ZSBmb3IgR29cclxuKGMpIExlYSBBbnRob255IDIwMTktcHJlc2VudFxyXG4qL1xyXG5cclxuaW1wb3J0IHtzZXR1cENvbnRleHRNZW51c30gZnJvbSBcIi4uL0B3YWlsc2lvL3J1bnRpbWUvc3JjL2NvbnRleHRtZW51XCI7XHJcbmltcG9ydCB7c2V0dXBEcmFnfSBmcm9tIFwiLi4vQHdhaWxzaW8vcnVudGltZS9zcmMvZHJhZ1wiO1xyXG5pbXBvcnQge3NldHVwRXZlbnRDYWxsYmFja3N9IGZyb20gXCIuLi9Ad2FpbHNpby9ydW50aW1lL3NyYy9ldmVudHNcIjtcclxuaW1wb3J0IHtSZWxvYWR9IGZyb20gJy4uL0B3YWlsc2lvL3J1bnRpbWUvc3JjL3dtbCc7XHJcbmltcG9ydCB7ZGVidWdMb2d9IGZyb20gXCIuLi9Ad2FpbHNpby9ydW50aW1lL3NyYy9sb2dcIjtcclxuXHJcbnNldHVwQ29udGV4dE1lbnVzKCk7XHJcbnNldHVwRHJhZygpO1xyXG5zZXR1cEV2ZW50Q2FsbGJhY2tzKCk7XHJcblJlbG9hZCgpO1xyXG5cclxuaWYoREVCVUcpIHtcclxuICAgIGRlYnVnTG9nKFwiV2FpbHMgQ29yZSBMb2FkZWRcIik7XHJcbn0iXSwKICAibWFwcGluZ3MiOiAiOztBQUFBLE1BQUksY0FDRjtBQVdLLE1BQUksU0FBUyxDQUFDQSxRQUFPLE9BQU87QUFDakMsUUFBSSxLQUFLO0FBQ1QsUUFBSSxJQUFJQTtBQUNSLFdB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
