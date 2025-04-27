import "./chunk-EHLZM3EC.js";

// node_modules/posthog-js/dist/module.js
var e;
var t = "undefined" != typeof window ? window : void 0;
var i = "undefined" != typeof globalThis ? globalThis : t;
var r = Array.prototype;
var s = r.forEach;
var n = r.indexOf;
var o = null == i ? void 0 : i.navigator;
var a = null == i ? void 0 : i.document;
var l = null == i ? void 0 : i.location;
var c = null == i ? void 0 : i.fetch;
var u = null != i && i.XMLHttpRequest && "withCredentials" in new i.XMLHttpRequest() ? i.XMLHttpRequest : void 0;
var d = null == i ? void 0 : i.AbortController;
var h = null == o ? void 0 : o.userAgent;
var _ = null != t ? t : {};
var p = { DEBUG: false, LIB_VERSION: "1.215.4" };
var v = "$copy_autocapture";
var g = ["$snapshot", "$pageview", "$pageleave", "$set", "survey dismissed", "survey sent", "survey shown", "$identify", "$groupidentify", "$create_alias", "$$client_ingestion_warning", "$web_experiment_applied", "$feature_enrollment_update", "$feature_flag_called"];
!function(e2) {
  e2.GZipJS = "gzip-js", e2.Base64 = "base64";
}(e || (e = {}));
var f = ["fatal", "error", "warning", "log", "info", "debug"];
var m = {};
function b(e2, t2, i2) {
  if (B(e2)) {
    if (s && e2.forEach === s)
      e2.forEach(t2, i2);
    else if ("length" in e2 && e2.length === +e2.length) {
      for (var r2 = 0, n2 = e2.length; r2 < n2; r2++)
        if (r2 in e2 && t2.call(i2, e2[r2], r2) === m)
          return;
    }
  }
}
function y(e2, t2, i2) {
  if (!J(e2)) {
    if (B(e2))
      return b(e2, t2, i2);
    if (X(e2)) {
      for (var r2 of e2.entries())
        if (t2.call(i2, r2[1], r2[0]) === m)
          return;
    } else
      for (var s2 in e2)
        if (N.call(e2, s2) && t2.call(i2, e2[s2], s2) === m)
          return;
  }
}
var w = function(e2) {
  for (var t2 = arguments.length, i2 = new Array(t2 > 1 ? t2 - 1 : 0), r2 = 1; r2 < t2; r2++)
    i2[r2 - 1] = arguments[r2];
  return b(i2, function(t3) {
    for (var i3 in t3)
      void 0 !== t3[i3] && (e2[i3] = t3[i3]);
  }), e2;
};
var S = function(e2) {
  for (var t2 = arguments.length, i2 = new Array(t2 > 1 ? t2 - 1 : 0), r2 = 1; r2 < t2; r2++)
    i2[r2 - 1] = arguments[r2];
  return b(i2, function(t3) {
    b(t3, function(t4) {
      e2.push(t4);
    });
  }), e2;
};
function k(e2) {
  for (var t2 = Object.keys(e2), i2 = t2.length, r2 = new Array(i2); i2--; )
    r2[i2] = [t2[i2], e2[t2[i2]]];
  return r2;
}
var E = function(e2) {
  try {
    return e2();
  } catch (e3) {
    return;
  }
};
var x = function(e2) {
  return function() {
    try {
      for (var t2 = arguments.length, i2 = new Array(t2), r2 = 0; r2 < t2; r2++)
        i2[r2] = arguments[r2];
      return e2.apply(this, i2);
    } catch (e3) {
      ee.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), ee.critical(e3);
    }
  };
};
var I = function(e2) {
  var t2 = {};
  return y(e2, function(e3, i2) {
    W(e3) && e3.length > 0 && (t2[i2] = e3);
  }), t2;
};
function C(e2, t2) {
  return i2 = e2, r2 = (e3) => W(e3) && !G(t2) ? e3.slice(0, t2) : e3, s2 = /* @__PURE__ */ new Set(), function e3(t3, i3) {
    return t3 !== Object(t3) ? r2 ? r2(t3, i3) : t3 : s2.has(t3) ? void 0 : (s2.add(t3), B(t3) ? (n2 = [], b(t3, (t4) => {
      n2.push(e3(t4));
    })) : (n2 = {}, y(t3, (t4, i4) => {
      s2.has(t4) || (n2[i4] = e3(t4, i4));
    })), n2);
    var n2;
  }(i2);
  var i2, r2, s2;
}
var P = ["herokuapp.com", "vercel.app", "netlify.app"];
function F(e2) {
  var t2 = null == e2 ? void 0 : e2.hostname;
  if (!W(t2))
    return false;
  var i2 = t2.split(".").slice(-2).join(".");
  for (var r2 of P)
    if (i2 === r2)
      return false;
  return true;
}
function T(e2, t2) {
  for (var i2 = 0; i2 < e2.length; i2++)
    if (t2(e2[i2]))
      return e2[i2];
}
function R(e2, t2, i2, r2) {
  var { capture: s2 = false, passive: n2 = true } = null != r2 ? r2 : {};
  null == e2 || e2.addEventListener(t2, i2, { capture: s2, passive: n2 });
}
function $(e2, t2) {
  return -1 !== e2.indexOf(t2);
}
var O = function(e2) {
  return e2.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
var M = function(e2) {
  return e2.replace(/^\$/, "");
};
var A = function(e2, t2) {
  if (!function(e3) {
    try {
      new RegExp(e3);
    } catch (e4) {
      return false;
    }
    return true;
  }(t2))
    return false;
  try {
    return new RegExp(t2).test(e2);
  } catch (e3) {
    return false;
  }
};
var L = Array.isArray;
var D = Object.prototype;
var N = D.hasOwnProperty;
var q = D.toString;
var B = L || function(e2) {
  return "[object Array]" === q.call(e2);
};
var H = (e2) => "function" == typeof e2;
var U = (e2) => e2 === Object(e2) && !B(e2);
var j = (e2) => {
  if (U(e2)) {
    for (var t2 in e2)
      if (N.call(e2, t2))
        return false;
    return true;
  }
  return false;
};
var z = (e2) => void 0 === e2;
var W = (e2) => "[object String]" == q.call(e2);
var V = (e2) => W(e2) && 0 === e2.trim().length;
var G = (e2) => null === e2;
var J = (e2) => z(e2) || G(e2);
var Y = (e2) => "[object Number]" == q.call(e2);
var K = (e2) => "[object Boolean]" === q.call(e2);
var X = (e2) => e2 instanceof FormData;
var Q = (e2) => $(g, e2);
var Z = (e2) => {
  var i2 = { _log: function(i3) {
    if (t && (p.DEBUG || _.POSTHOG_DEBUG) && !z(t.console) && t.console) {
      for (var r2 = ("__rrweb_original__" in t.console[i3]) ? t.console[i3].__rrweb_original__ : t.console[i3], s2 = arguments.length, n2 = new Array(s2 > 1 ? s2 - 1 : 0), o2 = 1; o2 < s2; o2++)
        n2[o2 - 1] = arguments[o2];
      r2(e2, ...n2);
    }
  }, info: function() {
    for (var e3 = arguments.length, t2 = new Array(e3), r2 = 0; r2 < e3; r2++)
      t2[r2] = arguments[r2];
    i2._log("log", ...t2);
  }, warn: function() {
    for (var e3 = arguments.length, t2 = new Array(e3), r2 = 0; r2 < e3; r2++)
      t2[r2] = arguments[r2];
    i2._log("warn", ...t2);
  }, error: function() {
    for (var e3 = arguments.length, t2 = new Array(e3), r2 = 0; r2 < e3; r2++)
      t2[r2] = arguments[r2];
    i2._log("error", ...t2);
  }, critical: function() {
    for (var t2 = arguments.length, i3 = new Array(t2), r2 = 0; r2 < t2; r2++)
      i3[r2] = arguments[r2];
    console.error(e2, ...i3);
  }, uninitializedWarning: (e3) => {
    i2.error("You must initialize PostHog before calling ".concat(e3));
  }, createLogger: (t2) => Z("".concat(e2, " ").concat(t2)) };
  return i2;
};
var ee = Z("[PostHog.js]");
var te = ee.createLogger;
var ie = te("[ExternalScriptsLoader]");
var re = (e2, t2, i2) => {
  if (e2.config.disable_external_dependency_loading)
    return ie.warn("".concat(t2, " was requested but loading of external scripts is disabled.")), i2("Loading of external scripts is disabled");
  var r2 = () => {
    if (!a)
      return i2("document not found");
    var r3 = a.createElement("script");
    if (r3.type = "text/javascript", r3.crossOrigin = "anonymous", r3.src = t2, r3.onload = (e3) => i2(void 0, e3), r3.onerror = (e3) => i2(e3), e2.config.prepare_external_dependency_script && (r3 = e2.config.prepare_external_dependency_script(r3)), !r3)
      return i2("prepare_external_dependency_script returned null");
    var s2, n2 = a.querySelectorAll("body > script");
    n2.length > 0 ? null === (s2 = n2[0].parentNode) || void 0 === s2 || s2.insertBefore(r3, n2[0]) : a.body.appendChild(r3);
  };
  null != a && a.body ? r2() : null == a || a.addEventListener("DOMContentLoaded", r2);
};
function se(e2, t2) {
  var i2 = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var r2 = Object.getOwnPropertySymbols(e2);
    t2 && (r2 = r2.filter(function(t3) {
      return Object.getOwnPropertyDescriptor(e2, t3).enumerable;
    })), i2.push.apply(i2, r2);
  }
  return i2;
}
function ne(e2) {
  for (var t2 = 1; t2 < arguments.length; t2++) {
    var i2 = null != arguments[t2] ? arguments[t2] : {};
    t2 % 2 ? se(Object(i2), true).forEach(function(t3) {
      oe(e2, t3, i2[t3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(i2)) : se(Object(i2)).forEach(function(t3) {
      Object.defineProperty(e2, t3, Object.getOwnPropertyDescriptor(i2, t3));
    });
  }
  return e2;
}
function oe(e2, t2, i2) {
  return t2 in e2 ? Object.defineProperty(e2, t2, { value: i2, enumerable: true, configurable: true, writable: true }) : e2[t2] = i2, e2;
}
function ae(e2, t2) {
  if (null == e2)
    return {};
  var i2, r2, s2 = function(e3, t3) {
    if (null == e3)
      return {};
    var i3, r3, s3 = {}, n3 = Object.keys(e3);
    for (r3 = 0; r3 < n3.length; r3++)
      i3 = n3[r3], t3.indexOf(i3) >= 0 || (s3[i3] = e3[i3]);
    return s3;
  }(e2, t2);
  if (Object.getOwnPropertySymbols) {
    var n2 = Object.getOwnPropertySymbols(e2);
    for (r2 = 0; r2 < n2.length; r2++)
      i2 = n2[r2], t2.indexOf(i2) >= 0 || Object.prototype.propertyIsEnumerable.call(e2, i2) && (s2[i2] = e2[i2]);
  }
  return s2;
}
_.__PosthogExtensions__ = _.__PosthogExtensions__ || {}, _.__PosthogExtensions__.loadExternalDependency = (e2, t2, i2) => {
  var r2 = "/static/".concat(t2, ".js") + "?v=".concat(e2.version);
  if ("remote-config" === t2 && (r2 = "/array/".concat(e2.config.token, "/config.js")), "toolbar" === t2) {
    var s2 = 3e5, n2 = Math.floor(Date.now() / s2) * s2;
    r2 = "".concat(r2, "&t=").concat(n2);
  }
  var o2 = e2.requestRouter.endpointFor("assets", r2);
  re(e2, o2, i2);
}, _.__PosthogExtensions__.loadSiteApp = (e2, t2, i2) => {
  var r2 = e2.requestRouter.endpointFor("api", t2);
  re(e2, r2, i2);
};
var le = "$people_distinct_id";
var ce = "__alias";
var ue = "__timers";
var de = "$autocapture_disabled_server_side";
var he = "$heatmaps_enabled_server_side";
var _e = "$exception_capture_enabled_server_side";
var pe = "$web_vitals_enabled_server_side";
var ve = "$dead_clicks_enabled_server_side";
var ge = "$web_vitals_allowed_metrics";
var fe = "$session_recording_enabled_server_side";
var me = "$console_log_recording_enabled_server_side";
var be = "$session_recording_network_payload_capture";
var ye = "$session_recording_canvas_recording";
var we = "$replay_sample_rate";
var Se = "$replay_minimum_duration";
var ke = "$replay_script_config";
var Ee = "$sesid";
var xe = "$session_is_sampled";
var Ie = "$session_recording_url_trigger_activated_session";
var Ce = "$session_recording_event_trigger_activated_session";
var Pe = "$enabled_feature_flags";
var Fe = "$early_access_features";
var Te = "$stored_person_properties";
var Re = "$stored_group_properties";
var $e = "$surveys";
var Oe = "$surveys_activated";
var Me = "$flag_call_reported";
var Ae = "$user_state";
var Le = "$client_session_props";
var De = "$capture_rate_limit";
var Ne = "$initial_campaign_params";
var qe = "$initial_referrer_info";
var Be = "$initial_person_info";
var He = "$epp";
var Ue = "__POSTHOG_TOOLBAR__";
var je = "$posthog_cookieless";
var ze = [le, ce, "__cmpns", ue, fe, he, Ee, Pe, Ae, Fe, Re, Te, $e, Me, Le, De, Ne, qe, He];
var We = te("[FeatureFlags]");
var Ve = "$active_feature_flags";
var Ge = "$override_feature_flags";
var Je = "$feature_flag_payloads";
var Ye = "$override_feature_flag_payloads";
var Ke = (e2) => {
  var t2 = {};
  for (var [i2, r2] of k(e2 || {}))
    r2 && (t2[i2] = r2);
  return t2;
};
var Xe = class {
  constructor(e2) {
    oe(this, "_override_warning", false), oe(this, "_hasLoadedFlags", false), oe(this, "_requestInFlight", false), oe(this, "_reloadingDisabled", false), oe(this, "_additionalReloadRequested", false), oe(this, "_decideCalled", false), oe(this, "_flagsLoadedFromRemote", false), this.instance = e2, this.featureFlagEventHandlers = [];
  }
  decide() {
    if (this.instance.config.__preview_remote_config)
      this._decideCalled = true;
    else {
      var e2 = !this._reloadDebouncer && (this.instance.config.advanced_disable_feature_flags || this.instance.config.advanced_disable_feature_flags_on_first_load);
      this._callDecideEndpoint({ disableFlags: e2 });
    }
  }
  get hasLoadedFlags() {
    return this._hasLoadedFlags;
  }
  getFlags() {
    return Object.keys(this.getFlagVariants());
  }
  getFlagVariants() {
    var e2 = this.instance.get_property(Pe), t2 = this.instance.get_property(Ge);
    if (!t2)
      return e2 || {};
    for (var i2 = w({}, e2), r2 = Object.keys(t2), s2 = 0; s2 < r2.length; s2++)
      i2[r2[s2]] = t2[r2[s2]];
    return this._override_warning || (We.warn(" Overriding feature flags!", { enabledFlags: e2, overriddenFlags: t2, finalFlags: i2 }), this._override_warning = true), i2;
  }
  getFlagPayloads() {
    var e2 = this.instance.get_property(Je), t2 = this.instance.get_property(Ye);
    if (!t2)
      return e2 || {};
    for (var i2 = w({}, e2 || {}), r2 = Object.keys(t2), s2 = 0; s2 < r2.length; s2++)
      i2[r2[s2]] = t2[r2[s2]];
    return this._override_warning || (We.warn(" Overriding feature flag payloads!", { flagPayloads: e2, overriddenPayloads: t2, finalPayloads: i2 }), this._override_warning = true), i2;
  }
  reloadFeatureFlags() {
    this._reloadingDisabled || this.instance.config.advanced_disable_feature_flags || this._reloadDebouncer || (this._reloadDebouncer = setTimeout(() => {
      this._callDecideEndpoint();
    }, 5));
  }
  clearDebouncer() {
    clearTimeout(this._reloadDebouncer), this._reloadDebouncer = void 0;
  }
  ensureFlagsLoaded() {
    this._hasLoadedFlags || this._requestInFlight || this._reloadDebouncer || this.reloadFeatureFlags();
  }
  setAnonymousDistinctId(e2) {
    this.$anon_distinct_id = e2;
  }
  setReloadingPaused(e2) {
    this._reloadingDisabled = e2;
  }
  _callDecideEndpoint(t2) {
    if (this.clearDebouncer(), !this.instance.config.advanced_disable_decide)
      if (this._requestInFlight)
        this._additionalReloadRequested = true;
      else {
        var i2 = { token: this.instance.config.token, distinct_id: this.instance.get_distinct_id(), groups: this.instance.getGroups(), $anon_distinct_id: this.$anon_distinct_id, person_properties: this.instance.get_property(Te), group_properties: this.instance.get_property(Re) };
        (null != t2 && t2.disableFlags || this.instance.config.advanced_disable_feature_flags) && (i2.disable_flags = true), this._requestInFlight = true, this.instance._send_request({ method: "POST", url: this.instance.requestRouter.endpointFor("api", "/decide/?v=3"), data: i2, compression: this.instance.config.disable_compression ? void 0 : e.Base64, timeout: this.instance.config.feature_flag_request_timeout_ms, callback: (e2) => {
          var t3, r2, s2 = true;
          (200 === e2.statusCode && (this.$anon_distinct_id = void 0, s2 = false), this._requestInFlight = false, this._decideCalled) || (this._decideCalled = true, this.instance._onRemoteConfig(null !== (r2 = e2.json) && void 0 !== r2 ? r2 : {}));
          i2.disable_flags || (this._flagsLoadedFromRemote = !s2, this.receivedFeatureFlags(null !== (t3 = e2.json) && void 0 !== t3 ? t3 : {}, s2), this._additionalReloadRequested && (this._additionalReloadRequested = false, this._callDecideEndpoint()));
        } });
      }
  }
  getFeatureFlag(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (this._hasLoadedFlags || this.getFlags() && this.getFlags().length > 0) {
      var i2, r2, s2, n2, o2, a2 = this.getFlagVariants()[e2], l2 = "".concat(a2), c2 = this.instance.get_property(Me) || {};
      if (t2.send_event || !("send_event" in t2)) {
        if (!(e2 in c2) || !c2[e2].includes(l2))
          B(c2[e2]) ? c2[e2].push(l2) : c2[e2] = [l2], null === (i2 = this.instance.persistence) || void 0 === i2 || i2.register({ [Me]: c2 }), this.instance.capture("$feature_flag_called", { $feature_flag: e2, $feature_flag_response: a2, $feature_flag_payload: this.getFeatureFlagPayload(e2) || null, $feature_flag_bootstrapped_response: (null === (r2 = this.instance.config.bootstrap) || void 0 === r2 || null === (s2 = r2.featureFlags) || void 0 === s2 ? void 0 : s2[e2]) || null, $feature_flag_bootstrapped_payload: (null === (n2 = this.instance.config.bootstrap) || void 0 === n2 || null === (o2 = n2.featureFlagPayloads) || void 0 === o2 ? void 0 : o2[e2]) || null, $used_bootstrap_value: !this._flagsLoadedFromRemote });
      }
      return a2;
    }
    We.warn('getFeatureFlag for key "' + e2 + `" failed. Feature flags didn't load in time.`);
  }
  getFeatureFlagPayload(e2) {
    return this.getFlagPayloads()[e2];
  }
  isFeatureEnabled(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (this._hasLoadedFlags || this.getFlags() && this.getFlags().length > 0)
      return !!this.getFeatureFlag(e2, t2);
    We.warn('isFeatureEnabled for key "' + e2 + `" failed. Feature flags didn't load in time.`);
  }
  addFeatureFlagsHandler(e2) {
    this.featureFlagEventHandlers.push(e2);
  }
  removeFeatureFlagsHandler(e2) {
    this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter((t2) => t2 !== e2);
  }
  receivedFeatureFlags(e2, t2) {
    if (this.instance.persistence) {
      this._hasLoadedFlags = true;
      var i2 = this.getFlagVariants(), r2 = this.getFlagPayloads();
      !function(e3, t3) {
        var i3 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}, r3 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {}, s2 = e3.featureFlags, n2 = e3.featureFlagPayloads;
        if (s2)
          if (B(s2)) {
            var o2 = {};
            if (s2)
              for (var a2 = 0; a2 < s2.length; a2++)
                o2[s2[a2]] = true;
            t3 && t3.register({ [Ve]: s2, [Pe]: o2 });
          } else {
            var l2 = s2, c2 = n2;
            e3.errorsWhileComputingFlags && (l2 = ne(ne({}, i3), l2), c2 = ne(ne({}, r3), c2)), t3 && t3.register({ [Ve]: Object.keys(Ke(l2)), [Pe]: l2 || {}, [Je]: c2 || {} });
          }
      }(e2, this.instance.persistence, i2, r2), this._fireFeatureFlagsCallbacks(t2);
    }
  }
  override(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    We.warn("override is deprecated. Please use overrideFeatureFlags instead."), this.overrideFeatureFlags({ flags: e2, suppressWarning: t2 });
  }
  overrideFeatureFlags(e2) {
    if (!this.instance.__loaded || !this.instance.persistence)
      return We.uninitializedWarning("posthog.feature_flags.overrideFeatureFlags");
    if (false === e2)
      return this.instance.persistence.unregister(Ge), this.instance.persistence.unregister(Ye), void this._fireFeatureFlagsCallbacks();
    if (e2 && "object" == typeof e2 && ("flags" in e2 || "payloads" in e2)) {
      var t2, i2 = e2;
      if (this._override_warning = Boolean(null !== (t2 = i2.suppressWarning) && void 0 !== t2 && t2), "flags" in i2) {
        if (false === i2.flags)
          this.instance.persistence.unregister(Ge);
        else if (i2.flags)
          if (B(i2.flags)) {
            for (var r2 = {}, s2 = 0; s2 < i2.flags.length; s2++)
              r2[i2.flags[s2]] = true;
            this.instance.persistence.register({ [Ge]: r2 });
          } else
            this.instance.persistence.register({ [Ge]: i2.flags });
      }
      return "payloads" in i2 && (false === i2.payloads ? this.instance.persistence.unregister(Ye) : i2.payloads && this.instance.persistence.register({ [Ye]: i2.payloads })), void this._fireFeatureFlagsCallbacks();
    }
    this._fireFeatureFlagsCallbacks();
  }
  onFeatureFlags(e2) {
    if (this.addFeatureFlagsHandler(e2), this._hasLoadedFlags) {
      var { flags: t2, flagVariants: i2 } = this._prepareFeatureFlagsForCallbacks();
      e2(t2, i2);
    }
    return () => this.removeFeatureFlagsHandler(e2);
  }
  updateEarlyAccessFeatureEnrollment(e2, t2) {
    var i2, r2 = (this.instance.get_property(Fe) || []).find((t3) => t3.flagKey === e2), s2 = { ["$feature_enrollment/".concat(e2)]: t2 }, n2 = { $feature_flag: e2, $feature_enrollment: t2, $set: s2 };
    r2 && (n2.$early_access_feature_name = r2.name), this.instance.capture("$feature_enrollment_update", n2), this.setPersonPropertiesForFlags(s2, false);
    var o2 = ne(ne({}, this.getFlagVariants()), {}, { [e2]: t2 });
    null === (i2 = this.instance.persistence) || void 0 === i2 || i2.register({ [Ve]: Object.keys(Ke(o2)), [Pe]: o2 }), this._fireFeatureFlagsCallbacks();
  }
  getEarlyAccessFeatures(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], i2 = this.instance.get_property(Fe);
    if (i2 && !t2)
      return e2(i2);
    this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/early_access_features/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
      var i3;
      if (t3.json) {
        var r2 = t3.json.earlyAccessFeatures;
        return null === (i3 = this.instance.persistence) || void 0 === i3 || i3.register({ [Fe]: r2 }), e2(r2);
      }
    } });
  }
  _prepareFeatureFlagsForCallbacks() {
    var e2 = this.getFlags(), t2 = this.getFlagVariants();
    return { flags: e2.filter((e3) => t2[e3]), flagVariants: Object.keys(t2).filter((e3) => t2[e3]).reduce((e3, i2) => (e3[i2] = t2[i2], e3), {}) };
  }
  _fireFeatureFlagsCallbacks(e2) {
    var { flags: t2, flagVariants: i2 } = this._prepareFeatureFlagsForCallbacks();
    this.featureFlagEventHandlers.forEach((r2) => r2(t2, i2, { errorsLoading: e2 }));
  }
  setPersonPropertiesForFlags(e2) {
    var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.instance.get_property(Te) || {};
    this.instance.register({ [Te]: ne(ne({}, i2), e2) }), t2 && this.instance.reloadFeatureFlags();
  }
  resetPersonPropertiesForFlags() {
    this.instance.unregister(Te);
  }
  setGroupPropertiesForFlags(e2) {
    var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1], i2 = this.instance.get_property(Re) || {};
    0 !== Object.keys(i2).length && Object.keys(i2).forEach((t3) => {
      i2[t3] = ne(ne({}, i2[t3]), e2[t3]), delete e2[t3];
    }), this.instance.register({ [Re]: ne(ne({}, i2), e2) }), t2 && this.instance.reloadFeatureFlags();
  }
  resetGroupPropertiesForFlags(e2) {
    if (e2) {
      var t2 = this.instance.get_property(Re) || {};
      this.instance.register({ [Re]: ne(ne({}, t2), {}, { [e2]: {} }) });
    } else
      this.instance.unregister(Re);
  }
};
Math.trunc || (Math.trunc = function(e2) {
  return e2 < 0 ? Math.ceil(e2) : Math.floor(e2);
}), Number.isInteger || (Number.isInteger = function(e2) {
  return Y(e2) && isFinite(e2) && Math.floor(e2) === e2;
});
var Qe = "0123456789abcdef";
var Ze = class _Ze {
  constructor(e2) {
    if (this.bytes = e2, 16 !== e2.length)
      throw new TypeError("not 128-bit length");
  }
  static fromFieldsV7(e2, t2, i2, r2) {
    if (!Number.isInteger(e2) || !Number.isInteger(t2) || !Number.isInteger(i2) || !Number.isInteger(r2) || e2 < 0 || t2 < 0 || i2 < 0 || r2 < 0 || e2 > 281474976710655 || t2 > 4095 || i2 > 1073741823 || r2 > 4294967295)
      throw new RangeError("invalid field value");
    var s2 = new Uint8Array(16);
    return s2[0] = e2 / Math.pow(2, 40), s2[1] = e2 / Math.pow(2, 32), s2[2] = e2 / Math.pow(2, 24), s2[3] = e2 / Math.pow(2, 16), s2[4] = e2 / Math.pow(2, 8), s2[5] = e2, s2[6] = 112 | t2 >>> 8, s2[7] = t2, s2[8] = 128 | i2 >>> 24, s2[9] = i2 >>> 16, s2[10] = i2 >>> 8, s2[11] = i2, s2[12] = r2 >>> 24, s2[13] = r2 >>> 16, s2[14] = r2 >>> 8, s2[15] = r2, new _Ze(s2);
  }
  toString() {
    for (var e2 = "", t2 = 0; t2 < this.bytes.length; t2++)
      e2 = e2 + Qe.charAt(this.bytes[t2] >>> 4) + Qe.charAt(15 & this.bytes[t2]), 3 !== t2 && 5 !== t2 && 7 !== t2 && 9 !== t2 || (e2 += "-");
    if (36 !== e2.length)
      throw new Error("Invalid UUIDv7 was generated");
    return e2;
  }
  clone() {
    return new _Ze(this.bytes.slice(0));
  }
  equals(e2) {
    return 0 === this.compareTo(e2);
  }
  compareTo(e2) {
    for (var t2 = 0; t2 < 16; t2++) {
      var i2 = this.bytes[t2] - e2.bytes[t2];
      if (0 !== i2)
        return Math.sign(i2);
    }
    return 0;
  }
};
var et = class {
  constructor() {
    oe(this, "timestamp", 0), oe(this, "counter", 0), oe(this, "random", new rt());
  }
  generate() {
    var e2 = this.generateOrAbort();
    if (z(e2)) {
      this.timestamp = 0;
      var t2 = this.generateOrAbort();
      if (z(t2))
        throw new Error("Could not generate UUID after timestamp reset");
      return t2;
    }
    return e2;
  }
  generateOrAbort() {
    var e2 = Date.now();
    if (e2 > this.timestamp)
      this.timestamp = e2, this.resetCounter();
    else {
      if (!(e2 + 1e4 > this.timestamp))
        return;
      this.counter++, this.counter > 4398046511103 && (this.timestamp++, this.resetCounter());
    }
    return Ze.fromFieldsV7(this.timestamp, Math.trunc(this.counter / Math.pow(2, 30)), this.counter & Math.pow(2, 30) - 1, this.random.nextUint32());
  }
  resetCounter() {
    this.counter = 1024 * this.random.nextUint32() + (1023 & this.random.nextUint32());
  }
};
var tt;
var it = (e2) => {
  if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG)
    throw new Error("no cryptographically strong RNG available");
  for (var t2 = 0; t2 < e2.length; t2++)
    e2[t2] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
  return e2;
};
t && !z(t.crypto) && crypto.getRandomValues && (it = (e2) => crypto.getRandomValues(e2));
var rt = class {
  constructor() {
    oe(this, "buffer", new Uint32Array(8)), oe(this, "cursor", 1 / 0);
  }
  nextUint32() {
    return this.cursor >= this.buffer.length && (it(this.buffer), this.cursor = 0), this.buffer[this.cursor++];
  }
};
var st = () => nt().toString();
var nt = () => (tt || (tt = new et())).generate();
var ot = "Thu, 01 Jan 1970 00:00:00 GMT";
var at = "";
var lt = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
function ct(e2, t2) {
  if (t2) {
    var i2 = function(e3) {
      var t3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : a;
      if (at)
        return at;
      if (!t3)
        return "";
      if (["localhost", "127.0.0.1"].includes(e3))
        return "";
      for (var i3 = e3.split("."), r3 = Math.min(i3.length, 8), s2 = "dmn_chk_" + st(), n2 = new RegExp("(^|;)\\s*" + s2 + "=1"); !at && r3--; ) {
        var o2 = i3.slice(r3).join("."), l2 = s2 + "=1;domain=." + o2;
        t3.cookie = l2, n2.test(t3.cookie) && (t3.cookie = l2 + ";expires=" + ot, at = o2);
      }
      return at;
    }(e2);
    if (!i2) {
      var r2 = ((e3) => {
        var t3 = e3.match(lt);
        return t3 ? t3[0] : "";
      })(e2);
      r2 !== i2 && ee.info("Warning: cookie subdomain discovery mismatch", r2, i2), i2 = r2;
    }
    return i2 ? "; domain=." + i2 : "";
  }
  return "";
}
var ut = { is_supported: () => !!a, error: function(e2) {
  ee.error("cookieStore error: " + e2);
}, get: function(e2) {
  if (a) {
    try {
      for (var t2 = e2 + "=", i2 = a.cookie.split(";").filter((e3) => e3.length), r2 = 0; r2 < i2.length; r2++) {
        for (var s2 = i2[r2]; " " == s2.charAt(0); )
          s2 = s2.substring(1, s2.length);
        if (0 === s2.indexOf(t2))
          return decodeURIComponent(s2.substring(t2.length, s2.length));
      }
    } catch (e3) {
    }
    return null;
  }
}, parse: function(e2) {
  var t2;
  try {
    t2 = JSON.parse(ut.get(e2)) || {};
  } catch (e3) {
  }
  return t2;
}, set: function(e2, t2, i2, r2, s2) {
  if (a)
    try {
      var n2 = "", o2 = "", l2 = ct(a.location.hostname, r2);
      if (i2) {
        var c2 = /* @__PURE__ */ new Date();
        c2.setTime(c2.getTime() + 24 * i2 * 60 * 60 * 1e3), n2 = "; expires=" + c2.toUTCString();
      }
      s2 && (o2 = "; secure");
      var u2 = e2 + "=" + encodeURIComponent(JSON.stringify(t2)) + n2 + "; SameSite=Lax; path=/" + l2 + o2;
      return u2.length > 3686.4 && ee.warn("cookieStore warning: large cookie, len=" + u2.length), a.cookie = u2, u2;
    } catch (e3) {
      return;
    }
}, remove: function(e2, t2) {
  try {
    ut.set(e2, "", -1, t2);
  } catch (e3) {
    return;
  }
} };
var dt = null;
var ht = { is_supported: function() {
  if (!G(dt))
    return dt;
  var e2 = true;
  if (z(t))
    e2 = false;
  else
    try {
      var i2 = "__mplssupport__";
      ht.set(i2, "xyz"), '"xyz"' !== ht.get(i2) && (e2 = false), ht.remove(i2);
    } catch (t2) {
      e2 = false;
    }
  return e2 || ee.error("localStorage unsupported; falling back to cookie store"), dt = e2, e2;
}, error: function(e2) {
  ee.error("localStorage error: " + e2);
}, get: function(e2) {
  try {
    return null == t ? void 0 : t.localStorage.getItem(e2);
  } catch (e3) {
    ht.error(e3);
  }
  return null;
}, parse: function(e2) {
  try {
    return JSON.parse(ht.get(e2)) || {};
  } catch (e3) {
  }
  return null;
}, set: function(e2, i2) {
  try {
    null == t || t.localStorage.setItem(e2, JSON.stringify(i2));
  } catch (e3) {
    ht.error(e3);
  }
}, remove: function(e2) {
  try {
    null == t || t.localStorage.removeItem(e2);
  } catch (e3) {
    ht.error(e3);
  }
} };
var _t = ["distinct_id", Ee, xe, He, Be];
var pt = ne(ne({}, ht), {}, { parse: function(e2) {
  try {
    var t2 = {};
    try {
      t2 = ut.parse(e2) || {};
    } catch (e3) {
    }
    var i2 = w(t2, JSON.parse(ht.get(e2) || "{}"));
    return ht.set(e2, i2), i2;
  } catch (e3) {
  }
  return null;
}, set: function(e2, t2, i2, r2, s2, n2) {
  try {
    ht.set(e2, t2, void 0, void 0, n2);
    var o2 = {};
    _t.forEach((e3) => {
      t2[e3] && (o2[e3] = t2[e3]);
    }), Object.keys(o2).length && ut.set(e2, o2, i2, r2, s2, n2);
  } catch (e3) {
    ht.error(e3);
  }
}, remove: function(e2, i2) {
  try {
    null == t || t.localStorage.removeItem(e2), ut.remove(e2, i2);
  } catch (e3) {
    ht.error(e3);
  }
} });
var vt = {};
var gt = { is_supported: function() {
  return true;
}, error: function(e2) {
  ee.error("memoryStorage error: " + e2);
}, get: function(e2) {
  return vt[e2] || null;
}, parse: function(e2) {
  return vt[e2] || null;
}, set: function(e2, t2) {
  vt[e2] = t2;
}, remove: function(e2) {
  delete vt[e2];
} };
var ft = null;
var mt = { is_supported: function() {
  if (!G(ft))
    return ft;
  if (ft = true, z(t))
    ft = false;
  else
    try {
      var e2 = "__support__";
      mt.set(e2, "xyz"), '"xyz"' !== mt.get(e2) && (ft = false), mt.remove(e2);
    } catch (e3) {
      ft = false;
    }
  return ft;
}, error: function(e2) {
  ee.error("sessionStorage error: ", e2);
}, get: function(e2) {
  try {
    return null == t ? void 0 : t.sessionStorage.getItem(e2);
  } catch (e3) {
    mt.error(e3);
  }
  return null;
}, parse: function(e2) {
  try {
    return JSON.parse(mt.get(e2)) || null;
  } catch (e3) {
  }
  return null;
}, set: function(e2, i2) {
  try {
    null == t || t.sessionStorage.setItem(e2, JSON.stringify(i2));
  } catch (e3) {
    mt.error(e3);
  }
}, remove: function(e2) {
  try {
    null == t || t.sessionStorage.removeItem(e2);
  } catch (e3) {
    mt.error(e3);
  }
} };
var bt = ["localhost", "127.0.0.1"];
var yt = (e2) => {
  var t2 = null == a ? void 0 : a.createElement("a");
  return z(t2) ? null : (t2.href = e2, t2);
};
var wt = function(e2) {
  var t2, i2, r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "&", s2 = [];
  return y(e2, function(e3, r3) {
    z(e3) || z(r3) || "undefined" === r3 || (t2 = encodeURIComponent(((e4) => e4 instanceof File)(e3) ? e3.name : e3.toString()), i2 = encodeURIComponent(r3), s2[s2.length] = i2 + "=" + t2);
  }), s2.join(r2);
};
var St = function(e2, t2) {
  for (var i2, r2 = ((e2.split("#")[0] || "").split("?")[1] || "").split("&"), s2 = 0; s2 < r2.length; s2++) {
    var n2 = r2[s2].split("=");
    if (n2[0] === t2) {
      i2 = n2;
      break;
    }
  }
  if (!B(i2) || i2.length < 2)
    return "";
  var o2 = i2[1];
  try {
    o2 = decodeURIComponent(o2);
  } catch (e3) {
    ee.error("Skipping decoding for malformed query param: " + o2);
  }
  return o2.replace(/\+/g, " ");
};
var kt = function(e2, t2, i2) {
  if (!e2 || !t2 || !t2.length)
    return e2;
  for (var r2 = e2.split("#"), s2 = r2[0] || "", n2 = r2[1], o2 = s2.split("?"), a2 = o2[1], l2 = o2[0], c2 = (a2 || "").split("&"), u2 = [], d2 = 0; d2 < c2.length; d2++) {
    var h2 = c2[d2].split("=");
    B(h2) && (t2.includes(h2[0]) ? u2.push(h2[0] + "=" + i2) : u2.push(c2[d2]));
  }
  var _2 = l2;
  return null != a2 && (_2 += "?" + u2.join("&")), null != n2 && (_2 += "#" + n2), _2;
};
var Et = function(e2, t2) {
  var i2 = e2.match(new RegExp(t2 + "=([^&]*)"));
  return i2 ? i2[1] : null;
};
var xt = "Mobile";
var It = "iOS";
var Ct = "Android";
var Pt = "Tablet";
var Ft = Ct + " " + Pt;
var Tt = "iPad";
var Rt = "Apple";
var $t = Rt + " Watch";
var Ot = "Safari";
var Mt = "BlackBerry";
var At = "Samsung";
var Lt = At + "Browser";
var Dt = At + " Internet";
var Nt = "Chrome";
var qt = Nt + " OS";
var Bt = Nt + " " + It;
var Ht = "Internet Explorer";
var Ut = Ht + " " + xt;
var jt = "Opera";
var zt = jt + " Mini";
var Wt = "Edge";
var Vt = "Microsoft " + Wt;
var Gt = "Firefox";
var Jt = Gt + " " + It;
var Yt = "Nintendo";
var Kt = "PlayStation";
var Xt = "Xbox";
var Qt = Ct + " " + xt;
var Zt = xt + " " + Ot;
var ei = "Windows";
var ti = ei + " Phone";
var ii = "Nokia";
var ri = "Ouya";
var si = "Generic";
var ni = si + " " + xt.toLowerCase();
var oi = si + " " + Pt.toLowerCase();
var ai = "Konqueror";
var li = "(\\d+(\\.\\d+)?)";
var ci = new RegExp("Version/" + li);
var ui = new RegExp(Xt, "i");
var di = new RegExp(Kt + " \\w+", "i");
var hi = new RegExp(Yt + " \\w+", "i");
var _i = new RegExp(Mt + "|PlayBook|BB10", "i");
var pi = { "NT3.51": "NT 3.11", "NT4.0": "NT 4.0", "5.0": "2000", 5.1: "XP", 5.2: "XP", "6.0": "Vista", 6.1: "7", 6.2: "8", 6.3: "8.1", 6.4: "10", "10.0": "10" };
var vi = (e2, t2) => t2 && $(t2, Rt) || function(e3) {
  return $(e3, Ot) && !$(e3, Nt) && !$(e3, Ct);
}(e2);
var gi = function(e2, t2) {
  return t2 = t2 || "", $(e2, " OPR/") && $(e2, "Mini") ? zt : $(e2, " OPR/") ? jt : _i.test(e2) ? Mt : $(e2, "IE" + xt) || $(e2, "WPDesktop") ? Ut : $(e2, Lt) ? Dt : $(e2, Wt) || $(e2, "Edg/") ? Vt : $(e2, "FBIOS") ? "Facebook " + xt : $(e2, "UCWEB") || $(e2, "UCBrowser") ? "UC Browser" : $(e2, "CriOS") ? Bt : $(e2, "CrMo") || $(e2, Nt) ? Nt : $(e2, Ct) && $(e2, Ot) ? Qt : $(e2, "FxiOS") ? Jt : $(e2.toLowerCase(), ai.toLowerCase()) ? ai : vi(e2, t2) ? $(e2, xt) ? Zt : Ot : $(e2, Gt) ? Gt : $(e2, "MSIE") || $(e2, "Trident/") ? Ht : $(e2, "Gecko") ? Gt : "";
};
var fi = { [Ut]: [new RegExp("rv:" + li)], [Vt]: [new RegExp(Wt + "?\\/" + li)], [Nt]: [new RegExp("(" + Nt + "|CrMo)\\/" + li)], [Bt]: [new RegExp("CriOS\\/" + li)], "UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + li)], [Ot]: [ci], [Zt]: [ci], [jt]: [new RegExp("(Opera|OPR)\\/" + li)], [Gt]: [new RegExp(Gt + "\\/" + li)], [Jt]: [new RegExp("FxiOS\\/" + li)], [ai]: [new RegExp("Konqueror[:/]?" + li, "i")], [Mt]: [new RegExp(Mt + " " + li), ci], [Qt]: [new RegExp("android\\s" + li, "i")], [Dt]: [new RegExp(Lt + "\\/" + li)], [Ht]: [new RegExp("(rv:|MSIE )" + li)], Mozilla: [new RegExp("rv:" + li)] };
var mi = [[new RegExp(Xt + "; " + Xt + " (.*?)[);]", "i"), (e2) => [Xt, e2 && e2[1] || ""]], [new RegExp(Yt, "i"), [Yt, ""]], [new RegExp(Kt, "i"), [Kt, ""]], [_i, [Mt, ""]], [new RegExp(ei, "i"), (e2, t2) => {
  if (/Phone/.test(t2) || /WPDesktop/.test(t2))
    return [ti, ""];
  if (new RegExp(xt).test(t2) && !/IEMobile\b/.test(t2))
    return [ei + " " + xt, ""];
  var i2 = /Windows NT ([0-9.]+)/i.exec(t2);
  if (i2 && i2[1]) {
    var r2 = i2[1], s2 = pi[r2] || "";
    return /arm/i.test(t2) && (s2 = "RT"), [ei, s2];
  }
  return [ei, ""];
}], [/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (e2) => {
  if (e2 && e2[3]) {
    var t2 = [e2[3], e2[4], e2[5] || "0"];
    return [It, t2.join(".")];
  }
  return [It, ""];
}], [/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (e2) => {
  var t2 = "";
  return e2 && e2.length >= 3 && (t2 = z(e2[2]) ? e2[3] : e2[2]), ["watchOS", t2];
}], [new RegExp("(" + Ct + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + Ct + ")", "i"), (e2) => {
  if (e2 && e2[2]) {
    var t2 = [e2[2], e2[3], e2[4] || "0"];
    return [Ct, t2.join(".")];
  }
  return [Ct, ""];
}], [/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (e2) => {
  var t2 = ["Mac OS X", ""];
  if (e2 && e2[1]) {
    var i2 = [e2[1], e2[2], e2[3] || "0"];
    t2[1] = i2.join(".");
  }
  return t2;
}], [/Mac/i, ["Mac OS X", ""]], [/CrOS/, [qt, ""]], [/Linux|debian/i, ["Linux", ""]]];
var bi = function(e2) {
  return hi.test(e2) ? Yt : di.test(e2) ? Kt : ui.test(e2) ? Xt : new RegExp(ri, "i").test(e2) ? ri : new RegExp("(" + ti + "|WPDesktop)", "i").test(e2) ? ti : /iPad/.test(e2) ? Tt : /iPod/.test(e2) ? "iPod Touch" : /iPhone/.test(e2) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(e2) ? $t : _i.test(e2) ? Mt : /(kobo)\s(ereader|touch)/i.test(e2) ? "Kobo" : new RegExp(ii, "i").test(e2) ? ii : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(e2) || /(kf[a-z]+)( bui|\)).+silk\//i.test(e2) ? "Kindle Fire" : /(Android|ZTE)/i.test(e2) ? !new RegExp(xt).test(e2) || /(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(e2) ? /pixel[\daxl ]{1,6}/i.test(e2) && !/pixel c/i.test(e2) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(e2) || /lmy47v/i.test(e2) && !/QTAQZ3/i.test(e2) ? Ct : Ft : Ct : new RegExp("(pda|" + xt + ")", "i").test(e2) ? ni : new RegExp(Pt, "i").test(e2) && !new RegExp(Pt + " pc", "i").test(e2) ? oi : "";
};
var yi = "https?://(.*)";
var wi = ["gclid", "gclsrc", "dclid", "gbraid", "wbraid", "fbclid", "msclkid", "twclid", "li_fat_id", "igshid", "ttclid", "rdt_cid", "irclid", "_kx"];
var Si = S(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gad_source", "mc_cid"], wi);
var ki = "<masked>";
var Ei = { campaignParams: function() {
  var { customTrackedParams: e2, maskPersonalDataProperties: t2, customPersonalDataProperties: i2 } = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
  if (!a)
    return {};
  var r2 = t2 ? S([], wi, i2 || []) : [];
  return this._campaignParamsFromUrl(kt(a.URL, r2, ki), e2);
}, _campaignParamsFromUrl: function(e2, t2) {
  var i2 = Si.concat(t2 || []), r2 = {};
  return y(i2, function(t3) {
    var i3 = St(e2, t3);
    r2[t3] = i3 || null;
  }), r2;
}, _searchEngine: function(e2) {
  return e2 ? 0 === e2.search(yi + "google.([^/?]*)") ? "google" : 0 === e2.search(yi + "bing.com") ? "bing" : 0 === e2.search(yi + "yahoo.com") ? "yahoo" : 0 === e2.search(yi + "duckduckgo.com") ? "duckduckgo" : null : null;
}, _searchInfoFromReferrer: function(e2) {
  var t2 = Ei._searchEngine(e2), i2 = "yahoo" != t2 ? "q" : "p", r2 = {};
  if (!G(t2)) {
    r2.$search_engine = t2;
    var s2 = a ? St(a.referrer, i2) : "";
    s2.length && (r2.ph_keyword = s2);
  }
  return r2;
}, searchInfo: function() {
  var e2 = null == a ? void 0 : a.referrer;
  return e2 ? this._searchInfoFromReferrer(e2) : {};
}, browser: gi, browserVersion: function(e2, t2) {
  var i2 = gi(e2, t2), r2 = fi[i2];
  if (z(r2))
    return null;
  for (var s2 = 0; s2 < r2.length; s2++) {
    var n2 = r2[s2], o2 = e2.match(n2);
    if (o2)
      return parseFloat(o2[o2.length - 2]);
  }
  return null;
}, browserLanguage: function() {
  return navigator.language || navigator.userLanguage;
}, browserLanguagePrefix: function() {
  var e2 = this.browserLanguage();
  return "string" == typeof e2 ? e2.split("-")[0] : void 0;
}, os: function(e2) {
  for (var t2 = 0; t2 < mi.length; t2++) {
    var [i2, r2] = mi[t2], s2 = i2.exec(e2), n2 = s2 && (H(r2) ? r2(s2, e2) : r2);
    if (n2)
      return n2;
  }
  return ["", ""];
}, device: bi, deviceType: function(e2) {
  var t2 = bi(e2);
  return t2 === Tt || t2 === Ft || "Kobo" === t2 || "Kindle Fire" === t2 || t2 === oi ? Pt : t2 === Yt || t2 === Xt || t2 === Kt || t2 === ri ? "Console" : t2 === $t ? "Wearable" : t2 ? xt : "Desktop";
}, referrer: function() {
  return (null == a ? void 0 : a.referrer) || "$direct";
}, referringDomain: function() {
  var e2;
  return null != a && a.referrer && (null === (e2 = yt(a.referrer)) || void 0 === e2 ? void 0 : e2.host) || "$direct";
}, referrerInfo: function() {
  return { $referrer: this.referrer(), $referring_domain: this.referringDomain() };
}, initialPersonInfo: function() {
  return { r: this.referrer().substring(0, 1e3), u: null == l ? void 0 : l.href.substring(0, 1e3) };
}, initialPersonPropsFromInfo: function(e2) {
  var t2, { r: i2, u: r2 } = e2, s2 = { $initial_referrer: i2, $initial_referring_domain: null == i2 ? void 0 : "$direct" == i2 ? "$direct" : null === (t2 = yt(i2)) || void 0 === t2 ? void 0 : t2.host };
  if (r2) {
    s2.$initial_current_url = r2;
    var n2 = yt(r2);
    s2.$initial_host = null == n2 ? void 0 : n2.host, s2.$initial_pathname = null == n2 ? void 0 : n2.pathname, y(this._campaignParamsFromUrl(r2), function(e3, t3) {
      s2["$initial_" + M(t3)] = e3;
    });
  }
  i2 && y(this._searchInfoFromReferrer(i2), function(e3, t3) {
    s2["$initial_" + M(t3)] = e3;
  });
  return s2;
}, timezone: function() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e2) {
    return;
  }
}, timezoneOffset: function() {
  try {
    return (/* @__PURE__ */ new Date()).getTimezoneOffset();
  } catch (e2) {
    return;
  }
}, properties: function() {
  var { maskPersonalDataProperties: e2, customPersonalDataProperties: i2 } = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
  if (!h)
    return {};
  var r2 = e2 ? S([], wi, i2 || []) : [], [s2, n2] = Ei.os(h);
  return w(I({ $os: s2, $os_version: n2, $browser: Ei.browser(h, navigator.vendor), $device: Ei.device(h), $device_type: Ei.deviceType(h), $timezone: Ei.timezone(), $timezone_offset: Ei.timezoneOffset() }), { $current_url: kt(null == l ? void 0 : l.href, r2, ki), $host: null == l ? void 0 : l.host, $pathname: null == l ? void 0 : l.pathname, $raw_user_agent: h.length > 1e3 ? h.substring(0, 997) + "..." : h, $browser_version: Ei.browserVersion(h, navigator.vendor), $browser_language: Ei.browserLanguage(), $browser_language_prefix: Ei.browserLanguagePrefix(), $screen_height: null == t ? void 0 : t.screen.height, $screen_width: null == t ? void 0 : t.screen.width, $viewport_height: null == t ? void 0 : t.innerHeight, $viewport_width: null == t ? void 0 : t.innerWidth, $lib: "web", $lib_version: p.LIB_VERSION, $insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10), $time: Date.now() / 1e3 });
}, people_properties: function() {
  if (!h)
    return {};
  var [e2, t2] = Ei.os(h);
  return w(I({ $os: e2, $os_version: t2, $browser: Ei.browser(h, navigator.vendor) }), { $browser_version: Ei.browserVersion(h, navigator.vendor) });
} };
var xi = ["cookie", "localstorage", "localstorage+cookie", "sessionstorage", "memory"];
var Ii = class {
  constructor(e2) {
    this.config = e2, this.props = {}, this.campaign_params_saved = false, this.name = ((e3) => {
      var t2 = "";
      return e3.token && (t2 = e3.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), e3.persistence_name ? "ph_" + e3.persistence_name : "ph_" + t2 + "_posthog";
    })(e2), this.storage = this.buildStorage(e2), this.load(), e2.debug && ee.info("Persistence loaded", e2.persistence, ne({}, this.props)), this.update_config(e2, e2), this.save();
  }
  buildStorage(e2) {
    -1 === xi.indexOf(e2.persistence.toLowerCase()) && (ee.critical("Unknown persistence type " + e2.persistence + "; falling back to localStorage+cookie"), e2.persistence = "localStorage+cookie");
    var t2 = e2.persistence.toLowerCase();
    return "localstorage" === t2 && ht.is_supported() ? ht : "localstorage+cookie" === t2 && pt.is_supported() ? pt : "sessionstorage" === t2 && mt.is_supported() ? mt : "memory" === t2 ? gt : "cookie" === t2 ? ut : pt.is_supported() ? pt : ut;
  }
  properties() {
    var e2 = {};
    return y(this.props, function(t2, i2) {
      if (i2 === Pe && U(t2))
        for (var r2 = Object.keys(t2), s2 = 0; s2 < r2.length; s2++)
          e2["$feature/".concat(r2[s2])] = t2[r2[s2]];
      else
        a2 = i2, l2 = false, (G(o2 = ze) ? l2 : n && o2.indexOf === n ? -1 != o2.indexOf(a2) : (y(o2, function(e3) {
          if (l2 || (l2 = e3 === a2))
            return m;
        }), l2)) || (e2[i2] = t2);
      var o2, a2, l2;
    }), e2;
  }
  load() {
    if (!this.disabled) {
      var e2 = this.storage.parse(this.name);
      e2 && (this.props = w({}, e2));
    }
  }
  save() {
    this.disabled || this.storage.set(this.name, this.props, this.expire_days, this.cross_subdomain, this.secure, this.config.debug);
  }
  remove() {
    this.storage.remove(this.name, false), this.storage.remove(this.name, true);
  }
  clear() {
    this.remove(), this.props = {};
  }
  register_once(e2, t2, i2) {
    if (U(e2)) {
      z(t2) && (t2 = "None"), this.expire_days = z(i2) ? this.default_expiry : i2;
      var r2 = false;
      if (y(e2, (e3, i3) => {
        this.props.hasOwnProperty(i3) && this.props[i3] !== t2 || (this.props[i3] = e3, r2 = true);
      }), r2)
        return this.save(), true;
    }
    return false;
  }
  register(e2, t2) {
    if (U(e2)) {
      this.expire_days = z(t2) ? this.default_expiry : t2;
      var i2 = false;
      if (y(e2, (t3, r2) => {
        e2.hasOwnProperty(r2) && this.props[r2] !== t3 && (this.props[r2] = t3, i2 = true);
      }), i2)
        return this.save(), true;
    }
    return false;
  }
  unregister(e2) {
    e2 in this.props && (delete this.props[e2], this.save());
  }
  update_campaign_params() {
    if (!this.campaign_params_saved) {
      var e2 = Ei.campaignParams({ customTrackedParams: this.config.custom_campaign_params, maskPersonalDataProperties: this.config.mask_personal_data_properties, customPersonalDataProperties: this.config.custom_personal_data_properties });
      j(I(e2)) || this.register(e2), this.campaign_params_saved = true;
    }
  }
  update_search_keyword() {
    this.register(Ei.searchInfo());
  }
  update_referrer_info() {
    this.register_once(Ei.referrerInfo(), void 0);
  }
  set_initial_person_info() {
    this.props[Ne] || this.props[qe] || this.register_once({ [Be]: Ei.initialPersonInfo() }, void 0);
  }
  get_referrer_info() {
    return I({ $referrer: this.props.$referrer, $referring_domain: this.props.$referring_domain });
  }
  get_initial_props() {
    var e2 = {};
    y([qe, Ne], (t3) => {
      var i3 = this.props[t3];
      i3 && y(i3, function(t4, i4) {
        e2["$initial_" + M(i4)] = t4;
      });
    });
    var t2 = this.props[Be];
    if (t2) {
      var i2 = Ei.initialPersonPropsFromInfo(t2);
      w(e2, i2);
    }
    return e2;
  }
  safe_merge(e2) {
    return y(this.props, function(t2, i2) {
      i2 in e2 || (e2[i2] = t2);
    }), e2;
  }
  update_config(e2, t2) {
    if (this.default_expiry = this.expire_days = e2.cookie_expiration, this.set_disabled(e2.disable_persistence), this.set_cross_subdomain(e2.cross_subdomain_cookie), this.set_secure(e2.secure_cookie), e2.persistence !== t2.persistence) {
      var i2 = this.buildStorage(e2), r2 = this.props;
      this.clear(), this.storage = i2, this.props = r2, this.save();
    }
  }
  set_disabled(e2) {
    this.disabled = e2, this.disabled ? this.remove() : this.save();
  }
  set_cross_subdomain(e2) {
    e2 !== this.cross_subdomain && (this.cross_subdomain = e2, this.remove(), this.save());
  }
  get_cross_subdomain() {
    return !!this.cross_subdomain;
  }
  set_secure(e2) {
    e2 !== this.secure && (this.secure = e2, this.remove(), this.save());
  }
  set_event_timer(e2, t2) {
    var i2 = this.props[ue] || {};
    i2[e2] = t2, this.props[ue] = i2, this.save();
  }
  remove_event_timer(e2) {
    var t2 = (this.props[ue] || {})[e2];
    return z(t2) || (delete this.props[ue][e2], this.save()), t2;
  }
  get_property(e2) {
    return this.props[e2];
  }
  set_property(e2, t2) {
    this.props[e2] = t2, this.save();
  }
};
function Ci(e2) {
  var t2, i2;
  return (null === (t2 = JSON.stringify(e2, (i2 = [], function(e3, t3) {
    if (U(t3)) {
      for (; i2.length > 0 && i2[i2.length - 1] !== this; )
        i2.pop();
      return i2.includes(t3) ? "[Circular]" : (i2.push(t3), t3);
    }
    return t3;
  }))) || void 0 === t2 ? void 0 : t2.length) || 0;
}
function Pi(e2) {
  var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 66060288e-1;
  if (e2.size >= t2 && e2.data.length > 1) {
    var i2 = Math.floor(e2.data.length / 2), r2 = e2.data.slice(0, i2), s2 = e2.data.slice(i2);
    return [Pi({ size: Ci(r2), data: r2, sessionId: e2.sessionId, windowId: e2.windowId }), Pi({ size: Ci(s2), data: s2, sessionId: e2.sessionId, windowId: e2.windowId })].flatMap((e3) => e3);
  }
  return [e2];
}
var Fi = ((e2) => (e2[e2.DomContentLoaded = 0] = "DomContentLoaded", e2[e2.Load = 1] = "Load", e2[e2.FullSnapshot = 2] = "FullSnapshot", e2[e2.IncrementalSnapshot = 3] = "IncrementalSnapshot", e2[e2.Meta = 4] = "Meta", e2[e2.Custom = 5] = "Custom", e2[e2.Plugin = 6] = "Plugin", e2))(Fi || {});
var Ti = ((e2) => (e2[e2.Mutation = 0] = "Mutation", e2[e2.MouseMove = 1] = "MouseMove", e2[e2.MouseInteraction = 2] = "MouseInteraction", e2[e2.Scroll = 3] = "Scroll", e2[e2.ViewportResize = 4] = "ViewportResize", e2[e2.Input = 5] = "Input", e2[e2.TouchMove = 6] = "TouchMove", e2[e2.MediaInteraction = 7] = "MediaInteraction", e2[e2.StyleSheetRule = 8] = "StyleSheetRule", e2[e2.CanvasMutation = 9] = "CanvasMutation", e2[e2.Font = 10] = "Font", e2[e2.Log = 11] = "Log", e2[e2.Drag = 12] = "Drag", e2[e2.StyleDeclaration = 13] = "StyleDeclaration", e2[e2.Selection = 14] = "Selection", e2[e2.AdoptedStyleSheet = 15] = "AdoptedStyleSheet", e2[e2.CustomElement = 16] = "CustomElement", e2))(Ti || {});
function Ri(e2) {
  var t2;
  return e2 instanceof Element && (e2.id === Ue || !(null === (t2 = e2.closest) || void 0 === t2 || !t2.call(e2, ".toolbar-global-fade-container")));
}
function $i(e2) {
  return !!e2 && 1 === e2.nodeType;
}
function Oi(e2, t2) {
  return !!e2 && !!e2.tagName && e2.tagName.toLowerCase() === t2.toLowerCase();
}
function Mi(e2) {
  return !!e2 && 3 === e2.nodeType;
}
function Ai(e2) {
  return !!e2 && 11 === e2.nodeType;
}
function Li(e2) {
  return e2 ? O(e2).split(/\s+/) : [];
}
function Di(e2) {
  var i2 = null == t ? void 0 : t.location.href;
  return !!(i2 && e2 && e2.some((e3) => i2.match(e3)));
}
function Ni(e2) {
  var t2 = "";
  switch (typeof e2.className) {
    case "string":
      t2 = e2.className;
      break;
    case "object":
      t2 = (e2.className && "baseVal" in e2.className ? e2.className.baseVal : null) || e2.getAttribute("class") || "";
      break;
    default:
      t2 = "";
  }
  return Li(t2);
}
function qi(e2) {
  return J(e2) ? null : O(e2).split(/(\s+)/).filter((e3) => Zi(e3)).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
}
function Bi(e2) {
  var t2 = "";
  return Wi(e2) && !Vi(e2) && e2.childNodes && e2.childNodes.length && y(e2.childNodes, function(e3) {
    var i2;
    Mi(e3) && e3.textContent && (t2 += null !== (i2 = qi(e3.textContent)) && void 0 !== i2 ? i2 : "");
  }), O(t2);
}
function Hi(e2) {
  return z(e2.target) ? e2.srcElement || null : null !== (t2 = e2.target) && void 0 !== t2 && t2.shadowRoot ? e2.composedPath()[0] || null : e2.target || null;
  var t2;
}
var Ui = ["a", "button", "form", "input", "select", "textarea", "label"];
function ji(e2) {
  var t2 = e2.parentNode;
  return !(!t2 || !$i(t2)) && t2;
}
function zi(e2, i2) {
  var r2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0, s2 = arguments.length > 3 ? arguments[3] : void 0, n2 = arguments.length > 4 ? arguments[4] : void 0;
  if (!t || !e2 || Oi(e2, "html") || !$i(e2))
    return false;
  if (null != r2 && r2.url_allowlist && !Di(r2.url_allowlist))
    return false;
  if (null != r2 && r2.url_ignorelist && Di(r2.url_ignorelist))
    return false;
  if (null != r2 && r2.dom_event_allowlist) {
    var o2 = r2.dom_event_allowlist;
    if (o2 && !o2.some((e3) => i2.type === e3))
      return false;
  }
  for (var a2 = false, l2 = [e2], c2 = true, u2 = e2; u2.parentNode && !Oi(u2, "body"); )
    if (Ai(u2.parentNode))
      l2.push(u2.parentNode.host), u2 = u2.parentNode.host;
    else {
      if (!(c2 = ji(u2)))
        break;
      if (s2 || Ui.indexOf(c2.tagName.toLowerCase()) > -1)
        a2 = true;
      else {
        var d2 = t.getComputedStyle(c2);
        d2 && "pointer" === d2.getPropertyValue("cursor") && (a2 = true);
      }
      l2.push(c2), u2 = c2;
    }
  if (!function(e3, t2) {
    var i3 = null == t2 ? void 0 : t2.element_allowlist;
    if (z(i3))
      return true;
    var r3 = function(e4) {
      if (i3.some((t3) => e4.tagName.toLowerCase() === t3))
        return { v: true };
    };
    for (var s3 of e3) {
      var n3 = r3(s3);
      if ("object" == typeof n3)
        return n3.v;
    }
    return false;
  }(l2, r2))
    return false;
  if (!function(e3, t2) {
    var i3 = null == t2 ? void 0 : t2.css_selector_allowlist;
    if (z(i3))
      return true;
    var r3 = function(e4) {
      if (i3.some((t3) => e4.matches(t3)))
        return { v: true };
    };
    for (var s3 of e3) {
      var n3 = r3(s3);
      if ("object" == typeof n3)
        return n3.v;
    }
    return false;
  }(l2, r2))
    return false;
  var h2 = t.getComputedStyle(e2);
  if (h2 && "pointer" === h2.getPropertyValue("cursor") && "click" === i2.type)
    return true;
  var _2 = e2.tagName.toLowerCase();
  switch (_2) {
    case "html":
      return false;
    case "form":
      return (n2 || ["submit"]).indexOf(i2.type) >= 0;
    case "input":
    case "select":
    case "textarea":
      return (n2 || ["change", "click"]).indexOf(i2.type) >= 0;
    default:
      return a2 ? (n2 || ["click"]).indexOf(i2.type) >= 0 : (n2 || ["click"]).indexOf(i2.type) >= 0 && (Ui.indexOf(_2) > -1 || "true" === e2.getAttribute("contenteditable"));
  }
}
function Wi(e2) {
  for (var t2 = e2; t2.parentNode && !Oi(t2, "body"); t2 = t2.parentNode) {
    var i2 = Ni(t2);
    if ($(i2, "ph-sensitive") || $(i2, "ph-no-capture"))
      return false;
  }
  if ($(Ni(e2), "ph-include"))
    return true;
  var r2 = e2.type || "";
  if (W(r2))
    switch (r2.toLowerCase()) {
      case "hidden":
      case "password":
        return false;
    }
  var s2 = e2.name || e2.id || "";
  if (W(s2)) {
    if (/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(s2.replace(/[^a-zA-Z0-9]/g, "")))
      return false;
  }
  return true;
}
function Vi(e2) {
  return !!(Oi(e2, "input") && !["button", "checkbox", "submit", "reset"].includes(e2.type) || Oi(e2, "select") || Oi(e2, "textarea") || "true" === e2.getAttribute("contenteditable"));
}
var Gi = "(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})";
var Ji = new RegExp("^(?:".concat(Gi, ")$"));
var Yi = new RegExp(Gi);
var Ki = "\\d{3}-?\\d{2}-?\\d{4}";
var Xi = new RegExp("^(".concat(Ki, ")$"));
var Qi = new RegExp("(".concat(Ki, ")"));
function Zi(e2) {
  var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
  if (J(e2))
    return false;
  if (W(e2)) {
    if (e2 = O(e2), (t2 ? Ji : Yi).test((e2 || "").replace(/[- ]/g, "")))
      return false;
    if ((t2 ? Xi : Qi).test(e2))
      return false;
  }
  return true;
}
function er(e2) {
  var t2 = Bi(e2);
  return Zi(t2 = "".concat(t2, " ").concat(tr(e2)).trim()) ? t2 : "";
}
function tr(e2) {
  var t2 = "";
  return e2 && e2.childNodes && e2.childNodes.length && y(e2.childNodes, function(e3) {
    var i2;
    if (e3 && "span" === (null === (i2 = e3.tagName) || void 0 === i2 ? void 0 : i2.toLowerCase()))
      try {
        var r2 = Bi(e3);
        t2 = "".concat(t2, " ").concat(r2).trim(), e3.childNodes && e3.childNodes.length && (t2 = "".concat(t2, " ").concat(tr(e3)).trim());
      } catch (e4) {
        ee.error("[AutoCapture]", e4);
      }
  }), t2;
}
function ir(e2) {
  return function(e3) {
    var t2 = e3.map((e4) => {
      var t3, i2, r2 = "";
      if (e4.tag_name && (r2 += e4.tag_name), e4.attr_class)
        for (var s2 of (e4.attr_class.sort(), e4.attr_class))
          r2 += ".".concat(s2.replace(/"/g, ""));
      var n2 = ne(ne(ne(ne({}, e4.text ? { text: e4.text } : {}), {}, { "nth-child": null !== (t3 = e4.nth_child) && void 0 !== t3 ? t3 : 0, "nth-of-type": null !== (i2 = e4.nth_of_type) && void 0 !== i2 ? i2 : 0 }, e4.href ? { href: e4.href } : {}), e4.attr_id ? { attr_id: e4.attr_id } : {}), e4.attributes), o2 = {};
      return k(n2).sort((e5, t4) => {
        var [i3] = e5, [r3] = t4;
        return i3.localeCompare(r3);
      }).forEach((e5) => {
        var [t4, i3] = e5;
        return o2[rr(t4.toString())] = rr(i3.toString());
      }), r2 += ":", r2 += k(n2).map((e5) => {
        var [t4, i3] = e5;
        return "".concat(t4, '="').concat(i3, '"');
      }).join("");
    });
    return t2.join(";");
  }(function(e3) {
    return e3.map((e4) => {
      var t2, i2, r2 = { text: null === (t2 = e4.$el_text) || void 0 === t2 ? void 0 : t2.slice(0, 400), tag_name: e4.tag_name, href: null === (i2 = e4.attr__href) || void 0 === i2 ? void 0 : i2.slice(0, 2048), attr_class: sr(e4), attr_id: e4.attr__id, nth_child: e4.nth_child, nth_of_type: e4.nth_of_type, attributes: {} };
      return k(e4).filter((e5) => {
        var [t3] = e5;
        return 0 === t3.indexOf("attr__");
      }).forEach((e5) => {
        var [t3, i3] = e5;
        return r2.attributes[t3] = i3;
      }), r2;
    });
  }(e2));
}
function rr(e2) {
  return e2.replace(/"|\\"/g, '\\"');
}
function sr(e2) {
  var t2 = e2.attr__class;
  return t2 ? B(t2) ? t2 : Li(t2) : void 0;
}
var nr = "[SessionRecording]";
var or = "redacted";
var ar = { initiatorTypes: ["audio", "beacon", "body", "css", "early-hint", "embed", "fetch", "frame", "iframe", "icon", "image", "img", "input", "link", "navigation", "object", "ping", "script", "track", "video", "xmlhttprequest"], maskRequestFn: (e2) => e2, recordHeaders: false, recordBody: false, recordInitialRequests: false, recordPerformance: false, performanceEntryTypeToObserve: ["first-input", "navigation", "paint", "resource"], payloadSizeLimitBytes: 1e6, payloadHostDenyList: [".lr-ingest.io", ".ingest.sentry.io", ".clarity.ms", "analytics.google.com"] };
var lr = ["authorization", "x-forwarded-for", "authorization", "cookie", "set-cookie", "x-api-key", "x-real-ip", "remote-addr", "forwarded", "proxy-authorization", "x-csrf-token", "x-csrftoken", "x-xsrf-token"];
var cr = ["password", "secret", "passwd", "api_key", "apikey", "auth", "credentials", "mysql_pwd", "privatekey", "private_key", "token"];
var ur = ["/s/", "/e/", "/i/"];
function dr(e2, t2, i2, r2) {
  if (J(e2))
    return e2;
  var s2 = (null == t2 ? void 0 : t2["content-length"]) || function(e3) {
    return new Blob([e3]).size;
  }(e2);
  return W(s2) && (s2 = parseInt(s2)), s2 > i2 ? nr + " ".concat(r2, " body too large to record (").concat(s2, " bytes)") : e2;
}
function hr(e2, t2) {
  if (J(e2))
    return e2;
  var i2 = e2;
  return Zi(i2, false) || (i2 = nr + " " + t2 + " body " + or), y(cr, (e3) => {
    var r2, s2;
    null !== (r2 = i2) && void 0 !== r2 && r2.length && -1 !== (null === (s2 = i2) || void 0 === s2 ? void 0 : s2.indexOf(e3)) && (i2 = nr + " " + t2 + " body " + or + " as might contain: " + e3);
  }), i2;
}
var _r = (e2, t2) => {
  var i2, r2, s2, n2 = { payloadSizeLimitBytes: ar.payloadSizeLimitBytes, performanceEntryTypeToObserve: [...ar.performanceEntryTypeToObserve], payloadHostDenyList: [...t2.payloadHostDenyList || [], ...ar.payloadHostDenyList] }, o2 = false !== e2.session_recording.recordHeaders && t2.recordHeaders, a2 = false !== e2.session_recording.recordBody && t2.recordBody, l2 = false !== e2.capture_performance && t2.recordPerformance, c2 = (i2 = n2, s2 = Math.min(1e6, null !== (r2 = i2.payloadSizeLimitBytes) && void 0 !== r2 ? r2 : 1e6), (e3) => (null != e3 && e3.requestBody && (e3.requestBody = dr(e3.requestBody, e3.requestHeaders, s2, "Request")), null != e3 && e3.responseBody && (e3.responseBody = dr(e3.responseBody, e3.responseHeaders, s2, "Response")), e3)), u2 = (t3) => {
    return c2(((e3, t4) => {
      var i4, r4 = yt(e3.name), s3 = 0 === t4.indexOf("http") ? null === (i4 = yt(t4)) || void 0 === i4 ? void 0 : i4.pathname : t4;
      "/" === s3 && (s3 = "");
      var n3 = null == r4 ? void 0 : r4.pathname.replace(s3 || "", "");
      if (!(r4 && n3 && ur.some((e4) => 0 === n3.indexOf(e4))))
        return e3;
    })((r3 = (i3 = t3).requestHeaders, J(r3) || y(Object.keys(null != r3 ? r3 : {}), (e3) => {
      lr.includes(e3.toLowerCase()) && (r3[e3] = or);
    }), i3), e2.api_host));
    var i3, r3;
  }, d2 = H(e2.session_recording.maskNetworkRequestFn);
  return d2 && H(e2.session_recording.maskCapturedNetworkRequestFn) && ee.warn("Both `maskNetworkRequestFn` and `maskCapturedNetworkRequestFn` are defined. `maskNetworkRequestFn` will be ignored."), d2 && (e2.session_recording.maskCapturedNetworkRequestFn = (t3) => {
    var i3 = e2.session_recording.maskNetworkRequestFn({ url: t3.name });
    return ne(ne({}, t3), {}, { name: null == i3 ? void 0 : i3.url });
  }), n2.maskRequestFn = H(e2.session_recording.maskCapturedNetworkRequestFn) ? (t3) => {
    var i3, r3, s3, n3 = u2(t3);
    return n3 && null !== (i3 = null === (r3 = (s3 = e2.session_recording).maskCapturedNetworkRequestFn) || void 0 === r3 ? void 0 : r3.call(s3, n3)) && void 0 !== i3 ? i3 : void 0;
  } : (e3) => function(e4) {
    if (!z(e4))
      return e4.requestBody = hr(e4.requestBody, "Request"), e4.responseBody = hr(e4.responseBody, "Response"), e4;
  }(u2(e3)), ne(ne(ne({}, ar), n2), {}, { recordHeaders: o2, recordBody: a2, recordPerformance: l2, recordInitialRequests: l2 });
};
function pr(e2, t2, i2, r2, s2) {
  return t2 > i2 && (ee.warn("min cannot be greater than max."), t2 = i2), Y(e2) ? e2 > i2 ? (r2 && ee.warn(r2 + " cannot be  greater than max: " + i2 + ". Using max value instead."), i2) : e2 < t2 ? (r2 && ee.warn(r2 + " cannot be less than min: " + t2 + ". Using min value instead."), t2) : e2 : (r2 && ee.warn(r2 + " must be a number. using max or fallback. max: " + i2 + ", fallback: " + s2), pr(s2 || i2, t2, i2, r2));
}
var vr = class {
  constructor(e2) {
    var t2, i2, r2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    oe(this, "bucketSize", 100), oe(this, "refillRate", 10), oe(this, "mutationBuckets", {}), oe(this, "loggedTracker", {}), oe(this, "refillBuckets", () => {
      Object.keys(this.mutationBuckets).forEach((e3) => {
        this.mutationBuckets[e3] = this.mutationBuckets[e3] + this.refillRate, this.mutationBuckets[e3] >= this.bucketSize && delete this.mutationBuckets[e3];
      });
    }), oe(this, "getNodeOrRelevantParent", (e3) => {
      var t3 = this.rrweb.mirror.getNode(e3);
      if ("svg" !== (null == t3 ? void 0 : t3.nodeName) && t3 instanceof Element) {
        var i3 = t3.closest("svg");
        if (i3)
          return [this.rrweb.mirror.getId(i3), i3];
      }
      return [e3, t3];
    }), oe(this, "numberOfChanges", (e3) => {
      var t3, i3, r3, s2, n2, o2, a2, l2;
      return (null !== (t3 = null === (i3 = e3.removes) || void 0 === i3 ? void 0 : i3.length) && void 0 !== t3 ? t3 : 0) + (null !== (r3 = null === (s2 = e3.attributes) || void 0 === s2 ? void 0 : s2.length) && void 0 !== r3 ? r3 : 0) + (null !== (n2 = null === (o2 = e3.texts) || void 0 === o2 ? void 0 : o2.length) && void 0 !== n2 ? n2 : 0) + (null !== (a2 = null === (l2 = e3.adds) || void 0 === l2 ? void 0 : l2.length) && void 0 !== a2 ? a2 : 0);
    }), oe(this, "throttleMutations", (e3) => {
      if (3 !== e3.type || 0 !== e3.data.source)
        return e3;
      var t3 = e3.data, i3 = this.numberOfChanges(t3);
      t3.attributes && (t3.attributes = t3.attributes.filter((e4) => {
        var t4, i4, r4, [s2, n2] = this.getNodeOrRelevantParent(e4.id);
        if (0 === this.mutationBuckets[s2])
          return false;
        (this.mutationBuckets[s2] = null !== (t4 = this.mutationBuckets[s2]) && void 0 !== t4 ? t4 : this.bucketSize, this.mutationBuckets[s2] = Math.max(this.mutationBuckets[s2] - 1, 0), 0 === this.mutationBuckets[s2]) && (this.loggedTracker[s2] || (this.loggedTracker[s2] = true, null === (i4 = (r4 = this.options).onBlockedNode) || void 0 === i4 || i4.call(r4, s2, n2)));
        return e4;
      }));
      var r3 = this.numberOfChanges(t3);
      return 0 !== r3 || i3 === r3 ? e3 : void 0;
    }), this.rrweb = e2, this.options = r2, this.refillRate = pr(null !== (t2 = this.options.refillRate) && void 0 !== t2 ? t2 : this.refillRate, 0, 100, "mutation throttling refill rate"), this.bucketSize = pr(null !== (i2 = this.options.bucketSize) && void 0 !== i2 ? i2 : this.bucketSize, 0, 100, "mutation throttling bucket size"), setInterval(() => {
      this.refillBuckets();
    }, 1e3);
  }
};
var gr = Uint8Array;
var fr = Uint16Array;
var mr = Uint32Array;
var br = new gr([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
var yr = new gr([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
var wr = new gr([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var Sr = function(e2, t2) {
  for (var i2 = new fr(31), r2 = 0; r2 < 31; ++r2)
    i2[r2] = t2 += 1 << e2[r2 - 1];
  var s2 = new mr(i2[30]);
  for (r2 = 1; r2 < 30; ++r2)
    for (var n2 = i2[r2]; n2 < i2[r2 + 1]; ++n2)
      s2[n2] = n2 - i2[r2] << 5 | r2;
  return [i2, s2];
};
var kr = Sr(br, 2);
var Er = kr[0];
var xr = kr[1];
Er[28] = 258, xr[258] = 28;
for (Ir = Sr(yr, 0)[1], Cr = new fr(32768), Pr = 0; Pr < 32768; ++Pr) {
  Fr = (43690 & Pr) >>> 1 | (21845 & Pr) << 1;
  Fr = (61680 & (Fr = (52428 & Fr) >>> 2 | (13107 & Fr) << 2)) >>> 4 | (3855 & Fr) << 4, Cr[Pr] = ((65280 & Fr) >>> 8 | (255 & Fr) << 8) >>> 1;
}
var Fr;
var Ir;
var Cr;
var Pr;
var Tr = function(e2, t2, i2) {
  for (var r2 = e2.length, s2 = 0, n2 = new fr(t2); s2 < r2; ++s2)
    ++n2[e2[s2] - 1];
  var o2, a2 = new fr(t2);
  for (s2 = 0; s2 < t2; ++s2)
    a2[s2] = a2[s2 - 1] + n2[s2 - 1] << 1;
  if (i2) {
    o2 = new fr(1 << t2);
    var l2 = 15 - t2;
    for (s2 = 0; s2 < r2; ++s2)
      if (e2[s2])
        for (var c2 = s2 << 4 | e2[s2], u2 = t2 - e2[s2], d2 = a2[e2[s2] - 1]++ << u2, h2 = d2 | (1 << u2) - 1; d2 <= h2; ++d2)
          o2[Cr[d2] >>> l2] = c2;
  } else
    for (o2 = new fr(r2), s2 = 0; s2 < r2; ++s2)
      o2[s2] = Cr[a2[e2[s2] - 1]++] >>> 15 - e2[s2];
  return o2;
};
var Rr = new gr(288);
for (Pr = 0; Pr < 144; ++Pr)
  Rr[Pr] = 8;
for (Pr = 144; Pr < 256; ++Pr)
  Rr[Pr] = 9;
for (Pr = 256; Pr < 280; ++Pr)
  Rr[Pr] = 7;
for (Pr = 280; Pr < 288; ++Pr)
  Rr[Pr] = 8;
var $r = new gr(32);
for (Pr = 0; Pr < 32; ++Pr)
  $r[Pr] = 5;
var Or = Tr(Rr, 9, 0);
var Mr = Tr($r, 5, 0);
var Ar = function(e2) {
  return (e2 / 8 >> 0) + (7 & e2 && 1);
};
var Lr = function(e2, t2, i2) {
  (null == i2 || i2 > e2.length) && (i2 = e2.length);
  var r2 = new (e2 instanceof fr ? fr : e2 instanceof mr ? mr : gr)(i2 - t2);
  return r2.set(e2.subarray(t2, i2)), r2;
};
var Dr = function(e2, t2, i2) {
  i2 <<= 7 & t2;
  var r2 = t2 / 8 >> 0;
  e2[r2] |= i2, e2[r2 + 1] |= i2 >>> 8;
};
var Nr = function(e2, t2, i2) {
  i2 <<= 7 & t2;
  var r2 = t2 / 8 >> 0;
  e2[r2] |= i2, e2[r2 + 1] |= i2 >>> 8, e2[r2 + 2] |= i2 >>> 16;
};
var qr = function(e2, t2) {
  for (var i2 = [], r2 = 0; r2 < e2.length; ++r2)
    e2[r2] && i2.push({ s: r2, f: e2[r2] });
  var s2 = i2.length, n2 = i2.slice();
  if (!s2)
    return [new gr(0), 0];
  if (1 == s2) {
    var o2 = new gr(i2[0].s + 1);
    return o2[i2[0].s] = 1, [o2, 1];
  }
  i2.sort(function(e3, t3) {
    return e3.f - t3.f;
  }), i2.push({ s: -1, f: 25001 });
  var a2 = i2[0], l2 = i2[1], c2 = 0, u2 = 1, d2 = 2;
  for (i2[0] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 }; u2 != s2 - 1; )
    a2 = i2[i2[c2].f < i2[d2].f ? c2++ : d2++], l2 = i2[c2 != u2 && i2[c2].f < i2[d2].f ? c2++ : d2++], i2[u2++] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 };
  var h2 = n2[0].s;
  for (r2 = 1; r2 < s2; ++r2)
    n2[r2].s > h2 && (h2 = n2[r2].s);
  var _2 = new fr(h2 + 1), p2 = Br(i2[u2 - 1], _2, 0);
  if (p2 > t2) {
    r2 = 0;
    var v2 = 0, g2 = p2 - t2, f2 = 1 << g2;
    for (n2.sort(function(e3, t3) {
      return _2[t3.s] - _2[e3.s] || e3.f - t3.f;
    }); r2 < s2; ++r2) {
      var m2 = n2[r2].s;
      if (!(_2[m2] > t2))
        break;
      v2 += f2 - (1 << p2 - _2[m2]), _2[m2] = t2;
    }
    for (v2 >>>= g2; v2 > 0; ) {
      var b2 = n2[r2].s;
      _2[b2] < t2 ? v2 -= 1 << t2 - _2[b2]++ - 1 : ++r2;
    }
    for (; r2 >= 0 && v2; --r2) {
      var y2 = n2[r2].s;
      _2[y2] == t2 && (--_2[y2], ++v2);
    }
    p2 = t2;
  }
  return [new gr(_2), p2];
};
var Br = function(e2, t2, i2) {
  return -1 == e2.s ? Math.max(Br(e2.l, t2, i2 + 1), Br(e2.r, t2, i2 + 1)) : t2[e2.s] = i2;
};
var Hr = function(e2) {
  for (var t2 = e2.length; t2 && !e2[--t2]; )
    ;
  for (var i2 = new fr(++t2), r2 = 0, s2 = e2[0], n2 = 1, o2 = function(e3) {
    i2[r2++] = e3;
  }, a2 = 1; a2 <= t2; ++a2)
    if (e2[a2] == s2 && a2 != t2)
      ++n2;
    else {
      if (!s2 && n2 > 2) {
        for (; n2 > 138; n2 -= 138)
          o2(32754);
        n2 > 2 && (o2(n2 > 10 ? n2 - 11 << 5 | 28690 : n2 - 3 << 5 | 12305), n2 = 0);
      } else if (n2 > 3) {
        for (o2(s2), --n2; n2 > 6; n2 -= 6)
          o2(8304);
        n2 > 2 && (o2(n2 - 3 << 5 | 8208), n2 = 0);
      }
      for (; n2--; )
        o2(s2);
      n2 = 1, s2 = e2[a2];
    }
  return [i2.subarray(0, r2), t2];
};
var Ur = function(e2, t2) {
  for (var i2 = 0, r2 = 0; r2 < t2.length; ++r2)
    i2 += e2[r2] * t2[r2];
  return i2;
};
var jr = function(e2, t2, i2) {
  var r2 = i2.length, s2 = Ar(t2 + 2);
  e2[s2] = 255 & r2, e2[s2 + 1] = r2 >>> 8, e2[s2 + 2] = 255 ^ e2[s2], e2[s2 + 3] = 255 ^ e2[s2 + 1];
  for (var n2 = 0; n2 < r2; ++n2)
    e2[s2 + n2 + 4] = i2[n2];
  return 8 * (s2 + 4 + r2);
};
var zr = function(e2, t2, i2, r2, s2, n2, o2, a2, l2, c2, u2) {
  Dr(t2, u2++, i2), ++s2[256];
  for (var d2 = qr(s2, 15), h2 = d2[0], _2 = d2[1], p2 = qr(n2, 15), v2 = p2[0], g2 = p2[1], f2 = Hr(h2), m2 = f2[0], b2 = f2[1], y2 = Hr(v2), w2 = y2[0], S2 = y2[1], k2 = new fr(19), E2 = 0; E2 < m2.length; ++E2)
    k2[31 & m2[E2]]++;
  for (E2 = 0; E2 < w2.length; ++E2)
    k2[31 & w2[E2]]++;
  for (var x2 = qr(k2, 7), I2 = x2[0], C2 = x2[1], P2 = 19; P2 > 4 && !I2[wr[P2 - 1]]; --P2)
    ;
  var F2, T2, R2, $2, O2 = c2 + 5 << 3, M2 = Ur(s2, Rr) + Ur(n2, $r) + o2, A2 = Ur(s2, h2) + Ur(n2, v2) + o2 + 14 + 3 * P2 + Ur(k2, I2) + (2 * k2[16] + 3 * k2[17] + 7 * k2[18]);
  if (O2 <= M2 && O2 <= A2)
    return jr(t2, u2, e2.subarray(l2, l2 + c2));
  if (Dr(t2, u2, 1 + (A2 < M2)), u2 += 2, A2 < M2) {
    F2 = Tr(h2, _2, 0), T2 = h2, R2 = Tr(v2, g2, 0), $2 = v2;
    var L2 = Tr(I2, C2, 0);
    Dr(t2, u2, b2 - 257), Dr(t2, u2 + 5, S2 - 1), Dr(t2, u2 + 10, P2 - 4), u2 += 14;
    for (E2 = 0; E2 < P2; ++E2)
      Dr(t2, u2 + 3 * E2, I2[wr[E2]]);
    u2 += 3 * P2;
    for (var D2 = [m2, w2], N2 = 0; N2 < 2; ++N2) {
      var q2 = D2[N2];
      for (E2 = 0; E2 < q2.length; ++E2) {
        var B2 = 31 & q2[E2];
        Dr(t2, u2, L2[B2]), u2 += I2[B2], B2 > 15 && (Dr(t2, u2, q2[E2] >>> 5 & 127), u2 += q2[E2] >>> 12);
      }
    }
  } else
    F2 = Or, T2 = Rr, R2 = Mr, $2 = $r;
  for (E2 = 0; E2 < a2; ++E2)
    if (r2[E2] > 255) {
      B2 = r2[E2] >>> 18 & 31;
      Nr(t2, u2, F2[B2 + 257]), u2 += T2[B2 + 257], B2 > 7 && (Dr(t2, u2, r2[E2] >>> 23 & 31), u2 += br[B2]);
      var H2 = 31 & r2[E2];
      Nr(t2, u2, R2[H2]), u2 += $2[H2], H2 > 3 && (Nr(t2, u2, r2[E2] >>> 5 & 8191), u2 += yr[H2]);
    } else
      Nr(t2, u2, F2[r2[E2]]), u2 += T2[r2[E2]];
  return Nr(t2, u2, F2[256]), u2 + T2[256];
};
var Wr = new mr([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var Vr = function() {
  for (var e2 = new mr(256), t2 = 0; t2 < 256; ++t2) {
    for (var i2 = t2, r2 = 9; --r2; )
      i2 = (1 & i2 && 3988292384) ^ i2 >>> 1;
    e2[t2] = i2;
  }
  return e2;
}();
var Gr = function() {
  var e2 = 4294967295;
  return { p: function(t2) {
    for (var i2 = e2, r2 = 0; r2 < t2.length; ++r2)
      i2 = Vr[255 & i2 ^ t2[r2]] ^ i2 >>> 8;
    e2 = i2;
  }, d: function() {
    return 4294967295 ^ e2;
  } };
};
var Jr = function(e2, t2, i2, r2, s2) {
  return function(e3, t3, i3, r3, s3, n2) {
    var o2 = e3.length, a2 = new gr(r3 + o2 + 5 * (1 + Math.floor(o2 / 7e3)) + s3), l2 = a2.subarray(r3, a2.length - s3), c2 = 0;
    if (!t3 || o2 < 8)
      for (var u2 = 0; u2 <= o2; u2 += 65535) {
        var d2 = u2 + 65535;
        d2 < o2 ? c2 = jr(l2, c2, e3.subarray(u2, d2)) : (l2[u2] = n2, c2 = jr(l2, c2, e3.subarray(u2, o2)));
      }
    else {
      for (var h2 = Wr[t3 - 1], _2 = h2 >>> 13, p2 = 8191 & h2, v2 = (1 << i3) - 1, g2 = new fr(32768), f2 = new fr(v2 + 1), m2 = Math.ceil(i3 / 3), b2 = 2 * m2, y2 = function(t4) {
        return (e3[t4] ^ e3[t4 + 1] << m2 ^ e3[t4 + 2] << b2) & v2;
      }, w2 = new mr(25e3), S2 = new fr(288), k2 = new fr(32), E2 = 0, x2 = 0, I2 = (u2 = 0, 0), C2 = 0, P2 = 0; u2 < o2; ++u2) {
        var F2 = y2(u2), T2 = 32767 & u2, R2 = f2[F2];
        if (g2[T2] = R2, f2[F2] = T2, C2 <= u2) {
          var $2 = o2 - u2;
          if ((E2 > 7e3 || I2 > 24576) && $2 > 423) {
            c2 = zr(e3, l2, 0, w2, S2, k2, x2, I2, P2, u2 - P2, c2), I2 = E2 = x2 = 0, P2 = u2;
            for (var O2 = 0; O2 < 286; ++O2)
              S2[O2] = 0;
            for (O2 = 0; O2 < 30; ++O2)
              k2[O2] = 0;
          }
          var M2 = 2, A2 = 0, L2 = p2, D2 = T2 - R2 & 32767;
          if ($2 > 2 && F2 == y2(u2 - D2))
            for (var N2 = Math.min(_2, $2) - 1, q2 = Math.min(32767, u2), B2 = Math.min(258, $2); D2 <= q2 && --L2 && T2 != R2; ) {
              if (e3[u2 + M2] == e3[u2 + M2 - D2]) {
                for (var H2 = 0; H2 < B2 && e3[u2 + H2] == e3[u2 + H2 - D2]; ++H2)
                  ;
                if (H2 > M2) {
                  if (M2 = H2, A2 = D2, H2 > N2)
                    break;
                  var U2 = Math.min(D2, H2 - 2), j2 = 0;
                  for (O2 = 0; O2 < U2; ++O2) {
                    var z2 = u2 - D2 + O2 + 32768 & 32767, W2 = z2 - g2[z2] + 32768 & 32767;
                    W2 > j2 && (j2 = W2, R2 = z2);
                  }
                }
              }
              D2 += (T2 = R2) - (R2 = g2[T2]) + 32768 & 32767;
            }
          if (A2) {
            w2[I2++] = 268435456 | xr[M2] << 18 | Ir[A2];
            var V2 = 31 & xr[M2], G2 = 31 & Ir[A2];
            x2 += br[V2] + yr[G2], ++S2[257 + V2], ++k2[G2], C2 = u2 + M2, ++E2;
          } else
            w2[I2++] = e3[u2], ++S2[e3[u2]];
        }
      }
      c2 = zr(e3, l2, n2, w2, S2, k2, x2, I2, P2, u2 - P2, c2);
    }
    return Lr(a2, 0, r3 + Ar(c2) + s3);
  }(e2, null == t2.level ? 6 : t2.level, null == t2.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(e2.length)))) : 12 + t2.mem, i2, r2, !s2);
};
var Yr = function(e2, t2, i2) {
  for (; i2; ++t2)
    e2[t2] = i2, i2 >>>= 8;
};
var Kr = function(e2, t2) {
  var i2 = t2.filename;
  if (e2[0] = 31, e2[1] = 139, e2[2] = 8, e2[8] = t2.level < 2 ? 4 : 9 == t2.level ? 2 : 0, e2[9] = 3, 0 != t2.mtime && Yr(e2, 4, Math.floor(new Date(t2.mtime || Date.now()) / 1e3)), i2) {
    e2[3] = 8;
    for (var r2 = 0; r2 <= i2.length; ++r2)
      e2[r2 + 10] = i2.charCodeAt(r2);
  }
};
var Xr = function(e2) {
  return 10 + (e2.filename && e2.filename.length + 1 || 0);
};
function Qr(e2, t2) {
  void 0 === t2 && (t2 = {});
  var i2 = Gr(), r2 = e2.length;
  i2.p(e2);
  var s2 = Jr(e2, t2, Xr(t2), 8), n2 = s2.length;
  return Kr(s2, t2), Yr(s2, n2 - 8, i2.d()), Yr(s2, n2 - 4, r2), s2;
}
function Zr(e2, t2) {
  var i2 = e2.length;
  if ("undefined" != typeof TextEncoder)
    return new TextEncoder().encode(e2);
  for (var r2 = new gr(e2.length + (e2.length >>> 1)), s2 = 0, n2 = function(e3) {
    r2[s2++] = e3;
  }, o2 = 0; o2 < i2; ++o2) {
    if (s2 + 5 > r2.length) {
      var a2 = new gr(s2 + 8 + (i2 - o2 << 1));
      a2.set(r2), r2 = a2;
    }
    var l2 = e2.charCodeAt(o2);
    l2 < 128 || t2 ? n2(l2) : l2 < 2048 ? (n2(192 | l2 >>> 6), n2(128 | 63 & l2)) : l2 > 55295 && l2 < 57344 ? (n2(240 | (l2 = 65536 + (1047552 & l2) | 1023 & e2.charCodeAt(++o2)) >>> 18), n2(128 | l2 >>> 12 & 63), n2(128 | l2 >>> 6 & 63), n2(128 | 63 & l2)) : (n2(224 | l2 >>> 12), n2(128 | l2 >>> 6 & 63), n2(128 | 63 & l2));
  }
  return Lr(r2, 0, s2);
}
function es(e2, t2) {
  return function(e3) {
    for (var t3 = 0, i2 = 0; i2 < e3.length; i2++)
      t3 = (t3 << 5) - t3 + e3.charCodeAt(i2), t3 |= 0;
    return Math.abs(t3);
  }(e2) % 100 < pr(100 * t2, 0, 100);
}
var ts = "[SessionRecording]";
var is = te(ts);
var rs = 3e5;
var ss = [Ti.MouseMove, Ti.MouseInteraction, Ti.Scroll, Ti.ViewportResize, Ti.Input, Ti.TouchMove, Ti.MediaInteraction, Ti.Drag];
var ns = (e2) => ({ rrwebMethod: e2, enqueuedAt: Date.now(), attempt: 1 });
function os(e2) {
  return function(e3, t2) {
    for (var i2 = "", r2 = 0; r2 < e3.length; ) {
      var s2 = e3[r2++];
      s2 < 128 || t2 ? i2 += String.fromCharCode(s2) : s2 < 224 ? i2 += String.fromCharCode((31 & s2) << 6 | 63 & e3[r2++]) : s2 < 240 ? i2 += String.fromCharCode((15 & s2) << 12 | (63 & e3[r2++]) << 6 | 63 & e3[r2++]) : (s2 = ((15 & s2) << 18 | (63 & e3[r2++]) << 12 | (63 & e3[r2++]) << 6 | 63 & e3[r2++]) - 65536, i2 += String.fromCharCode(55296 | s2 >> 10, 56320 | 1023 & s2));
    }
    return i2;
  }(Qr(Zr(JSON.stringify(e2))), true);
}
function as(e2) {
  return e2.type === Fi.Custom && "sessionIdle" === e2.data.tag;
}
function ls(e2, t2) {
  return t2.some((t3) => "regex" === t3.matching && new RegExp(t3.url).test(e2));
}
var cs = class {
  get sessionIdleThresholdMilliseconds() {
    return this.instance.config.session_recording.session_idle_threshold_ms || 3e5;
  }
  get rrwebRecord() {
    var e2, t2;
    return null == _ || null === (e2 = _.__PosthogExtensions__) || void 0 === e2 || null === (t2 = e2.rrweb) || void 0 === t2 ? void 0 : t2.record;
  }
  get started() {
    return this._captureStarted;
  }
  get sessionManager() {
    if (!this.instance.sessionManager)
      throw new Error(ts + " must be started with a valid sessionManager.");
    return this.instance.sessionManager;
  }
  get fullSnapshotIntervalMillis() {
    var e2, t2;
    return "trigger_pending" === this.triggerStatus ? 6e4 : null !== (e2 = null === (t2 = this.instance.config.session_recording) || void 0 === t2 ? void 0 : t2.full_snapshot_interval_millis) && void 0 !== e2 ? e2 : rs;
  }
  get isSampled() {
    var e2 = this.instance.get_property(xe);
    return K(e2) ? e2 : null;
  }
  get sessionDuration() {
    var e2, t2, i2 = null === (e2 = this.buffer) || void 0 === e2 ? void 0 : e2.data[(null === (t2 = this.buffer) || void 0 === t2 ? void 0 : t2.data.length) - 1], { sessionStartTimestamp: r2 } = this.sessionManager.checkAndGetSessionAndWindowId(true);
    return i2 ? i2.timestamp - r2 : null;
  }
  get isRecordingEnabled() {
    var e2 = !!this.instance.get_property(fe), i2 = !this.instance.config.disable_session_recording;
    return t && e2 && i2;
  }
  get isConsoleLogCaptureEnabled() {
    var e2 = !!this.instance.get_property(me), t2 = this.instance.config.enable_recording_console_log;
    return null != t2 ? t2 : e2;
  }
  get canvasRecording() {
    var e2, t2, i2, r2, s2, n2, o2 = this.instance.config.session_recording.captureCanvas, a2 = this.instance.get_property(ye), l2 = null !== (e2 = null !== (t2 = null == o2 ? void 0 : o2.recordCanvas) && void 0 !== t2 ? t2 : null == a2 ? void 0 : a2.enabled) && void 0 !== e2 && e2, c2 = null !== (i2 = null !== (r2 = null == o2 ? void 0 : o2.canvasFps) && void 0 !== r2 ? r2 : null == a2 ? void 0 : a2.fps) && void 0 !== i2 ? i2 : 0, u2 = null !== (s2 = null !== (n2 = null == o2 ? void 0 : o2.canvasQuality) && void 0 !== n2 ? n2 : null == a2 ? void 0 : a2.quality) && void 0 !== s2 ? s2 : 0;
    return { enabled: l2, fps: pr(c2, 0, 12, "canvas recording fps"), quality: pr(u2, 0, 1, "canvas recording quality") };
  }
  get networkPayloadCapture() {
    var e2, t2, i2 = this.instance.get_property(be), r2 = { recordHeaders: null === (e2 = this.instance.config.session_recording) || void 0 === e2 ? void 0 : e2.recordHeaders, recordBody: null === (t2 = this.instance.config.session_recording) || void 0 === t2 ? void 0 : t2.recordBody }, s2 = (null == r2 ? void 0 : r2.recordHeaders) || (null == i2 ? void 0 : i2.recordHeaders), n2 = (null == r2 ? void 0 : r2.recordBody) || (null == i2 ? void 0 : i2.recordBody), o2 = U(this.instance.config.capture_performance) ? this.instance.config.capture_performance.network_timing : this.instance.config.capture_performance, a2 = !!(K(o2) ? o2 : null == i2 ? void 0 : i2.capturePerformance);
    return s2 || n2 || a2 ? { recordHeaders: s2, recordBody: n2, recordPerformance: a2 } : void 0;
  }
  get sampleRate() {
    var e2 = this.instance.get_property(we);
    return Y(e2) ? e2 : null;
  }
  get minimumDuration() {
    var e2 = this.instance.get_property(Se);
    return Y(e2) ? e2 : null;
  }
  get status() {
    return this.receivedDecide ? this.isRecordingEnabled ? false === this.isSampled ? "disabled" : this._urlBlocked ? "paused" : J(this._linkedFlag) || this._linkedFlagSeen ? "trigger_pending" === this.triggerStatus ? "buffering" : K(this.isSampled) ? this.isSampled ? "sampled" : "disabled" : "active" : "buffering" : "disabled" : "buffering";
  }
  get urlTriggerStatus() {
    var e2;
    return 0 === this._urlTriggers.length ? "trigger_disabled" : (null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2.get_property(Ie)) === this.sessionId ? "trigger_activated" : "trigger_pending";
  }
  get eventTriggerStatus() {
    var e2;
    return 0 === this._eventTriggers.length ? "trigger_disabled" : (null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2.get_property(Ce)) === this.sessionId ? "trigger_activated" : "trigger_pending";
  }
  get triggerStatus() {
    var e2 = "trigger_activated" === this.eventTriggerStatus || "trigger_activated" === this.urlTriggerStatus, t2 = "trigger_pending" === this.eventTriggerStatus || "trigger_pending" === this.urlTriggerStatus;
    return e2 ? "trigger_activated" : t2 ? "trigger_pending" : "trigger_disabled";
  }
  constructor(e2) {
    if (oe(this, "queuedRRWebEvents", []), oe(this, "isIdle", false), oe(this, "_linkedFlagSeen", false), oe(this, "_lastActivityTimestamp", Date.now()), oe(this, "_linkedFlag", null), oe(this, "_removePageViewCaptureHook", void 0), oe(this, "_onSessionIdListener", void 0), oe(this, "_persistDecideOnSessionListener", void 0), oe(this, "_samplingSessionListener", void 0), oe(this, "_urlTriggers", []), oe(this, "_urlBlocklist", []), oe(this, "_urlBlocked", false), oe(this, "_eventTriggers", []), oe(this, "_removeEventTriggerCaptureHook", void 0), oe(this, "_forceAllowLocalhostNetworkCapture", false), oe(this, "_onBeforeUnload", () => {
      this._flushBuffer();
    }), oe(this, "_onOffline", () => {
      this._tryAddCustomEvent("browser offline", {});
    }), oe(this, "_onOnline", () => {
      this._tryAddCustomEvent("browser online", {});
    }), oe(this, "_onVisibilityChange", () => {
      if (null != a && a.visibilityState) {
        var e3 = "window " + a.visibilityState;
        this._tryAddCustomEvent(e3, {});
      }
    }), this.instance = e2, this._captureStarted = false, this._endpoint = "/s/", this.stopRrweb = void 0, this.receivedDecide = false, !this.instance.sessionManager)
      throw is.error("started without valid sessionManager"), new Error(ts + " started without valid sessionManager. This is a bug.");
    if (this.instance.config.__preview_experimental_cookieless_mode)
      throw new Error(ts + " cannot be used with __preview_experimental_cookieless_mode.");
    var { sessionId: t2, windowId: i2 } = this.sessionManager.checkAndGetSessionAndWindowId();
    this.sessionId = t2, this.windowId = i2, this.buffer = this.clearBuffer(), this.sessionIdleThresholdMilliseconds >= this.sessionManager.sessionTimeoutMs && is.warn("session_idle_threshold_ms (".concat(this.sessionIdleThresholdMilliseconds, ") is greater than the session timeout (").concat(this.sessionManager.sessionTimeoutMs, "). Session will never be detected as idle"));
  }
  startIfEnabledOrStop(e2) {
    this.isRecordingEnabled ? (this._startCapture(e2), R(t, "beforeunload", this._onBeforeUnload), R(t, "offline", this._onOffline), R(t, "online", this._onOnline), R(t, "visibilitychange", this._onVisibilityChange), this._setupSampling(), this._addEventTriggerListener(), J(this._removePageViewCaptureHook) && (this._removePageViewCaptureHook = this.instance.on("eventCaptured", (e3) => {
      try {
        if ("$pageview" === e3.event) {
          var t2 = null != e3 && e3.properties.$current_url ? this._maskUrl(null == e3 ? void 0 : e3.properties.$current_url) : "";
          if (!t2)
            return;
          this._tryAddCustomEvent("$pageview", { href: t2 });
        }
      } catch (e4) {
        is.error("Could not add $pageview to rrweb session", e4);
      }
    })), this._onSessionIdListener || (this._onSessionIdListener = this.sessionManager.onSessionId((e3, t2, i2) => {
      var r2, s2, n2, o2;
      i2 && (this._tryAddCustomEvent("$session_id_change", { sessionId: e3, windowId: t2, changeReason: i2 }), null === (r2 = this.instance) || void 0 === r2 || null === (s2 = r2.persistence) || void 0 === s2 || s2.unregister(Ce), null === (n2 = this.instance) || void 0 === n2 || null === (o2 = n2.persistence) || void 0 === o2 || o2.unregister(Ie));
    }))) : this.stopRecording();
  }
  stopRecording() {
    var e2, i2, r2, s2;
    this._captureStarted && this.stopRrweb && (this.stopRrweb(), this.stopRrweb = void 0, this._captureStarted = false, null == t || t.removeEventListener("beforeunload", this._onBeforeUnload), null == t || t.removeEventListener("offline", this._onOffline), null == t || t.removeEventListener("online", this._onOnline), null == t || t.removeEventListener("visibilitychange", this._onVisibilityChange), this.clearBuffer(), clearInterval(this._fullSnapshotTimer), null === (e2 = this._removePageViewCaptureHook) || void 0 === e2 || e2.call(this), this._removePageViewCaptureHook = void 0, null === (i2 = this._removeEventTriggerCaptureHook) || void 0 === i2 || i2.call(this), this._removeEventTriggerCaptureHook = void 0, null === (r2 = this._onSessionIdListener) || void 0 === r2 || r2.call(this), this._onSessionIdListener = void 0, null === (s2 = this._samplingSessionListener) || void 0 === s2 || s2.call(this), this._samplingSessionListener = void 0, is.info("stopped"));
  }
  makeSamplingDecision(e2) {
    var t2, i2 = this.sessionId !== e2, r2 = this.sampleRate;
    if (Y(r2)) {
      var s2 = this.isSampled, n2 = i2 || !K(s2), o2 = n2 ? es(e2, r2) : s2;
      n2 && (o2 ? this._reportStarted("sampled") : is.warn("Sample rate (".concat(r2, ") has determined that this sessionId (").concat(e2, ") will not be sent to the server.")), this._tryAddCustomEvent("samplingDecisionMade", { sampleRate: r2, isSampled: o2 })), null === (t2 = this.instance.persistence) || void 0 === t2 || t2.register({ [xe]: o2 });
    } else {
      var a2;
      null === (a2 = this.instance.persistence) || void 0 === a2 || a2.register({ [xe]: null });
    }
  }
  onRemoteConfig(e2) {
    var t2, i2, r2, s2, n2, o2;
    (this._tryAddCustomEvent("$remote_config_received", e2), this._persistRemoteConfig(e2), this._linkedFlag = (null === (t2 = e2.sessionRecording) || void 0 === t2 ? void 0 : t2.linkedFlag) || null, null !== (i2 = e2.sessionRecording) && void 0 !== i2 && i2.endpoint) && (this._endpoint = null === (o2 = e2.sessionRecording) || void 0 === o2 ? void 0 : o2.endpoint);
    if (this._setupSampling(), !J(this._linkedFlag) && !this._linkedFlagSeen) {
      var a2 = W(this._linkedFlag) ? this._linkedFlag : this._linkedFlag.flag, l2 = W(this._linkedFlag) ? null : this._linkedFlag.variant;
      this.instance.onFeatureFlags((e3, t3) => {
        var i3 = U(t3) && a2 in t3, r3 = l2 ? t3[a2] === l2 : i3;
        r3 && this._reportStarted("linked_flag_matched", { linkedFlag: a2, linkedVariant: l2 }), this._linkedFlagSeen = r3;
      });
    }
    null !== (r2 = e2.sessionRecording) && void 0 !== r2 && r2.urlTriggers && (this._urlTriggers = e2.sessionRecording.urlTriggers), null !== (s2 = e2.sessionRecording) && void 0 !== s2 && s2.urlBlocklist && (this._urlBlocklist = e2.sessionRecording.urlBlocklist), null !== (n2 = e2.sessionRecording) && void 0 !== n2 && n2.eventTriggers && (this._eventTriggers = e2.sessionRecording.eventTriggers), this.receivedDecide = true, this.startIfEnabledOrStop();
  }
  _setupSampling() {
    Y(this.sampleRate) && J(this._samplingSessionListener) && (this._samplingSessionListener = this.sessionManager.onSessionId((e2) => {
      this.makeSamplingDecision(e2);
    }));
  }
  _persistRemoteConfig(e2) {
    if (this.instance.persistence) {
      var t2, i2 = this.instance.persistence, r2 = () => {
        var t3, r3, s2, n2, o2, a2, l2, c2, u2 = null === (t3 = e2.sessionRecording) || void 0 === t3 ? void 0 : t3.sampleRate, d2 = J(u2) ? null : parseFloat(u2), h2 = null === (r3 = e2.sessionRecording) || void 0 === r3 ? void 0 : r3.minimumDurationMilliseconds;
        i2.register({ [fe]: !!e2.sessionRecording, [me]: null === (s2 = e2.sessionRecording) || void 0 === s2 ? void 0 : s2.consoleLogRecordingEnabled, [be]: ne({ capturePerformance: e2.capturePerformance }, null === (n2 = e2.sessionRecording) || void 0 === n2 ? void 0 : n2.networkPayloadCapture), [ye]: { enabled: null === (o2 = e2.sessionRecording) || void 0 === o2 ? void 0 : o2.recordCanvas, fps: null === (a2 = e2.sessionRecording) || void 0 === a2 ? void 0 : a2.canvasFps, quality: null === (l2 = e2.sessionRecording) || void 0 === l2 ? void 0 : l2.canvasQuality }, [we]: d2, [Se]: z(h2) ? null : h2, [ke]: null === (c2 = e2.sessionRecording) || void 0 === c2 ? void 0 : c2.scriptConfig });
      };
      r2(), null === (t2 = this._persistDecideOnSessionListener) || void 0 === t2 || t2.call(this), this._persistDecideOnSessionListener = this.sessionManager.onSessionId(r2);
    }
  }
  log(e2) {
    var t2, i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "log";
    null === (t2 = this.instance.sessionRecording) || void 0 === t2 || t2.onRRwebEmit({ type: 6, data: { plugin: "rrweb/console@1", payload: { level: i2, trace: [], payload: [JSON.stringify(e2)] } }, timestamp: Date.now() });
  }
  _startCapture(e2) {
    if (!z(Object.assign) && !z(Array.from) && !(this._captureStarted || this.instance.config.disable_session_recording || this.instance.consent.isOptedOut())) {
      var t2, i2;
      if (this._captureStarted = true, this.sessionManager.checkAndGetSessionAndWindowId(), this.rrwebRecord)
        this._onScriptLoaded();
      else
        null === (t2 = _.__PosthogExtensions__) || void 0 === t2 || null === (i2 = t2.loadExternalDependency) || void 0 === i2 || i2.call(t2, this.instance, this.scriptName, (e3) => {
          if (e3)
            return is.error("could not load recorder", e3);
          this._onScriptLoaded();
        });
      is.info("starting"), "active" === this.status && this._reportStarted(e2 || "recording_initialized");
    }
  }
  get scriptName() {
    var e2, t2, i2;
    return (null === (e2 = this.instance) || void 0 === e2 || null === (t2 = e2.persistence) || void 0 === t2 || null === (i2 = t2.get_property(ke)) || void 0 === i2 ? void 0 : i2.script) || "recorder";
  }
  isInteractiveEvent(e2) {
    var t2;
    return 3 === e2.type && -1 !== ss.indexOf(null === (t2 = e2.data) || void 0 === t2 ? void 0 : t2.source);
  }
  _updateWindowAndSessionIds(e2) {
    var t2 = this.isInteractiveEvent(e2);
    t2 || this.isIdle || e2.timestamp - this._lastActivityTimestamp > this.sessionIdleThresholdMilliseconds && (this.isIdle = true, clearInterval(this._fullSnapshotTimer), this._tryAddCustomEvent("sessionIdle", { eventTimestamp: e2.timestamp, lastActivityTimestamp: this._lastActivityTimestamp, threshold: this.sessionIdleThresholdMilliseconds, bufferLength: this.buffer.data.length, bufferSize: this.buffer.size }), this._flushBuffer());
    var i2 = false;
    if (t2 && (this._lastActivityTimestamp = e2.timestamp, this.isIdle && (this.isIdle = false, this._tryAddCustomEvent("sessionNoLongerIdle", { reason: "user activity", type: e2.type }), i2 = true)), !this.isIdle) {
      var { windowId: r2, sessionId: s2 } = this.sessionManager.checkAndGetSessionAndWindowId(!t2, e2.timestamp), n2 = this.sessionId !== s2, o2 = this.windowId !== r2;
      this.windowId = r2, this.sessionId = s2, n2 || o2 ? (this.stopRecording(), this.startIfEnabledOrStop("session_id_changed")) : i2 && this._scheduleFullSnapshot();
    }
  }
  _tryRRWebMethod(e2) {
    try {
      return e2.rrwebMethod(), true;
    } catch (t2) {
      return this.queuedRRWebEvents.length < 10 ? this.queuedRRWebEvents.push({ enqueuedAt: e2.enqueuedAt || Date.now(), attempt: e2.attempt++, rrwebMethod: e2.rrwebMethod }) : is.warn("could not emit queued rrweb event.", t2, e2), false;
    }
  }
  _tryAddCustomEvent(e2, t2) {
    return this._tryRRWebMethod(ns(() => this.rrwebRecord.addCustomEvent(e2, t2)));
  }
  _tryTakeFullSnapshot() {
    return this._tryRRWebMethod(ns(() => this.rrwebRecord.takeFullSnapshot()));
  }
  _onScriptLoaded() {
    var e2, t2 = { blockClass: "ph-no-capture", blockSelector: void 0, ignoreClass: "ph-ignore-input", maskTextClass: "ph-mask", maskTextSelector: void 0, maskTextFn: void 0, maskAllInputs: true, maskInputOptions: { password: true }, maskInputFn: void 0, slimDOMOptions: {}, collectFonts: false, inlineStylesheet: true, recordCrossOriginIframes: false }, i2 = this.instance.config.session_recording;
    for (var [r2, s2] of Object.entries(i2 || {}))
      r2 in t2 && ("maskInputOptions" === r2 ? t2.maskInputOptions = ne({ password: true }, s2) : t2[r2] = s2);
    if (this.canvasRecording && this.canvasRecording.enabled && (t2.recordCanvas = true, t2.sampling = { canvas: this.canvasRecording.fps }, t2.dataURLOptions = { type: "image/webp", quality: this.canvasRecording.quality }), this.rrwebRecord) {
      this.mutationRateLimiter = null !== (e2 = this.mutationRateLimiter) && void 0 !== e2 ? e2 : new vr(this.rrwebRecord, { refillRate: this.instance.config.session_recording.__mutationRateLimiterRefillRate, bucketSize: this.instance.config.session_recording.__mutationRateLimiterBucketSize, onBlockedNode: (e3, t3) => {
        var i3 = "Too many mutations on node '".concat(e3, "'. Rate limiting. This could be due to SVG animations or something similar");
        is.info(i3, { node: t3 }), this.log(ts + " " + i3, "warn");
      } });
      var n2 = this._gatherRRWebPlugins();
      this.stopRrweb = this.rrwebRecord(ne({ emit: (e3) => {
        this.onRRwebEmit(e3);
      }, plugins: n2 }, t2)), this._lastActivityTimestamp = Date.now(), this.isIdle = false, this._tryAddCustomEvent("$session_options", { sessionRecordingOptions: t2, activePlugins: n2.map((e3) => null == e3 ? void 0 : e3.name) }), this._tryAddCustomEvent("$posthog_config", { config: this.instance.config });
    } else
      is.error("onScriptLoaded was called but rrwebRecord is not available. This indicates something has gone wrong.");
  }
  _scheduleFullSnapshot() {
    if (this._fullSnapshotTimer && clearInterval(this._fullSnapshotTimer), !this.isIdle) {
      var e2 = this.fullSnapshotIntervalMillis;
      e2 && (this._fullSnapshotTimer = setInterval(() => {
        this._tryTakeFullSnapshot();
      }, e2));
    }
  }
  _gatherRRWebPlugins() {
    var e2, t2, i2, r2, s2 = [], n2 = null === (e2 = _.__PosthogExtensions__) || void 0 === e2 || null === (t2 = e2.rrwebPlugins) || void 0 === t2 ? void 0 : t2.getRecordConsolePlugin;
    n2 && this.isConsoleLogCaptureEnabled && s2.push(n2());
    var o2 = null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.rrwebPlugins) || void 0 === r2 ? void 0 : r2.getRecordNetworkPlugin;
    this.networkPayloadCapture && H(o2) && (!bt.includes(location.hostname) || this._forceAllowLocalhostNetworkCapture ? s2.push(o2(_r(this.instance.config, this.networkPayloadCapture))) : is.info("NetworkCapture not started because we are on localhost."));
    return s2;
  }
  onRRwebEmit(e2) {
    var t2;
    if (this._processQueuedEvents(), e2 && U(e2)) {
      if (e2.type === Fi.Meta) {
        var i2 = this._maskUrl(e2.data.href);
        if (this._lastHref = i2, !i2)
          return;
        e2.data.href = i2;
      } else
        this._pageViewFallBack();
      if (this._checkUrlTriggerConditions(), !this._urlBlocked || function(e3) {
        return e3.type === Fi.Custom && "recording paused" === e3.data.tag;
      }(e2)) {
        e2.type === Fi.FullSnapshot && this._scheduleFullSnapshot(), e2.type === Fi.FullSnapshot && "trigger_pending" === this.triggerStatus && this.clearBuffer();
        var r2 = this.mutationRateLimiter ? this.mutationRateLimiter.throttleMutations(e2) : e2;
        if (r2) {
          var s2 = function(e3) {
            var t3 = e3;
            if (t3 && U(t3) && 6 === t3.type && U(t3.data) && "rrweb/console@1" === t3.data.plugin) {
              t3.data.payload.payload.length > 10 && (t3.data.payload.payload = t3.data.payload.payload.slice(0, 10), t3.data.payload.payload.push("...[truncated]"));
              for (var i3 = [], r3 = 0; r3 < t3.data.payload.payload.length; r3++)
                t3.data.payload.payload[r3] && t3.data.payload.payload[r3].length > 2e3 ? i3.push(t3.data.payload.payload[r3].slice(0, 2e3) + "...[truncated]") : i3.push(t3.data.payload.payload[r3]);
              return t3.data.payload.payload = i3, e3;
            }
            return e3;
          }(r2);
          if (this._updateWindowAndSessionIds(s2), !this.isIdle || as(s2)) {
            if (as(s2)) {
              var n2 = s2.data.payload;
              if (n2) {
                var o2 = n2.lastActivityTimestamp, a2 = n2.threshold;
                s2.timestamp = o2 + a2;
              }
            }
            var l2 = null === (t2 = this.instance.config.session_recording.compress_events) || void 0 === t2 || t2 ? function(e3) {
              if (Ci(e3) < 1024)
                return e3;
              try {
                if (e3.type === Fi.FullSnapshot)
                  return ne(ne({}, e3), {}, { data: os(e3.data), cv: "2024-10" });
                if (e3.type === Fi.IncrementalSnapshot && e3.data.source === Ti.Mutation)
                  return ne(ne({}, e3), {}, { cv: "2024-10", data: ne(ne({}, e3.data), {}, { texts: os(e3.data.texts), attributes: os(e3.data.attributes), removes: os(e3.data.removes), adds: os(e3.data.adds) }) });
                if (e3.type === Fi.IncrementalSnapshot && e3.data.source === Ti.StyleSheetRule)
                  return ne(ne({}, e3), {}, { cv: "2024-10", data: ne(ne({}, e3.data), {}, { adds: os(e3.data.adds), removes: os(e3.data.removes) }) });
              } catch (e4) {
                is.error("could not compress event - will use uncompressed event", e4);
              }
              return e3;
            }(s2) : s2, c2 = { $snapshot_bytes: Ci(l2), $snapshot_data: l2, $session_id: this.sessionId, $window_id: this.windowId };
            "disabled" !== this.status ? this._captureSnapshotBuffered(c2) : this.clearBuffer();
          }
        }
      }
    }
  }
  _pageViewFallBack() {
    if (!this.instance.config.capture_pageview && t) {
      var e2 = this._maskUrl(t.location.href);
      this._lastHref !== e2 && (this._tryAddCustomEvent("$url_changed", { href: e2 }), this._lastHref = e2);
    }
  }
  _processQueuedEvents() {
    if (this.queuedRRWebEvents.length) {
      var e2 = [...this.queuedRRWebEvents];
      this.queuedRRWebEvents = [], e2.forEach((e3) => {
        Date.now() - e3.enqueuedAt <= 2e3 && this._tryRRWebMethod(e3);
      });
    }
  }
  _maskUrl(e2) {
    var t2 = this.instance.config.session_recording;
    if (t2.maskNetworkRequestFn) {
      var i2, r2 = { url: e2 };
      return null === (i2 = r2 = t2.maskNetworkRequestFn(r2)) || void 0 === i2 ? void 0 : i2.url;
    }
    return e2;
  }
  clearBuffer() {
    return this.buffer = { size: 0, data: [], sessionId: this.sessionId, windowId: this.windowId }, this.buffer;
  }
  _flushBuffer() {
    this.flushBufferTimer && (clearTimeout(this.flushBufferTimer), this.flushBufferTimer = void 0);
    var e2 = this.minimumDuration, t2 = this.sessionDuration, i2 = Y(t2) && t2 >= 0, r2 = Y(e2) && i2 && t2 < e2;
    if ("buffering" === this.status || "paused" === this.status || "disabled" === this.status || r2)
      return this.flushBufferTimer = setTimeout(() => {
        this._flushBuffer();
      }, 2e3), this.buffer;
    this.buffer.data.length > 0 && Pi(this.buffer).forEach((e3) => {
      this._captureSnapshot({ $snapshot_bytes: e3.size, $snapshot_data: e3.data, $session_id: e3.sessionId, $window_id: e3.windowId, $lib: "web", $lib_version: p.LIB_VERSION });
    });
    return this.clearBuffer();
  }
  _captureSnapshotBuffered(e2) {
    var t2, i2 = 2 + ((null === (t2 = this.buffer) || void 0 === t2 ? void 0 : t2.data.length) || 0);
    !this.isIdle && (this.buffer.size + e2.$snapshot_bytes + i2 > 943718.4 || this.buffer.sessionId !== this.sessionId) && (this.buffer = this._flushBuffer()), this.buffer.size += e2.$snapshot_bytes, this.buffer.data.push(e2.$snapshot_data), this.flushBufferTimer || this.isIdle || (this.flushBufferTimer = setTimeout(() => {
      this._flushBuffer();
    }, 2e3));
  }
  _captureSnapshot(e2) {
    this.instance.capture("$snapshot", e2, { _url: this.instance.requestRouter.endpointFor("api", this._endpoint), _noTruncate: true, _batchKey: "recordings", skip_client_rate_limiting: true });
  }
  _checkUrlTriggerConditions() {
    if (void 0 !== t && t.location.href) {
      var e2 = t.location.href, i2 = this._urlBlocked, r2 = ls(e2, this._urlBlocklist);
      r2 && !i2 ? this._pauseRecording() : !r2 && i2 && this._resumeRecording(), ls(e2, this._urlTriggers) && this._activateTrigger("url");
    }
  }
  _activateTrigger(e2) {
    var t2, i2;
    "trigger_pending" === this.triggerStatus && (null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 || i2.register({ ["url" === e2 ? Ie : Ce]: this.sessionId }), this._flushBuffer(), this._reportStarted(e2 + "_trigger_matched"));
  }
  _pauseRecording() {
    this._urlBlocked || (this._urlBlocked = true, clearInterval(this._fullSnapshotTimer), is.info("recording paused due to URL blocker"), this._tryAddCustomEvent("recording paused", { reason: "url blocker" }));
  }
  _resumeRecording() {
    this._urlBlocked && (this._urlBlocked = false, this._tryTakeFullSnapshot(), this._scheduleFullSnapshot(), this._tryAddCustomEvent("recording resumed", { reason: "left blocked url" }), is.info("recording resumed"));
  }
  _addEventTriggerListener() {
    0 !== this._eventTriggers.length && J(this._removeEventTriggerCaptureHook) && (this._removeEventTriggerCaptureHook = this.instance.on("eventCaptured", (e2) => {
      try {
        this._eventTriggers.includes(e2.event) && this._activateTrigger("event");
      } catch (e3) {
        is.error("Could not activate event trigger", e3);
      }
    }));
  }
  overrideLinkedFlag() {
    this._linkedFlagSeen = true, this._tryTakeFullSnapshot(), this._reportStarted("linked_flag_overridden");
  }
  overrideSampling() {
    var e2;
    null === (e2 = this.instance.persistence) || void 0 === e2 || e2.register({ [xe]: true }), this._tryTakeFullSnapshot(), this._reportStarted("sampling_overridden");
  }
  overrideTrigger(e2) {
    this._activateTrigger(e2);
  }
  _reportStarted(e2, t2) {
    this.instance.register_for_session({ $session_recording_start_reason: e2 }), is.info(e2.replace("_", " "), t2), $(["recording_initialized", "session_id_changed"], e2) || this._tryAddCustomEvent(e2, t2);
  }
};
var us = te("[RemoteConfig]");
var ds = class {
  constructor(e2) {
    this.instance = e2;
  }
  get remoteConfig() {
    var e2, t2;
    return null === (e2 = _._POSTHOG_REMOTE_CONFIG) || void 0 === e2 || null === (t2 = e2[this.instance.config.token]) || void 0 === t2 ? void 0 : t2.config;
  }
  _loadRemoteConfigJs(e2) {
    var t2, i2, r2;
    null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.loadExternalDependency ? null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.loadExternalDependency) || void 0 === r2 || r2.call(i2, this.instance, "remote-config", () => e2(this.remoteConfig)) : (us.error("PostHog Extensions not found. Cannot load remote config."), e2());
  }
  _loadRemoteConfigJSON(e2) {
    this.instance._send_request({ method: "GET", url: this.instance.requestRouter.endpointFor("assets", "/array/".concat(this.instance.config.token, "/config")), callback: (t2) => {
      e2(t2.json);
    } });
  }
  load() {
    try {
      if (this.remoteConfig)
        return us.info("Using preloaded remote config", this.remoteConfig), void this.onRemoteConfig(this.remoteConfig);
      if (this.instance.config.advanced_disable_decide)
        return void us.warn("Remote config is disabled. Falling back to local config.");
      this._loadRemoteConfigJs((e2) => {
        if (!e2)
          return us.info("No config found after loading remote JS config. Falling back to JSON."), void this._loadRemoteConfigJSON((e3) => {
            this.onRemoteConfig(e3);
          });
        this.onRemoteConfig(e2);
      });
    } catch (e2) {
      us.error("Error loading remote config", e2);
    }
  }
  onRemoteConfig(e2) {
    e2 ? this.instance.config.__preview_remote_config ? (this.instance._onRemoteConfig(e2), false !== e2.hasFeatureFlags && this.instance.featureFlags.ensureFlagsLoaded()) : us.info("__preview_remote_config is disabled. Logging config instead", e2) : us.error("Failed to fetch remote config from PostHog.");
  }
};
var hs;
var _s = null != t && t.location ? Et(t.location.hash, "__posthog") || Et(location.hash, "state") : null;
var ps = "_postHogToolbarParams";
var vs = te("[Toolbar]");
!function(e2) {
  e2[e2.UNINITIALIZED = 0] = "UNINITIALIZED", e2[e2.LOADING = 1] = "LOADING", e2[e2.LOADED = 2] = "LOADED";
}(hs || (hs = {}));
var gs = class {
  constructor(e2) {
    this.instance = e2;
  }
  setToolbarState(e2) {
    _.ph_toolbar_state = e2;
  }
  getToolbarState() {
    var e2;
    return null !== (e2 = _.ph_toolbar_state) && void 0 !== e2 ? e2 : hs.UNINITIALIZED;
  }
  maybeLoadToolbar() {
    var e2, i2, r2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0, s2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0, n2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0;
    if (!t || !a)
      return false;
    r2 = null !== (e2 = r2) && void 0 !== e2 ? e2 : t.location, n2 = null !== (i2 = n2) && void 0 !== i2 ? i2 : t.history;
    try {
      if (!s2) {
        try {
          t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
        } catch (e3) {
          return false;
        }
        s2 = null == t ? void 0 : t.localStorage;
      }
      var o2, l2 = _s || Et(r2.hash, "__posthog") || Et(r2.hash, "state"), c2 = l2 ? E(() => JSON.parse(atob(decodeURIComponent(l2)))) || E(() => JSON.parse(decodeURIComponent(l2))) : null;
      return c2 && "ph_authorize" === c2.action ? ((o2 = c2).source = "url", o2 && Object.keys(o2).length > 0 && (c2.desiredHash ? r2.hash = c2.desiredHash : n2 ? n2.replaceState(n2.state, "", r2.pathname + r2.search) : r2.hash = "")) : ((o2 = JSON.parse(s2.getItem(ps) || "{}")).source = "localstorage", delete o2.userIntent), !(!o2.token || this.instance.config.token !== o2.token) && (this.loadToolbar(o2), true);
    } catch (e3) {
      return false;
    }
  }
  _callLoadToolbar(e2) {
    var t2 = _.ph_load_toolbar || _.ph_load_editor;
    !J(t2) && H(t2) ? t2(e2, this.instance) : vs.warn("No toolbar load function found");
  }
  loadToolbar(e2) {
    var i2 = !(null == a || !a.getElementById(Ue));
    if (!t || i2)
      return false;
    var r2 = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, s2 = ne(ne({ token: this.instance.config.token }, e2), {}, { apiURL: this.instance.requestRouter.endpointFor("ui") }, r2 ? { instrument: false } : {});
    if (t.localStorage.setItem(ps, JSON.stringify(ne(ne({}, s2), {}, { source: void 0 }))), this.getToolbarState() === hs.LOADED)
      this._callLoadToolbar(s2);
    else if (this.getToolbarState() === hs.UNINITIALIZED) {
      var n2, o2;
      this.setToolbarState(hs.LOADING), null === (n2 = _.__PosthogExtensions__) || void 0 === n2 || null === (o2 = n2.loadExternalDependency) || void 0 === o2 || o2.call(n2, this.instance, "toolbar", (e3) => {
        if (e3)
          return vs.error("[Toolbar] Failed to load", e3), void this.setToolbarState(hs.UNINITIALIZED);
        this.setToolbarState(hs.LOADED), this._callLoadToolbar(s2);
      }), R(t, "turbolinks:load", () => {
        this.setToolbarState(hs.UNINITIALIZED), this.loadToolbar(s2);
      });
    }
    return true;
  }
  _loadEditor(e2) {
    return this.loadToolbar(e2);
  }
  maybeLoadEditor() {
    var e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : void 0, t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : void 0, i2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : void 0;
    return this.maybeLoadToolbar(e2, t2, i2);
  }
};
var fs = 3e3;
var ms = class {
  constructor(e2, t2) {
    oe(this, "isPaused", true), oe(this, "queue", []), this.flushTimeoutMs = pr((null == t2 ? void 0 : t2.flush_interval_ms) || fs, 250, 5e3, "flush interval", fs), this.sendRequest = e2;
  }
  enqueue(e2) {
    this.queue.push(e2), this.flushTimeout || this.setFlushTimeout();
  }
  unload() {
    this.clearFlushTimeout();
    var e2 = this.queue.length > 0 ? this.formatQueue() : {}, t2 = Object.values(e2), i2 = [...t2.filter((e3) => 0 === e3.url.indexOf("/e")), ...t2.filter((e3) => 0 !== e3.url.indexOf("/e"))];
    i2.map((e3) => {
      this.sendRequest(ne(ne({}, e3), {}, { transport: "sendBeacon" }));
    });
  }
  enable() {
    this.isPaused = false, this.setFlushTimeout();
  }
  setFlushTimeout() {
    var e2 = this;
    this.isPaused || (this.flushTimeout = setTimeout(() => {
      if (this.clearFlushTimeout(), this.queue.length > 0) {
        var t2 = this.formatQueue(), i2 = function(i3) {
          var r3 = t2[i3], s2 = (/* @__PURE__ */ new Date()).getTime();
          r3.data && B(r3.data) && y(r3.data, (e3) => {
            e3.offset = Math.abs(e3.timestamp - s2), delete e3.timestamp;
          }), e2.sendRequest(r3);
        };
        for (var r2 in t2)
          i2(r2);
      }
    }, this.flushTimeoutMs));
  }
  clearFlushTimeout() {
    clearTimeout(this.flushTimeout), this.flushTimeout = void 0;
  }
  formatQueue() {
    var e2 = {};
    return y(this.queue, (t2) => {
      var i2, r2 = t2, s2 = (r2 ? r2.batchKey : null) || r2.url;
      z(e2[s2]) && (e2[s2] = ne(ne({}, r2), {}, { data: [] })), null === (i2 = e2[s2].data) || void 0 === i2 || i2.push(r2.data);
    }), this.queue = [], e2;
  }
};
var bs = function(e2) {
  var t2, i2, r2, s2, n2 = "";
  for (t2 = i2 = 0, r2 = (e2 = (e2 + "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")).length, s2 = 0; s2 < r2; s2++) {
    var o2 = e2.charCodeAt(s2), a2 = null;
    o2 < 128 ? i2++ : a2 = o2 > 127 && o2 < 2048 ? String.fromCharCode(o2 >> 6 | 192, 63 & o2 | 128) : String.fromCharCode(o2 >> 12 | 224, o2 >> 6 & 63 | 128, 63 & o2 | 128), G(a2) || (i2 > t2 && (n2 += e2.substring(t2, i2)), n2 += a2, t2 = i2 = s2 + 1);
  }
  return i2 > t2 && (n2 += e2.substring(t2, e2.length)), n2;
};
var ys = !!u || !!c;
var ws = "text/plain";
var Ss = (e2, t2) => {
  var [i2, r2] = e2.split("?"), s2 = ne({}, t2);
  null == r2 || r2.split("&").forEach((e3) => {
    var [t3] = e3.split("=");
    delete s2[t3];
  });
  var n2 = wt(s2);
  return n2 = n2 ? (r2 ? r2 + "&" : "") + n2 : r2, "".concat(i2, "?").concat(n2);
};
var ks = (e2, t2) => JSON.stringify(e2, (e3, t3) => "bigint" == typeof t3 ? t3.toString() : t3, t2);
var Es = (t2) => {
  var { data: i2, compression: r2 } = t2;
  if (i2) {
    if (r2 === e.GZipJS) {
      var s2 = Qr(Zr(ks(i2)), { mtime: 0 }), n2 = new Blob([s2], { type: ws });
      return { contentType: ws, body: n2, estimatedSize: n2.size };
    }
    if (r2 === e.Base64) {
      var o2 = function(e2) {
        var t3, i3, r3, s3, n3, o3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", a3 = 0, l3 = 0, c2 = "", u2 = [];
        if (!e2)
          return e2;
        e2 = bs(e2);
        do {
          t3 = (n3 = e2.charCodeAt(a3++) << 16 | e2.charCodeAt(a3++) << 8 | e2.charCodeAt(a3++)) >> 18 & 63, i3 = n3 >> 12 & 63, r3 = n3 >> 6 & 63, s3 = 63 & n3, u2[l3++] = o3.charAt(t3) + o3.charAt(i3) + o3.charAt(r3) + o3.charAt(s3);
        } while (a3 < e2.length);
        switch (c2 = u2.join(""), e2.length % 3) {
          case 1:
            c2 = c2.slice(0, -2) + "==";
            break;
          case 2:
            c2 = c2.slice(0, -1) + "=";
        }
        return c2;
      }(ks(i2)), a2 = ((e2) => "data=" + encodeURIComponent("string" == typeof e2 ? e2 : ks(e2)))(o2);
      return { contentType: "application/x-www-form-urlencoded", body: a2, estimatedSize: new Blob([a2]).size };
    }
    var l2 = ks(i2);
    return { contentType: "application/json", body: l2, estimatedSize: new Blob([l2]).size };
  }
};
var xs = [];
c && xs.push({ transport: "fetch", method: (e2) => {
  var t2, i2, { contentType: r2, body: s2, estimatedSize: n2 } = null !== (t2 = Es(e2)) && void 0 !== t2 ? t2 : {}, o2 = new Headers();
  y(e2.headers, function(e3, t3) {
    o2.append(t3, e3);
  }), r2 && o2.append("Content-Type", r2);
  var a2 = e2.url, l2 = null;
  if (d) {
    var u2 = new d();
    l2 = { signal: u2.signal, timeout: setTimeout(() => u2.abort(), e2.timeout) };
  }
  c(a2, ne({ method: (null == e2 ? void 0 : e2.method) || "GET", headers: o2, keepalive: "POST" === e2.method && (n2 || 0) < 52428.8, body: s2, signal: null === (i2 = l2) || void 0 === i2 ? void 0 : i2.signal }, e2.fetchOptions)).then((t3) => t3.text().then((i3) => {
    var r3, s3 = { statusCode: t3.status, text: i3 };
    if (200 === t3.status)
      try {
        s3.json = JSON.parse(i3);
      } catch (e3) {
        ee.error(e3);
      }
    null === (r3 = e2.callback) || void 0 === r3 || r3.call(e2, s3);
  })).catch((t3) => {
    var i3;
    ee.error(t3), null === (i3 = e2.callback) || void 0 === i3 || i3.call(e2, { statusCode: 0, text: t3 });
  }).finally(() => l2 ? clearTimeout(l2.timeout) : null);
} }), u && xs.push({ transport: "XHR", method: (e2) => {
  var t2, i2 = new u();
  i2.open(e2.method || "GET", e2.url, true);
  var { contentType: r2, body: s2 } = null !== (t2 = Es(e2)) && void 0 !== t2 ? t2 : {};
  y(e2.headers, function(e3, t3) {
    i2.setRequestHeader(t3, e3);
  }), r2 && i2.setRequestHeader("Content-Type", r2), e2.timeout && (i2.timeout = e2.timeout), i2.withCredentials = true, i2.onreadystatechange = () => {
    if (4 === i2.readyState) {
      var t3, r3 = { statusCode: i2.status, text: i2.responseText };
      if (200 === i2.status)
        try {
          r3.json = JSON.parse(i2.responseText);
        } catch (e3) {
        }
      null === (t3 = e2.callback) || void 0 === t3 || t3.call(e2, r3);
    }
  }, i2.send(s2);
} }), null != o && o.sendBeacon && xs.push({ transport: "sendBeacon", method: (e2) => {
  var t2 = Ss(e2.url, { beacon: "1" });
  try {
    var i2, { contentType: r2, body: s2 } = null !== (i2 = Es(e2)) && void 0 !== i2 ? i2 : {}, n2 = "string" == typeof s2 ? new Blob([s2], { type: r2 }) : s2;
    o.sendBeacon(t2, n2);
  } catch (e3) {
  }
} });
var Is = ["retriesPerformedSoFar"];
var Cs = class {
  constructor(e2) {
    oe(this, "isPolling", false), oe(this, "pollIntervalMs", 3e3), oe(this, "queue", []), this.instance = e2, this.queue = [], this.areWeOnline = true, !z(t) && "onLine" in t.navigator && (this.areWeOnline = t.navigator.onLine, R(t, "online", () => {
      this.areWeOnline = true, this.flush();
    }), R(t, "offline", () => {
      this.areWeOnline = false;
    }));
  }
  retriableRequest(e2) {
    var { retriesPerformedSoFar: t2 } = e2, i2 = ae(e2, Is);
    Y(t2) && t2 > 0 && (i2.url = Ss(i2.url, { retry_count: t2 })), this.instance._send_request(ne(ne({}, i2), {}, { callback: (e3) => {
      var r2;
      200 !== e3.statusCode && (e3.statusCode < 400 || e3.statusCode >= 500) && (null != t2 ? t2 : 0) < 10 ? this.enqueue(ne({ retriesPerformedSoFar: t2 }, i2)) : null === (r2 = i2.callback) || void 0 === r2 || r2.call(i2, e3);
    } }));
  }
  enqueue(e2) {
    var t2 = e2.retriesPerformedSoFar || 0;
    e2.retriesPerformedSoFar = t2 + 1;
    var i2 = function(e3) {
      var t3 = 3e3 * Math.pow(2, e3), i3 = t3 / 2, r3 = Math.min(18e5, t3), s3 = (Math.random() - 0.5) * (r3 - i3);
      return Math.ceil(r3 + s3);
    }(t2), r2 = Date.now() + i2;
    this.queue.push({ retryAt: r2, requestOptions: e2 });
    var s2 = "Enqueued failed request for retry in ".concat(i2);
    navigator.onLine || (s2 += " (Browser is offline)"), ee.warn(s2), this.isPolling || (this.isPolling = true, this.poll());
  }
  poll() {
    this.poller && clearTimeout(this.poller), this.poller = setTimeout(() => {
      this.areWeOnline && this.queue.length > 0 && this.flush(), this.poll();
    }, this.pollIntervalMs);
  }
  flush() {
    var e2 = Date.now(), t2 = [], i2 = this.queue.filter((i3) => i3.retryAt < e2 || (t2.push(i3), false));
    if (this.queue = t2, i2.length > 0)
      for (var { requestOptions: r2 } of i2)
        this.retriableRequest(r2);
  }
  unload() {
    for (var { requestOptions: e2 } of (this.poller && (clearTimeout(this.poller), this.poller = void 0), this.queue))
      try {
        this.instance._send_request(ne(ne({}, e2), {}, { transport: "sendBeacon" }));
      } catch (e3) {
        ee.error(e3);
      }
    this.queue = [];
  }
};
var Ps;
var Fs = te("[SessionId]");
var Ts = class {
  constructor(e2, t2, i2) {
    var r2;
    if (oe(this, "_sessionIdChangedHandlers", []), !e2.persistence)
      throw new Error("SessionIdManager requires a PostHogPersistence instance");
    if (e2.config.__preview_experimental_cookieless_mode)
      throw new Error("SessionIdManager cannot be used with __preview_experimental_cookieless_mode");
    this.config = e2.config, this.persistence = e2.persistence, this._windowId = void 0, this._sessionId = void 0, this._sessionStartTimestamp = null, this._sessionActivityTimestamp = null, this._sessionIdGenerator = t2 || st, this._windowIdGenerator = i2 || st;
    var s2 = this.config.persistence_name || this.config.token, n2 = this.config.session_idle_timeout_seconds || 1800;
    if (this._sessionTimeoutMs = 1e3 * pr(n2, 60, 36e3, "session_idle_timeout_seconds", 1800), e2.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.resetIdleTimer(), this._window_id_storage_key = "ph_" + s2 + "_window_id", this._primary_window_exists_storage_key = "ph_" + s2 + "_primary_window_exists", this._canUseSessionStorage()) {
      var o2 = mt.parse(this._window_id_storage_key), a2 = mt.parse(this._primary_window_exists_storage_key);
      o2 && !a2 ? this._windowId = o2 : mt.remove(this._window_id_storage_key), mt.set(this._primary_window_exists_storage_key, true);
    }
    if (null !== (r2 = this.config.bootstrap) && void 0 !== r2 && r2.sessionID)
      try {
        var l2 = ((e3) => {
          var t3 = e3.replace(/-/g, "");
          if (32 !== t3.length)
            throw new Error("Not a valid UUID");
          if ("7" !== t3[12])
            throw new Error("Not a UUIDv7");
          return parseInt(t3.substring(0, 12), 16);
        })(this.config.bootstrap.sessionID);
        this._setSessionId(this.config.bootstrap.sessionID, (/* @__PURE__ */ new Date()).getTime(), l2);
      } catch (e3) {
        Fs.error("Invalid sessionID in bootstrap", e3);
      }
    this._listenToReloadWindow();
  }
  get sessionTimeoutMs() {
    return this._sessionTimeoutMs;
  }
  onSessionId(e2) {
    return z(this._sessionIdChangedHandlers) && (this._sessionIdChangedHandlers = []), this._sessionIdChangedHandlers.push(e2), this._sessionId && e2(this._sessionId, this._windowId), () => {
      this._sessionIdChangedHandlers = this._sessionIdChangedHandlers.filter((t2) => t2 !== e2);
    };
  }
  _canUseSessionStorage() {
    return "memory" !== this.config.persistence && !this.persistence.disabled && mt.is_supported();
  }
  _setWindowId(e2) {
    e2 !== this._windowId && (this._windowId = e2, this._canUseSessionStorage() && mt.set(this._window_id_storage_key, e2));
  }
  _getWindowId() {
    return this._windowId ? this._windowId : this._canUseSessionStorage() ? mt.parse(this._window_id_storage_key) : null;
  }
  _setSessionId(e2, t2, i2) {
    e2 === this._sessionId && t2 === this._sessionActivityTimestamp && i2 === this._sessionStartTimestamp || (this._sessionStartTimestamp = i2, this._sessionActivityTimestamp = t2, this._sessionId = e2, this.persistence.register({ [Ee]: [t2, e2, i2] }));
  }
  _getSessionId() {
    if (this._sessionId && this._sessionActivityTimestamp && this._sessionStartTimestamp)
      return [this._sessionActivityTimestamp, this._sessionId, this._sessionStartTimestamp];
    var e2 = this.persistence.props[Ee];
    return B(e2) && 2 === e2.length && e2.push(e2[0]), e2 || [0, null, 0];
  }
  resetSessionId() {
    this._setSessionId(null, null, null);
  }
  _listenToReloadWindow() {
    R(t, "beforeunload", () => {
      this._canUseSessionStorage() && mt.remove(this._primary_window_exists_storage_key);
    }, { capture: false });
  }
  checkAndGetSessionAndWindowId() {
    var e2 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null;
    if (this.config.__preview_experimental_cookieless_mode)
      throw new Error("checkAndGetSessionAndWindowId should not be called in __preview_experimental_cookieless_mode");
    var i2 = t2 || (/* @__PURE__ */ new Date()).getTime(), [r2, s2, n2] = this._getSessionId(), o2 = this._getWindowId(), a2 = Y(n2) && n2 > 0 && Math.abs(i2 - n2) > 864e5, l2 = false, c2 = !s2, u2 = !e2 && Math.abs(i2 - r2) > this.sessionTimeoutMs;
    c2 || u2 || a2 ? (s2 = this._sessionIdGenerator(), o2 = this._windowIdGenerator(), Fs.info("new session ID generated", { sessionId: s2, windowId: o2, changeReason: { noSessionId: c2, activityTimeout: u2, sessionPastMaximumLength: a2 } }), n2 = i2, l2 = true) : o2 || (o2 = this._windowIdGenerator(), l2 = true);
    var d2 = 0 === r2 || !e2 || a2 ? i2 : r2, h2 = 0 === n2 ? (/* @__PURE__ */ new Date()).getTime() : n2;
    return this._setWindowId(o2), this._setSessionId(s2, d2, h2), e2 || this.resetIdleTimer(), l2 && this._sessionIdChangedHandlers.forEach((e3) => e3(s2, o2, l2 ? { noSessionId: c2, activityTimeout: u2, sessionPastMaximumLength: a2 } : void 0)), { sessionId: s2, windowId: o2, sessionStartTimestamp: h2, changeReason: l2 ? { noSessionId: c2, activityTimeout: u2, sessionPastMaximumLength: a2 } : void 0, lastActivityTimestamp: r2 };
  }
  resetIdleTimer() {
    clearTimeout(this._enforceIdleTimeout), this._enforceIdleTimeout = setTimeout(() => {
      this.resetSessionId();
    }, 1.1 * this.sessionTimeoutMs);
  }
};
!function(e2) {
  e2.US = "us", e2.EU = "eu", e2.CUSTOM = "custom";
}(Ps || (Ps = {}));
var Rs = "i.posthog.com";
var $s = class {
  constructor(e2) {
    oe(this, "_regionCache", {}), this.instance = e2;
  }
  get apiHost() {
    var e2 = this.instance.config.api_host.trim().replace(/\/$/, "");
    return "https://app.posthog.com" === e2 ? "https://us.i.posthog.com" : e2;
  }
  get uiHost() {
    var e2, t2 = null === (e2 = this.instance.config.ui_host) || void 0 === e2 ? void 0 : e2.replace(/\/$/, "");
    return t2 || (t2 = this.apiHost.replace(".".concat(Rs), ".posthog.com")), "https://app.posthog.com" === t2 ? "https://us.posthog.com" : t2;
  }
  get region() {
    return this._regionCache[this.apiHost] || (/https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this._regionCache[this.apiHost] = Ps.US : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this._regionCache[this.apiHost] = Ps.EU : this._regionCache[this.apiHost] = Ps.CUSTOM), this._regionCache[this.apiHost];
  }
  endpointFor(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "";
    if (t2 && (t2 = "/" === t2[0] ? t2 : "/".concat(t2)), "ui" === e2)
      return this.uiHost + t2;
    if (this.region === Ps.CUSTOM)
      return this.apiHost + t2;
    var i2 = Rs + t2;
    switch (e2) {
      case "assets":
        return "https://".concat(this.region, "-assets.").concat(i2);
      case "api":
        return "https://".concat(this.region, ".").concat(i2);
    }
  }
};
var Os = "posthog-js";
function Ms(e2) {
  var { organization: t2, projectId: i2, prefix: r2, severityAllowList: s2 = ["error"] } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
  return (n2) => {
    var o2, a2, l2, c2, u2;
    if (!("*" === s2 || s2.includes(n2.level)) || !e2.__loaded)
      return n2;
    n2.tags || (n2.tags = {});
    var d2 = e2.requestRouter.endpointFor("ui", "/project/".concat(e2.config.token, "/person/").concat(e2.get_distinct_id()));
    n2.tags["PostHog Person URL"] = d2, e2.sessionRecordingStarted() && (n2.tags["PostHog Recording URL"] = e2.get_session_replay_url({ withTimestamp: true }));
    var h2 = (null === (o2 = n2.exception) || void 0 === o2 ? void 0 : o2.values) || [];
    h2.forEach((e3) => {
      e3.stacktrace && (e3.stacktrace.type = "raw", e3.stacktrace.frames.forEach((e4) => {
        e4.platform = "web:javascript";
      }));
    });
    var _2 = { $exception_message: (null === (a2 = h2[0]) || void 0 === a2 ? void 0 : a2.value) || n2.message, $exception_type: null === (l2 = h2[0]) || void 0 === l2 ? void 0 : l2.type, $exception_personURL: d2, $exception_level: n2.level, $exception_list: h2, $sentry_event_id: n2.event_id, $sentry_exception: n2.exception, $sentry_exception_message: (null === (c2 = h2[0]) || void 0 === c2 ? void 0 : c2.value) || n2.message, $sentry_exception_type: null === (u2 = h2[0]) || void 0 === u2 ? void 0 : u2.type, $sentry_tags: n2.tags };
    return t2 && i2 && (_2.$sentry_url = (r2 || "https://sentry.io/organizations/") + t2 + "/issues/?project=" + i2 + "&query=" + n2.event_id), e2.exceptions.sendExceptionEvent(_2), n2;
  };
}
var As = class {
  constructor(e2, t2, i2, r2, s2) {
    this.name = Os, this.setupOnce = function(n2) {
      n2(Ms(e2, { organization: t2, projectId: i2, prefix: r2, severityAllowList: s2 }));
    };
  }
};
var Ls = te("[SegmentIntegration]");
function Ds(e2, t2) {
  var i2 = e2.config.segment;
  if (!i2)
    return t2();
  !function(e3, t3) {
    var i3 = e3.config.segment;
    if (!i3)
      return t3();
    var r2 = (i4) => {
      var r3 = () => i4.anonymousId() || st();
      e3.config.get_device_id = r3, i4.id() && (e3.register({ distinct_id: i4.id(), $device_id: r3() }), e3.persistence.set_property(Ae, "identified")), t3();
    }, s2 = i3.user();
    "then" in s2 && H(s2.then) ? s2.then((e4) => r2(e4)) : r2(s2);
  }(e2, () => {
    i2.register(((e3) => {
      Promise && Promise.resolve || Ls.warn("This browser does not have Promise support, and can not use the segment integration");
      var t3 = (t4, i3) => {
        var r2;
        if (!i3)
          return t4;
        t4.event.userId || t4.event.anonymousId === e3.get_distinct_id() || (Ls.info("No userId set, resetting PostHog"), e3.reset()), t4.event.userId && t4.event.userId !== e3.get_distinct_id() && (Ls.info("UserId set, identifying with PostHog"), e3.identify(t4.event.userId));
        var s2 = e3._calculate_event_properties(i3, null !== (r2 = t4.event.properties) && void 0 !== r2 ? r2 : {}, /* @__PURE__ */ new Date());
        return t4.event.properties = Object.assign({}, s2, t4.event.properties), t4;
      };
      return { name: "PostHog JS", type: "enrichment", version: "1.0.0", isLoaded: () => true, load: () => Promise.resolve(), track: (e4) => t3(e4, e4.event.event), page: (e4) => t3(e4, "$pageview"), identify: (e4) => t3(e4, "$identify"), screen: (e4) => t3(e4, "$screen") };
    })(e2)).then(() => {
      t2();
    });
  });
}
var Ns = class {
  constructor(e2) {
    this._instance = e2;
  }
  doPageView(e2, i2) {
    var r2, s2 = this._previousPageViewProperties(e2, i2);
    return this._currentPageview = { pathname: null !== (r2 = null == t ? void 0 : t.location.pathname) && void 0 !== r2 ? r2 : "", pageViewId: i2, timestamp: e2 }, this._instance.scrollManager.resetContext(), s2;
  }
  doPageLeave(e2) {
    var t2;
    return this._previousPageViewProperties(e2, null === (t2 = this._currentPageview) || void 0 === t2 ? void 0 : t2.pageViewId);
  }
  doEvent() {
    var e2;
    return { $pageview_id: null === (e2 = this._currentPageview) || void 0 === e2 ? void 0 : e2.pageViewId };
  }
  _previousPageViewProperties(e2, t2) {
    var i2 = this._currentPageview;
    if (!i2)
      return { $pageview_id: t2 };
    var r2 = { $pageview_id: t2, $prev_pageview_id: i2.pageViewId }, s2 = this._instance.scrollManager.getContext();
    if (s2 && !this._instance.config.disable_scroll_properties) {
      var { maxScrollHeight: n2, lastScrollY: o2, maxScrollY: a2, maxContentHeight: l2, lastContentY: c2, maxContentY: u2 } = s2;
      if (!(z(n2) || z(o2) || z(a2) || z(l2) || z(c2) || z(u2))) {
        n2 = Math.ceil(n2), o2 = Math.ceil(o2), a2 = Math.ceil(a2), l2 = Math.ceil(l2), c2 = Math.ceil(c2), u2 = Math.ceil(u2);
        var d2 = n2 <= 1 ? 1 : pr(o2 / n2, 0, 1), h2 = n2 <= 1 ? 1 : pr(a2 / n2, 0, 1), _2 = l2 <= 1 ? 1 : pr(c2 / l2, 0, 1), p2 = l2 <= 1 ? 1 : pr(u2 / l2, 0, 1);
        r2 = w(r2, { $prev_pageview_last_scroll: o2, $prev_pageview_last_scroll_percentage: d2, $prev_pageview_max_scroll: a2, $prev_pageview_max_scroll_percentage: h2, $prev_pageview_last_content: c2, $prev_pageview_last_content_percentage: _2, $prev_pageview_max_content: u2, $prev_pageview_max_content_percentage: p2 });
      }
    }
    return i2.pathname && (r2.$prev_pageview_pathname = i2.pathname), i2.timestamp && (r2.$prev_pageview_duration = (e2.getTime() - i2.timestamp.getTime()) / 1e3), r2;
  }
};
var qs;
var Bs;
var Hs;
var Us;
var js;
var zs;
var Ws;
var Vs;
var Gs = {};
var Js = [];
var Ys = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var Ks = Array.isArray;
function Xs(e2, t2) {
  for (var i2 in t2)
    e2[i2] = t2[i2];
  return e2;
}
function Qs(e2) {
  var t2 = e2.parentNode;
  t2 && t2.removeChild(e2);
}
function Zs(e2, t2, i2, r2, s2) {
  var n2 = { type: e2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, constructor: void 0, __v: null == s2 ? ++Hs : s2, __i: -1, __u: 0 };
  return null == s2 && null != Bs.vnode && Bs.vnode(n2), n2;
}
function en(e2) {
  return e2.children;
}
function tn(e2, t2) {
  this.props = e2, this.context = t2;
}
function rn(e2, t2) {
  if (null == t2)
    return e2.__ ? rn(e2.__, e2.__i + 1) : null;
  for (var i2; t2 < e2.__k.length; t2++)
    if (null != (i2 = e2.__k[t2]) && null != i2.__e)
      return i2.__e;
  return "function" == typeof e2.type ? rn(e2) : null;
}
function sn(e2) {
  var t2, i2;
  if (null != (e2 = e2.__) && null != e2.__c) {
    for (e2.__e = e2.__c.base = null, t2 = 0; t2 < e2.__k.length; t2++)
      if (null != (i2 = e2.__k[t2]) && null != i2.__e) {
        e2.__e = e2.__c.base = i2.__e;
        break;
      }
    return sn(e2);
  }
}
function nn(e2) {
  (!e2.__d && (e2.__d = true) && Us.push(e2) && !on.__r++ || js !== Bs.debounceRendering) && ((js = Bs.debounceRendering) || zs)(on);
}
function on() {
  var e2, t2, i2, r2, s2, n2, o2, a2, l2;
  for (Us.sort(Ws); e2 = Us.shift(); )
    e2.__d && (t2 = Us.length, r2 = void 0, n2 = (s2 = (i2 = e2).__v).__e, a2 = [], l2 = [], (o2 = i2.__P) && ((r2 = Xs({}, s2)).__v = s2.__v + 1, Bs.vnode && Bs.vnode(r2), vn(o2, r2, s2, i2.__n, void 0 !== o2.ownerSVGElement, 32 & s2.__u ? [n2] : null, a2, null == n2 ? rn(s2) : n2, !!(32 & s2.__u), l2), r2.__.__k[r2.__i] = r2, gn(a2, r2, l2), r2.__e != n2 && sn(r2)), Us.length > t2 && Us.sort(Ws));
  on.__r = 0;
}
function an(e2, t2, i2, r2, s2, n2, o2, a2, l2, c2, u2) {
  var d2, h2, _2, p2, v2, g2 = r2 && r2.__k || Js, f2 = t2.length;
  for (i2.__d = l2, ln(i2, t2, g2), l2 = i2.__d, d2 = 0; d2 < f2; d2++)
    null != (_2 = i2.__k[d2]) && "boolean" != typeof _2 && "function" != typeof _2 && (h2 = -1 === _2.__i ? Gs : g2[_2.__i] || Gs, _2.__i = d2, vn(e2, _2, h2, s2, n2, o2, a2, l2, c2, u2), p2 = _2.__e, _2.ref && h2.ref != _2.ref && (h2.ref && mn(h2.ref, null, _2), u2.push(_2.ref, _2.__c || p2, _2)), null == v2 && null != p2 && (v2 = p2), 65536 & _2.__u || h2.__k === _2.__k ? l2 = cn(_2, l2, e2) : "function" == typeof _2.type && void 0 !== _2.__d ? l2 = _2.__d : p2 && (l2 = p2.nextSibling), _2.__d = void 0, _2.__u &= -196609);
  i2.__d = l2, i2.__e = v2;
}
function ln(e2, t2, i2) {
  var r2, s2, n2, o2, a2, l2 = t2.length, c2 = i2.length, u2 = c2, d2 = 0;
  for (e2.__k = [], r2 = 0; r2 < l2; r2++)
    null != (s2 = e2.__k[r2] = null == (s2 = t2[r2]) || "boolean" == typeof s2 || "function" == typeof s2 ? null : "string" == typeof s2 || "number" == typeof s2 || "bigint" == typeof s2 || s2.constructor == String ? Zs(null, s2, null, null, s2) : Ks(s2) ? Zs(en, { children: s2 }, null, null, null) : void 0 === s2.constructor && s2.__b > 0 ? Zs(s2.type, s2.props, s2.key, s2.ref ? s2.ref : null, s2.__v) : s2) ? (s2.__ = e2, s2.__b = e2.__b + 1, a2 = un(s2, i2, o2 = r2 + d2, u2), s2.__i = a2, n2 = null, -1 !== a2 && (u2--, (n2 = i2[a2]) && (n2.__u |= 131072)), null == n2 || null === n2.__v ? (-1 == a2 && d2--, "function" != typeof s2.type && (s2.__u |= 65536)) : a2 !== o2 && (a2 === o2 + 1 ? d2++ : a2 > o2 ? u2 > l2 - o2 ? d2 += a2 - o2 : d2-- : d2 = a2 < o2 && a2 == o2 - 1 ? a2 - o2 : 0, a2 !== r2 + d2 && (s2.__u |= 65536))) : (n2 = i2[r2]) && null == n2.key && n2.__e && (n2.__e == e2.__d && (e2.__d = rn(n2)), bn(n2, n2, false), i2[r2] = null, u2--);
  if (u2)
    for (r2 = 0; r2 < c2; r2++)
      null != (n2 = i2[r2]) && 0 == (131072 & n2.__u) && (n2.__e == e2.__d && (e2.__d = rn(n2)), bn(n2, n2));
}
function cn(e2, t2, i2) {
  var r2, s2;
  if ("function" == typeof e2.type) {
    for (r2 = e2.__k, s2 = 0; r2 && s2 < r2.length; s2++)
      r2[s2] && (r2[s2].__ = e2, t2 = cn(r2[s2], t2, i2));
    return t2;
  }
  return e2.__e != t2 && (i2.insertBefore(e2.__e, t2 || null), t2 = e2.__e), t2 && t2.nextSibling;
}
function un(e2, t2, i2, r2) {
  var s2 = e2.key, n2 = e2.type, o2 = i2 - 1, a2 = i2 + 1, l2 = t2[i2];
  if (null === l2 || l2 && s2 == l2.key && n2 === l2.type)
    return i2;
  if (r2 > (null != l2 && 0 == (131072 & l2.__u) ? 1 : 0))
    for (; o2 >= 0 || a2 < t2.length; ) {
      if (o2 >= 0) {
        if ((l2 = t2[o2]) && 0 == (131072 & l2.__u) && s2 == l2.key && n2 === l2.type)
          return o2;
        o2--;
      }
      if (a2 < t2.length) {
        if ((l2 = t2[a2]) && 0 == (131072 & l2.__u) && s2 == l2.key && n2 === l2.type)
          return a2;
        a2++;
      }
    }
  return -1;
}
function dn(e2, t2, i2) {
  "-" === t2[0] ? e2.setProperty(t2, null == i2 ? "" : i2) : e2[t2] = null == i2 ? "" : "number" != typeof i2 || Ys.test(t2) ? i2 : i2 + "px";
}
function hn(e2, t2, i2, r2, s2) {
  var n2;
  e:
    if ("style" === t2)
      if ("string" == typeof i2)
        e2.style.cssText = i2;
      else {
        if ("string" == typeof r2 && (e2.style.cssText = r2 = ""), r2)
          for (t2 in r2)
            i2 && t2 in i2 || dn(e2.style, t2, "");
        if (i2)
          for (t2 in i2)
            r2 && i2[t2] === r2[t2] || dn(e2.style, t2, i2[t2]);
      }
    else if ("o" === t2[0] && "n" === t2[1])
      n2 = t2 !== (t2 = t2.replace(/(PointerCapture)$|Capture$/, "$1")), t2 = t2.toLowerCase() in e2 ? t2.toLowerCase().slice(2) : t2.slice(2), e2.l || (e2.l = {}), e2.l[t2 + n2] = i2, i2 ? r2 ? i2.u = r2.u : (i2.u = Date.now(), e2.addEventListener(t2, n2 ? pn : _n, n2)) : e2.removeEventListener(t2, n2 ? pn : _n, n2);
    else {
      if (s2)
        t2 = t2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if ("width" !== t2 && "height" !== t2 && "href" !== t2 && "list" !== t2 && "form" !== t2 && "tabIndex" !== t2 && "download" !== t2 && "rowSpan" !== t2 && "colSpan" !== t2 && "role" !== t2 && t2 in e2)
        try {
          e2[t2] = null == i2 ? "" : i2;
          break e;
        } catch (e3) {
        }
      "function" == typeof i2 || (null == i2 || false === i2 && "-" !== t2[4] ? e2.removeAttribute(t2) : e2.setAttribute(t2, i2));
    }
}
function _n(e2) {
  var t2 = this.l[e2.type + false];
  if (e2.t) {
    if (e2.t <= t2.u)
      return;
  } else
    e2.t = Date.now();
  return t2(Bs.event ? Bs.event(e2) : e2);
}
function pn(e2) {
  return this.l[e2.type + true](Bs.event ? Bs.event(e2) : e2);
}
function vn(e2, t2, i2, r2, s2, n2, o2, a2, l2, c2) {
  var u2, d2, h2, _2, p2, v2, g2, f2, m2, b2, y2, w2, S2, k2, E2, x2 = t2.type;
  if (void 0 !== t2.constructor)
    return null;
  128 & i2.__u && (l2 = !!(32 & i2.__u), n2 = [a2 = t2.__e = i2.__e]), (u2 = Bs.__b) && u2(t2);
  e:
    if ("function" == typeof x2)
      try {
        if (f2 = t2.props, m2 = (u2 = x2.contextType) && r2[u2.__c], b2 = u2 ? m2 ? m2.props.value : u2.__ : r2, i2.__c ? g2 = (d2 = t2.__c = i2.__c).__ = d2.__E : ("prototype" in x2 && x2.prototype.render ? t2.__c = d2 = new x2(f2, b2) : (t2.__c = d2 = new tn(f2, b2), d2.constructor = x2, d2.render = yn), m2 && m2.sub(d2), d2.props = f2, d2.state || (d2.state = {}), d2.context = b2, d2.__n = r2, h2 = d2.__d = true, d2.__h = [], d2._sb = []), null == d2.__s && (d2.__s = d2.state), null != x2.getDerivedStateFromProps && (d2.__s == d2.state && (d2.__s = Xs({}, d2.__s)), Xs(d2.__s, x2.getDerivedStateFromProps(f2, d2.__s))), _2 = d2.props, p2 = d2.state, d2.__v = t2, h2)
          null == x2.getDerivedStateFromProps && null != d2.componentWillMount && d2.componentWillMount(), null != d2.componentDidMount && d2.__h.push(d2.componentDidMount);
        else {
          if (null == x2.getDerivedStateFromProps && f2 !== _2 && null != d2.componentWillReceiveProps && d2.componentWillReceiveProps(f2, b2), !d2.__e && (null != d2.shouldComponentUpdate && false === d2.shouldComponentUpdate(f2, d2.__s, b2) || t2.__v === i2.__v)) {
            for (t2.__v !== i2.__v && (d2.props = f2, d2.state = d2.__s, d2.__d = false), t2.__e = i2.__e, t2.__k = i2.__k, t2.__k.forEach(function(e3) {
              e3 && (e3.__ = t2);
            }), y2 = 0; y2 < d2._sb.length; y2++)
              d2.__h.push(d2._sb[y2]);
            d2._sb = [], d2.__h.length && o2.push(d2);
            break e;
          }
          null != d2.componentWillUpdate && d2.componentWillUpdate(f2, d2.__s, b2), null != d2.componentDidUpdate && d2.__h.push(function() {
            d2.componentDidUpdate(_2, p2, v2);
          });
        }
        if (d2.context = b2, d2.props = f2, d2.__P = e2, d2.__e = false, w2 = Bs.__r, S2 = 0, "prototype" in x2 && x2.prototype.render) {
          for (d2.state = d2.__s, d2.__d = false, w2 && w2(t2), u2 = d2.render(d2.props, d2.state, d2.context), k2 = 0; k2 < d2._sb.length; k2++)
            d2.__h.push(d2._sb[k2]);
          d2._sb = [];
        } else
          do {
            d2.__d = false, w2 && w2(t2), u2 = d2.render(d2.props, d2.state, d2.context), d2.state = d2.__s;
          } while (d2.__d && ++S2 < 25);
        d2.state = d2.__s, null != d2.getChildContext && (r2 = Xs(Xs({}, r2), d2.getChildContext())), h2 || null == d2.getSnapshotBeforeUpdate || (v2 = d2.getSnapshotBeforeUpdate(_2, p2)), an(e2, Ks(E2 = null != u2 && u2.type === en && null == u2.key ? u2.props.children : u2) ? E2 : [E2], t2, i2, r2, s2, n2, o2, a2, l2, c2), d2.base = t2.__e, t2.__u &= -161, d2.__h.length && o2.push(d2), g2 && (d2.__E = d2.__ = null);
      } catch (e3) {
        t2.__v = null, l2 || null != n2 ? (t2.__e = a2, t2.__u |= l2 ? 160 : 32, n2[n2.indexOf(a2)] = null) : (t2.__e = i2.__e, t2.__k = i2.__k), Bs.__e(e3, t2, i2);
      }
    else
      null == n2 && t2.__v === i2.__v ? (t2.__k = i2.__k, t2.__e = i2.__e) : t2.__e = fn(i2.__e, t2, i2, r2, s2, n2, o2, l2, c2);
  (u2 = Bs.diffed) && u2(t2);
}
function gn(e2, t2, i2) {
  t2.__d = void 0;
  for (var r2 = 0; r2 < i2.length; r2++)
    mn(i2[r2], i2[++r2], i2[++r2]);
  Bs.__c && Bs.__c(t2, e2), e2.some(function(t3) {
    try {
      e2 = t3.__h, t3.__h = [], e2.some(function(e3) {
        e3.call(t3);
      });
    } catch (e3) {
      Bs.__e(e3, t3.__v);
    }
  });
}
function fn(e2, t2, i2, r2, s2, n2, o2, a2, l2) {
  var c2, u2, d2, h2, _2, p2, v2, g2 = i2.props, f2 = t2.props, m2 = t2.type;
  if ("svg" === m2 && (s2 = true), null != n2) {
    for (c2 = 0; c2 < n2.length; c2++)
      if ((_2 = n2[c2]) && "setAttribute" in _2 == !!m2 && (m2 ? _2.localName === m2 : 3 === _2.nodeType)) {
        e2 = _2, n2[c2] = null;
        break;
      }
  }
  if (null == e2) {
    if (null === m2)
      return document.createTextNode(f2);
    e2 = s2 ? document.createElementNS("http://www.w3.org/2000/svg", m2) : document.createElement(m2, f2.is && f2), n2 = null, a2 = false;
  }
  if (null === m2)
    g2 === f2 || a2 && e2.data === f2 || (e2.data = f2);
  else {
    if (n2 = n2 && qs.call(e2.childNodes), g2 = i2.props || Gs, !a2 && null != n2)
      for (g2 = {}, c2 = 0; c2 < e2.attributes.length; c2++)
        g2[(_2 = e2.attributes[c2]).name] = _2.value;
    for (c2 in g2)
      _2 = g2[c2], "children" == c2 || ("dangerouslySetInnerHTML" == c2 ? d2 = _2 : "key" === c2 || c2 in f2 || hn(e2, c2, null, _2, s2));
    for (c2 in f2)
      _2 = f2[c2], "children" == c2 ? h2 = _2 : "dangerouslySetInnerHTML" == c2 ? u2 = _2 : "value" == c2 ? p2 = _2 : "checked" == c2 ? v2 = _2 : "key" === c2 || a2 && "function" != typeof _2 || g2[c2] === _2 || hn(e2, c2, _2, g2[c2], s2);
    if (u2)
      a2 || d2 && (u2.__html === d2.__html || u2.__html === e2.innerHTML) || (e2.innerHTML = u2.__html), t2.__k = [];
    else if (d2 && (e2.innerHTML = ""), an(e2, Ks(h2) ? h2 : [h2], t2, i2, r2, s2 && "foreignObject" !== m2, n2, o2, n2 ? n2[0] : i2.__k && rn(i2, 0), a2, l2), null != n2)
      for (c2 = n2.length; c2--; )
        null != n2[c2] && Qs(n2[c2]);
    a2 || (c2 = "value", void 0 !== p2 && (p2 !== e2[c2] || "progress" === m2 && !p2 || "option" === m2 && p2 !== g2[c2]) && hn(e2, c2, p2, g2[c2], false), c2 = "checked", void 0 !== v2 && v2 !== e2[c2] && hn(e2, c2, v2, g2[c2], false));
  }
  return e2;
}
function mn(e2, t2, i2) {
  try {
    "function" == typeof e2 ? e2(t2) : e2.current = t2;
  } catch (e3) {
    Bs.__e(e3, i2);
  }
}
function bn(e2, t2, i2) {
  var r2, s2;
  if (Bs.unmount && Bs.unmount(e2), (r2 = e2.ref) && (r2.current && r2.current !== e2.__e || mn(r2, null, t2)), null != (r2 = e2.__c)) {
    if (r2.componentWillUnmount)
      try {
        r2.componentWillUnmount();
      } catch (e3) {
        Bs.__e(e3, t2);
      }
    r2.base = r2.__P = null, e2.__c = void 0;
  }
  if (r2 = e2.__k)
    for (s2 = 0; s2 < r2.length; s2++)
      r2[s2] && bn(r2[s2], t2, i2 || "function" != typeof e2.type);
  i2 || null == e2.__e || Qs(e2.__e), e2.__ = e2.__e = e2.__d = void 0;
}
function yn(e2, t2, i2) {
  return this.constructor(e2, i2);
}
qs = Js.slice, Bs = { __e: function(e2, t2, i2, r2) {
  for (var s2, n2, o2; t2 = t2.__; )
    if ((s2 = t2.__c) && !s2.__)
      try {
        if ((n2 = s2.constructor) && null != n2.getDerivedStateFromError && (s2.setState(n2.getDerivedStateFromError(e2)), o2 = s2.__d), null != s2.componentDidCatch && (s2.componentDidCatch(e2, r2 || {}), o2 = s2.__d), o2)
          return s2.__E = s2;
      } catch (t3) {
        e2 = t3;
      }
  throw e2;
} }, Hs = 0, tn.prototype.setState = function(e2, t2) {
  var i2;
  i2 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = Xs({}, this.state), "function" == typeof e2 && (e2 = e2(Xs({}, i2), this.props)), e2 && Xs(i2, e2), null != e2 && this.__v && (t2 && this._sb.push(t2), nn(this));
}, tn.prototype.forceUpdate = function(e2) {
  this.__v && (this.__e = true, e2 && this.__h.push(e2), nn(this));
}, tn.prototype.render = en, Us = [], zs = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, Ws = function(e2, t2) {
  return e2.__v.__b - t2.__v.__b;
}, on.__r = 0, Vs = 0;
var wn;
var Sn;
var kn;
!function(e2, t2) {
  var i2 = { __c: t2 = "__cC" + Vs++, __: e2, Consumer: function(e3, t3) {
    return e3.children(t3);
  }, Provider: function(e3) {
    var i3, r2;
    return this.getChildContext || (i3 = [], (r2 = {})[t2] = this, this.getChildContext = function() {
      return r2;
    }, this.shouldComponentUpdate = function(e4) {
      this.props.value !== e4.value && i3.some(function(e5) {
        e5.__e = true, nn(e5);
      });
    }, this.sub = function(e4) {
      i3.push(e4);
      var t3 = e4.componentWillUnmount;
      e4.componentWillUnmount = function() {
        i3.splice(i3.indexOf(e4), 1), t3 && t3.call(e4);
      };
    }), e3.children;
  } };
  i2.Provider.__ = i2.Consumer.contextType = i2;
}({ isPreviewMode: false, previewPageIndex: 0, handleCloseSurveyPopup: () => {
}, isPopup: true, onPreviewSubmit: () => {
} }), function(e2) {
  e2.Popover = "popover", e2.API = "api", e2.Widget = "widget";
}(wn || (wn = {})), function(e2) {
  e2.Open = "open", e2.MultipleChoice = "multiple_choice", e2.SingleChoice = "single_choice", e2.Rating = "rating", e2.Link = "link";
}(Sn || (Sn = {})), function(e2) {
  e2.NextQuestion = "next_question", e2.End = "end", e2.ResponseBased = "response_based", e2.SpecificQuestion = "specific_question";
}(kn || (kn = {}));
var En = class {
  constructor() {
    oe(this, "events", {}), this.events = {};
  }
  on(e2, t2) {
    return this.events[e2] || (this.events[e2] = []), this.events[e2].push(t2), () => {
      this.events[e2] = this.events[e2].filter((e3) => e3 !== t2);
    };
  }
  emit(e2, t2) {
    for (var i2 of this.events[e2] || [])
      i2(t2);
    for (var r2 of this.events["*"] || [])
      r2(e2, t2);
  }
};
var xn = class _xn {
  constructor(e2) {
    oe(this, "_debugEventEmitter", new En()), oe(this, "checkStep", (e3, t2) => this.checkStepEvent(e3, t2) && this.checkStepUrl(e3, t2) && this.checkStepElement(e3, t2)), oe(this, "checkStepEvent", (e3, t2) => null == t2 || !t2.event || (null == e3 ? void 0 : e3.event) === (null == t2 ? void 0 : t2.event)), this.instance = e2, this.actionEvents = /* @__PURE__ */ new Set(), this.actionRegistry = /* @__PURE__ */ new Set();
  }
  init() {
    var e2;
    if (!z(null === (e2 = this.instance) || void 0 === e2 ? void 0 : e2._addCaptureHook)) {
      var t2;
      null === (t2 = this.instance) || void 0 === t2 || t2._addCaptureHook((e3, t3) => {
        this.on(e3, t3);
      });
    }
  }
  register(e2) {
    var t2, i2;
    if (!z(null === (t2 = this.instance) || void 0 === t2 ? void 0 : t2._addCaptureHook) && (e2.forEach((e3) => {
      var t3, i3;
      null === (t3 = this.actionRegistry) || void 0 === t3 || t3.add(e3), null === (i3 = e3.steps) || void 0 === i3 || i3.forEach((e4) => {
        var t4;
        null === (t4 = this.actionEvents) || void 0 === t4 || t4.add((null == e4 ? void 0 : e4.event) || "");
      });
    }), null !== (i2 = this.instance) && void 0 !== i2 && i2.autocapture)) {
      var r2, s2 = /* @__PURE__ */ new Set();
      e2.forEach((e3) => {
        var t3;
        null === (t3 = e3.steps) || void 0 === t3 || t3.forEach((e4) => {
          null != e4 && e4.selector && s2.add(null == e4 ? void 0 : e4.selector);
        });
      }), null === (r2 = this.instance) || void 0 === r2 || r2.autocapture.setElementSelectors(s2);
    }
  }
  on(e2, t2) {
    var i2;
    null != t2 && 0 != e2.length && (this.actionEvents.has(e2) || this.actionEvents.has(null == t2 ? void 0 : t2.event)) && this.actionRegistry && (null === (i2 = this.actionRegistry) || void 0 === i2 ? void 0 : i2.size) > 0 && this.actionRegistry.forEach((e3) => {
      this.checkAction(t2, e3) && this._debugEventEmitter.emit("actionCaptured", e3.name);
    });
  }
  _addActionHook(e2) {
    this.onAction("actionCaptured", (t2) => e2(t2));
  }
  checkAction(e2, t2) {
    if (null == (null == t2 ? void 0 : t2.steps))
      return false;
    for (var i2 of t2.steps)
      if (this.checkStep(e2, i2))
        return true;
    return false;
  }
  onAction(e2, t2) {
    return this._debugEventEmitter.on(e2, t2);
  }
  checkStepUrl(e2, t2) {
    if (null != t2 && t2.url) {
      var i2, r2 = null == e2 || null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$current_url;
      if (!r2 || "string" != typeof r2)
        return false;
      if (!_xn.matchString(r2, null == t2 ? void 0 : t2.url, (null == t2 ? void 0 : t2.url_matching) || "contains"))
        return false;
    }
    return true;
  }
  static matchString(e2, i2, r2) {
    switch (r2) {
      case "regex":
        return !!t && A(e2, i2);
      case "exact":
        return i2 === e2;
      case "contains":
        var s2 = _xn.escapeStringRegexp(i2).replace(/_/g, ".").replace(/%/g, ".*");
        return A(e2, s2);
      default:
        return false;
    }
  }
  static escapeStringRegexp(e2) {
    return e2.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  }
  checkStepElement(e2, t2) {
    if ((null != t2 && t2.href || null != t2 && t2.tag_name || null != t2 && t2.text) && !this.getElementsList(e2).some((e3) => !(null != t2 && t2.href && !_xn.matchString(e3.href || "", null == t2 ? void 0 : t2.href, (null == t2 ? void 0 : t2.href_matching) || "exact")) && ((null == t2 || !t2.tag_name || e3.tag_name === (null == t2 ? void 0 : t2.tag_name)) && !(null != t2 && t2.text && !_xn.matchString(e3.text || "", null == t2 ? void 0 : t2.text, (null == t2 ? void 0 : t2.text_matching) || "exact") && !_xn.matchString(e3.$el_text || "", null == t2 ? void 0 : t2.text, (null == t2 ? void 0 : t2.text_matching) || "exact")))))
      return false;
    if (null != t2 && t2.selector) {
      var i2, r2 = null == e2 || null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$element_selectors;
      if (!r2)
        return false;
      if (!r2.includes(null == t2 ? void 0 : t2.selector))
        return false;
    }
    return true;
  }
  getElementsList(e2) {
    return null == (null == e2 ? void 0 : e2.properties.$elements) ? [] : null == e2 ? void 0 : e2.properties.$elements;
  }
};
var In = class _In {
  constructor(e2) {
    this.instance = e2, this.eventToSurveys = /* @__PURE__ */ new Map(), this.actionToSurveys = /* @__PURE__ */ new Map();
  }
  register(e2) {
    var t2;
    z(null === (t2 = this.instance) || void 0 === t2 ? void 0 : t2._addCaptureHook) || (this.setupEventBasedSurveys(e2), this.setupActionBasedSurveys(e2));
  }
  setupActionBasedSurveys(e2) {
    var t2 = e2.filter((e3) => {
      var t3, i2, r2, s2;
      return (null === (t3 = e3.conditions) || void 0 === t3 ? void 0 : t3.actions) && (null === (i2 = e3.conditions) || void 0 === i2 || null === (r2 = i2.actions) || void 0 === r2 || null === (s2 = r2.values) || void 0 === s2 ? void 0 : s2.length) > 0;
    });
    if (0 !== t2.length) {
      if (null == this.actionMatcher) {
        this.actionMatcher = new xn(this.instance), this.actionMatcher.init();
        this.actionMatcher._addActionHook((e3) => {
          this.onAction(e3);
        });
      }
      t2.forEach((e3) => {
        var t3, i2, r2, s2, n2, o2, a2, l2, c2, u2;
        e3.conditions && null !== (t3 = e3.conditions) && void 0 !== t3 && t3.actions && null !== (i2 = e3.conditions) && void 0 !== i2 && null !== (r2 = i2.actions) && void 0 !== r2 && r2.values && (null === (s2 = e3.conditions) || void 0 === s2 || null === (n2 = s2.actions) || void 0 === n2 || null === (o2 = n2.values) || void 0 === o2 ? void 0 : o2.length) > 0 && (null === (a2 = this.actionMatcher) || void 0 === a2 || a2.register(e3.conditions.actions.values), null === (l2 = e3.conditions) || void 0 === l2 || null === (c2 = l2.actions) || void 0 === c2 || null === (u2 = c2.values) || void 0 === u2 || u2.forEach((t4) => {
          if (t4 && t4.name) {
            var i3 = this.actionToSurveys.get(t4.name);
            i3 && i3.push(e3.id), this.actionToSurveys.set(t4.name, i3 || [e3.id]);
          }
        }));
      });
    }
  }
  setupEventBasedSurveys(e2) {
    var t2;
    if (0 !== e2.filter((e3) => {
      var t3, i2, r2, s2;
      return (null === (t3 = e3.conditions) || void 0 === t3 ? void 0 : t3.events) && (null === (i2 = e3.conditions) || void 0 === i2 || null === (r2 = i2.events) || void 0 === r2 || null === (s2 = r2.values) || void 0 === s2 ? void 0 : s2.length) > 0;
    }).length) {
      null === (t2 = this.instance) || void 0 === t2 || t2._addCaptureHook((e3, t3) => {
        this.onEvent(e3, t3);
      }), e2.forEach((e3) => {
        var t3, i2, r2;
        null === (t3 = e3.conditions) || void 0 === t3 || null === (i2 = t3.events) || void 0 === i2 || null === (r2 = i2.values) || void 0 === r2 || r2.forEach((t4) => {
          if (t4 && t4.name) {
            var i3 = this.eventToSurveys.get(t4.name);
            i3 && i3.push(e3.id), this.eventToSurveys.set(t4.name, i3 || [e3.id]);
          }
        });
      });
    }
  }
  onEvent(e2, t2) {
    var i2, r2, s2 = (null === (i2 = this.instance) || void 0 === i2 || null === (r2 = i2.persistence) || void 0 === r2 ? void 0 : r2.props[Oe]) || [];
    if (_In.SURVEY_SHOWN_EVENT_NAME == e2 && t2 && s2.length > 0) {
      var n2, o2 = null == t2 || null === (n2 = t2.properties) || void 0 === n2 ? void 0 : n2.$survey_id;
      if (o2) {
        var a2 = s2.indexOf(o2);
        a2 >= 0 && (s2.splice(a2, 1), this._updateActivatedSurveys(s2));
      }
    } else
      this.eventToSurveys.has(e2) && this._updateActivatedSurveys(s2.concat(this.eventToSurveys.get(e2) || []));
  }
  onAction(e2) {
    var t2, i2, r2 = (null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 ? void 0 : i2.props[Oe]) || [];
    this.actionToSurveys.has(e2) && this._updateActivatedSurveys(r2.concat(this.actionToSurveys.get(e2) || []));
  }
  _updateActivatedSurveys(e2) {
    var t2, i2;
    null === (t2 = this.instance) || void 0 === t2 || null === (i2 = t2.persistence) || void 0 === i2 || i2.register({ [Oe]: [...new Set(e2)] });
  }
  getSurveys() {
    var e2, t2, i2 = null === (e2 = this.instance) || void 0 === e2 || null === (t2 = e2.persistence) || void 0 === t2 ? void 0 : t2.props[Oe];
    return i2 || [];
  }
  getEventToSurveys() {
    return this.eventToSurveys;
  }
  _getActionMatcher() {
    return this.actionMatcher;
  }
};
oe(In, "SURVEY_SHOWN_EVENT_NAME", "survey shown");
var Cn = te("[Surveys]");
var Pn = { icontains: (e2, t2) => e2.some((e3) => t2.toLowerCase().includes(e3.toLowerCase())), not_icontains: (e2, t2) => e2.every((e3) => !t2.toLowerCase().includes(e3.toLowerCase())), regex: (e2, t2) => e2.some((e3) => A(t2, e3)), not_regex: (e2, t2) => e2.every((e3) => !A(t2, e3)), exact: (e2, t2) => e2.some((e3) => t2 === e3), is_not: (e2, t2) => e2.every((e3) => t2 !== e3) };
function Fn(e2, t2, i2) {
  var r2, s2 = e2.questions[t2], n2 = t2 + 1;
  if (null === (r2 = s2.branching) || void 0 === r2 || !r2.type)
    return t2 === e2.questions.length - 1 ? kn.End : n2;
  if (s2.branching.type === kn.End)
    return kn.End;
  if (s2.branching.type === kn.SpecificQuestion) {
    if (Number.isInteger(s2.branching.index))
      return s2.branching.index;
  } else if (s2.branching.type === kn.ResponseBased) {
    if (s2.type === Sn.SingleChoice) {
      var o2, a2, l2 = s2.choices.indexOf("".concat(i2));
      if (null !== (o2 = s2.branching) && void 0 !== o2 && null !== (a2 = o2.responseValues) && void 0 !== a2 && a2.hasOwnProperty(l2)) {
        var c2 = s2.branching.responseValues[l2];
        return Number.isInteger(c2) ? c2 : c2 === kn.End ? kn.End : n2;
      }
    } else if (s2.type === Sn.Rating) {
      var u2, d2;
      if ("number" != typeof i2 || !Number.isInteger(i2))
        throw new Error("The response type must be an integer");
      var h2 = function(e3, t3) {
        if (3 === t3) {
          if (e3 < 1 || e3 > 3)
            throw new Error("The response must be in range 1-3");
          return 1 === e3 ? "negative" : 2 === e3 ? "neutral" : "positive";
        }
        if (5 === t3) {
          if (e3 < 1 || e3 > 5)
            throw new Error("The response must be in range 1-5");
          return e3 <= 2 ? "negative" : 3 === e3 ? "neutral" : "positive";
        }
        if (7 === t3) {
          if (e3 < 1 || e3 > 7)
            throw new Error("The response must be in range 1-7");
          return e3 <= 3 ? "negative" : 4 === e3 ? "neutral" : "positive";
        }
        if (10 === t3) {
          if (e3 < 0 || e3 > 10)
            throw new Error("The response must be in range 0-10");
          return e3 <= 6 ? "detractors" : e3 <= 8 ? "passives" : "promoters";
        }
        throw new Error("The scale must be one of: 3, 5, 7, 10");
      }(i2, s2.scale);
      if (null !== (u2 = s2.branching) && void 0 !== u2 && null !== (d2 = u2.responseValues) && void 0 !== d2 && d2.hasOwnProperty(h2)) {
        var _2 = s2.branching.responseValues[h2];
        return Number.isInteger(_2) ? _2 : _2 === kn.End ? kn.End : n2;
      }
    }
    return n2;
  }
  return Cn.warn("Falling back to next question index due to unexpected branching type"), n2;
}
function Tn(e2) {
  return null != e2 ? e2 : "icontains";
}
var Rn = class {
  constructor(e2) {
    oe(this, "getNextSurveyStep", Fn), this.instance = e2, this._surveyEventReceiver = null;
  }
  onRemoteConfig(e2) {
    this._decideServerResponse = !!e2.surveys, Cn.info("decideServerResponse set to ".concat(this._decideServerResponse)), this.loadIfEnabled();
  }
  reset() {
    localStorage.removeItem("lastSeenSurveyDate");
    var e2 = (() => {
      for (var e3 = [], t2 = 0; t2 < localStorage.length; t2++) {
        var i2 = localStorage.key(t2);
        null != i2 && i2.startsWith("seenSurvey_") && e3.push(i2);
      }
      return e3;
    })();
    e2.forEach((e3) => localStorage.removeItem(e3));
  }
  loadIfEnabled() {
    if (!this._surveyManager)
      if (this.instance.config.disable_surveys)
        Cn.info("Disabled. Not loading surveys.");
      else {
        var e2 = null == _ ? void 0 : _.__PosthogExtensions__;
        if (e2) {
          var t2 = e2.generateSurveys;
          if (this._decideServerResponse)
            if (null == this._surveyEventReceiver && (this._surveyEventReceiver = new In(this.instance)), t2)
              this._surveyManager = t2(this.instance);
            else {
              var i2 = e2.loadExternalDependency;
              i2 ? i2(this.instance, "surveys", (t3) => {
                var i3;
                t3 ? Cn.error("Could not load surveys script", t3) : this._surveyManager = null === (i3 = e2.generateSurveys) || void 0 === i3 ? void 0 : i3.call(e2, this.instance);
              }) : Cn.error("PostHog loadExternalDependency extension not found. Cannot load remote config.");
            }
          else
            Cn.warn("Decide not loaded yet. Not loading surveys.");
        } else
          Cn.error("PostHog Extensions not found.");
      }
  }
  getSurveys(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    if (this.instance.config.disable_surveys)
      return Cn.info("Disabled. Not loading surveys."), e2([]);
    null == this._surveyEventReceiver && (this._surveyEventReceiver = new In(this.instance));
    var i2 = this.instance.get_property($e);
    if (i2 && !t2)
      return e2(i2);
    this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/surveys/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
      var i3, r2 = t3.statusCode;
      if (200 !== r2 || !t3.json)
        return Cn.error("Surveys API could not be loaded, status: ".concat(r2)), e2([]);
      var s2, n2 = t3.json.surveys || [], o2 = n2.filter((e3) => {
        var t4, i4, r3, s3, n3, o3, a2, l2, c2, u2, d2, h2;
        return (null === (t4 = e3.conditions) || void 0 === t4 ? void 0 : t4.events) && (null === (i4 = e3.conditions) || void 0 === i4 || null === (r3 = i4.events) || void 0 === r3 ? void 0 : r3.values) && (null === (s3 = e3.conditions) || void 0 === s3 || null === (n3 = s3.events) || void 0 === n3 || null === (o3 = n3.values) || void 0 === o3 ? void 0 : o3.length) > 0 || (null === (a2 = e3.conditions) || void 0 === a2 ? void 0 : a2.actions) && (null === (l2 = e3.conditions) || void 0 === l2 || null === (c2 = l2.actions) || void 0 === c2 ? void 0 : c2.values) && (null === (u2 = e3.conditions) || void 0 === u2 || null === (d2 = u2.actions) || void 0 === d2 || null === (h2 = d2.values) || void 0 === h2 ? void 0 : h2.length) > 0;
      });
      o2.length > 0 && (null === (s2 = this._surveyEventReceiver) || void 0 === s2 || s2.register(o2));
      return null === (i3 = this.instance.persistence) || void 0 === i3 || i3.register({ [$e]: n2 }), e2(n2);
    } });
  }
  getActiveMatchingSurveys(e2) {
    var i2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    this.getSurveys((i3) => {
      var r2, s2 = i3.filter((e3) => !(!e3.start_date || e3.end_date)).filter((e3) => {
        var i4;
        if (!e3.conditions)
          return true;
        var r3 = function(e4) {
          var i5, r4, s4;
          if (null === (i5 = e4.conditions) || void 0 === i5 || !i5.url)
            return true;
          var n4 = null == t || null === (r4 = t.location) || void 0 === r4 ? void 0 : r4.href;
          if (!n4)
            return false;
          var o3 = [e4.conditions.url];
          return Pn[Tn(null === (s4 = e4.conditions) || void 0 === s4 ? void 0 : s4.urlMatchType)](o3, n4);
        }(e3), s3 = null === (i4 = e3.conditions) || void 0 === i4 || !i4.selector || (null == a ? void 0 : a.querySelector(e3.conditions.selector)), n3 = function(e4) {
          var t2, i5;
          if (null === (t2 = e4.conditions) || void 0 === t2 || !t2.deviceTypes)
            return true;
          if (!h)
            return false;
          var r4 = Ei.deviceType(h);
          return Pn[Tn(null === (i5 = e4.conditions) || void 0 === i5 ? void 0 : i5.deviceTypesMatchType)](e4.conditions.deviceTypes, r4);
        }(e3);
        return r3 && s3 && n3;
      }), n2 = null === (r2 = this._surveyEventReceiver) || void 0 === r2 ? void 0 : r2.getSurveys(), o2 = s2.filter((e3) => {
        var t2, i4, r3, s3, o3, a2, l2, c2, u2, d2, h2;
        if (!(e3.linked_flag_key || e3.targeting_flag_key || e3.internal_targeting_flag_key || null !== (t2 = e3.feature_flag_keys) && void 0 !== t2 && t2.length))
          return true;
        var _2 = !e3.linked_flag_key || this.instance.featureFlags.isFeatureEnabled(e3.linked_flag_key), p2 = !e3.targeting_flag_key || this.instance.featureFlags.isFeatureEnabled(e3.targeting_flag_key), v2 = (null === (i4 = e3.conditions) || void 0 === i4 ? void 0 : i4.events) && (null === (r3 = e3.conditions) || void 0 === r3 || null === (s3 = r3.events) || void 0 === s3 ? void 0 : s3.values) && (null === (o3 = e3.conditions) || void 0 === o3 || null === (a2 = o3.events) || void 0 === a2 ? void 0 : a2.values.length) > 0, g2 = (null === (l2 = e3.conditions) || void 0 === l2 ? void 0 : l2.actions) && (null === (c2 = e3.conditions) || void 0 === c2 || null === (u2 = c2.actions) || void 0 === u2 ? void 0 : u2.values) && (null === (d2 = e3.conditions) || void 0 === d2 || null === (h2 = d2.actions) || void 0 === h2 ? void 0 : h2.values.length) > 0, f2 = !v2 && !g2 || (null == n2 ? void 0 : n2.includes(e3.id)), m2 = this._canActivateRepeatedly(e3), b2 = !(e3.internal_targeting_flag_key && !m2) || this.instance.featureFlags.isFeatureEnabled(e3.internal_targeting_flag_key), y2 = this.checkFlags(e3);
        return _2 && p2 && b2 && f2 && y2;
      });
      return e2(o2);
    }, i2);
  }
  checkFlags(e2) {
    var t2;
    return null === (t2 = e2.feature_flag_keys) || void 0 === t2 || !t2.length || e2.feature_flag_keys.every((e3) => {
      var { key: t3, value: i2 } = e3;
      return !t3 || !i2 || this.instance.featureFlags.isFeatureEnabled(i2);
    });
  }
  _canActivateRepeatedly(e2) {
    var t2;
    return J(null === (t2 = _.__PosthogExtensions__) || void 0 === t2 ? void 0 : t2.canActivateRepeatedly) ? (Cn.warn("init was not called"), false) : _.__PosthogExtensions__.canActivateRepeatedly(e2);
  }
  canRenderSurvey(e2) {
    J(this._surveyManager) ? Cn.warn("init was not called") : this.getSurveys((t2) => {
      var i2 = t2.filter((t3) => t3.id === e2)[0];
      this._surveyManager.canRenderSurvey(i2);
    });
  }
  renderSurvey(e2, t2) {
    J(this._surveyManager) ? Cn.warn("init was not called") : this.getSurveys((i2) => {
      var r2 = i2.filter((t3) => t3.id === e2)[0];
      this._surveyManager.renderSurvey(r2, null == a ? void 0 : a.querySelector(t2));
    });
  }
};
var $n = te("[RateLimiter]");
var On = class {
  constructor(e2) {
    var t2, i2;
    oe(this, "serverLimits", {}), oe(this, "lastEventRateLimited", false), oe(this, "checkForLimiting", (e3) => {
      var t3 = e3.text;
      if (t3 && t3.length)
        try {
          (JSON.parse(t3).quota_limited || []).forEach((e4) => {
            $n.info("".concat(e4 || "events", " is quota limited.")), this.serverLimits[e4] = (/* @__PURE__ */ new Date()).getTime() + 6e4;
          });
        } catch (e4) {
          return void $n.warn('could not rate limit - continuing. Error: "'.concat(null == e4 ? void 0 : e4.message, '"'), { text: t3 });
        }
    }), this.instance = e2, this.captureEventsPerSecond = (null === (t2 = e2.config.rate_limiting) || void 0 === t2 ? void 0 : t2.events_per_second) || 10, this.captureEventsBurstLimit = Math.max((null === (i2 = e2.config.rate_limiting) || void 0 === i2 ? void 0 : i2.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond), this.lastEventRateLimited = this.clientRateLimitContext(true).isRateLimited;
  }
  clientRateLimitContext() {
    var e2, t2, i2, r2 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0], s2 = (/* @__PURE__ */ new Date()).getTime(), n2 = null !== (e2 = null === (t2 = this.instance.persistence) || void 0 === t2 ? void 0 : t2.get_property(De)) && void 0 !== e2 ? e2 : { tokens: this.captureEventsBurstLimit, last: s2 };
    n2.tokens += (s2 - n2.last) / 1e3 * this.captureEventsPerSecond, n2.last = s2, n2.tokens > this.captureEventsBurstLimit && (n2.tokens = this.captureEventsBurstLimit);
    var o2 = n2.tokens < 1;
    return o2 || r2 || (n2.tokens = Math.max(0, n2.tokens - 1)), !o2 || this.lastEventRateLimited || r2 || this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited. Config is set to ".concat(this.captureEventsPerSecond, " events per second and ").concat(this.captureEventsBurstLimit, " events burst limit.") }, { skip_client_rate_limiting: true }), this.lastEventRateLimited = o2, null === (i2 = this.instance.persistence) || void 0 === i2 || i2.set_property(De, n2), { isRateLimited: o2, remainingTokens: n2.tokens };
  }
  isServerRateLimited(e2) {
    var t2 = this.serverLimits[e2 || "events"] || false;
    return false !== t2 && (/* @__PURE__ */ new Date()).getTime() < t2;
  }
};
var Mn = (e2) => {
  var t2 = null == e2 ? void 0 : e2.config;
  return ne({ initialPathName: (null == l ? void 0 : l.pathname) || "", referringDomain: Ei.referringDomain() }, Ei.campaignParams({ customTrackedParams: null == t2 ? void 0 : t2.custom_campaign_params, maskPersonalDataProperties: null == t2 ? void 0 : t2.mask_personal_data_properties, customPersonalDataProperties: null == t2 ? void 0 : t2.custom_personal_data_properties }));
};
var An = class {
  constructor(e2, t2, i2, r2) {
    oe(this, "_onSessionIdCallback", (e3) => {
      var t3 = this._getStoredProps();
      if (!t3 || t3.sessionId !== e3) {
        var i3 = { sessionId: e3, props: this._sessionSourceParamGenerator(this.instance) };
        this._persistence.register({ [Le]: i3 });
      }
    }), this.instance = e2, this._sessionIdManager = t2, this._persistence = i2, this._sessionSourceParamGenerator = r2 || Mn, this._sessionIdManager.onSessionId(this._onSessionIdCallback);
  }
  _getStoredProps() {
    return this._persistence.props[Le];
  }
  getSessionProps() {
    var e2, t2 = null === (e2 = this._getStoredProps()) || void 0 === e2 ? void 0 : e2.props;
    return t2 ? { $client_session_initial_referring_host: t2.referringDomain, $client_session_initial_pathname: t2.initialPathName, $client_session_initial_utm_source: t2.utm_source, $client_session_initial_utm_campaign: t2.utm_campaign, $client_session_initial_utm_medium: t2.utm_medium, $client_session_initial_utm_content: t2.utm_content, $client_session_initial_utm_term: t2.utm_term } : {};
  }
};
var Ln = ["ahrefsbot", "ahrefssiteaudit", "applebot", "baiduspider", "better uptime bot", "bingbot", "bingpreview", "bot.htm", "bot.php", "crawler", "deepscan", "duckduckbot", "facebookexternal", "facebookcatalog", "http://yandex.com/bots", "hubspot", "ia_archiver", "linkedinbot", "mj12bot", "msnbot", "nessus", "petalbot", "pinterest", "prerender", "rogerbot", "screaming frog", "semrushbot", "sitebulb", "slurp", "turnitin", "twitterbot", "vercelbot", "yahoo! slurp", "yandexbot", "gptbot", "oai-searchbot", "chatgpt-user", "headlesschrome", "cypress", "Google-HotelAdsVerifier", "adsbot-google", "apis-google", "duplexweb-google", "feedfetcher-google", "google favicon", "google web preview", "google-read-aloud", "googlebot", "googleweblight", "mediapartners-google", "storebot-google", "Bytespider;"];
var Dn = function(e2, t2) {
  if (!e2)
    return false;
  var i2 = e2.toLowerCase();
  return Ln.concat(t2 || []).some((e3) => {
    var t3 = e3.toLowerCase();
    return -1 !== i2.indexOf(t3);
  });
};
var Nn = function(e2, t2) {
  if (!e2)
    return false;
  var i2 = e2.userAgent;
  if (i2 && Dn(i2, t2))
    return true;
  try {
    var r2 = null == e2 ? void 0 : e2.userAgentData;
    if (null != r2 && r2.brands && r2.brands.some((e3) => Dn(null == e3 ? void 0 : e3.brand, t2)))
      return true;
  } catch (e3) {
  }
  return !!e2.webdriver;
};
var qn = class {
  constructor() {
    this.clicks = [];
  }
  isRageClick(e2, t2, i2) {
    var r2 = this.clicks[this.clicks.length - 1];
    if (r2 && Math.abs(e2 - r2.x) + Math.abs(t2 - r2.y) < 30 && i2 - r2.timestamp < 1e3) {
      if (this.clicks.push({ x: e2, y: t2, timestamp: i2 }), 3 === this.clicks.length)
        return true;
    } else
      this.clicks = [{ x: e2, y: t2, timestamp: i2 }];
    return false;
  }
};
var Bn = te("[Dead Clicks]");
var Hn = () => true;
var Un = (e2) => {
  var t2, i2 = !(null === (t2 = e2.instance.persistence) || void 0 === t2 || !t2.get_property(ve)), r2 = e2.instance.config.capture_dead_clicks;
  return K(r2) ? r2 : i2;
};
var jn = class {
  get lazyLoadedDeadClicksAutocapture() {
    return this._lazyLoadedDeadClicksAutocapture;
  }
  constructor(e2, t2, i2) {
    this.instance = e2, this.isEnabled = t2, this.onCapture = i2, this.startIfEnabled();
  }
  onRemoteConfig(e2) {
    this.instance.persistence && this.instance.persistence.register({ [ve]: null == e2 ? void 0 : e2.captureDeadClicks }), this.startIfEnabled();
  }
  startIfEnabled() {
    this.isEnabled(this) && this.loadScript(() => {
      this.start();
    });
  }
  loadScript(e2) {
    var t2, i2, r2;
    null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.initDeadClicksAutocapture && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.loadExternalDependency) || void 0 === r2 || r2.call(i2, this.instance, "dead-clicks-autocapture", (t3) => {
      t3 ? Bn.error("failed to load script", t3) : e2();
    });
  }
  start() {
    var e2;
    if (a) {
      if (!this._lazyLoadedDeadClicksAutocapture && null !== (e2 = _.__PosthogExtensions__) && void 0 !== e2 && e2.initDeadClicksAutocapture) {
        var t2 = U(this.instance.config.capture_dead_clicks) ? this.instance.config.capture_dead_clicks : {};
        t2.__onCapture = this.onCapture, this._lazyLoadedDeadClicksAutocapture = _.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, t2), this._lazyLoadedDeadClicksAutocapture.start(a), Bn.info("starting...");
      }
    } else
      Bn.error("`document` not found. Cannot start.");
  }
  stop() {
    this._lazyLoadedDeadClicksAutocapture && (this._lazyLoadedDeadClicksAutocapture.stop(), this._lazyLoadedDeadClicksAutocapture = void 0, Bn.info("stopping..."));
  }
};
var zn = te("[Heatmaps]");
function Wn(e2) {
  return U(e2) && "clientX" in e2 && "clientY" in e2 && Y(e2.clientX) && Y(e2.clientY);
}
var Vn = class {
  constructor(e2) {
    var i2;
    oe(this, "rageclicks", new qn()), oe(this, "_enabledServerSide", false), oe(this, "_initialized", false), oe(this, "_flushInterval", null), this.instance = e2, this._enabledServerSide = !(null === (i2 = this.instance.persistence) || void 0 === i2 || !i2.props[he]), R(t, "beforeunload", this.flush);
  }
  get flushIntervalMilliseconds() {
    var e2 = 5e3;
    return U(this.instance.config.capture_heatmaps) && this.instance.config.capture_heatmaps.flush_interval_milliseconds && (e2 = this.instance.config.capture_heatmaps.flush_interval_milliseconds), e2;
  }
  get isEnabled() {
    return z(this.instance.config.capture_heatmaps) ? z(this.instance.config.enable_heatmaps) ? this._enabledServerSide : this.instance.config.enable_heatmaps : false !== this.instance.config.capture_heatmaps;
  }
  startIfEnabled() {
    if (this.isEnabled) {
      if (this._initialized)
        return;
      zn.info("starting..."), this._setupListeners(), this._flushInterval = setInterval(this.flush.bind(this), this.flushIntervalMilliseconds);
    } else {
      var e2, t2;
      clearInterval(null !== (e2 = this._flushInterval) && void 0 !== e2 ? e2 : void 0), null === (t2 = this.deadClicksCapture) || void 0 === t2 || t2.stop(), this.getAndClearBuffer();
    }
  }
  onRemoteConfig(e2) {
    var t2 = !!e2.heatmaps;
    this.instance.persistence && this.instance.persistence.register({ [he]: t2 }), this._enabledServerSide = t2, this.startIfEnabled();
  }
  getAndClearBuffer() {
    var e2 = this.buffer;
    return this.buffer = void 0, e2;
  }
  _onDeadClick(e2) {
    this._onClick(e2.originalEvent, "deadclick");
  }
  _setupListeners() {
    t && a && (R(a, "click", (e2) => this._onClick(e2 || (null == t ? void 0 : t.event)), { capture: true }), R(a, "mousemove", (e2) => this._onMouseMove(e2 || (null == t ? void 0 : t.event)), { capture: true }), this.deadClicksCapture = new jn(this.instance, Hn, this._onDeadClick.bind(this)), this.deadClicksCapture.startIfEnabled(), this._initialized = true);
  }
  _getProperties(e2, i2) {
    var r2 = this.instance.scrollManager.scrollY(), s2 = this.instance.scrollManager.scrollX(), n2 = this.instance.scrollManager.scrollElement(), o2 = function(e3, i3, r3) {
      for (var s3 = e3; s3 && $i(s3) && !Oi(s3, "body"); ) {
        if (s3 === r3)
          return false;
        if ($(i3, null == t ? void 0 : t.getComputedStyle(s3).position))
          return true;
        s3 = ji(s3);
      }
      return false;
    }(Hi(e2), ["fixed", "sticky"], n2);
    return { x: e2.clientX + (o2 ? 0 : s2), y: e2.clientY + (o2 ? 0 : r2), target_fixed: o2, type: i2 };
  }
  _onClick(e2) {
    var t2, i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "click";
    if (!Ri(e2.target) && Wn(e2)) {
      var r2 = this._getProperties(e2, i2);
      null !== (t2 = this.rageclicks) && void 0 !== t2 && t2.isRageClick(e2.clientX, e2.clientY, (/* @__PURE__ */ new Date()).getTime()) && this._capture(ne(ne({}, r2), {}, { type: "rageclick" })), this._capture(r2);
    }
  }
  _onMouseMove(e2) {
    !Ri(e2.target) && Wn(e2) && (clearTimeout(this._mouseMoveTimeout), this._mouseMoveTimeout = setTimeout(() => {
      this._capture(this._getProperties(e2, "mousemove"));
    }, 500));
  }
  _capture(e2) {
    if (t) {
      var i2 = t.location.href;
      this.buffer = this.buffer || {}, this.buffer[i2] || (this.buffer[i2] = []), this.buffer[i2].push(e2);
    }
  }
  flush() {
    this.buffer && !j(this.buffer) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
  }
};
var Gn = class {
  constructor(e2) {
    oe(this, "_updateScrollData", () => {
      var e3, t2, i2, r2;
      this.context || (this.context = {});
      var s2 = this.scrollElement(), n2 = this.scrollY(), o2 = s2 ? Math.max(0, s2.scrollHeight - s2.clientHeight) : 0, a2 = n2 + ((null == s2 ? void 0 : s2.clientHeight) || 0), l2 = (null == s2 ? void 0 : s2.scrollHeight) || 0;
      this.context.lastScrollY = Math.ceil(n2), this.context.maxScrollY = Math.max(n2, null !== (e3 = this.context.maxScrollY) && void 0 !== e3 ? e3 : 0), this.context.maxScrollHeight = Math.max(o2, null !== (t2 = this.context.maxScrollHeight) && void 0 !== t2 ? t2 : 0), this.context.lastContentY = a2, this.context.maxContentY = Math.max(a2, null !== (i2 = this.context.maxContentY) && void 0 !== i2 ? i2 : 0), this.context.maxContentHeight = Math.max(l2, null !== (r2 = this.context.maxContentHeight) && void 0 !== r2 ? r2 : 0);
    }), this.instance = e2;
  }
  getContext() {
    return this.context;
  }
  resetContext() {
    var e2 = this.context;
    return setTimeout(this._updateScrollData, 0), e2;
  }
  startMeasuringScrollPosition() {
    R(t, "scroll", this._updateScrollData, { capture: true }), R(t, "scrollend", this._updateScrollData, { capture: true }), R(t, "resize", this._updateScrollData);
  }
  scrollElement() {
    if (!this.instance.config.scroll_root_selector)
      return null == t ? void 0 : t.document.documentElement;
    var e2 = B(this.instance.config.scroll_root_selector) ? this.instance.config.scroll_root_selector : [this.instance.config.scroll_root_selector];
    for (var i2 of e2) {
      var r2 = null == t ? void 0 : t.document.querySelector(i2);
      if (r2)
        return r2;
    }
  }
  scrollY() {
    if (this.instance.config.scroll_root_selector) {
      var e2 = this.scrollElement();
      return e2 && e2.scrollTop || 0;
    }
    return t && (t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop) || 0;
  }
  scrollX() {
    if (this.instance.config.scroll_root_selector) {
      var e2 = this.scrollElement();
      return e2 && e2.scrollLeft || 0;
    }
    return t && (t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft) || 0;
  }
};
var Jn = te("[AutoCapture]");
function Yn(e2, t2) {
  return t2.length > e2 ? t2.slice(0, e2) + "..." : t2;
}
function Kn(e2) {
  if (e2.previousElementSibling)
    return e2.previousElementSibling;
  var t2 = e2;
  do {
    t2 = t2.previousSibling;
  } while (t2 && !$i(t2));
  return t2;
}
function Xn(e2, t2, i2, r2) {
  var s2 = e2.tagName.toLowerCase(), n2 = { tag_name: s2 };
  Ui.indexOf(s2) > -1 && !i2 && ("a" === s2.toLowerCase() || "button" === s2.toLowerCase() ? n2.$el_text = Yn(1024, er(e2)) : n2.$el_text = Yn(1024, Bi(e2)));
  var o2 = Ni(e2);
  o2.length > 0 && (n2.classes = o2.filter(function(e3) {
    return "" !== e3;
  })), y(e2.attributes, function(i3) {
    var s3;
    if ((!Vi(e2) || -1 !== ["name", "id", "class", "aria-label"].indexOf(i3.name)) && ((null == r2 || !r2.includes(i3.name)) && !t2 && Zi(i3.value) && (s3 = i3.name, !W(s3) || "_ngcontent" !== s3.substring(0, 10) && "_nghost" !== s3.substring(0, 7)))) {
      var o3 = i3.value;
      "class" === i3.name && (o3 = Li(o3).join(" ")), n2["attr__" + i3.name] = Yn(1024, o3);
    }
  });
  for (var a2 = 1, l2 = 1, c2 = e2; c2 = Kn(c2); )
    a2++, c2.tagName === e2.tagName && l2++;
  return n2.nth_child = a2, n2.nth_of_type = l2, n2;
}
function Qn(e2, i2) {
  for (var r2, s2, { e: n2, maskAllElementAttributes: o2, maskAllText: a2, elementAttributeIgnoreList: l2, elementsChainAsString: c2 } = i2, u2 = [e2], d2 = e2; d2.parentNode && !Oi(d2, "body"); )
    Ai(d2.parentNode) ? (u2.push(d2.parentNode.host), d2 = d2.parentNode.host) : (u2.push(d2.parentNode), d2 = d2.parentNode);
  var h2, _2 = [], p2 = {}, v2 = false, g2 = false;
  if (y(u2, (e3) => {
    var t2 = Wi(e3);
    "a" === e3.tagName.toLowerCase() && (v2 = e3.getAttribute("href"), v2 = t2 && v2 && Zi(v2) && v2), $(Ni(e3), "ph-no-capture") && (g2 = true), _2.push(Xn(e3, o2, a2, l2));
    var i3 = function(e4) {
      if (!Wi(e4))
        return {};
      var t3 = {};
      return y(e4.attributes, function(e5) {
        if (e5.name && 0 === e5.name.indexOf("data-ph-capture-attribute")) {
          var i4 = e5.name.replace("data-ph-capture-attribute-", ""), r3 = e5.value;
          i4 && r3 && Zi(r3) && (t3[i4] = r3);
        }
      }), t3;
    }(e3);
    w(p2, i3);
  }), g2)
    return { props: {}, explicitNoCapture: g2 };
  if (a2 || ("a" === e2.tagName.toLowerCase() || "button" === e2.tagName.toLowerCase() ? _2[0].$el_text = er(e2) : _2[0].$el_text = Bi(e2)), v2) {
    var f2, m2;
    _2[0].attr__href = v2;
    var b2 = null === (f2 = yt(v2)) || void 0 === f2 ? void 0 : f2.host, S2 = null == t || null === (m2 = t.location) || void 0 === m2 ? void 0 : m2.host;
    b2 && S2 && b2 !== S2 && (h2 = v2);
  }
  return { props: w({ $event_type: n2.type, $ce_version: 1 }, c2 ? {} : { $elements: _2 }, { $elements_chain: ir(_2) }, null !== (r2 = _2[0]) && void 0 !== r2 && r2.$el_text ? { $el_text: null === (s2 = _2[0]) || void 0 === s2 ? void 0 : s2.$el_text } : {}, h2 && "click" === n2.type ? { $external_click_url: h2 } : {}, p2) };
}
var Zn = class {
  constructor(e2) {
    oe(this, "_initialized", false), oe(this, "_isDisabledServerSide", null), oe(this, "rageclicks", new qn()), oe(this, "_elementsChainAsString", false), this.instance = e2, this._elementSelectors = null;
  }
  get config() {
    var e2, t2, i2 = U(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
    return i2.url_allowlist = null === (e2 = i2.url_allowlist) || void 0 === e2 ? void 0 : e2.map((e3) => new RegExp(e3)), i2.url_ignorelist = null === (t2 = i2.url_ignorelist) || void 0 === t2 ? void 0 : t2.map((e3) => new RegExp(e3)), i2;
  }
  _addDomEventHandlers() {
    if (this.isBrowserSupported()) {
      if (t && a) {
        var e2 = (e3) => {
          e3 = e3 || (null == t ? void 0 : t.event);
          try {
            this._captureEvent(e3);
          } catch (e4) {
            Jn.error("Failed to capture event", e4);
          }
        };
        if (R(a, "submit", e2, { capture: true }), R(a, "change", e2, { capture: true }), R(a, "click", e2, { capture: true }), this.config.capture_copied_text) {
          var i2 = (e3) => {
            e3 = e3 || (null == t ? void 0 : t.event), this._captureEvent(e3, v);
          };
          R(a, "copy", i2, { capture: true }), R(a, "cut", i2, { capture: true });
        }
      }
    } else
      Jn.info("Disabling Automatic Event Collection because this browser is not supported");
  }
  startIfEnabled() {
    this.isEnabled && !this._initialized && (this._addDomEventHandlers(), this._initialized = true);
  }
  onRemoteConfig(e2) {
    e2.elementsChainAsString && (this._elementsChainAsString = e2.elementsChainAsString), this.instance.persistence && this.instance.persistence.register({ [de]: !!e2.autocapture_opt_out }), this._isDisabledServerSide = !!e2.autocapture_opt_out, this.startIfEnabled();
  }
  setElementSelectors(e2) {
    this._elementSelectors = e2;
  }
  getElementSelectors(e2) {
    var t2, i2 = [];
    return null === (t2 = this._elementSelectors) || void 0 === t2 || t2.forEach((t3) => {
      var r2 = null == a ? void 0 : a.querySelectorAll(t3);
      null == r2 || r2.forEach((r3) => {
        e2 === r3 && i2.push(t3);
      });
    }), i2;
  }
  get isEnabled() {
    var e2, t2, i2 = null === (e2 = this.instance.persistence) || void 0 === e2 ? void 0 : e2.props[de], r2 = this._isDisabledServerSide;
    if (G(r2) && !K(i2) && !this.instance.config.advanced_disable_decide)
      return false;
    var s2 = null !== (t2 = this._isDisabledServerSide) && void 0 !== t2 ? t2 : !!i2;
    return !!this.instance.config.autocapture && !s2;
  }
  _captureEvent(e2) {
    var i2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "$autocapture";
    if (this.isEnabled) {
      var r2, s2 = Hi(e2);
      if (Mi(s2) && (s2 = s2.parentNode || null), "$autocapture" === i2 && "click" === e2.type && e2 instanceof MouseEvent)
        this.instance.config.rageclick && null !== (r2 = this.rageclicks) && void 0 !== r2 && r2.isRageClick(e2.clientX, e2.clientY, (/* @__PURE__ */ new Date()).getTime()) && this._captureEvent(e2, "$rageclick");
      var n2 = i2 === v;
      if (s2 && zi(s2, e2, this.config, n2, n2 ? ["copy", "cut"] : void 0)) {
        var { props: o2, explicitNoCapture: a2 } = Qn(s2, { e: e2, maskAllElementAttributes: this.instance.config.mask_all_element_attributes, maskAllText: this.instance.config.mask_all_text, elementAttributeIgnoreList: this.config.element_attribute_ignorelist, elementsChainAsString: this._elementsChainAsString });
        if (a2)
          return false;
        var l2 = this.getElementSelectors(s2);
        if (l2 && l2.length > 0 && (o2.$element_selectors = l2), i2 === v) {
          var c2, u2 = qi(null == t || null === (c2 = t.getSelection()) || void 0 === c2 ? void 0 : c2.toString()), d2 = e2.type || "clipboard";
          if (!u2)
            return false;
          o2.$selected_content = u2, o2.$copy_type = d2;
        }
        return this.instance.capture(i2, o2), true;
      }
    }
  }
  isBrowserSupported() {
    return H(null == a ? void 0 : a.querySelectorAll);
  }
};
var eo = te("[TracingHeaders]");
var to = class {
  constructor(e2) {
    oe(this, "_restoreXHRPatch", void 0), oe(this, "_restoreFetchPatch", void 0), oe(this, "_startCapturing", () => {
      var e3, t2, i2, r2;
      z(this._restoreXHRPatch) && (null === (e3 = _.__PosthogExtensions__) || void 0 === e3 || null === (t2 = e3.tracingHeadersPatchFns) || void 0 === t2 || t2._patchXHR(this.instance.sessionManager));
      z(this._restoreFetchPatch) && (null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.tracingHeadersPatchFns) || void 0 === r2 || r2._patchFetch(this.instance.sessionManager));
    }), this.instance = e2;
  }
  _loadScript(e2) {
    var t2, i2, r2;
    null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.tracingHeadersPatchFns && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.loadExternalDependency) || void 0 === r2 || r2.call(i2, this.instance, "tracing-headers", (t3) => {
      if (t3)
        return eo.error("failed to load script", t3);
      e2();
    });
  }
  startIfEnabledOrStop() {
    var e2, t2;
    this.instance.config.__add_tracing_headers ? this._loadScript(this._startCapturing) : (null === (e2 = this._restoreXHRPatch) || void 0 === e2 || e2.call(this), null === (t2 = this._restoreFetchPatch) || void 0 === t2 || t2.call(this), this._restoreXHRPatch = void 0, this._restoreFetchPatch = void 0);
  }
};
var io;
!function(e2) {
  e2[e2.PENDING = -1] = "PENDING", e2[e2.DENIED = 0] = "DENIED", e2[e2.GRANTED = 1] = "GRANTED";
}(io || (io = {}));
var ro = class {
  constructor(e2) {
    this.instance = e2;
  }
  get config() {
    return this.instance.config;
  }
  get consent() {
    return this.getDnt() ? io.DENIED : this.storedConsent;
  }
  isOptedOut() {
    return this.consent === io.DENIED || this.consent === io.PENDING && this.config.opt_out_capturing_by_default;
  }
  isOptedIn() {
    return !this.isOptedOut();
  }
  optInOut(e2) {
    this.storage.set(this.storageKey, e2 ? 1 : 0, this.config.cookie_expiration, this.config.cross_subdomain_cookie, this.config.secure_cookie);
  }
  reset() {
    this.storage.remove(this.storageKey, this.config.cross_subdomain_cookie);
  }
  get storageKey() {
    var { token: e2, opt_out_capturing_cookie_prefix: t2 } = this.instance.config;
    return (t2 || "__ph_opt_in_out_") + e2;
  }
  get storedConsent() {
    var e2 = this.storage.get(this.storageKey);
    return "1" === e2 ? io.GRANTED : "0" === e2 ? io.DENIED : io.PENDING;
  }
  get storage() {
    if (!this._storage) {
      var e2 = this.config.opt_out_capturing_persistence_type;
      this._storage = "localStorage" === e2 ? ht : ut;
      var t2 = "localStorage" === e2 ? ut : ht;
      t2.get(this.storageKey) && (this._storage.get(this.storageKey) || this.optInOut("1" === t2.get(this.storageKey)), t2.remove(this.storageKey, this.config.cross_subdomain_cookie));
    }
    return this._storage;
  }
  getDnt() {
    return !!this.config.respect_dnt && !!T([null == o ? void 0 : o.doNotTrack, null == o ? void 0 : o.msDoNotTrack, _.doNotTrack], (e2) => $([true, 1, "1", "yes"], e2));
  }
};
var so = te("[ExceptionAutocapture]");
var no = class {
  constructor(e2) {
    var i2;
    oe(this, "originalOnUnhandledRejectionHandler", void 0), oe(this, "startCapturing", () => {
      var e3, i3, r2, s2;
      if (t && this.isEnabled && !this.hasHandlers && !this.isCapturing) {
        var n2 = null === (e3 = _.__PosthogExtensions__) || void 0 === e3 || null === (i3 = e3.errorWrappingFunctions) || void 0 === i3 ? void 0 : i3.wrapOnError, o2 = null === (r2 = _.__PosthogExtensions__) || void 0 === r2 || null === (s2 = r2.errorWrappingFunctions) || void 0 === s2 ? void 0 : s2.wrapUnhandledRejection;
        if (n2 && o2)
          try {
            this.unwrapOnError = n2(this.captureException.bind(this)), this.unwrapUnhandledRejection = o2(this.captureException.bind(this));
          } catch (e4) {
            so.error("failed to start", e4), this.stopCapturing();
          }
        else
          so.error("failed to load error wrapping functions - cannot start");
      }
    }), this.instance = e2, this.remoteEnabled = !(null === (i2 = this.instance.persistence) || void 0 === i2 || !i2.props[_e]), this.startIfEnabled();
  }
  get isEnabled() {
    var e2;
    return null !== (e2 = this.remoteEnabled) && void 0 !== e2 && e2;
  }
  get isCapturing() {
    var e2;
    return !(null == t || null === (e2 = t.onerror) || void 0 === e2 || !e2.__POSTHOG_INSTRUMENTED__);
  }
  get hasHandlers() {
    return this.originalOnUnhandledRejectionHandler || this.unwrapOnError;
  }
  startIfEnabled() {
    this.isEnabled && !this.isCapturing && (so.info("enabled, starting..."), this.loadScript(this.startCapturing));
  }
  loadScript(e2) {
    var t2, i2;
    this.hasHandlers && e2(), null === (t2 = _.__PosthogExtensions__) || void 0 === t2 || null === (i2 = t2.loadExternalDependency) || void 0 === i2 || i2.call(t2, this.instance, "exception-autocapture", (t3) => {
      if (t3)
        return so.error("failed to load script", t3);
      e2();
    });
  }
  stopCapturing() {
    var e2, t2;
    null === (e2 = this.unwrapOnError) || void 0 === e2 || e2.call(this), null === (t2 = this.unwrapUnhandledRejection) || void 0 === t2 || t2.call(this);
  }
  onRemoteConfig(e2) {
    var t2 = e2.autocaptureExceptions;
    this.remoteEnabled = !!t2 || false, this.instance.persistence && this.instance.persistence.register({ [_e]: this.remoteEnabled }), this.startIfEnabled();
  }
  captureException(e2) {
    var t2 = this.instance.requestRouter.endpointFor("ui");
    e2.$exception_personURL = "".concat(t2, "/project/").concat(this.instance.config.token, "/person/").concat(this.instance.get_distinct_id()), this.instance.exceptions.sendExceptionEvent(e2);
  }
};
var oo = te("[Web Vitals]");
var ao = 9e5;
var lo = class {
  constructor(e2) {
    var t2;
    oe(this, "_enabledServerSide", false), oe(this, "_initialized", false), oe(this, "buffer", { url: void 0, metrics: [], firstMetricTimestamp: void 0 }), oe(this, "_flushToCapture", () => {
      clearTimeout(this._delayedFlushTimer), 0 !== this.buffer.metrics.length && (this.instance.capture("$web_vitals", this.buffer.metrics.reduce((e3, t3) => ne(ne({}, e3), {}, { ["$web_vitals_".concat(t3.name, "_event")]: ne({}, t3), ["$web_vitals_".concat(t3.name, "_value")]: t3.value }), {})), this.buffer = { url: void 0, metrics: [], firstMetricTimestamp: void 0 });
    }), oe(this, "_addToBuffer", (e3) => {
      var t3, i2 = null === (t3 = this.instance.sessionManager) || void 0 === t3 ? void 0 : t3.checkAndGetSessionAndWindowId(true);
      if (z(i2))
        oo.error("Could not read session ID. Dropping metrics!");
      else {
        this.buffer = this.buffer || { url: void 0, metrics: [], firstMetricTimestamp: void 0 };
        var r2 = this._currentURL();
        if (!z(r2))
          if (J(null == e3 ? void 0 : e3.name) || J(null == e3 ? void 0 : e3.value))
            oo.error("Invalid metric received", e3);
          else if (this._maxAllowedValue && e3.value >= this._maxAllowedValue)
            oo.error("Ignoring metric with value >= " + this._maxAllowedValue, e3);
          else
            this.buffer.url !== r2 && (this._flushToCapture(), this._delayedFlushTimer = setTimeout(this._flushToCapture, this.flushToCaptureTimeoutMs)), z(this.buffer.url) && (this.buffer.url = r2), this.buffer.firstMetricTimestamp = z(this.buffer.firstMetricTimestamp) ? Date.now() : this.buffer.firstMetricTimestamp, e3.attribution && e3.attribution.interactionTargetElement && (e3.attribution.interactionTargetElement = void 0), this.buffer.metrics.push(ne(ne({}, e3), {}, { $current_url: r2, $session_id: i2.sessionId, $window_id: i2.windowId, timestamp: Date.now() })), this.buffer.metrics.length === this.allowedMetrics.length && this._flushToCapture();
      }
    }), oe(this, "_startCapturing", () => {
      var e3, t3, i2, r2, s2 = _.__PosthogExtensions__;
      z(s2) || z(s2.postHogWebVitalsCallbacks) || ({ onLCP: e3, onCLS: t3, onFCP: i2, onINP: r2 } = s2.postHogWebVitalsCallbacks), e3 && t3 && i2 && r2 ? (this.allowedMetrics.indexOf("LCP") > -1 && e3(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("CLS") > -1 && t3(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("FCP") > -1 && i2(this._addToBuffer.bind(this)), this.allowedMetrics.indexOf("INP") > -1 && r2(this._addToBuffer.bind(this)), this._initialized = true) : oo.error("web vitals callbacks not loaded - not starting");
    }), this.instance = e2, this._enabledServerSide = !(null === (t2 = this.instance.persistence) || void 0 === t2 || !t2.props[pe]), this.startIfEnabled();
  }
  get allowedMetrics() {
    var e2, t2, i2 = U(this.instance.config.capture_performance) ? null === (e2 = this.instance.config.capture_performance) || void 0 === e2 ? void 0 : e2.web_vitals_allowed_metrics : void 0;
    return z(i2) ? (null === (t2 = this.instance.persistence) || void 0 === t2 ? void 0 : t2.props[ge]) || ["CLS", "FCP", "INP", "LCP"] : i2;
  }
  get flushToCaptureTimeoutMs() {
    return (U(this.instance.config.capture_performance) ? this.instance.config.capture_performance.web_vitals_delayed_flush_ms : void 0) || 5e3;
  }
  get _maxAllowedValue() {
    var e2 = U(this.instance.config.capture_performance) && Y(this.instance.config.capture_performance.__web_vitals_max_value) ? this.instance.config.capture_performance.__web_vitals_max_value : ao;
    return 0 < e2 && e2 <= 6e4 ? ao : e2;
  }
  get isEnabled() {
    var e2 = U(this.instance.config.capture_performance) ? this.instance.config.capture_performance.web_vitals : void 0;
    return K(e2) ? e2 : this._enabledServerSide;
  }
  startIfEnabled() {
    this.isEnabled && !this._initialized && (oo.info("enabled, starting..."), this.loadScript(this._startCapturing));
  }
  onRemoteConfig(e2) {
    var t2 = U(e2.capturePerformance) && !!e2.capturePerformance.web_vitals, i2 = U(e2.capturePerformance) ? e2.capturePerformance.web_vitals_allowed_metrics : void 0;
    this.instance.persistence && (this.instance.persistence.register({ [pe]: t2 }), this.instance.persistence.register({ [ge]: i2 })), this._enabledServerSide = t2, this.startIfEnabled();
  }
  loadScript(e2) {
    var t2, i2, r2;
    null !== (t2 = _.__PosthogExtensions__) && void 0 !== t2 && t2.postHogWebVitalsCallbacks && e2(), null === (i2 = _.__PosthogExtensions__) || void 0 === i2 || null === (r2 = i2.loadExternalDependency) || void 0 === r2 || r2.call(i2, this.instance, "web-vitals", (t3) => {
      t3 ? oo.error("failed to load script", t3) : e2();
    });
  }
  _currentURL() {
    var e2 = t ? t.location.href : void 0;
    return e2 || oo.error("Could not determine current URL"), e2;
  }
};
var co = { icontains: (e2, i2) => !!t && i2.href.toLowerCase().indexOf(e2.toLowerCase()) > -1, not_icontains: (e2, i2) => !!t && -1 === i2.href.toLowerCase().indexOf(e2.toLowerCase()), regex: (e2, i2) => !!t && A(i2.href, e2), not_regex: (e2, i2) => !!t && !A(i2.href, e2), exact: (e2, t2) => t2.href === e2, is_not: (e2, t2) => t2.href !== e2 };
var uo = class _uo {
  constructor(e2) {
    var t2 = this;
    oe(this, "getWebExperimentsAndEvaluateDisplayLogic", function() {
      var e3 = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
      t2.getWebExperiments((e4) => {
        _uo.logInfo("retrieved web experiments from the server"), t2._flagToExperiments = /* @__PURE__ */ new Map(), e4.forEach((e5) => {
          if (e5.feature_flag_key) {
            var i2;
            if (t2._flagToExperiments)
              _uo.logInfo("setting flag key ", e5.feature_flag_key, " to web experiment ", e5), null === (i2 = t2._flagToExperiments) || void 0 === i2 || i2.set(e5.feature_flag_key, e5);
            var r2 = t2.instance.getFeatureFlag(e5.feature_flag_key);
            W(r2) && e5.variants[r2] && t2.applyTransforms(e5.name, r2, e5.variants[r2].transforms);
          } else if (e5.variants)
            for (var s2 in e5.variants) {
              var n2 = e5.variants[s2];
              _uo.matchesTestVariant(n2) && t2.applyTransforms(e5.name, s2, n2.transforms);
            }
        });
      }, e3);
    }), this.instance = e2, this.instance.onFeatureFlags((e3) => {
      this.onFeatureFlags(e3);
    });
  }
  onFeatureFlags(e2) {
    if (this._is_bot())
      _uo.logInfo("Refusing to render web experiment since the viewer is a likely bot");
    else if (!this.instance.config.disable_web_experiments) {
      if (J(this._flagToExperiments))
        return this._flagToExperiments = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
      _uo.logInfo("applying feature flags", e2), e2.forEach((e3) => {
        var t2;
        if (this._flagToExperiments && null !== (t2 = this._flagToExperiments) && void 0 !== t2 && t2.has(e3)) {
          var i2, r2 = this.instance.getFeatureFlag(e3), s2 = null === (i2 = this._flagToExperiments) || void 0 === i2 ? void 0 : i2.get(e3);
          r2 && null != s2 && s2.variants[r2] && this.applyTransforms(s2.name, r2, s2.variants[r2].transforms);
        }
      });
    }
  }
  previewWebExperiment() {
    var e2 = _uo.getWindowLocation();
    if (null != e2 && e2.search) {
      var t2 = St(null == e2 ? void 0 : e2.search, "__experiment_id"), i2 = St(null == e2 ? void 0 : e2.search, "__experiment_variant");
      t2 && i2 && (_uo.logInfo("previewing web experiments ".concat(t2, " && ").concat(i2)), this.getWebExperiments((e3) => {
        this.showPreviewWebExperiment(parseInt(t2), i2, e3);
      }, false, true));
    }
  }
  loadIfEnabled() {
    this.instance.config.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
  }
  getWebExperiments(e2, t2, i2) {
    if (this.instance.config.disable_web_experiments && !i2)
      return e2([]);
    var r2 = this.instance.get_property("$web_experiments");
    if (r2 && !t2)
      return e2(r2);
    this.instance._send_request({ url: this.instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=".concat(this.instance.config.token)), method: "GET", callback: (t3) => {
      if (200 !== t3.statusCode || !t3.json)
        return e2([]);
      var i3 = t3.json.experiments || [];
      return e2(i3);
    } });
  }
  showPreviewWebExperiment(e2, t2, i2) {
    var r2 = i2.filter((t3) => t3.id === e2);
    r2 && r2.length > 0 && (_uo.logInfo("Previewing web experiment [".concat(r2[0].name, "] with variant [").concat(t2, "]")), this.applyTransforms(r2[0].name, t2, r2[0].variants[t2].transforms));
  }
  static matchesTestVariant(e2) {
    return !J(e2.conditions) && (_uo.matchUrlConditions(e2) && _uo.matchUTMConditions(e2));
  }
  static matchUrlConditions(e2) {
    var t2;
    if (J(e2.conditions) || J(null === (t2 = e2.conditions) || void 0 === t2 ? void 0 : t2.url))
      return true;
    var i2, r2, s2, n2 = _uo.getWindowLocation();
    return !!n2 && (null === (i2 = e2.conditions) || void 0 === i2 || !i2.url || co[null !== (r2 = null === (s2 = e2.conditions) || void 0 === s2 ? void 0 : s2.urlMatchType) && void 0 !== r2 ? r2 : "icontains"](e2.conditions.url, n2));
  }
  static getWindowLocation() {
    return null == t ? void 0 : t.location;
  }
  static matchUTMConditions(e2) {
    var t2;
    if (J(e2.conditions) || J(null === (t2 = e2.conditions) || void 0 === t2 ? void 0 : t2.utm))
      return true;
    var i2 = Ei.campaignParams();
    if (i2.utm_source) {
      var r2, s2, n2, o2, a2, l2, c2, u2, d2, h2, _2, p2, v2, g2, f2, m2, b2 = null === (r2 = e2.conditions) || void 0 === r2 || null === (s2 = r2.utm) || void 0 === s2 || !s2.utm_campaign || (null === (n2 = e2.conditions) || void 0 === n2 || null === (o2 = n2.utm) || void 0 === o2 ? void 0 : o2.utm_campaign) == i2.utm_campaign, y2 = null === (a2 = e2.conditions) || void 0 === a2 || null === (l2 = a2.utm) || void 0 === l2 || !l2.utm_source || (null === (c2 = e2.conditions) || void 0 === c2 || null === (u2 = c2.utm) || void 0 === u2 ? void 0 : u2.utm_source) == i2.utm_source, w2 = null === (d2 = e2.conditions) || void 0 === d2 || null === (h2 = d2.utm) || void 0 === h2 || !h2.utm_medium || (null === (_2 = e2.conditions) || void 0 === _2 || null === (p2 = _2.utm) || void 0 === p2 ? void 0 : p2.utm_medium) == i2.utm_medium, S2 = null === (v2 = e2.conditions) || void 0 === v2 || null === (g2 = v2.utm) || void 0 === g2 || !g2.utm_term || (null === (f2 = e2.conditions) || void 0 === f2 || null === (m2 = f2.utm) || void 0 === m2 ? void 0 : m2.utm_term) == i2.utm_term;
      return b2 && w2 && S2 && y2;
    }
    return false;
  }
  static logInfo(e2) {
    for (var t2 = arguments.length, i2 = new Array(t2 > 1 ? t2 - 1 : 0), r2 = 1; r2 < t2; r2++)
      i2[r2 - 1] = arguments[r2];
    ee.info("[WebExperiments] ".concat(e2), i2);
  }
  applyTransforms(e2, t2, i2) {
    this._is_bot() ? _uo.logInfo("Refusing to render web experiment since the viewer is a likely bot") : "control" !== t2 ? i2.forEach((i3) => {
      if (i3.selector) {
        var r2;
        _uo.logInfo("applying transform of variant ".concat(t2, " for experiment ").concat(e2, " "), i3);
        var s2 = null === (r2 = document) || void 0 === r2 ? void 0 : r2.querySelectorAll(i3.selector);
        null == s2 || s2.forEach((e3) => {
          var t3 = e3;
          i3.attributes && i3.attributes.forEach((e4) => {
            switch (e4.name) {
              case "text":
                t3.innerText = e4.value;
                break;
              case "html":
                t3.innerHTML = e4.value;
                break;
              case "cssClass":
                t3.className = e4.value;
                break;
              default:
                t3.setAttribute(e4.name, e4.value);
            }
          }), i3.text && (t3.innerText = i3.text), i3.html && (t3.parentElement ? t3.parentElement.innerHTML = i3.html : t3.innerHTML = i3.html), i3.css && t3.setAttribute("style", i3.css);
        });
      }
    }) : _uo.logInfo("Control variants leave the page unmodified.");
  }
  _is_bot() {
    return o && this.instance ? Nn(o, this.instance.config.custom_blocked_useragents) : void 0;
  }
};
var ho = class {
  constructor(e2) {
    this.instance = e2;
  }
  sendExceptionEvent(e2) {
    this.instance.capture("$exception", e2, { _noTruncate: true, _batchKey: "exceptionEvent" });
  }
};
var _o = ["$set_once", "$set"];
var po = te("[SiteApps]");
var vo = class {
  constructor(e2) {
    this.instance = e2, this.bufferedInvocations = [], this.apps = {};
  }
  get isEnabled() {
    return !!this.instance.config.opt_in_site_apps;
  }
  eventCollector(e2, t2) {
    if (t2) {
      var i2 = this.globalsForEvent(t2);
      this.bufferedInvocations.push(i2), this.bufferedInvocations.length > 1e3 && (this.bufferedInvocations = this.bufferedInvocations.slice(10));
    }
  }
  get siteAppLoaders() {
    var e2, t2;
    return null === (e2 = _._POSTHOG_REMOTE_CONFIG) || void 0 === e2 || null === (t2 = e2[this.instance.config.token]) || void 0 === t2 ? void 0 : t2.siteApps;
  }
  init() {
    if (this.isEnabled) {
      var e2 = this.instance._addCaptureHook(this.eventCollector.bind(this));
      this.stopBuffering = () => {
        e2(), this.bufferedInvocations = [], this.stopBuffering = void 0;
      };
    }
  }
  globalsForEvent(e2) {
    var t2, i2, r2, s2, n2, o2, a2;
    if (!e2)
      throw new Error("Event payload is required");
    var l2 = {}, c2 = this.instance.get_property("$groups") || [], u2 = this.instance.get_property("$stored_group_properties") || {};
    for (var [d2, h2] of Object.entries(u2))
      l2[d2] = { id: c2[d2], type: d2, properties: h2 };
    var { $set_once: _2, $set: p2 } = e2;
    return { event: ne(ne({}, ae(e2, _o)), {}, { properties: ne(ne(ne({}, e2.properties), p2 ? { $set: ne(ne({}, null !== (t2 = null === (i2 = e2.properties) || void 0 === i2 ? void 0 : i2.$set) && void 0 !== t2 ? t2 : {}), p2) } : {}), _2 ? { $set_once: ne(ne({}, null !== (r2 = null === (s2 = e2.properties) || void 0 === s2 ? void 0 : s2.$set_once) && void 0 !== r2 ? r2 : {}), _2) } : {}), elements_chain: null !== (n2 = null === (o2 = e2.properties) || void 0 === o2 ? void 0 : o2.$elements_chain) && void 0 !== n2 ? n2 : "", distinct_id: null === (a2 = e2.properties) || void 0 === a2 ? void 0 : a2.distinct_id }), person: { properties: this.instance.get_property("$stored_person_properties") }, groups: l2 };
  }
  setupSiteApp(e2) {
    var t2 = { id: e2.id, loaded: false, errored: false };
    this.apps[e2.id] = t2;
    var i2 = (i3) => {
      var r3;
      for (var s2 of (this.apps[e2.id].errored = !i3, this.apps[e2.id].loaded = true, po.info("Site app with id ".concat(e2.id, " ").concat(i3 ? "loaded" : "errored")), i3 && this.bufferedInvocations.length && (po.info("Processing ".concat(this.bufferedInvocations.length, " events for site app with id ").concat(e2.id)), this.bufferedInvocations.forEach((e3) => {
        var i4;
        return null === (i4 = t2.processEvent) || void 0 === i4 ? void 0 : i4.call(t2, e3);
      })), Object.values(this.apps)))
        if (!s2.loaded)
          return;
      null === (r3 = this.stopBuffering) || void 0 === r3 || r3.call(this);
    };
    try {
      var { processEvent: r2 } = e2.init({ posthog: this.instance, callback: (e3) => {
        i2(e3);
      } });
      r2 && (t2.processEvent = r2);
    } catch (t3) {
      po.error("Error while initializing PostHog app with config id ".concat(e2.id), t3), i2(false);
    }
  }
  onCapturedEvent(e2) {
    if (0 !== Object.keys(this.apps).length) {
      var t2 = this.globalsForEvent(e2);
      for (var i2 of Object.values(this.apps))
        try {
          var r2;
          null === (r2 = i2.processEvent) || void 0 === r2 || r2.call(i2, t2);
        } catch (t3) {
          po.error("Error while processing event ".concat(e2.event, " for site app ").concat(i2.id), t3);
        }
    }
  }
  onRemoteConfig(e2) {
    var t2, i2, r2, s2 = this;
    if (null !== (t2 = this.siteAppLoaders) && void 0 !== t2 && t2.length) {
      if (!this.isEnabled)
        return void po.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
      for (var n2 of this.siteAppLoaders)
        this.setupSiteApp(n2);
      this.instance.on("eventCaptured", (e3) => this.onCapturedEvent(e3));
    } else if (null === (i2 = this.stopBuffering) || void 0 === i2 || i2.call(this), null !== (r2 = e2.siteApps) && void 0 !== r2 && r2.length)
      if (this.isEnabled) {
        var o2 = function(e3, t3) {
          var i3, r3;
          _["__$$ph_site_app_".concat(e3)] = s2.instance, null === (i3 = _.__PosthogExtensions__) || void 0 === i3 || null === (r3 = i3.loadSiteApp) || void 0 === r3 || r3.call(i3, s2.instance, t3, (t4) => {
            if (t4)
              return po.error("Error while initializing PostHog app with config id ".concat(e3), t4);
          });
        };
        for (var { id: a2, url: l2 } of e2.siteApps)
          o2(a2, l2);
      } else
        po.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
  }
};
function go(e2, t2, i2) {
  return ks({ distinct_id: e2, userPropertiesToSet: t2, userPropertiesToSetOnce: i2 });
}
var fo = {};
var mo = () => {
};
var bo = "posthog";
var yo = !ys && -1 === (null == h ? void 0 : h.indexOf("MSIE")) && -1 === (null == h ? void 0 : h.indexOf("Mozilla"));
var wo = () => {
  var e2;
  return { api_host: "https://us.i.posthog.com", ui_host: null, token: "", autocapture: true, rageclick: true, cross_subdomain_cookie: F(null == a ? void 0 : a.location), persistence: "localStorage+cookie", persistence_name: "", loaded: mo, save_campaign_params: true, custom_campaign_params: [], custom_blocked_useragents: [], save_referrer: true, capture_pageview: true, capture_pageleave: "if_capture_pageview", debug: l && W(null == l ? void 0 : l.search) && -1 !== l.search.indexOf("__posthog_debug=true") || false, cookie_expiration: 365, upgrade: false, disable_session_recording: false, disable_persistence: false, disable_web_experiments: true, disable_surveys: false, disable_external_dependency_loading: false, enable_recording_console_log: void 0, secure_cookie: "https:" === (null == t || null === (e2 = t.location) || void 0 === e2 ? void 0 : e2.protocol), ip: true, opt_out_capturing_by_default: false, opt_out_persistence_by_default: false, opt_out_useragent_filter: false, opt_out_capturing_persistence_type: "localStorage", opt_out_capturing_cookie_prefix: null, opt_in_site_apps: false, property_denylist: [], respect_dnt: false, sanitize_properties: null, request_headers: {}, request_batching: true, properties_string_max_length: 65535, session_recording: {}, mask_all_element_attributes: false, mask_all_text: false, mask_personal_data_properties: false, custom_personal_data_properties: [], advanced_disable_decide: false, advanced_disable_feature_flags: false, advanced_disable_feature_flags_on_first_load: false, advanced_disable_toolbar_metrics: false, feature_flag_request_timeout_ms: 3e3, on_request_error: (e3) => {
    var t2 = "Bad HTTP status: " + e3.statusCode + " " + e3.text;
    ee.error(t2);
  }, get_device_id: (e3) => e3, capture_performance: void 0, name: "posthog", bootstrap: {}, disable_compression: false, session_idle_timeout_seconds: 1800, person_profiles: "identified_only", before_send: void 0, request_queue_config: { flush_interval_ms: fs }, _onCapture: mo };
};
var So = (e2) => {
  var t2 = {};
  z(e2.process_person) || (t2.person_profiles = e2.process_person), z(e2.xhr_headers) || (t2.request_headers = e2.xhr_headers), z(e2.cookie_name) || (t2.persistence_name = e2.cookie_name), z(e2.disable_cookie) || (t2.disable_persistence = e2.disable_cookie), z(e2.store_google) || (t2.save_campaign_params = e2.store_google), z(e2.verbose) || (t2.debug = e2.verbose);
  var i2 = w({}, t2, e2);
  return B(e2.property_blacklist) && (z(e2.property_denylist) ? i2.property_denylist = e2.property_blacklist : B(e2.property_denylist) ? i2.property_denylist = [...e2.property_blacklist, ...e2.property_denylist] : ee.error("Invalid value for property_denylist config: " + e2.property_denylist)), i2;
};
var ko = class {
  constructor() {
    oe(this, "__forceAllowLocalhost", false);
  }
  get _forceAllowLocalhost() {
    return this.__forceAllowLocalhost;
  }
  set _forceAllowLocalhost(e2) {
    ee.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = e2;
  }
};
var Eo = class _Eo {
  get decideEndpointWasHit() {
    var e2, t2;
    return null !== (e2 = null === (t2 = this.featureFlags) || void 0 === t2 ? void 0 : t2.hasLoadedFlags) && void 0 !== e2 && e2;
  }
  constructor() {
    oe(this, "webPerformance", new ko()), oe(this, "version", p.LIB_VERSION), oe(this, "_internalEventEmitter", new En()), this.config = wo(), this.SentryIntegration = As, this.sentryIntegration = (e2) => function(e3, t2) {
      var i2 = Ms(e3, t2);
      return { name: Os, processEvent: (e4) => i2(e4) };
    }(this, e2), this.__request_queue = [], this.__loaded = false, this.analyticsDefaultEndpoint = "/e/", this._initialPageviewCaptured = false, this._initialPersonProfilesConfig = null, this._cachedIdentify = null, this.featureFlags = new Xe(this), this.toolbar = new gs(this), this.scrollManager = new Gn(this), this.pageViewManager = new Ns(this), this.surveys = new Rn(this), this.experiments = new uo(this), this.exceptions = new ho(this), this.rateLimiter = new On(this), this.requestRouter = new $s(this), this.consent = new ro(this), this.people = { set: (e2, t2, i2) => {
      var r2 = W(e2) ? { [e2]: t2 } : e2;
      this.setPersonProperties(r2), null == i2 || i2({});
    }, set_once: (e2, t2, i2) => {
      var r2 = W(e2) ? { [e2]: t2 } : e2;
      this.setPersonProperties(void 0, r2), null == i2 || i2({});
    } }, this.on("eventCaptured", (e2) => ee.info('send "'.concat(null == e2 ? void 0 : e2.event, '"'), e2));
  }
  init(e2, t2, i2) {
    if (i2 && i2 !== bo) {
      var r2, s2 = null !== (r2 = fo[i2]) && void 0 !== r2 ? r2 : new _Eo();
      return s2._init(e2, t2, i2), fo[i2] = s2, fo[bo][i2] = s2, s2;
    }
    return this._init(e2, t2, i2);
  }
  _init(i2) {
    var r2, s2, n2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, o2 = arguments.length > 2 ? arguments[2] : void 0;
    if (z(i2) || V(i2))
      return ee.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
    if (this.__loaded)
      return ee.warn("You have already initialized PostHog! Re-initializing is a no-op"), this;
    this.__loaded = true, this.config = {}, this._triggered_notifs = [], n2.person_profiles && (this._initialPersonProfilesConfig = n2.person_profiles), this.set_config(w({}, wo(), So(n2), { name: o2, token: i2 })), this.config.on_xhr_error && ee.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = n2.disable_compression ? void 0 : e.GZipJS, this.persistence = new Ii(this.config), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Ii(ne(ne({}, this.config), {}, { persistence: "sessionStorage" }));
    var a2 = ne({}, this.persistence.props), l2 = ne({}, this.sessionPersistence.props);
    if (this._requestQueue = new ms((e2) => this._send_retriable_request(e2), this.config.request_queue_config), this._retryQueue = new Cs(this), this.__request_queue = [], this.config.__preview_experimental_cookieless_mode || (this.sessionManager = new Ts(this), this.sessionPropsManager = new An(this, this.sessionManager, this.persistence)), new to(this).startIfEnabledOrStop(), this.siteApps = new vo(this), null === (r2 = this.siteApps) || void 0 === r2 || r2.init(), this.config.__preview_experimental_cookieless_mode || (this.sessionRecording = new cs(this), this.sessionRecording.startIfEnabledOrStop()), this.config.disable_scroll_properties || this.scrollManager.startMeasuringScrollPosition(), this.autocapture = new Zn(this), this.autocapture.startIfEnabled(), this.surveys.loadIfEnabled(), this.heatmaps = new Vn(this), this.heatmaps.startIfEnabled(), this.webVitalsAutocapture = new lo(this), this.exceptionObserver = new no(this), this.exceptionObserver.startIfEnabled(), this.deadClicksAutocapture = new jn(this, Un), this.deadClicksAutocapture.startIfEnabled(), p.DEBUG = p.DEBUG || this.config.debug, p.DEBUG && ee.info("Starting in debug mode", { this: this, config: n2, thisC: ne({}, this.config), p: a2, s: l2 }), this._sync_opt_out_with_persistence(), void 0 !== (null === (s2 = n2.bootstrap) || void 0 === s2 ? void 0 : s2.distinctID)) {
      var c2, u2, d2 = this.config.get_device_id(st()), h2 = null !== (c2 = n2.bootstrap) && void 0 !== c2 && c2.isIdentifiedID ? d2 : n2.bootstrap.distinctID;
      this.persistence.set_property(Ae, null !== (u2 = n2.bootstrap) && void 0 !== u2 && u2.isIdentifiedID ? "identified" : "anonymous"), this.register({ distinct_id: n2.bootstrap.distinctID, $device_id: h2 });
    }
    if (this._hasBootstrappedFeatureFlags()) {
      var _2, v2, g2 = Object.keys((null === (_2 = n2.bootstrap) || void 0 === _2 ? void 0 : _2.featureFlags) || {}).filter((e2) => {
        var t2, i3;
        return !(null === (t2 = n2.bootstrap) || void 0 === t2 || null === (i3 = t2.featureFlags) || void 0 === i3 || !i3[e2]);
      }).reduce((e2, t2) => {
        var i3, r3;
        return e2[t2] = (null === (i3 = n2.bootstrap) || void 0 === i3 || null === (r3 = i3.featureFlags) || void 0 === r3 ? void 0 : r3[t2]) || false, e2;
      }, {}), f2 = Object.keys((null === (v2 = n2.bootstrap) || void 0 === v2 ? void 0 : v2.featureFlagPayloads) || {}).filter((e2) => g2[e2]).reduce((e2, t2) => {
        var i3, r3, s3, o3;
        null !== (i3 = n2.bootstrap) && void 0 !== i3 && null !== (r3 = i3.featureFlagPayloads) && void 0 !== r3 && r3[t2] && (e2[t2] = null === (s3 = n2.bootstrap) || void 0 === s3 || null === (o3 = s3.featureFlagPayloads) || void 0 === o3 ? void 0 : o3[t2]);
        return e2;
      }, {});
      this.featureFlags.receivedFeatureFlags({ featureFlags: g2, featureFlagPayloads: f2 });
    }
    if (this.config.__preview_experimental_cookieless_mode)
      this.register_once({ distinct_id: je, $device_id: null }, "");
    else if (!this.get_distinct_id()) {
      var m2 = this.config.get_device_id(st());
      this.register_once({ distinct_id: m2, $device_id: m2 }, ""), this.persistence.set_property(Ae, "anonymous");
    }
    return R(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this), { passive: false }), this.toolbar.maybeLoadToolbar(), n2.segment ? Ds(this, () => this._loaded()) : this._loaded(), H(this.config._onCapture) && this.config._onCapture !== mo && (ee.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", (e2) => this.config._onCapture(e2.event, e2))), this;
  }
  _onRemoteConfig(t2) {
    var i2, r2, s2, n2, o2, l2, c2, u2;
    if (!a || !a.body)
      return ee.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout(() => {
        this._onRemoteConfig(t2);
      }, 500);
    this.compression = void 0, t2.supportedCompression && !this.config.disable_compression && (this.compression = $(t2.supportedCompression, e.GZipJS) ? e.GZipJS : $(t2.supportedCompression, e.Base64) ? e.Base64 : void 0), null !== (i2 = t2.analytics) && void 0 !== i2 && i2.endpoint && (this.analyticsDefaultEndpoint = t2.analytics.endpoint), this.set_config({ person_profiles: this._initialPersonProfilesConfig ? this._initialPersonProfilesConfig : "identified_only" }), null === (r2 = this.siteApps) || void 0 === r2 || r2.onRemoteConfig(t2), null === (s2 = this.sessionRecording) || void 0 === s2 || s2.onRemoteConfig(t2), null === (n2 = this.autocapture) || void 0 === n2 || n2.onRemoteConfig(t2), null === (o2 = this.heatmaps) || void 0 === o2 || o2.onRemoteConfig(t2), this.surveys.onRemoteConfig(t2), null === (l2 = this.webVitalsAutocapture) || void 0 === l2 || l2.onRemoteConfig(t2), null === (c2 = this.exceptionObserver) || void 0 === c2 || c2.onRemoteConfig(t2), null === (u2 = this.deadClicksAutocapture) || void 0 === u2 || u2.onRemoteConfig(t2);
  }
  _loaded() {
    try {
      this.config.loaded(this);
    } catch (e2) {
      ee.critical("`loaded` function failed", e2);
    }
    this._start_queue_if_opted_in(), this.config.capture_pageview && setTimeout(() => {
      this.consent.isOptedIn() && this._captureInitialPageview();
    }, 1), new ds(this).load(), this.featureFlags.decide();
  }
  _start_queue_if_opted_in() {
    var e2;
    this.has_opted_out_capturing() || this.config.request_batching && (null === (e2 = this._requestQueue) || void 0 === e2 || e2.enable());
  }
  _dom_loaded() {
    this.has_opted_out_capturing() || b(this.__request_queue, (e2) => this._send_retriable_request(e2)), this.__request_queue = [], this._start_queue_if_opted_in();
  }
  _handle_unload() {
    var e2, t2;
    this.config.request_batching ? (this._shouldCapturePageleave() && this.capture("$pageleave"), null === (e2 = this._requestQueue) || void 0 === e2 || e2.unload(), null === (t2 = this._retryQueue) || void 0 === t2 || t2.unload()) : this._shouldCapturePageleave() && this.capture("$pageleave", null, { transport: "sendBeacon" });
  }
  _send_request(e2) {
    this.__loaded && (yo ? this.__request_queue.push(e2) : this.rateLimiter.isServerRateLimited(e2.batchKey) || (e2.transport = e2.transport || this.config.api_transport, e2.url = Ss(e2.url, { ip: this.config.ip ? 1 : 0 }), e2.headers = ne({}, this.config.request_headers), e2.compression = "best-available" === e2.compression ? this.compression : e2.compression, e2.fetchOptions = e2.fetchOptions || this.config.fetch_options, ((e3) => {
      var t2, i2, r2, s2 = ne({}, e3);
      s2.timeout = s2.timeout || 6e4, s2.url = Ss(s2.url, { _: (/* @__PURE__ */ new Date()).getTime().toString(), ver: p.LIB_VERSION, compression: s2.compression });
      var n2 = null !== (t2 = s2.transport) && void 0 !== t2 ? t2 : "fetch", o2 = null !== (i2 = null === (r2 = T(xs, (e4) => e4.transport === n2)) || void 0 === r2 ? void 0 : r2.method) && void 0 !== i2 ? i2 : xs[0].method;
      if (!o2)
        throw new Error("No available transport method");
      o2(s2);
    })(ne(ne({}, e2), {}, { callback: (t2) => {
      var i2, r2, s2;
      (this.rateLimiter.checkForLimiting(t2), t2.statusCode >= 400) && (null === (r2 = (s2 = this.config).on_request_error) || void 0 === r2 || r2.call(s2, t2));
      null === (i2 = e2.callback) || void 0 === i2 || i2.call(e2, t2);
    } }))));
  }
  _send_retriable_request(e2) {
    this._retryQueue ? this._retryQueue.retriableRequest(e2) : this._send_request(e2);
  }
  _execute_array(e2) {
    var t2, i2 = [], r2 = [], s2 = [];
    b(e2, (e3) => {
      e3 && (t2 = e3[0], B(t2) ? s2.push(e3) : H(e3) ? e3.call(this) : B(e3) && "alias" === t2 ? i2.push(e3) : B(e3) && -1 !== t2.indexOf("capture") && H(this[t2]) ? s2.push(e3) : r2.push(e3));
    });
    var n2 = function(e3, t3) {
      b(e3, function(e4) {
        if (B(e4[0])) {
          var i3 = t3;
          y(e4, function(e5) {
            i3 = i3[e5[0]].apply(i3, e5.slice(1));
          });
        } else
          this[e4[0]].apply(this, e4.slice(1));
      }, t3);
    };
    n2(i2, this), n2(r2, this), n2(s2, this);
  }
  _hasBootstrappedFeatureFlags() {
    var e2, t2;
    return (null === (e2 = this.config.bootstrap) || void 0 === e2 ? void 0 : e2.featureFlags) && Object.keys(null === (t2 = this.config.bootstrap) || void 0 === t2 ? void 0 : t2.featureFlags).length > 0 || false;
  }
  push(e2) {
    this._execute_array([e2]);
  }
  capture(e2, t2, i2) {
    var r2;
    if (this.__loaded && this.persistence && this.sessionPersistence && this._requestQueue) {
      if (!this.consent.isOptedOut())
        if (!z(e2) && W(e2)) {
          if (this.config.opt_out_useragent_filter || !this._is_bot()) {
            var s2 = null != i2 && i2.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
            if (null == s2 || !s2.isRateLimited) {
              this.sessionPersistence.update_search_keyword(), this.config.save_campaign_params && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.save_campaign_params || this.config.save_referrer) && this.persistence.set_initial_person_info();
              var n2 = /* @__PURE__ */ new Date(), o2 = (null == i2 ? void 0 : i2.timestamp) || n2, a2 = st(), l2 = { uuid: a2, event: e2, properties: this._calculate_event_properties(e2, t2 || {}, o2, a2) };
              s2 && (l2.properties.$lib_rate_limit_remaining_tokens = s2.remainingTokens), (null == i2 ? void 0 : i2.$set) && (l2.$set = null == i2 ? void 0 : i2.$set);
              var c2 = this._calculate_set_once_properties(null == i2 ? void 0 : i2.$set_once);
              c2 && (l2.$set_once = c2), (l2 = C(l2, null != i2 && i2._noTruncate ? null : this.config.properties_string_max_length)).timestamp = o2, z(null == i2 ? void 0 : i2.timestamp) || (l2.properties.$event_time_override_provided = true, l2.properties.$event_time_override_system_time = n2);
              var u2 = ne(ne({}, l2.properties.$set), l2.$set);
              if (j(u2) || this.setPersonPropertiesForFlags(u2), !J(this.config.before_send)) {
                var d2 = this._runBeforeSend(l2);
                if (!d2)
                  return;
                l2 = d2;
              }
              this._internalEventEmitter.emit("eventCaptured", l2);
              var h2 = { method: "POST", url: null !== (r2 = null == i2 ? void 0 : i2._url) && void 0 !== r2 ? r2 : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint), data: l2, compression: "best-available", batchKey: null == i2 ? void 0 : i2._batchKey };
              return !this.config.request_batching || i2 && (null == i2 || !i2._batchKey) || null != i2 && i2.send_instantly ? this._send_retriable_request(h2) : this._requestQueue.enqueue(h2), l2;
            }
            ee.critical("This capture call is ignored due to client rate limiting.");
          }
        } else
          ee.error("No event name provided to posthog.capture");
    } else
      ee.uninitializedWarning("posthog.capture");
  }
  _addCaptureHook(e2) {
    return this.on("eventCaptured", (t2) => e2(t2.event, t2));
  }
  _calculate_event_properties(e2, t2, i2, r2) {
    if (i2 = i2 || /* @__PURE__ */ new Date(), !this.persistence || !this.sessionPersistence)
      return t2;
    var s2 = this.persistence.remove_event_timer(e2), n2 = ne({}, t2);
    if (n2.token = this.config.token, this.config.__preview_experimental_cookieless_mode && (n2.$cookieless_mode = true), "$snapshot" === e2) {
      var o2 = ne(ne({}, this.persistence.properties()), this.sessionPersistence.properties());
      return n2.distinct_id = o2.distinct_id, (!W(n2.distinct_id) && !Y(n2.distinct_id) || V(n2.distinct_id)) && ee.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), n2;
    }
    var l2, c2 = Ei.properties({ maskPersonalDataProperties: this.config.mask_personal_data_properties, customPersonalDataProperties: this.config.custom_personal_data_properties });
    if (this.sessionManager) {
      var { sessionId: u2, windowId: d2 } = this.sessionManager.checkAndGetSessionAndWindowId();
      n2.$session_id = u2, n2.$window_id = d2;
    }
    if (this.sessionRecording && (n2.$recording_status = this.sessionRecording.status), this.requestRouter.region === Ps.CUSTOM && (n2.$lib_custom_api_host = this.config.api_host), l2 = "$pageview" === e2 ? this.pageViewManager.doPageView(i2, r2) : "$pageleave" === e2 ? this.pageViewManager.doPageLeave(i2) : this.pageViewManager.doEvent(), n2 = w(n2, l2), "$pageview" === e2 && a && (n2.title = a.title), !z(s2)) {
      var _2 = i2.getTime() - s2;
      n2.$duration = parseFloat((_2 / 1e3).toFixed(3));
    }
    h && this.config.opt_out_useragent_filter && (n2.$browser_type = this._is_bot() ? "bot" : "browser"), (n2 = w({}, c2, this.persistence.properties(), this.sessionPersistence.properties(), n2)).$is_identified = this._isIdentified(), B(this.config.property_denylist) ? y(this.config.property_denylist, function(e3) {
      delete n2[e3];
    }) : ee.error("Invalid value for property_denylist config: " + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
    var p2 = this.config.sanitize_properties;
    p2 && (ee.error("sanitize_properties is deprecated. Use before_send instead"), n2 = p2(n2, e2));
    var v2 = this._hasPersonProcessing();
    return n2.$process_person_profile = v2, v2 && this._requirePersonProcessing("_calculate_event_properties"), n2;
  }
  _calculate_set_once_properties(e2) {
    if (!this.persistence || !this._hasPersonProcessing())
      return e2;
    var t2 = w({}, this.persistence.get_initial_props(), e2 || {}), i2 = this.config.sanitize_properties;
    return i2 && (ee.error("sanitize_properties is deprecated. Use before_send instead"), t2 = i2(t2, "$set_once")), j(t2) ? void 0 : t2;
  }
  register(e2, t2) {
    var i2;
    null === (i2 = this.persistence) || void 0 === i2 || i2.register(e2, t2);
  }
  register_once(e2, t2, i2) {
    var r2;
    null === (r2 = this.persistence) || void 0 === r2 || r2.register_once(e2, t2, i2);
  }
  register_for_session(e2) {
    var t2;
    null === (t2 = this.sessionPersistence) || void 0 === t2 || t2.register(e2);
  }
  unregister(e2) {
    var t2;
    null === (t2 = this.persistence) || void 0 === t2 || t2.unregister(e2);
  }
  unregister_for_session(e2) {
    var t2;
    null === (t2 = this.sessionPersistence) || void 0 === t2 || t2.unregister(e2);
  }
  _register_single(e2, t2) {
    this.register({ [e2]: t2 });
  }
  getFeatureFlag(e2, t2) {
    return this.featureFlags.getFeatureFlag(e2, t2);
  }
  getFeatureFlagPayload(e2) {
    var t2 = this.featureFlags.getFeatureFlagPayload(e2);
    try {
      return JSON.parse(t2);
    } catch (e3) {
      return t2;
    }
  }
  isFeatureEnabled(e2, t2) {
    return this.featureFlags.isFeatureEnabled(e2, t2);
  }
  reloadFeatureFlags() {
    this.featureFlags.reloadFeatureFlags();
  }
  updateEarlyAccessFeatureEnrollment(e2, t2) {
    this.featureFlags.updateEarlyAccessFeatureEnrollment(e2, t2);
  }
  getEarlyAccessFeatures(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    return this.featureFlags.getEarlyAccessFeatures(e2, t2);
  }
  on(e2, t2) {
    return this._internalEventEmitter.on(e2, t2);
  }
  onFeatureFlags(e2) {
    return this.featureFlags.onFeatureFlags(e2);
  }
  onSessionId(e2) {
    var t2, i2;
    return null !== (t2 = null === (i2 = this.sessionManager) || void 0 === i2 ? void 0 : i2.onSessionId(e2)) && void 0 !== t2 ? t2 : () => {
    };
  }
  getSurveys(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    this.surveys.getSurveys(e2, t2);
  }
  getActiveMatchingSurveys(e2) {
    var t2 = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
    this.surveys.getActiveMatchingSurveys(e2, t2);
  }
  renderSurvey(e2, t2) {
    this.surveys.renderSurvey(e2, t2);
  }
  canRenderSurvey(e2) {
    this.surveys.canRenderSurvey(e2);
  }
  getNextSurveyStep(e2, t2, i2) {
    return this.surveys.getNextSurveyStep(e2, t2, i2);
  }
  identify(e2, t2, i2) {
    if (!this.__loaded || !this.persistence)
      return ee.uninitializedWarning("posthog.identify");
    if (Y(e2) && (e2 = e2.toString(), ee.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), e2) {
      if (["distinct_id", "distinctid"].includes(e2.toLowerCase()))
        ee.critical('The string "'.concat(e2, '" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string.'));
      else if (this._requirePersonProcessing("posthog.identify")) {
        var r2 = this.get_distinct_id();
        if (this.register({ $user_id: e2 }), !this.get_property("$device_id")) {
          var s2 = r2;
          this.register_once({ $had_persisted_distinct_id: true, $device_id: s2 }, "");
        }
        e2 !== r2 && e2 !== this.get_property(ce) && (this.unregister(ce), this.register({ distinct_id: e2 }));
        var n2 = "anonymous" === (this.persistence.get_property(Ae) || "anonymous");
        e2 !== r2 && n2 ? (this.persistence.set_property(Ae, "identified"), this.setPersonPropertiesForFlags(ne(ne({}, i2 || {}), t2 || {}), false), this.capture("$identify", { distinct_id: e2, $anon_distinct_id: r2 }, { $set: t2 || {}, $set_once: i2 || {} }), this.featureFlags.setAnonymousDistinctId(r2), this._cachedIdentify = go(e2, t2, i2)) : (t2 || i2) && (this._cachedIdentify !== go(e2, t2, i2) ? (this.setPersonProperties(t2, i2), this._cachedIdentify = go(e2, t2, i2)) : ee.info("A duplicate posthog.identify call was made with the same properties. It has been ignored.")), e2 !== r2 && (this.reloadFeatureFlags(), this.unregister(Me));
      }
    } else
      ee.error("Unique user id has not been set in posthog.identify");
  }
  setPersonProperties(e2, t2) {
    (e2 || t2) && this._requirePersonProcessing("posthog.setPersonProperties") && (this.setPersonPropertiesForFlags(ne(ne({}, t2 || {}), e2 || {})), this.capture("$set", { $set: e2 || {}, $set_once: t2 || {} }));
  }
  group(e2, t2, i2) {
    if (e2 && t2) {
      if (this._requirePersonProcessing("posthog.group")) {
        var r2 = this.getGroups();
        r2[e2] !== t2 && this.resetGroupPropertiesForFlags(e2), this.register({ $groups: ne(ne({}, r2), {}, { [e2]: t2 }) }), i2 && (this.capture("$groupidentify", { $group_type: e2, $group_key: t2, $group_set: i2 }), this.setGroupPropertiesForFlags({ [e2]: i2 })), r2[e2] === t2 || i2 || this.reloadFeatureFlags();
      }
    } else
      ee.error("posthog.group requires a group type and group key");
  }
  resetGroups() {
    this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
  }
  setPersonPropertiesForFlags(e2) {
    var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
    this.featureFlags.setPersonPropertiesForFlags(e2, t2);
  }
  resetPersonPropertiesForFlags() {
    this.featureFlags.resetPersonPropertiesForFlags();
  }
  setGroupPropertiesForFlags(e2) {
    var t2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
    this._requirePersonProcessing("posthog.setGroupPropertiesForFlags") && this.featureFlags.setGroupPropertiesForFlags(e2, t2);
  }
  resetGroupPropertiesForFlags(e2) {
    this.featureFlags.resetGroupPropertiesForFlags(e2);
  }
  reset(e2) {
    var t2, i2, r2, s2;
    if (ee.info("reset"), !this.__loaded)
      return ee.uninitializedWarning("posthog.reset");
    var n2 = this.get_property("$device_id");
    if (this.consent.reset(), null === (t2 = this.persistence) || void 0 === t2 || t2.clear(), null === (i2 = this.sessionPersistence) || void 0 === i2 || i2.clear(), this.surveys.reset(), null === (r2 = this.persistence) || void 0 === r2 || r2.set_property(Ae, "anonymous"), null === (s2 = this.sessionManager) || void 0 === s2 || s2.resetSessionId(), this._cachedIdentify = null, this.config.__preview_experimental_cookieless_mode)
      this.register_once({ distinct_id: je, $device_id: null }, "");
    else {
      var o2 = this.config.get_device_id(st());
      this.register_once({ distinct_id: o2, $device_id: e2 ? o2 : n2 }, "");
    }
    this.register({ $last_posthog_reset: (/* @__PURE__ */ new Date()).toISOString() }, 1);
  }
  get_distinct_id() {
    return this.get_property("distinct_id");
  }
  getGroups() {
    return this.get_property("$groups") || {};
  }
  get_session_id() {
    var e2, t2;
    return null !== (e2 = null === (t2 = this.sessionManager) || void 0 === t2 ? void 0 : t2.checkAndGetSessionAndWindowId(true).sessionId) && void 0 !== e2 ? e2 : "";
  }
  get_session_replay_url(e2) {
    if (!this.sessionManager)
      return "";
    var { sessionId: t2, sessionStartTimestamp: i2 } = this.sessionManager.checkAndGetSessionAndWindowId(true), r2 = this.requestRouter.endpointFor("ui", "/project/".concat(this.config.token, "/replay/").concat(t2));
    if (null != e2 && e2.withTimestamp && i2) {
      var s2, n2 = null !== (s2 = e2.timestampLookBack) && void 0 !== s2 ? s2 : 10;
      if (!i2)
        return r2;
      var o2 = Math.max(Math.floor(((/* @__PURE__ */ new Date()).getTime() - i2) / 1e3) - n2, 0);
      r2 += "?t=".concat(o2);
    }
    return r2;
  }
  alias(e2, t2) {
    return e2 === this.get_property(le) ? (ee.critical("Attempting to create alias for existing People user - aborting."), -2) : this._requirePersonProcessing("posthog.alias") ? (z(t2) && (t2 = this.get_distinct_id()), e2 !== t2 ? (this._register_single(ce, e2), this.capture("$create_alias", { alias: e2, distinct_id: t2 })) : (ee.warn("alias matches current distinct_id - skipping api call."), this.identify(e2), -1)) : void 0;
  }
  set_config(e2) {
    var t2, i2, r2, s2, n2 = ne({}, this.config);
    U(e2) && (w(this.config, So(e2)), null === (t2 = this.persistence) || void 0 === t2 || t2.update_config(this.config, n2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Ii(ne(ne({}, this.config), {}, { persistence: "sessionStorage" })), ht.is_supported() && "true" === ht.get("ph_debug") && (this.config.debug = true), this.config.debug && (p.DEBUG = true, ee.info("set_config", { config: e2, oldConfig: n2, newConfig: ne({}, this.config) })), null === (i2 = this.sessionRecording) || void 0 === i2 || i2.startIfEnabledOrStop(), null === (r2 = this.autocapture) || void 0 === r2 || r2.startIfEnabled(), null === (s2 = this.heatmaps) || void 0 === s2 || s2.startIfEnabled(), this.surveys.loadIfEnabled(), this._sync_opt_out_with_persistence());
  }
  startSessionRecording(e2) {
    var t2 = true === e2, i2 = { sampling: t2 || !(null == e2 || !e2.sampling), linked_flag: t2 || !(null == e2 || !e2.linked_flag), url_trigger: t2 || !(null == e2 || !e2.url_trigger), event_trigger: t2 || !(null == e2 || !e2.event_trigger) };
    if (Object.values(i2).some(Boolean)) {
      var r2, s2, n2, o2, a2;
      if (null === (r2 = this.sessionManager) || void 0 === r2 || r2.checkAndGetSessionAndWindowId(), i2.sampling)
        null === (s2 = this.sessionRecording) || void 0 === s2 || s2.overrideSampling();
      if (i2.linked_flag)
        null === (n2 = this.sessionRecording) || void 0 === n2 || n2.overrideLinkedFlag();
      if (i2.url_trigger)
        null === (o2 = this.sessionRecording) || void 0 === o2 || o2.overrideTrigger("url");
      if (i2.event_trigger)
        null === (a2 = this.sessionRecording) || void 0 === a2 || a2.overrideTrigger("event");
    }
    this.set_config({ disable_session_recording: false });
  }
  stopSessionRecording() {
    this.set_config({ disable_session_recording: true });
  }
  sessionRecordingStarted() {
    var e2;
    return !(null === (e2 = this.sessionRecording) || void 0 === e2 || !e2.started);
  }
  captureException(e2, t2) {
    var i2, r2 = new Error("PostHog syntheticException"), s2 = H(null === (i2 = _.__PosthogExtensions__) || void 0 === i2 ? void 0 : i2.parseErrorAsProperties) ? ne(ne({}, _.__PosthogExtensions__.parseErrorAsProperties([e2.message, void 0, void 0, void 0, e2], { syntheticException: r2 })), t2) : ne({ $exception_level: "error", $exception_list: [{ type: e2.name, value: e2.message, mechanism: { handled: true, synthetic: false } }] }, t2);
    this.exceptions.sendExceptionEvent(s2);
  }
  loadToolbar(e2) {
    return this.toolbar.loadToolbar(e2);
  }
  get_property(e2) {
    var t2;
    return null === (t2 = this.persistence) || void 0 === t2 ? void 0 : t2.props[e2];
  }
  getSessionProperty(e2) {
    var t2;
    return null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.props[e2];
  }
  toString() {
    var e2, t2 = null !== (e2 = this.config.name) && void 0 !== e2 ? e2 : bo;
    return t2 !== bo && (t2 = bo + "." + t2), t2;
  }
  _isIdentified() {
    var e2, t2;
    return "identified" === (null === (e2 = this.persistence) || void 0 === e2 ? void 0 : e2.get_property(Ae)) || "identified" === (null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.get_property(Ae));
  }
  _hasPersonProcessing() {
    var e2, t2, i2, r2;
    return !("never" === this.config.person_profiles || "identified_only" === this.config.person_profiles && !this._isIdentified() && j(this.getGroups()) && (null === (e2 = this.persistence) || void 0 === e2 || null === (t2 = e2.props) || void 0 === t2 || !t2[ce]) && (null === (i2 = this.persistence) || void 0 === i2 || null === (r2 = i2.props) || void 0 === r2 || !r2[He]));
  }
  _shouldCapturePageleave() {
    return true === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && this.config.capture_pageview;
  }
  createPersonProfile() {
    this._hasPersonProcessing() || this._requirePersonProcessing("posthog.createPersonProfile") && this.setPersonProperties({}, {});
  }
  _requirePersonProcessing(e2) {
    return "never" === this.config.person_profiles ? (ee.error(e2 + ' was called, but process_person is set to "never". This call will be ignored.'), false) : (this._register_single(He, true), true);
  }
  _sync_opt_out_with_persistence() {
    var e2, t2, i2, r2, s2 = this.consent.isOptedOut(), n2 = this.config.opt_out_persistence_by_default, o2 = this.config.disable_persistence || s2 && !!n2;
    (null === (e2 = this.persistence) || void 0 === e2 ? void 0 : e2.disabled) !== o2 && (null === (i2 = this.persistence) || void 0 === i2 || i2.set_disabled(o2));
    (null === (t2 = this.sessionPersistence) || void 0 === t2 ? void 0 : t2.disabled) !== o2 && (null === (r2 = this.sessionPersistence) || void 0 === r2 || r2.set_disabled(o2));
  }
  opt_in_capturing(e2) {
    var t2;
    (this.consent.optInOut(true), this._sync_opt_out_with_persistence(), z(null == e2 ? void 0 : e2.captureEventName) || null != e2 && e2.captureEventName) && this.capture(null !== (t2 = null == e2 ? void 0 : e2.captureEventName) && void 0 !== t2 ? t2 : "$opt_in", null == e2 ? void 0 : e2.captureProperties, { send_instantly: true });
    this.config.capture_pageview && this._captureInitialPageview();
  }
  opt_out_capturing() {
    this.consent.optInOut(false), this._sync_opt_out_with_persistence();
  }
  has_opted_in_capturing() {
    return this.consent.isOptedIn();
  }
  has_opted_out_capturing() {
    return this.consent.isOptedOut();
  }
  clear_opt_in_out_capturing() {
    this.consent.reset(), this._sync_opt_out_with_persistence();
  }
  _is_bot() {
    return o ? Nn(o, this.config.custom_blocked_useragents) : void 0;
  }
  _captureInitialPageview() {
    a && !this._initialPageviewCaptured && (this._initialPageviewCaptured = true, this.capture("$pageview", { title: a.title }, { send_instantly: true }));
  }
  debug(e2) {
    false === e2 ? (null == t || t.console.log("You've disabled debug mode."), localStorage && localStorage.removeItem("ph_debug"), this.set_config({ debug: false })) : (null == t || t.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), localStorage && localStorage.setItem("ph_debug", "true"), this.set_config({ debug: true }));
  }
  _runBeforeSend(e2) {
    if (J(this.config.before_send))
      return e2;
    var t2 = B(this.config.before_send) ? this.config.before_send : [this.config.before_send], i2 = e2;
    for (var r2 of t2) {
      if (i2 = r2(i2), J(i2)) {
        var s2 = "Event '".concat(e2.event, "' was rejected in beforeSend function");
        return Q(e2.event) ? ee.warn("".concat(s2, ". This can cause unexpected behavior.")) : ee.info(s2), null;
      }
      i2.properties && !j(i2.properties) || ee.warn("Event '".concat(e2.event, "' has no properties after beforeSend function, this is likely an error."));
    }
    return i2;
  }
  getPageViewId() {
    var e2;
    return null === (e2 = this.pageViewManager._currentPageview) || void 0 === e2 ? void 0 : e2.pageViewId;
  }
};
!function(e2, t2) {
  for (var i2 = 0; i2 < t2.length; i2++)
    e2.prototype[t2[i2]] = x(e2.prototype[t2[i2]]);
}(Eo, ["identify"]);
var xo;
var Io = (xo = fo[bo] = new Eo(), function() {
  function e2() {
    e2.done || (e2.done = true, yo = false, y(fo, function(e3) {
      e3._dom_loaded();
    }));
  }
  null != a && a.addEventListener ? "complete" === a.readyState ? e2() : R(a, "DOMContentLoaded", e2, { capture: false }) : t && ee.error("Browser doesn't support `document.addEventListener` so PostHog couldn't be initialized");
}(), xo);
export {
  v as COPY_AUTOCAPTURE_EVENT,
  e as Compression,
  Eo as PostHog,
  kn as SurveyQuestionBranchingType,
  Sn as SurveyQuestionType,
  wn as SurveyType,
  Io as default,
  g as knownUnsafeEditableEvent,
  Io as posthog,
  f as severityLevels
};
//# sourceMappingURL=posthog-js.js.map
