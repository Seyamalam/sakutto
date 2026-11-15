// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { isAlreadyTargetLanguage, languageOf } from '@/dom/detect';

describe('block language', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = '';
  });

  it('keeps a Japanese paragraph when the document language is English', () => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = '<p>これは日本語です</p><p>Read the documentation</p>';
    const [japanese, english] = [...document.querySelectorAll('p')];
    if (!japanese || !english) throw new Error('missing paragraphs');

    expect(languageOf(japanese, 'en')).toBe('ja');
    expect(isAlreadyTargetLanguage(japanese, 'en', 'en')).toBe(false);
    expect(languageOf(english, 'en')).toBe('en');
    expect(isAlreadyTargetLanguage(english, 'en', 'en')).toBe(true);
    expect(isAlreadyTargetLanguage(english, 'ja', 'en')).toBe(false);
  });

  it('keeps an English sentence that only mentions a few kanji', () => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = '<p>By the Edo period, 大坂 (Ōsaka) was the city.</p>';
    const block = document.querySelector('p');
    if (!block) throw new Error('missing paragraph');

    expect(languageOf(block, 'en')).toBe('en');
    expect(isAlreadyTargetLanguage(block, 'ja', 'en')).toBe(false);
  });

  it('skips a block whose own language tag matches the target', () => {
    document.body.innerHTML = '<p lang="ja">これは日本語です</p>';
    const block = document.querySelector('p');
    if (!block) throw new Error('missing paragraph');
    expect(isAlreadyTargetLanguage(block, 'ja', 'en')).toBe(true);
  });

  it('does not treat Japanese text as already Easy Japanese', () => {
    document.documentElement.lang = 'ja';
    document.body.innerHTML = '<p>これは日本語です</p><p>Read the documentation</p>';
    const [japanese, english] = [...document.querySelectorAll('p')];
    if (!japanese || !english) throw new Error('missing paragraphs');

    expect(isAlreadyTargetLanguage(japanese, 'ja-easy', 'ja')).toBe(false);
    expect(isAlreadyTargetLanguage(english, 'ja-easy', 'ja')).toBe(false);
  });
});

describe('nested target-language labels', () => {
  const japaneseLabel = `
    <div class="commentthread_comment_text" id="outer">
      <blockquote class="bb_blockquote" id="quote">
        <div class="bb_quoteauthor" id="label"><b>Name</b> の投稿を引用：</div>
        I've lost faith in the process.
      </blockquote>
      Is it that time of the month already?
    </div>`;

  function elements(): { outer: Element; quote: Element; label: Element } {
    const outer = document.getElementById('outer');
    const quote = document.getElementById('quote');
    const label = document.getElementById('label');
    if (!outer || !quote || !label) throw new Error('missing comment elements');
    return { outer, quote, label };
  }

  beforeEach(() => {
    document.documentElement.lang = 'ja';
    document.body.innerHTML = japaneseLabel;
  });

  it('detects English on the comment and quote, not the nested Japanese label', () => {
    const { outer, quote, label } = elements();

    expect(languageOf(outer, 'ja')).toBeNull();
    expect(isAlreadyTargetLanguage(outer, 'ja', 'ja')).toBe(false);
    expect(languageOf(quote, 'ja')).toBeNull();
    expect(isAlreadyTargetLanguage(quote, 'ja', 'ja')).toBe(false);
    expect(languageOf(label, 'ja')).toBe('ja');
    expect(isAlreadyTargetLanguage(label, 'ja', 'ja')).toBe(true);
  });

  it('keeps an English quote label translatable on an English page', () => {
    document.documentElement.lang = 'en';
    document.body.innerHTML = `
      <div class="commentthread_comment_text" id="outer">
        <blockquote class="bb_blockquote" id="quote">
          <div class="bb_quoteauthor" id="label"><b>Name</b> Originally posted by:</div>
          I've lost faith in the process.
        </blockquote>
        Is it that time of the month already?
      </div>`;
    const { outer, quote, label } = elements();

    for (const block of [outer, quote, label]) {
      expect(isAlreadyTargetLanguage(block, 'ja', 'en')).toBe(false);
    }
    expect(languageOf(label, 'en')).toBe('en');
  });

  it('still detects a Japanese paragraph that carries many English words', () => {
    document.documentElement.lang = 'ja';
    document.body.innerHTML =
      '<p id="mixed">このコメントは Steam の投稿を引用しています。I have lost faith in the process.</p>';
    const block = document.getElementById('mixed');
    if (!block) throw new Error('missing paragraph');

    expect(languageOf(block, 'ja')).toBe('ja');
    expect(isAlreadyTargetLanguage(block, 'ja', 'ja')).toBe(true);
  });
});
