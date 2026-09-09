# RC Fintax Services

Modern static website for RC Fintax Services, designed to deploy from the repository root on GitHub Pages.

## Files

- `index.html` - homepage
- `services.html` - finance service details
- `courses.html` - Accounting, Tally, GST, TDS and Income Tax courses
- `sap-training.html` - dedicated SAP Training page
- `about.html` - business overview
- `contact.html` - enquiry and contact details
- `styles.css` - responsive styling
- `script.js` - mobile navigation toggle
- `assets/hero-training.jpg` - original hero image asset
- `assets/social-preview.png` - branded WhatsApp and social sharing image
- `assets/favicon.svg` - RC monogram browser icon
- `sitemap.xml` - public page directory for search engines
- `.nojekyll` - keeps GitHub Pages from processing the site with Jekyll

## GitHub Pages

The site can be published from the `main` branch and repository root.

The site remains static and requires no build step. Open `index.html` locally to preview it. The development dependencies are used only for checks, not by the website.

Canonical, Open Graph and sitemap URLs currently use `https://pruthvirajksuresh.github.io/rcfintax/`. Update them together if the repository URL or domain changes. Social crawlers can fetch the new preview image only after the site is published; previews of previously shared URLs may remain cached.

## Checks

Run `npm ci` followed by `npm test`. The tests check local links and anchors, sharing metadata, menu interaction, focus restoration and enquiry topics.

Desktop and mobile layout checks are separate browser checks. The navigation remains visible without JavaScript; with JavaScript enabled it becomes a disclosure menu on smaller screens. Escape closes the menu and returns focus to its button.

## Content Awaiting Confirmation

- SAP fee, duration and software access costs: the references and former detail-page prices disagree. The site now asks visitors to enquire rather than advertising unconfirmed prices.
- Office address: the original reference and existing site use #1541/A1, Vidyanagar 2nd Cross, Mandya - 571401. The later design reference shows another address. The existing address has been preserved pending confirmation; Maps links search for that address and are not a verified business listing.
- Trainer name, qualifications and experience: these have not been supplied. The About page describes the training approach without inventing a personal biography.
- Genuine office/training photos and approved testimonials: none have been supplied. The existing hero is an illustration, not evidence of the premises. No testimonials, review ratings, client counts or experience statistics have been invented.

## Sharing Artwork

`assets/social-preview.png` was generated with the built-in image tool. Brief: a restrained white, navy and gold RC Fintax Services sharing card, featuring “Accounting, Tax & SAP Training”, “Tally | GST | TDS | Income Tax | S/4HANA FICO”, and “Serving Karnataka”; no people, premises, prices or accreditation claims. The location line was subsequently edited to reflect statewide coverage while preserving the other artwork.

Service-area messaging and metadata describe coverage across Karnataka. Mandya is retained only in the physical office address and Maps search, not as a limit on the service area.
