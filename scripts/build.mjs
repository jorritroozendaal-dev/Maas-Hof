import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const header = await readFile(path.join(root, 'templates/header.html'), 'utf8');
const footer = await readFile(path.join(root, 'templates/footer.html'), 'utf8');
const files = (await readdir(path.join(root, 'src/pages'))).filter(p => p.endsWith('.html')).sort();
for (const name of files) {
  const source = await readFile(path.join(root, 'src/pages', name), 'utf8');
  const navPage = name.startsWith('blog-') ? 'blog.html' : name === 'budgetplanner.html' ? 'rekentools.html' : name;
  const current = name.startsWith('blog-') || name === 'budgetplanner.html' ? 'true' : 'page';
  const active = header.replaceAll(`href="${navPage}"`, `href="${navPage}" aria-current="${current}"`);
  const page = source.replace('{{header}}', active).replace('{{footer}}', footer);
  if (/\{\{\w+\}\}/.test(page)) throw new Error(`Unresolved template: ${name}`);
  await writeFile(path.join(root, name), page);
}
const base = 'https://jorritroozendaal-dev.github.io/Maas-Hof/';
await writeFile(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + files.filter(name => name !== 'intranet.html').map(name => `  <url><loc>${base}${name === 'index.html' ? '' : name}</loc></url>`).join('\n') + '\n</urlset>\n');
await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
console.log(`Built ${files.length} pages, sitemap and robots.txt.`);
