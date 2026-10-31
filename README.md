# AL MUSHREF — Abaya & Sheila Website

Responsive static website source for AL MUSHREF TAILORING & EMBROIDERY, Dubai.

## Included features
- Abaya and Sheila catalogue with category filters and product details.
- Retail and wholesale enquiry preparation.
- One-tap product WhatsApp enquiries, email and call links.
- Google Maps, Instagram and TikTok links.
- Responsive layouts checked at 12 widths from 320px to 1920px in Chromium.
- Full garment photographs with aligned catalogue buttons.

This is a catalogue and enquiry website. It does not accept payments and does not include an admin panel. Product images and specifications include design references that require business confirmation. Native phone app handoff and physical Apple-device testing remain to be completed.

## Share the code on GitHub
1. Create a repository called al-mushref-website in your own GitHub account.
2. Choose Public if anyone should see the source, or Private and invite your friend as a collaborator.
3. Extract this ZIP and upload its contents. Keep the assets folder intact.
4. Commit the files. Share the repository URL with your friend.
5. Future commits show your project changes in GitHub history.

No GitHub repository or new public website is created by downloading this package.

## Hosting the shop
Use the current website hosting service or other hosting suitable for business websites. A domain bought from e& / Etisalat can be connected to the selected host.

GitHub Pages is not allowed to be used to run an online business, an e-commerce site, or a site primarily directed at facilitating commercial transactions. Do not use GitHub Pages as the live shop host.
Official source: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Files
- index.html: website sections and contact links.
- style.css: phone, tablet and desktop presentation.
- app.js: catalogue filtering, product details and enquiry messages.
- catalogue.json: product names, codes, photographs and optional AED prices.
- assets/: product images and Google Maps icon.

## Product changes
Edit catalogue.json to change a product. retailPrice and wholesalePrice accept a nonnegative AED amount or null for enquiry pricing. Set active to false to hide an item. Product image filenames refer to assets/. Add new images to that folder and reference their filenames in the catalogue. Maintain unique product IDs. Product descriptions, sizes, fabrics, availability and prices must be confirmed by the business.

To preview locally, serve this folder through a static HTTP server. Opening index.html directly as a file will not load catalogue.json in browsers that restrict local fetch requests.

## Ownership
Code, brand artwork and product imagery are supplied for the AL MUSHREF project. This package does not select an open-source licence on the business owner's behalf.
