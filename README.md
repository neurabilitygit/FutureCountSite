# FutureCount

The public website for FutureCount Holdings LLC, led by Eric Bass.

## Pages

- Home: why Eric created FutureCount, owner decisions and selected experience.
- How I work: Business Diagnostic, custom strategy and implementation.
- About Eric: experience, current CFO roles and public career sources.
- Talk with Eric: the existing 30-minute SimplyMeet booking link.
- Privacy notice, website terms and accessibility statement.

Legacy page addresses redirect to relevant current pages. A custom 404 page helps visitors return to the site.

## Deployment

GitHub Pages serves the root of `main`. `CNAME` retains `futurecountllc.com` and `.nojekyll` enables the buildless static site. No package installation or build step is required. Do not copy working drafts, screenshots or private notes into the repository.

## Quality checks

Run `python3 scripts/check_site.py` and `node --check assets/navigation.js` before publishing. The GitHub Actions quality workflow repeats those checks on pushes and pull requests. Browser checks should include desktop and mobile layouts, menu keyboard behavior, old-page redirects and the contact-to-SimplyMeet flow. Do not create a real appointment merely to test navigation.

## Assets and privacy

Manrope is self-hosted; its OFL license is included. Images are supplied by the site owner and optimized for delivery. This site has no contact form, analytics, advertising scripts or browser storage. Scheduling opens SimplyMeet as an external service. Provider processing is described in the privacy notice.

## Recovery

Use Git history to restore a previous release if needed. Prefer a new revert commit over rewriting the branch history. Keep the custom domain configuration when reverting.

## Search discovery

The four primary pages contain descriptive search titles and JSON-LD identifying FutureCount Holdings LLC, Eric Bass and the diagnostic service. The homepage retains the Bing verification tag. Google ownership is verified through the existing domain provider record; preserve that record.

Run `python3 scripts/check_discovery.py` to validate identity and IndexNow configuration. After successful GitHub Pages publication, the IndexNow workflow verifies that the four changed pages and public ownership proof match the deployed commit, then notifies participating search engines of the seven canonical sitemap URLs. The workflow can also be started manually. Receipt of a notification does not guarantee crawling, indexing or inclusion in AI answers. The IndexNow text file is public website-ownership proof, not a private account credential.
