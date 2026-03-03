const NEWSLETTER_INDEX_PATH = 'content/index.json';

async function loadNewsletterIndex() {
  const response = await fetch(NEWSLETTER_INDEX_PATH);
  if (!response.ok) {
    throw new Error('인덱스 파일을 불러오지 못했습니다.');
  }

  const items = await response.json();
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

function createNewsletterItem(entry) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `newsletter.html?date=${encodeURIComponent(entry.date)}`;

  const title = document.createElement('span');
  title.textContent = entry.title;

  const date = document.createElement('span');
  date.className = 'news-date';
  date.textContent = entry.date;

  link.append(title, date);
  item.append(link);
  return item;
}

function getDateParam() {
  const params = new URLSearchParams(window.location.search);
  return params.get('date');
}

async function renderHome() {
  const list = document.getElementById('recent-newsletters');
  const empty = document.getElementById('recent-empty');

  try {
    const items = await loadNewsletterIndex();
    const recent = items.slice(0, 7);

    if (!recent.length) {
      empty.classList.remove('hidden');
      return;
    }

    recent.forEach((entry) => list.append(createNewsletterItem(entry)));
  } catch (error) {
    empty.textContent = '뉴스레터 목록을 불러오지 못했습니다.';
    empty.classList.remove('hidden');
  }
}

async function renderArchive() {
  const list = document.getElementById('all-newsletters');
  const empty = document.getElementById('archive-empty');

  try {
    const items = await loadNewsletterIndex();

    if (!items.length) {
      empty.classList.remove('hidden');
      return;
    }

    items.forEach((entry) => list.append(createNewsletterItem(entry)));
  } catch (error) {
    empty.textContent = '뉴스레터 목록을 불러오지 못했습니다.';
    empty.classList.remove('hidden');
  }
}

function setPagerLink(anchor, entry, label) {
  if (!entry) {
    anchor.classList.add('is-disabled');
    anchor.href = '#';
    anchor.setAttribute('aria-label', `${label} 없음`);
    return;
  }

  anchor.classList.remove('is-disabled');
  anchor.href = `newsletter.html?date=${encodeURIComponent(entry.date)}`;
  anchor.setAttribute('aria-label', `${label} ${entry.date}`);
}

function parseTitleFromMarkdown(markdown, fallback) {
  const firstHeading = markdown.match(/^#\s+(.+)$/m);
  if (firstHeading?.[1]) {
    return firstHeading[1].trim();
  }
  return fallback;
}

async function renderDetail() {
  const titleNode = document.getElementById('newsletter-title');
  const dateNode = document.getElementById('newsletter-date');
  const contentNode = document.getElementById('newsletter-content');
  const errorNode = document.getElementById('detail-error');
  const prevLink = document.getElementById('prev-link');
  const nextLink = document.getElementById('next-link');

  try {
    const dateParam = getDateParam();
    if (!dateParam) {
      throw new Error('조회할 날짜가 없습니다.');
    }

    const items = await loadNewsletterIndex();
    const currentIndex = items.findIndex((entry) => entry.date === dateParam);

    if (currentIndex === -1) {
      throw new Error('해당 날짜 뉴스레터를 찾지 못했습니다.');
    }

    const current = items[currentIndex];
    const mdResponse = await fetch(current.file);

    if (!mdResponse.ok) {
      throw new Error('마크다운 파일을 불러오지 못했습니다.');
    }

    const markdown = await mdResponse.text();
    const computedTitle = parseTitleFromMarkdown(markdown, current.title || current.date);

    titleNode.textContent = computedTitle;
    document.title = `${computedTitle} | eBookRadar`;
    dateNode.textContent = current.date;

    if (window.marked) {
      contentNode.innerHTML = marked.parse(markdown);
    } else {
      contentNode.innerHTML = markdown;
    }

    const older = items[currentIndex + 1] || null;
    const newer = items[currentIndex - 1] || null;
    setPagerLink(prevLink, older, '이전 뉴스레터');
    setPagerLink(nextLink, newer, '다음 뉴스레터');
  } catch (error) {
    errorNode.textContent = error.message;
    errorNode.classList.remove('hidden');
    titleNode.textContent = '뉴스레터를 불러올 수 없습니다.';
    dateNode.textContent = '';
    contentNode.innerHTML = '';
    setPagerLink(prevLink, null, '이전 뉴스레터');
    setPagerLink(nextLink, null, '다음 뉴스레터');
  }
}

function init() {
  const page = document.body.dataset.page;

  if (page === 'home') {
    renderHome();
  } else if (page === 'archive') {
    renderArchive();
  } else if (page === 'detail') {
    renderDetail();
  }
}

document.addEventListener('DOMContentLoaded', init);
