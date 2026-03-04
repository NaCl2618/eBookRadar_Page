const NEWSLETTER_INDEX_PATH = 'content/index.json';
const THEME_STORAGE_KEY = 'ebookradar-theme';
const DEFAULT_THEME = 'light';
const SUPPORTED_THEMES = ['light', 'dark', 'eink'];

// 한국어 주석: 저장된 테마를 안전하게 읽어 초기 테마를 결정한다.
function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && SUPPORTED_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {
    return DEFAULT_THEME;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return DEFAULT_THEME;
}

// 한국어 주석: HTML 루트 속성에 테마를 반영해 전역 CSS 변수를 전환한다.
function applyTheme(theme) {
  const nextTheme = SUPPORTED_THEMES.includes(theme) ? theme : DEFAULT_THEME;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme === 'dark' ? 'dark' : 'light';
  return nextTheme;
}

// 한국어 주석: 헤더에 테마 선택 UI를 동적으로 삽입하고 선택 상태를 저장한다.
function mountThemeControl() {
  const header = document.querySelector('.site-header');
  if (!header || document.getElementById('theme-select')) {
    return;
  }

  const tools = document.createElement('div');
  tools.className = 'header-tools';

  const label = document.createElement('label');
  label.className = 'theme-label';
  label.setAttribute('for', 'theme-select');
  label.textContent = '테마';

  const select = document.createElement('select');
  select.id = 'theme-select';
  select.className = 'theme-select';
  select.setAttribute('aria-label', '테마 선택');

  const options = [
    { value: 'light', text: '라이트' },
    { value: 'dark', text: '다크' },
    { value: 'eink', text: 'e-ink' }
  ];

  options.forEach((option) => {
    const optionNode = document.createElement('option');
    optionNode.value = option.value;
    optionNode.textContent = option.text;
    select.append(optionNode);
  });

  select.value = document.documentElement.dataset.theme || DEFAULT_THEME;
  select.addEventListener('change', (event) => {
    const selectedTheme = applyTheme(event.target.value);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    } catch (error) {
      // 한국어 주석: 저장소 접근 불가 환경(사파리 프라이빗 모드 등)에서는 무시하고 테마만 적용한다.
    }
  });

  tools.append(label, select);
  header.append(tools);
}

function initializeTheme() {
  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);
}

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

// 한국어 주석: 브라우저에 삽입하기 전 위험한 태그/속성/URL 스킴을 제거해 XSS를 완화한다.
function sanitizeHtml(unsafeHtml) {
  if (typeof unsafeHtml !== 'string') {
    return '';
  }

  return unsafeHtml
    .replace(/<\s*(script|iframe|object|embed|link|style|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|link|style|meta)[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(srcdoc)\s*=\s*(['"])[\s\S]*?\2/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*(javascript:|data:)/gi, ' $1=$2#');
}

// 한국어 주석: marked 사용 시 sanitize 후 innerHTML로 렌더링하고, 미사용 시 textContent로 안전 출력한다.
function renderMarkdownContent(contentNode, markdown) {
  if (window.marked) {
    const renderedHtml = window.marked.parse(markdown);
    contentNode.innerHTML = sanitizeHtml(renderedHtml);
    return;
  }

  contentNode.textContent = markdown;
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

    renderMarkdownContent(contentNode, markdown);

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
  initializeTheme();
  mountThemeControl();

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
