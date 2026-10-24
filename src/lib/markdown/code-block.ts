import { defineHastPlugin, type HastNode } from 'satteri';
import { icons, type IconName } from '../icons.generated';

type ElementNode = Extract<HastNode, { type: 'element' }>;

const DEFAULT_LANGUAGE = 'text';

function iconMarkup(name: IconName): string {
  const { body, width, height } = icons[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false">${body}</svg>`;
}

function element(
  tagName: string,
  properties: ElementNode['properties'],
  children: ElementNode['children'],
): ElementNode {
  return { type: 'element', tagName, properties, children };
}

/**
 * The language exactly as written in the fence. Shiki's output carries it as `data-language`;
 * un-highlighted blocks only have the `language-*` class on their `<code>` child.
 */
function languageOf(pre: ElementNode): string {
  const { dataLanguage } = pre.properties;
  if (typeof dataLanguage === 'string' && dataLanguage !== '') return dataLanguage;

  for (const child of pre.children) {
    if (child.type !== 'element' || child.tagName !== 'code') continue;
    const classes = Array.isArray(child.properties.className) ? child.properties.className : [];
    const match = classes.find(
      (name): name is string => typeof name === 'string' && name.startsWith('language-'),
    );
    if (match) return match.slice('language-'.length);
  }
  return DEFAULT_LANGUAGE;
}

function copyButton(): ElementNode {
  return element('button', { type: 'button', className: ['code-copy'], ariaLabel: 'Copy code' }, [
    { type: 'raw', value: iconMarkup('copy') },
    { type: 'raw', value: iconMarkup('check') },
    element('span', { className: ['code-copy__label'] }, [{ type: 'text', value: 'Copy' }]),
  ]);
}

/**
 * Wraps every `<pre>` in `<figure class="code-block">` with a header holding the language label
 * and a copy button. Runs after Astro's Shiki pass, so it receives the highlighted `<pre>`.
 */
export const codeBlockPlugin = defineHastPlugin({
  name: 'code-block',
  element: {
    filter: ['pre'],
    visit(node) {
      const header = element('div', { className: ['code-block__header'], dataPagefindIgnore: '' }, [
        element('span', { className: ['code-block__lang'] }, [
          { type: 'text', value: languageOf(node) },
        ]),
        copyButton(),
      ]);
      return element('figure', { className: ['code-block'] }, [header, node]);
    },
  },
});
