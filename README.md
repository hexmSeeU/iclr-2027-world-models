# World Model Papers · ICLR 2027

A searchable reading index for world-model-related ICLR 2027 submissions, discovered through [AcceptOdds](https://acceptodds.com/) and checked against canonical OpenReview records.

## What this is

A manually screened, non-exhaustive snapshot of public submissions. Inclusion is **not acceptance**, and the site does not reproduce or endorse acceptance probabilities. Titles and canonical paper links remain prominent. Relevance notes and concise abstract summaries are editorial aids; consult each original paper for its full claims.

The current retrieval date, coverage and limitations are in `data/papers.json` and shown on the website.

## Features

- Search across paper titles, concise abstract summaries, tags and Chinese relevance notes
- Filter core / adjacent relevance and research topics
- Case-insensitive, Unicode-normalized, multi-keyword matching
- Shareable search URLs and JSON download
- Responsive, keyboard-accessible interface; no backend, account, analytics or build dependencies

## Local preview and checks

Requires Python 3 to serve files and Node.js 20+ to run tests.

```sh
python3 -m http.server 8080
node --test tests/*.test.mjs
```

Open `http://localhost:8080`. The site uses ES modules and fetch, so serve it over HTTP rather than opening `index.html` as a local file.

## Update the collection

Edit `data/papers.json`, keeping the top-level `metadata` and `papers` objects. Each entry contains:

- `id`: stable source identifier
- `title`: paper title, verified against the primary record
- `paperUrl`: canonical `https://openreview.net/forum?id=...` URL
- `abstract`: short, paraphrased summary, not a full copied abstract
- `category`: `core` or `adjacent`
- `tags`: research topic strings
- `relevanceNote`: a short explanation for inclusion
- `status`: submission status as observed; never infer acceptance
- `sourceUrl`: discovery-source record

Record the retrieval date, screening method and any limitations in `metadata`. Avoid private information and fabricated placeholders. Run the tests before publishing a change.

## Hosting

Static GitHub Pages deployment from the `main` branch root. No paid services or custom build artifacts are required.

## Attribution

Paper titles, links and research claims belong to their respective authors and sources. This independent reading directory is not affiliated with ICLR, OpenReview or AcceptOdds.
