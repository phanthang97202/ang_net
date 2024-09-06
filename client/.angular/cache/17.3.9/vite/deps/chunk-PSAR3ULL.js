// node_modules/@angular/cdk/fesm2022/keycodes.mjs
var SHIFT = 16;
var CONTROL = 17;
var ALT = 18;
var ESCAPE = 27;
var META = 91;
var MAC_META = 224;
function hasModifierKey(event, ...modifiers) {
  if (modifiers.length) {
    return modifiers.some((modifier) => event[modifier]);
  }
  return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}

export {
  SHIFT,
  CONTROL,
  ALT,
  ESCAPE,
  META,
  MAC_META,
  hasModifierKey
};
//# sourceMappingURL=chunk-PSAR3ULL.js.map
