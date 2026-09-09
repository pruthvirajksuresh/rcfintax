const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync, existsSync } = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const pages = [
  "index.html",
  "services.html",
  "courses.html",
  "sap-training.html",
  "about.html",
  "contact.html",
];
const script = readFileSync(path.join(root, "script.js"), "utf8");
const base = "https://pruthvirajksuresh.github.io/rcfintax/";
const read = (file) => readFileSync(path.join(root, file), "utf8");
const documents = new Map(
  pages.map((file) => [file, new JSDOM(read(file)).window.document]),
);

test("all internal links, fragments and assets resolve under a GitHub Pages project path", () => {
  for (const [file, document] of documents) {
    const ids = Array.from(
      document.querySelectorAll("[id]"),
      (node) => node.id,
    );
    assert.equal(new Set(ids).size, ids.length, file + ": duplicate ID");
    for (const node of document.querySelectorAll("[href], [src]")) {
      const raw = node.getAttribute("href") || node.getAttribute("src");
      const url = new URL(raw, base + file);
      if (url.origin !== new URL(base).origin) continue;
      assert.ok(
        url.pathname.startsWith("/rcfintax/"),
        file + ": broken project-relative URL " + raw,
      );
      const target =
        decodeURIComponent(url.pathname.slice("/rcfintax/".length)) ||
        "index.html";
      assert.ok(existsSync(path.join(root, target)), file + ": missing " + raw);
      if (url.hash && documents.has(target)) {
        assert.ok(
          documents
            .get(target)
            .getElementById(decodeURIComponent(url.hash.slice(1))),
          file + ": missing anchor " + raw,
        );
      }
    }
  }
});

test("every page has matching search and sharing metadata and accessible page navigation", () => {
  const titles = [];
  for (const [file, document] of documents) {
    const title = document.title;
    titles.push(title);
    assert.equal(document.querySelectorAll("h1").length, 1, file);
    assert.ok(document.querySelector("#main"), file);
    assert.equal(
      document.querySelector(".skip-link").getAttribute("href"),
      "#main",
    );
    assert.equal(
      document
        .querySelector('.site-nav [aria-current="page"]')
        .getAttribute("href"),
      file,
    );
    assert.equal(
      document.querySelector('meta[property="og:title"]').content,
      title,
    );
    assert.equal(
      document.querySelector('meta[name="twitter:title"]').content,
      title,
    );
    assert.equal(
      document.querySelector('meta[property="og:description"]').content,
      document.querySelector('meta[name="description"]').content,
    );
    assert.equal(
      document.querySelector('meta[property="og:url"]').content,
      new URL(file === "index.html" ? "" : file, base).href,
    );
    assert.equal(
      document.querySelector('meta[property="og:image"]').content,
      base + "assets/social-preview.png",
    );
    for (const image of document.images) {
      assert.ok(image.hasAttribute("alt"), file + ": missing alt");
      assert.ok(
        image.hasAttribute("width") && image.hasAttribute("height"),
        file + ": missing image dimensions",
      );
    }
  }
  assert.equal(new Set(titles).size, pages.length);
});

test("homepage service and course links lead to their own detailed sections", () => {
  const document = documents.get("index.html");
  const services = Array.from(document.querySelectorAll(".service-card"), (a) =>
    a.getAttribute("href"),
  );
  assert.equal(new Set(services).size, 4);
  for (const href of services) assert.ok(href.startsWith("services.html#"));
  assert.deepEqual(
    Array.from(document.querySelectorAll(".course-footer a"), (a) =>
      a.getAttribute("href"),
    ),
    [
      "courses.html#tally",
      "courses.html#taxation",
      "sap-training.html#syllabus",
    ],
  );
});

function interactive(file = "index.html", query = "") {
  const dom = new JSDOM(read(file), {
    url: base + file + query,
    runScripts: "outside-only",
  });
  const media = new Map();
  dom.window.matchMedia = (query) => {
    if (!media.has(query)) {
      const target = new dom.window.EventTarget();
      target.matches = query.includes("1080px");
      media.set(query, target);
    }
    return media.get(query);
  };
  dom.window.eval(script);
  return { dom, document: dom.window.document, window: dom.window, media };
}

test("mobile menu opens, closes with Escape and restores focus", () => {
  const { dom, document, window } = interactive();
  const toggle = document.querySelector(".nav-toggle");
  toggle.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.ok(document.querySelector(".site-nav").classList.contains("is-open"));
  document.querySelector(".site-nav a").focus();
  document.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, toggle);
  dom.window.close();
});

test("mobile menu closes for nested link clicks, outside clicks, focus leaving and resizing", () => {
  const { dom, document, window, media } = interactive();
  const toggle = document.querySelector(".nav-toggle");
  const link = document.querySelector(".site-nav a");
  link.addEventListener("click", (event) => event.preventDefault());
  const icon = document.createElement("span");
  link.append(icon);
  toggle.click();
  icon.click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  document.querySelector("main").click();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  document.querySelector("main").focus();
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  media.get("(max-width: 1080px)").dispatchEvent(new window.Event("change"));
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  dom.window.close();
});

test("SAP enquiry produces a draft link with the correct topic and no automatic submission", () => {
  const { dom, document } = interactive("contact.html", "?topic=sap");
  assert.equal(document.querySelector("#contact-context").hidden, false);
  assert.equal(
    document.querySelector("#contact-topic").textContent,
    "SAP S/4HANA FICO training",
  );
  const whatsapp = new URL(document.querySelector("#enquiry-whatsapp").href);
  assert.equal(whatsapp.hostname, "wa.me");
  assert.equal(whatsapp.pathname, "/919353791842");
  assert.equal(
    whatsapp.searchParams.get("text"),
    "Hello RC Fintax, I would like to enquire about SAP S/4HANA FICO training.",
  );
  dom.window.close();
});

test("unknown enquiry topics cannot insert content or change destinations", () => {
  const { dom, document } = interactive(
    "contact.html",
    "?topic=" + encodeURIComponent("<img src=x onerror=alert(1)>"),
  );
  assert.equal(document.querySelector("#contact-context").hidden, true);
  assert.equal(document.querySelector("#contact-topic").textContent, "");
  assert.equal(
    document.querySelector("#enquiry-whatsapp").href,
    "https://wa.me/919353791842",
  );
  dom.window.close();
});

test("service tabs select one panel and preserve each service enquiry link", () => {
  const { dom, document, window } = interactive("services.html");
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  assert.equal(tabs.length, 4);
  assert.equal(
    document.querySelector('[aria-selected="true"]').id,
    "tab-accounting-tax",
  );
  for (const tab of tabs) {
    tab.click();
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    assert.equal(
      document.querySelectorAll(".service-panel:not([hidden])").length,
      1,
    );
    assert.equal(panel.hidden, false);
    assert.equal(tab.getAttribute("aria-selected"), "true");
    assert.equal(tab.tabIndex, 0);
    assert.equal(panel.getAttribute("aria-labelledby"), tab.id);
    assert.equal(window.location.hash, "#" + panel.id);
    assert.equal(
      panel.querySelector(".button").getAttribute("href"),
      "contact.html?topic=" + panel.id,
    );
  }
  dom.window.close();
});

test("service deep links open the right tab and unknown fragments use the default", () => {
  for (const id of [
    "accounting-tax",
    "compliance",
    "finance",
    "digital-statutory",
    "unknown",
  ]) {
    const { dom, document } = interactive("services.html", "#" + id);
    const expected = id === "unknown" ? "accounting-tax" : id;
    assert.equal(
      document.querySelector(".service-panel:not([hidden])").id,
      expected,
    );
    assert.equal(
      document.querySelector('[aria-selected="true"]').id,
      "tab-" + expected,
    );
    dom.window.close();
  }
});

test("service tabs support arrow keys, Home, End and roving keyboard focus", () => {
  const { dom, document, window } = interactive("services.html");
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const press = (index, key, expected) => {
    tabs[index].dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(document.activeElement, tabs[expected]);
    assert.equal(tabs[expected].getAttribute("aria-selected"), "true");
    assert.equal(tabs.filter((tab) => tab.tabIndex === 0).length, 1);
  };
  press(0, "ArrowLeft", 3);
  press(3, "ArrowRight", 0);
  press(0, "End", 3);
  press(3, "Home", 0);
  press(0, "ArrowRight", 1);
  dom.window.close();
});

test("browser history and hash changes restore the selected service", async () => {
  const { dom, document, window } = interactive(
    "services.html",
    "#accounting-tax",
  );
  const tabs = document.querySelectorAll('[role="tab"]');
  tabs[1].click();
  tabs[2].click();
  document.querySelector("#finance .button").focus();
  const changed = (event) =>
    new Promise((resolve) =>
      window.addEventListener(event, resolve, { once: true }),
    );
  let navigation = changed("popstate");
  window.history.back();
  await navigation;
  assert.equal(document.activeElement, tabs[1]);
  assert.equal(
    document.querySelector(".service-panel:not([hidden])").id,
    "compliance",
  );
  navigation = changed("popstate");
  window.history.forward();
  await navigation;
  assert.equal(
    document.querySelector(".service-panel:not([hidden])").id,
    "finance",
  );
  navigation = changed("hashchange");
  window.location.hash = "#digital-statutory";
  await navigation;
  assert.equal(
    document.querySelector(".service-panel:not([hidden])").id,
    "digital-statutory",
  );
  dom.window.close();
});
