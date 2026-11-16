(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Icons
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2, "aria-hidden": "true" } });

  // Year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Header border on scroll
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  var nav = document.getElementById("main-nav");
  var toggle = document.getElementById("nav-toggle");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (nav && toggle) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // Active nav link follows the section in view
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  function setActive() {
    var line = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0];
    sections.forEach(function (sec) { if (sec.offsetTop <= line) current = sec; });
    // At the very bottom, the last section wins
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    navLinks.forEach(function (a) {
      var on = a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  if (sections.length) {
    setActive();
    window.addEventListener("scroll", setActive, { passive: true });
    window.addEventListener("resize", setActive);
  }

  // FAQ accordion (one open at a time)
  var faqBtns = document.querySelectorAll(".faq-btn");
  faqBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      faqBtns.forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
        b.closest(".faq-item").classList.remove("is-open");
      });
      if (!open) {
        btn.setAttribute("aria-expanded", "true");
        btn.closest(".faq-item").classList.add("is-open");
      }
    });
  });

  // Fade-up reveal + progress bars filling
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    document.querySelectorAll(".bar-fill").forEach(function (b) { b.classList.add("is-filled"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) {
      // Above-the-fold content shows straight away (no blank hero while JS warms up)
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      else io.observe(el);
    });
    // Safety net: never leave content hidden if the observer doesn't fire
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add("is-visible"); }); }, 4000);
  }

  // Sticky mobile CTA: show once the hero CTA has scrolled away, hide over the final CTA band
  var sticky = document.getElementById("sticky-cta");
  var heroCta = document.getElementById("hero-cta");
  var finalCta = document.getElementById("final-cta");
  if (sticky && heroCta && finalCta && "IntersectionObserver" in window) {
    var heroVisible = true, finalVisible = false;
    var stickyLink = sticky.querySelector("a");
    function update() {
      var show = !heroVisible && !finalVisible;
      sticky.classList.toggle("is-shown", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      stickyLink.tabIndex = show ? 0 : -1;
    }
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting || e[0].boundingClientRect.top > 0; update(); }).observe(heroCta);
    new IntersectionObserver(function (e) { finalVisible = e[0].isIntersecting || e[0].boundingClientRect.top < 0; update(); }).observe(finalCta);
  }

  // Notify form (one field). Set data-endpoint on the form to POST to your backend.
  var form = document.getElementById("notify-form");
  if (form) {
    var input = form.querySelector("input[type=email]");
    var msg = document.getElementById("notify-msg");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Please enter a valid email address.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        console.warn("[FinSave] Notify form has no data-endpoint yet; email was not stored.");
        msg.textContent = "Thanks! We'll let you know when FinSave launches.";
        form.reset();
        return;
      }
      msg.textContent = "Sending…";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email })
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        msg.textContent = "Thanks! We'll let you know when FinSave launches.";
        form.reset();
      }).catch(function () {
        msg.textContent = "Something went wrong. Please try again.";
      });
    });
  }
})();
