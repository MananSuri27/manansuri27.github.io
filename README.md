# manansuri.com

Source for [manansuri.com](https://manansuri.com), the personal site of Manan Suri.
Built with [Jekyll](https://jekyllrb.com/) on the [al-folio](https://github.com/alshedivat/al-folio) theme and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `master`.

## Where things live

| What | Where |
|---|---|
| Homepage bio, sections shown | `_pages/about.md` (front matter toggles `news`, `press`, `service`, `selected_papers`) |
| Publications | `_bibliography/papers.bib` (fields `abbr`, `html`, `pdf`, `code`, `website`, `blog`, `selected` drive badges/buttons) |
| Venue badges | `_data/venues.yml` |
| News | one file per item in `_news/` |
| Press | `_data/press.yml` |
| Service | `_data/service.yml` |
| Blog posts | `_posts/YYYY-MM-DD-slug.md`, images under `assets/img/blog/` |
| CV | `/cv/` redirects to the PDF named in `_layouts/redirected.html` |
| Site metadata, social IDs, SEO | `_config.yml` |

## Local build

Docker is the easiest way (no local Ruby needed):

```bash
docker run --rm -v "$PWD":/srv/jekyll -w /srv/jekyll -p 8080:8080 amirpourmand/al-folio \
  bash -c "rm -f Gemfile.lock; bundle install && bundle exec jekyll serve --host 0.0.0.0 --port 8080"
```

Then open http://localhost:8080.
