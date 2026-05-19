import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'docs/index.html');
const scriptPath = path.join(repoRoot, 'docs/preview-tabs.js');

function readLandingPage() {
  return fs.readFileSync(htmlPath, 'utf8');
}

function loadPreviewTabs() {
  expect(fs.existsSync(scriptPath), 'docs/preview-tabs.js should exist').toBe(true);

  if (!fs.existsSync(scriptPath)) {
    return undefined;
  }

  const require = createRequire(import.meta.url);
  delete require.cache[require.resolve(scriptPath)];
  return require(scriptPath);
}

class FakeClassList {
  constructor(className = '') {
    this.classes = new Set(className.split(/\s+/).filter(Boolean));
  }

  add(className) {
    this.classes.add(className);
  }

  remove(className) {
    this.classes.delete(className);
  }

  contains(className) {
    return this.classes.has(className);
  }
}

class FakeElement {
  constructor({ className = '', dataset = {}, textContent = '' } = {}) {
    this.attributes = {};
    this.children = new Map();
    this.classList = new FakeClassList(className);
    this.dataset = dataset;
    this.listeners = new Map();
    this.tabIndex = 0;
    this.textContent = textContent;
  }

  addEventListener(eventName, handler) {
    this.listeners.set(eventName, handler);
  }

  click() {
    this.listeners.get('click')?.({ currentTarget: this });
  }

  focus() {
    this.focused = true;
  }

  querySelector(selector) {
    return this.children.get(selector) ?? null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

function createPreviewDocument() {
  const buttons = ['plan', 'knowledge', 'export', 'models'].map(
    (key, index) =>
      new FakeElement({
        className: index === 0 ? 'active' : '',
        dataset: { previewTab: key },
      }),
  );
  buttons[0].setAttribute('aria-selected', 'true');

  const elements = {
    '[data-preview-status]': new FakeElement(),
    '[data-preview-title]': new FakeElement(),
    '[data-preview-prompt]': new FakeElement(),
  };

  const steps = [0, 1, 2].map(() => {
    const step = new FakeElement();
    step.children.set('[data-preview-step-index]', new FakeElement());
    step.children.set('[data-preview-step-title]', new FakeElement());
    step.children.set('[data-preview-step-body]', new FakeElement());
    return step;
  });

  const contexts = [0, 1].map(() => {
    const context = new FakeElement();
    context.children.set('[data-preview-context-label]', new FakeElement());
    context.children.set('[data-preview-context-title]', new FakeElement());
    context.children.set('[data-preview-context-body]', new FakeElement());
    return context;
  });

  return {
    buttons,
    contexts,
    elements,
    querySelector(selector) {
      return elements[selector] ?? null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-preview-tab]') {
        return buttons;
      }
      if (selector === '[data-preview-step]') {
        return steps;
      }
      if (selector === '[data-preview-context]') {
        return contexts;
      }
      return [];
    },
    steps,
  };
}

describe('landing page preview tabs', () => {
  it('renders the top preview labels as interactive tab buttons', () => {
    const html = readLandingPage();

    expect(html).toContain('src="preview-tabs.js"');
    expect(html).not.toContain('class="mode-switcher" aria-hidden="true"');

    const tabKeys = [...html.matchAll(/<button[^>]+data-preview-tab="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(tabKeys).toEqual(['plan', 'knowledge', 'export', 'models']);
  });

  it('switches the mockup content when a preview tab is clicked', () => {
    const previewTabs = loadPreviewTabs();

    if (!previewTabs) {
      return;
    }

    const fakeDocument = createPreviewDocument();
    previewTabs.initPreviewTabs(fakeDocument);
    fakeDocument.buttons[1].click();

    expect(fakeDocument.elements['[data-preview-title]'].textContent).toBe(
      previewTabs.PREVIEW_TABS.knowledge.title,
    );
    expect(fakeDocument.buttons[1].classList.contains('active')).toBe(true);
    expect(fakeDocument.buttons[1].attributes['aria-selected']).toBe('true');
    expect(fakeDocument.buttons[0].classList.contains('active')).toBe(false);
    expect(fakeDocument.steps[0].querySelector('[data-preview-step-title]').textContent).toBe(
      previewTabs.PREVIEW_TABS.knowledge.steps[0].title,
    );
    expect(fakeDocument.contexts[0].querySelector('[data-preview-context-title]').textContent).toBe(
      previewTabs.PREVIEW_TABS.knowledge.context[0].title,
    );
  });
});
