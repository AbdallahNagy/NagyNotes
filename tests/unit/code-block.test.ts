import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vitest';
import { codeBlockPlugin } from '@/lib/markdown/code-block';

const render = (markdown: string) =>
  markdownToHtml(markdown, { hastPlugins: [codeBlockPlugin] }).html;

describe('codeBlockPlugin', () => {
  it('wraps a fenced block in a figure with a header', () => {
    const html = render('```bash\necho hi\n```\n');

    expect(html).toContain('<figure class="code-block">');
    expect(html).toContain('<div class="code-block__header"');
    expect(html).toMatch(/<pre><code class="language-bash">echo hi\n<\/code><\/pre><\/figure>/);
  });

  it('keeps the language label exactly as written', () => {
    expect(render('```c#\nvar x = 1;\n```\n')).toContain(
      '<span class="code-block__lang">c#</span>',
    );
    expect(render('```json\n{}\n```\n')).toContain('<span class="code-block__lang">json</span>');
  });

  it('falls back to "text" when the fence has no language', () => {
    expect(render('```\nplain\n```\n')).toContain('<span class="code-block__lang">text</span>');
  });

  it('adds an accessible copy button with icons and a label', () => {
    const html = render('```js\n1\n```\n');

    expect(html).toContain('<button type="button" class="code-copy" aria-label="Copy code">');
    expect(html).toContain('<span class="code-copy__label">Copy</span>');
    expect(html.match(/<svg /g)).toHaveLength(2);
  });

  it('keeps the header (label and Copy button) out of the search index', () => {
    expect(render('```js\n1\n```\n')).toContain('data-pagefind-ignore');
  });

  it('wraps every block and leaves other content alone', () => {
    const html = render('Text.\n\n```a\n1\n```\n\n```b\n2\n```\n');

    expect(html.match(/<figure class="code-block">/g)).toHaveLength(2);
    expect(html).toContain('<p>Text.</p>');
  });
});
