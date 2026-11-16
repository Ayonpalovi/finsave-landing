/*
 * FinSave i18n
 * ------------
 * English is the source language and lives directly in index.html (best for SEO and no-JS).
 * Every translatable string carries a data-i18n="key" attribute; attributes use
 * data-i18n-attr="placeholder:key".
 *
 * To add Dutch:
 *   1. In the browser console run  FinSaveI18n.dumpKeys()  to get every key + English text.
 *   2. Create locales/nl.js:
 *        window.FINSAVE_LOCALES = window.FINSAVE_LOCALES || {};
 *        window.FINSAVE_LOCALES.nl = { meta: { title: "...", description: "..." }, strings: { "hero.title": "...", ... } };
 *   3. Add <script src="locales/nl.js" defer></script> before assets/i18n.js in index.html.
 *   4. Visit ?lang=nl (or add a language switch that calls FinSaveI18n.setLang("nl")).
 * Missing keys fall back to the English text in the HTML.
 */
(function () {
  var SUPPORTED_DEFAULT = "en";
  var locales = window.FINSAVE_LOCALES || {};

  function pickLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && (q === SUPPORTED_DEFAULT || locales[q])) return q;
    try {
      var saved = localStorage.getItem("finsave-lang");
      if (saved && locales[saved]) return saved;
    } catch (e) { /* storage blocked */ }
    return SUPPORTED_DEFAULT;
  }

  function apply(lang) {
    var pack = locales[lang];
    document.documentElement.lang = lang;
    if (!pack) return; // English: HTML is already correct
    var s = pack.strings || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = s[el.getAttribute("data-i18n")];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        var v = s[parts[1]];
        if (v != null) el.setAttribute(parts[0], v);
      });
    });
    if (pack.meta) {
      if (pack.meta.title) document.title = pack.meta.title;
      var d = document.querySelector('meta[name="description"]');
      if (d && pack.meta.description) d.setAttribute("content", pack.meta.description);
    }
  }

  window.FinSaveI18n = {
    setLang: function (lang) {
      try { localStorage.setItem("finsave-lang", lang); } catch (e) {}
      location.search = "?lang=" + lang;
    },
    dumpKeys: function () {
      var out = {};
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        out[el.getAttribute("data-i18n")] = el.textContent.trim();
      });
      document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
        el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
          var p = pair.split(":");
          out[p[1]] = el.getAttribute(p[0]);
        });
      });
      return out;
    }
  };

  apply(pickLang());
})();
