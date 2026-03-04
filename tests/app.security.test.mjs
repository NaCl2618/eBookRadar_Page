import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadAppContext() {
  const source = fs.readFileSync('assets/app.js', 'utf8');
  // 한국어 주석: 브라우저 전역을 최소 목킹해 app.js를 실행 가능한 컨텍스트로 만든다.
  const context = {
    console,
    window: {
      localStorage: {
        getItem: () => null,
        setItem: () => {}
      },
      matchMedia: () => ({ matches: false }),
      location: { search: '' }
    },
    document: {
      documentElement: {
        dataset: {},
        style: {}
      },
      querySelector: () => null,
      getElementById: () => null,
      addEventListener: () => {},
      body: { dataset: {} }
    },
    URLSearchParams
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('sanitizeHtml 함수가 존재해야 한다', () => {
  const context = loadAppContext();
  assert.equal(typeof context.sanitizeHtml, 'function');
});

test('renderMarkdownContent fallback은 innerHTML이 아닌 textContent를 사용해야 한다', () => {
  const context = loadAppContext();

  const contentNode = {
    innerHTML: '',
    textContent: ''
  };

  context.window.marked = null;
  context.renderMarkdownContent(contentNode, '# 제목\n<script>alert(1)</script>');

  assert.equal(contentNode.textContent.includes('<script>alert(1)</script>'), true);
  assert.equal(contentNode.innerHTML, '');
});

test('marked 렌더링 결과에서 script/on* 속성/javascript: 링크를 제거해야 한다', () => {
  const context = loadAppContext();

  const contentNode = {
    innerHTML: '',
    textContent: ''
  };

  context.window.marked = {
    parse: () => '<h1>안전</h1><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(2)">링크</a>'
  };

  context.renderMarkdownContent(contentNode, '# hello');

  assert.equal(/<script/i.test(contentNode.innerHTML), false);
  assert.equal(/onclick\s*=/.test(contentNode.innerHTML), false);
  assert.equal(/javascript:/i.test(contentNode.innerHTML), false);
});
