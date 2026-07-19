# Submission Checklist

## Files prepared in this repository

- Extension package source: `extension-dist/`
- Upload ZIP: `X-follow-to-list-0.1.9-store.zip`
- Privacy policy: `PRIVACY.md`
- Store copy and permission explanations: `store-listing/STORE_LISTING.md`
- Private certification notes: `store-listing/REVIEW_NOTES.md`
- Chrome store icon: `store-assets/store-icon-128.png`
- Edge listing logo: `store-assets/edge-logo-300.png`
- Small promotional tile: `store-assets/promo-small-440x280.png`
- Store screenshots: `store-assets/screenshots/*.png`

## Owner-only actions before submission

- [ ] Push this release so the privacy policy URL is publicly accessible.
- [ ] Confirm the public GitHub repository and Issues page are available.
- [ ] Register and verify the Chrome Web Store developer account, including two-step verification and the registration fee.
- [ ] Register the Microsoft Edge developer account in Partner Center.
- [ ] Enter a monitored developer contact email in each store dashboard.
- [ ] If a reviewer requires an X login, create a dedicated low-risk test account and provide its credentials only through the store's secure reviewer field.
- [ ] Upload the ZIP without wrapping it in an extra parent folder; `manifest.json` must be at the ZIP root.
- [ ] Add English and Simplified Chinese listings using `STORE_LISTING.md`.
- [ ] Upload the matching icon, promotional tile, and screenshots from `store-assets/`.
- [ ] Copy the relevant text from `REVIEW_NOTES.md` into the private reviewer-notes field.
- [ ] Select an initial private, hidden, or unlisted distribution if you want to verify the installed store build before making it public.
- [ ] Submit for review and monitor the developer contact email for reviewer questions.

## Update rule

Every future package upload must use a version greater than `0.1.9` in `extension-dist/manifest.json` and must include the complete extension package, not only changed files.
