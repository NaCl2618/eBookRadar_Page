#!/usr/bin/env node

// 한국어 주석: content 디렉터리의 마크다운 파일을 스캔해 index.json을 자동 생성/갱신한다.
const fs = require('node:fs/promises');
const path = require('node:path');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const INDEX_PATH = path.join(CONTENT_DIR, 'index.json');
const FILE_NAME_PATTERN = /^(\d{4}-\d{2}-\d{2})\.md$/;
const HEADING_PATTERN = /^#\s+(.+)$/m;

// 한국어 주석: 마크다운 본문에서 첫 번째 H1 제목을 추출한다.
function parseTitleFromMarkdown(markdownText, fallbackTitle) {
  const headingMatch = markdownText.match(HEADING_PATTERN);
  if (headingMatch && headingMatch[1] && headingMatch[1].trim()) {
    return headingMatch[1].trim();
  }
  return fallbackTitle;
}

// 한국어 주석: 기존 index.json에서 날짜별 제목을 읽어 제목이 없는 경우 보존용으로 활용한다.
async function readExistingTitleMap() {
  try {
    const raw = await fs.readFile(INDEX_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Map();
    }

    const titleMap = new Map();
    for (const item of parsed) {
      if (item && typeof item.date === 'string' && typeof item.title === 'string') {
        titleMap.set(item.date, item.title);
      }
    }
    return titleMap;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return new Map();
    }

    console.warn('[warn] 기존 index.json 파싱에 실패하여 제목 보존 없이 재생성합니다.');
    return new Map();
  }
}

// 한국어 주석: 파일명 규칙(YYYY-MM-DD.md)을 만족하는 마크다운만 추려 정렬한다.
async function listMarkdownFiles() {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && FILE_NAME_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  return files;
}

// 한국어 주석: 마크다운 파일 목록으로 index 배열을 생성한다.
async function buildIndexItems(markdownFiles, existingTitleMap) {
  const items = [];

  for (const fileName of markdownFiles) {
    const date = fileName.replace('.md', '');
    const filePath = path.join(CONTENT_DIR, fileName);
    const markdownText = await fs.readFile(filePath, 'utf8');
    const fallbackTitle = existingTitleMap.get(date) || `eBookRadar Daily - ${date}`;
    const title = parseTitleFromMarkdown(markdownText, fallbackTitle);

    items.push({
      date,
      title,
      file: `content/${fileName}`
    });
  }

  return items;
}

// 한국어 주석: index.json 파일을 변경 사항이 있을 때만 덮어써 불필요한 커밋을 방지한다.
async function writeIndexIfChanged(nextJsonText) {
  let currentJsonText = '';

  try {
    currentJsonText = await fs.readFile(INDEX_PATH, 'utf8');
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (currentJsonText === nextJsonText) {
    console.log('[skip] content/index.json은 이미 최신 상태입니다.');
    return;
  }

  await fs.writeFile(INDEX_PATH, nextJsonText, 'utf8');
  console.log('[ok] content/index.json을 갱신했습니다.');
}

async function main() {
  const existingTitleMap = await readExistingTitleMap();
  const markdownFiles = await listMarkdownFiles();
  const items = await buildIndexItems(markdownFiles, existingTitleMap);
  const nextJsonText = `${JSON.stringify(items, null, 2)}\n`;

  await writeIndexIfChanged(nextJsonText);
  console.log(`[done] 총 ${items.length}개 뉴스레터 항목을 처리했습니다.`);
}

main().catch((error) => {
  console.error('[error] index.json 갱신 실패:', error);
  process.exitCode = 1;
});
