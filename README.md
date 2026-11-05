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
