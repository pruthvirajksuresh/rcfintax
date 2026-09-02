const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const revealItems = document.querySelectorAll(".reveal");
const leadForm = document.querySelector("#lead-form");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(leadForm);
    const name = (formData.get("name") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const course = (formData.get("course") || "").toString().trim();
    const mode = (formData.get("mode") || "").toString().trim();

    if (!name || !phone || !course || !mode) {
      leadForm.reportValidity();
      return;
    }

    const message = `Hello RC Fintax, I want to enquire about *${course}* for *${mode}* mode. My name is ${name} and my phone number is ${phone}.`;
    const whatsappUrl = `https://wa.me/919353791842?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
}

if (revealItems.length > 0) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}
