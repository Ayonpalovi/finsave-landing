/* Microsoft Clarity, loaded only after the visitor says yes.
   Choice is remembered in this browser; "Analytics settings" in the footer reopens the bar. */
(function () {
  var CLARITY_ID = "zfa0nsdh97";
  var KEY = "finsave-analytics";
  var bar = document.getElementById("consent-bar");

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function loadClarity() {
    if (loaded) return; loaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
    // Tell Clarity the visitor consented (required for visitors in the EEA)
    window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  }

  function showBar(show) {
    if (!bar) return;
    if (show) {
      bar.hidden = false;
      void bar.offsetWidth;              // apply the start state so the slide-in animates
      bar.classList.add("is-shown");
    } else {
      bar.classList.remove("is-shown");
      setTimeout(function () { if (!bar.classList.contains("is-shown")) bar.hidden = true; }, 400);
    }
  }

  var choice = getChoice();
  if (choice === "granted") loadClarity();
  else if (choice !== "denied") setTimeout(function () { showBar(true); }, 1200);

  if (bar) {
    bar.querySelector("[data-consent='yes']").addEventListener("click", function () {
      setChoice("granted"); loadClarity(); showBar(false);
    });
    bar.querySelector("[data-consent='no']").addEventListener("click", function () {
      setChoice("denied"); showBar(false);
      // If Clarity was running from an earlier "yes", stop it and clear its cookies
      if (loaded && window.clarity) window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
    });
  }
  document.querySelectorAll("[data-open-consent]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); showBar(true); });
  });
})();
