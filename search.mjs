/** Search helpers shared by the browser and dependency-free Node tests. */
export function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function filterPapers(papers, query = '', category = 'all', tag = 'all') {
  const tokens = normalize(query).split(' ').filter(Boolean);
  return papers.filter(paper => {
    if (category !== 'all' && paper.category !== category) return false;
    if (tag !== 'all' && !paper.tags.some(value => normalize(value) === normalize(tag))) return false;
    const searchable = normalize([paper.title, paper.abstract, paper.relevanceNote, paper.relevanceNoteZh, ...paper.tags].join(' '));
    return tokens.every(token => searchable.includes(token));
  });
}
export function validateDataset(dataset) {
  if (dataset?.metadata?.conference !== 'ICLR 2027' || !Array.isArray(dataset.papers)) throw new Error('Invalid ICLR 2027 dataset');
  const ids = new Set(), urls = new Set();
  for (const paper of dataset.papers) {
    if (!paper.id || !paper.title?.trim()) throw new Error('Missing paper ID or title');
    if (ids.has(paper.id)) throw new Error(`Duplicate ID: ${paper.id}`);
    ids.add(paper.id);
    let url;
    try { url = new URL(paper.paperUrl); } catch { throw new Error(`Invalid paper URL: ${paper.id}`); }
    if (url.protocol !== 'https:' || url.hostname !== 'openreview.net' || url.pathname !== '/forum' || !url.searchParams.get('id') || url.username || url.password) throw new Error(`Noncanonical paper URL: ${paper.id}`);
    if (urls.has(paper.paperUrl)) throw new Error(`Duplicate URL: ${paper.id}`);
    urls.add(paper.paperUrl);
    if (!['core','adjacent'].includes(paper.category) || !Array.isArray(paper.tags) || typeof paper.relevanceNote !== 'string') throw new Error(`Invalid relevance metadata: ${paper.id}`);
  }
  return dataset;
}
export function verificationLabel(paper) {
  return paper.verifiedConference === true ? 'OpenReview 已核验' : '原站待核验';
}
