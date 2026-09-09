document.documentElement.classList.add("js");

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const header = document.querySelector(".site-header");
const mobileNavigation = window.matchMedia("(max-width: 1080px)");

if (navToggle && nav && header) {
  const setOpen = (open, returnFocus = false) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (returnFocus) navToggle.focus();
  };
  navToggle.addEventListener("click", () => {
    setOpen(navToggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", (event) => {
    // Icons inside links must close the menu just like their text.
    if (event.target instanceof Element && event.target.closest("a"))
      setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      setOpen(false, true);
    }
  });
  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener("focusin", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  mobileNavigation.addEventListener("change", () => setOpen(false));
}

// Only recognized topics can populate enquiry text and external link drafts.
const topics = new Map([
  ["tally", "Accounting with Tally"],
  ["taxation", "GST, TDS and Income Tax training"],
  ["sap", "SAP S/4HANA FICO training"],
  ["accounting-tax", "Accounting and Taxation services"],
  ["compliance", "Audit and Compliance support"],
  ["finance", "Loan and Insurance assistance"],
  ["digital-statutory", "Digital Signature and ESI / PF support"],
  ["general", "Finance services and training"],
]);
const topic = topics.get(
  new URLSearchParams(window.location.search).get("topic"),
);
const topicLabel = document.querySelector("#contact-topic");
const context = document.querySelector("#contact-context");
if (topic && topicLabel && context) {
  topicLabel.textContent = topic;
  context.hidden = false;
  const message =
    "Hello RC Fintax, I would like to enquire about " + topic + ".";
  const whatsapp = document.querySelector("#enquiry-whatsapp");
  const email = document.querySelector("#enquiry-email");
  if (whatsapp)
    whatsapp.href =
      "https://wa.me/919353791842?text=" + encodeURIComponent(message);
  if (email)
    email.href =
      "mailto:rcinsuranceservice@gmail.com?subject=" +
      encodeURIComponent("Enquiry: " + topic);
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reduceMotion.matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((item) => observer.observe(item));
}
