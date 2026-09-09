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
