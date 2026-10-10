import { filterPapers, validateDataset, verificationLabel, normalize } from './search.mjs';
const $ = id => document.getElementById(id);
const PAGE_SIZE = 30;
const categoryLabels = { core: '核心相关', adjacent: '拓展相关' };
const state = { papers: [], query: '', category: 'all', tag: 'all', sort: 'relevance', shown: PAGE_SIZE };
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function externalLink(text, href) {
  const link = element('a', '', text);
  const url = new URL(href);
  if (url.protocol !== 'https:') throw new Error('Unsafe source URL');
  link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}
function card(paper, index) {
  const article = element('article', 'paper-card');
  article.append(element('span', 'paper-index', String(index + 1).padStart(2, '0')));
  const content = element('div', 'paper-content');
  const heading = element('h3');
  heading.append(externalLink(paper.title, paper.paperUrl)); content.append(heading);
  const labels = element('div', 'card-labels');
  labels.append(element('span', `relevance ${paper.category}`, categoryLabels[paper.category]));
  const verification = element('span', `verification ${paper.verifiedConference === true ? 'verified' : 'pending'}`, verificationLabel(paper));
  verification.title = paper.verifiedConference === true ? '已对照 OpenReview 核验标题与会议信息；不代表录用。' : '已读取 AcceptOdds 记录及其论文链接；原始会议信息尚待独立核验。';
  labels.append(verification);
  for (const tag of paper.tags) labels.append(element('span', 'tag', tag));
  content.append(labels, element('p', 'relevance-note', paper.relevanceNoteZh || paper.relevanceNote));
  const bottom = element('div', 'card-bottom');
  if (paper.abstract) {
    const details = element('details', 'abstract');
    details.append(element('summary', '', '展开摘要简述'), element('p', '', paper.abstract));
    bottom.append(details);
  }
  const links = element('div', 'paper-links');
  links.append(externalLink('阅读论文 ↗', paper.paperUrl));
  if (paper.sourceUrl && paper.sourceUrl !== paper.paperUrl) links.append(externalLink('来源 ↗', paper.sourceUrl));
  bottom.append(links); content.append(bottom); article.append(content);
  return article;
}
function updateLocation() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.category !== 'all') params.set('category', state.category);
  if (state.tag !== 'all') params.set('tag', state.tag);
  if (state.sort !== 'relevance') params.set('sort', state.sort);
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? '?' + query : ''}${location.hash}`);
}
function render() {
  let matches = filterPapers(state.papers, state.query, state.category, state.tag);
  matches.sort((a,b) => state.sort === 'relevance' ? (a.category === b.category ? a.title.localeCompare(b.title,'en') : a.category === 'core' ? -1 : 1) : a.title.localeCompare(b.title,'en'));
  const visible = matches.slice(0,state.shown);
  $('papers').replaceChildren(...visible.map(card));
  $('result-count').textContent = `找到 ${matches.length} 篇论文${matches.length > visible.length ? ` · 当前显示 ${visible.length} 篇` : ''}`;
  $('clear-search').hidden = !state.query;
  $('empty').hidden = matches.length !== 0;
  $('load-more').hidden = matches.length <= visible.length;
  $('load-more').textContent = `查看更多论文 · 剩余 ${Math.max(0,matches.length-visible.length)} 篇`;
  if (state.papers.length === 0) {
    $('empty-title').textContent = '暂无已核实的论文记录';
    $('empty-description').textContent = '当前数据集为空，请查看下方检索范围与限制说明。';
    $('reset-filters').hidden = true;
  }
  document.querySelectorAll('[data-category]').forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  updateLocation();
}
function reset() {
  state.query='';state.category='all';state.tag='all';state.sort='relevance';state.shown=PAGE_SIZE;
  $('search').value='';$('tag').value='all';$('sort').value='relevance';render();$('search').focus();
}
async function start() {
  const response = await fetch(new URL('./data/papers.json',import.meta.url));
  if (!response.ok) throw new Error(`Dataset HTTP ${response.status}`);
  const { papers, metadata } = validateDataset(await response.json());
  state.papers=papers;
  const params=new URLSearchParams(location.search);
  state.query=params.get('q') || '';
  const category=params.get('category');if(['core','adjacent'].includes(category)) state.category=category;
  if(params.get('sort')==='title') state.sort='title';
  const tags=[...new Map(papers.flatMap(paper=>paper.tags).map(tag=>[normalize(tag),tag])).values()].sort((a,b)=>a.localeCompare(b,'en'));
  for(const tag of tags){const option=element('option','',tag);option.value=tag;$('tag').append(option);}
  if(tags.includes(params.get('tag'))) state.tag=params.get('tag');
  $('search').value=state.query;$('tag').value=state.tag;$('sort').value=state.sort;
  $('total-count').textContent=String(papers.length);
  $('verification-count').textContent=`其中 ${papers.filter(p=>p.verifiedConference===true).length} 篇已对照 OpenReview 核验标题与会议信息`;$('all-count').textContent=String(papers.length);
  for(const category of ['core','adjacent']) $(`${category}-count`).textContent=String(papers.filter(p=>p.category===category).length);
  const date=new Date(metadata.retrievedAt);
  $('updated').textContent=Number.isNaN(date.valueOf())?'更新日期未提供':`检索于 ${date.toISOString().slice(0,10)} · UTC`;
  $('coverage').textContent=metadata.coverage || '公开来源中的 ICLR 2027 world model 相关投稿。';
  $('limitations').textContent=Array.isArray(metadata.limitations)?metadata.limitations.join(' '):(metadata.limitations || '该目录为检索快照，可能有遗漏，尚不代表完整投稿清单。');
  if(Array.isArray(metadata.sources) && metadata.sources.length){
    const links=metadata.sources.filter(s=>typeof s?.url==='string'&&s.url.startsWith('https://')).map(s=>externalLink(`${s.label || s.name || s.title || new URL(s.url).hostname} ↗`,s.url));
    if(links.length) $('source-links').replaceChildren(...links);
  }
  $('search').addEventListener('input',event=>{state.query=event.target.value;state.shown=PAGE_SIZE;render();});
  $('search-form').addEventListener('submit',event=>event.preventDefault());
  $('clear-search').addEventListener('click',()=>{state.query='';state.shown=PAGE_SIZE;$('search').value='';render();$('search').focus();});
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{state.category=button.dataset.category;state.shown=PAGE_SIZE;render();}));
  $('tag').addEventListener('change',event=>{state.tag=event.target.value;state.shown=PAGE_SIZE;render();});
  $('sort').addEventListener('change',event=>{state.sort=event.target.value;render();});
  $('reset-filters').addEventListener('click',reset);
  $('load-more').addEventListener('click',()=>{state.shown+=PAGE_SIZE;render();});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();$('search').focus();}if(event.key==='Escape'&&document.activeElement===$('search')){$('clear-search').click();}});
  render();
}
start().catch(error=>{
  console.error('Could not load paper index',error);
  $('result-count').textContent='论文数据加载失败';$('empty').hidden=false;$('reset-filters').hidden=true;
  $('empty-title').textContent='暂时无法读取论文数据';$('empty-description').textContent='请刷新页面重试，或从下方链接下载 JSON 数据。';
  $('coverage').textContent='数据暂不可用，检索范围与更新日期尚未读取。';
});
