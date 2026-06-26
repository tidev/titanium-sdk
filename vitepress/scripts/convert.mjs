import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, breaks: true });

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const APIDOC_DIR = join(ROOT, '..', 'apidoc', 'Titanium');
const DOCS_DIR = join(ROOT, 'docs');
const API_OUT = join(DOCS_DIR, 'api');
const MODULES_CACHE = join(ROOT, 'modules-cache');

const MODULES = [
  { name: 'Facebook', repo: 'tidev/ti.facebook', apidoc: 'apidoc' },
  { name: 'Map', repo: 'tidev/ti.map', apidoc: 'apidoc' },
];

const copied = new Set();

const SPECIAL_SLUGS = {
  iOS: 'ios',
  iPad: 'ipad',
  iPhone: 'iphone',
  macOS: 'macos',
};

function slugify(name) {
  if (SPECIAL_SLUGS[name]) return SPECIAL_SLUGS[name];
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function namespaceFromPath(ymlPath, baseDir = APIDOC_DIR, prefix = 'Titanium') {
  const rel = ymlPath.replace(baseDir, '').replace(/^\//, '');
  const dir = dirname(rel);
  const parts = dir.split('/').filter(p => p && p !== '.');
  return [prefix, ...parts].join('.');
}

function docToPath(name, ymlPath) {
  const parts = name.split('.');
  const ymlBasename = basename(ymlPath, extname(ymlPath));
  const parentDir = basename(dirname(ymlPath));
  const last = parts[parts.length - 1];

  if (ymlBasename === parentDir) {
    const nsDir = parts.slice(0, -1).map(d => d.toLowerCase());
    const dirName = last.toLowerCase();
    return { dir: [...nsDir, dirName].join('/'), file: 'index.md' };
  }

  const dirs = parts.slice(0, -1).map(d => d.toLowerCase());
  return { dir: dirs.join('/'), file: slugify(last) + '.md' };
}

function linkify(text) {
  if (!text) return text;
  return text.replace(/<([A-Za-z][\w.]*)>/g, (match, ref) => {
    const parts = ref.split('.');
    const typeParts = [];
    for (const p of parts) {
      if (p[0] === p[0].toUpperCase() && p[0] !== p[0].toLowerCase()) {
        typeParts.push(p);
      } else {
        break;
      }
    }
    const typeName = typeParts.join('.');
    if (!typeName || typeName.split('.').length < 2) return '<' + ref + '>';
    const rest = parts.slice(typeParts.length).join('.');
    const slugParts = typeParts.map(p => slugify(p));
    const dirPath = typeParts.slice(0, -1).map(p => p.toLowerCase()).join('/');
    const outPath = '/api/' + (dirPath ? dirPath + '/' : '') + slugParts[slugParts.length - 1];
    const text = rest ? typeName + '.' + rest : typeName;
    return `[${text}](${outPath})`;
  });
}

function copyImages(md, ymlDir) {
  return md.replace(/\]\(([^)]+)\)/g, (match, imgPath) => {
    imgPath = imgPath.trim();
    if (imgPath.startsWith('http') || imgPath.startsWith('/') || imgPath.startsWith('#') || imgPath.startsWith('api/')) {
      return match;
    }
    const fullPath = join(ymlDir, imgPath);
    if (!existsSync(fullPath)) return match;
    const name = basename(imgPath).replace(/[^a-zA-Z0-9._-]/g, '_');
    const dest = join(DOCS_DIR, 'public', 'images', name);
    if (!copied.has(name)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(fullPath, dest);
      copied.add(name);
    }
    return `](/images/${name})`;
  });
}

function parseExample(text) {
  if (!text.includes('```')) return { code: [{ content: text, language: '' }] };

  const blocks = [];
  let cursor = text;
  let consumed = 0;

  while (cursor.includes('```')) {
    const start = cursor.indexOf('```');
    const afterOpen = cursor.slice(start + 3);
    const langEnd = afterOpen.indexOf('\n');
    if (langEnd === -1) break;
    const lang = afterOpen.slice(0, langEnd).trim();
    const innerStart = langEnd + 1;
    const close = afterOpen.indexOf('```');
    if (close === -1 || close <= innerStart) break;
    const codeContent = afterOpen.slice(innerStart, close).replace(/\n$/, '');
    const blockLen = 3 + langEnd + 1 + close + 3;
    blocks.push({ lang, code: codeContent, startOffset: consumed + start, endOffset: consumed + start + blockLen });
    consumed += start + blockLen;
    cursor = afterOpen.slice(close + 3);
  }

  if (blocks.length === 0) return { code: [{ content: text, language: '' }] };

  const intro = text.slice(0, blocks[0].startOffset).trim();
  const code = blocks.map(b => ({ content: b.code, language: b.lang }));
  return { code, intro: intro || undefined };
}

function fmtType(t) {
  if (!t) return '';
  if (Array.isArray(t)) return t.map(fmtType).join(', ');
  return t;
}

function fmtSince(s) {
  if (!s) return '';
  if (typeof s === 'string') return s;
  return Object.values(s).join(', ');
}

function fmtPlatforms(p) {
  if (!p) return '';
  return Array.isArray(p) ? p.join(', ') : p;
}

function docToMd(doc, ymlPath, nsOpts = {}) {
  let { name, summary, description, extends: ext, since, platforms, deprecated } = doc;
  if (!name.includes('.')) {
    const ns = namespaceFromPath(ymlPath, nsOpts.baseDir || APIDOC_DIR, nsOpts.prefix || 'Titanium');
    if (name !== ns) {
      name = ns + '.' + name;
    }
  }
  const pathInfo = docToPath(name, ymlPath);
  const ymlDir = dirname(ymlPath);
  const outDir = join(API_OUT, pathInfo.dir);
  const outFile = join(outDir, pathInfo.file);

  function renderText(text) {
    if (!text) return '';
    return md.renderInline(linkify(text));
  }

  function wrapCodeBlocks(html) {
    return html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_, lang, code) => `<div class="language-${lang}"><pre class="shiki"><code>${code}</code></pre></div>`
    );
  }

  function renderBlock(text) {
    if (!text) return '';
    return wrapCodeBlocks(md.render(copyImages(linkify(text), ymlDir)));
  }

  const fmData = { title: name };

  fmData.properties = (doc.properties || []).map(p => {
    const entry = { name: p.name, type: fmtType(p.type) };
    if (p.summary) entry.summary = renderText(p.summary);
    if (p.description) entry.description = renderBlock(p.description);
    if (p.deprecated) entry.deprecated = true;
    if (p.platforms) {
      entry.platforms = Array.isArray(p.platforms) ? p.platforms : [p.platforms];
    }
    if (p.since) entry.since = p.since;
    return entry;
  });

  fmData.methods = (doc.methods || []).map(m => {
    const entry = { name: m.name };
    if (m.summary) entry.summary = renderText(m.summary);
    if (m.description) entry.description = renderBlock(m.description);
    const params = (m.parameters || []).map(p => {
      const pe = { name: p.name, type: fmtType(p.type) };
      if (p.summary) pe.summary = renderText(p.summary);
      if (p.optional) pe.optional = true;
      return pe;
    });
    if (params.length) entry.parameters = params;
    if (m.returns) {
      const rt = Array.isArray(m.returns)
        ? m.returns.map(r => fmtType(r.type)).join(', ')
        : fmtType(m.returns.type);
      entry.returns = { type: rt };
      if (m.returns.summary) entry.returns.summary = m.returns.summary;
    }
    return entry;
  });

  fmData.events = (doc.events || []).map(e => {
    const entry = { name: e.name };
    if (e.summary) entry.summary = renderText(e.summary);
    if (e.description) entry.description = renderBlock(e.description);
    const eProps = (e.properties || []).map(p => {
      const pe = { name: p.name, type: fmtType(p.type) };
      if (p.summary) pe.summary = renderText(p.summary);
      return pe;
    });
    if (eProps.length) entry.properties = eProps;
    return entry;
  });

  fmData.examples = (doc.examples || []).map(ex => {
    const entry = {};
    if (ex.title) entry.title = ex.title;
    if (ex.example) {
      const parsed = parseExample(ex.example);
      entry.code = parsed.code;
      if (parsed.intro) entry.intro = parsed.intro;
    }
    return entry;
  });

  // Remove empty collections
  if (!fmData.properties.length) delete fmData.properties;
  if (!fmData.methods.length) delete fmData.methods;
  if (!fmData.events.length) delete fmData.events;
  if (!fmData.examples.length) delete fmData.examples;

  function escapeBodyHtml(text) {
    const VUE_TAGS = ['ApiProperties', 'ApiMethods', 'ApiEvents', 'ApiExamples'];
    const saved = [];

    text = text.replace(
      new RegExp('</?(?:' + VUE_TAGS.join('|') + ')\\s*/?>', 'g'),
      match => { saved.push(match); return '\x00' + (saved.length - 1) + '\x00'; }
    );

    text = text.replace(/```[\s\S]*?```/g, match => {
      saved.push(match);
      return '\x00' + (saved.length - 1) + '\x00';
    });

    text = text.replace(/`[^`]+`/g, match => {
      saved.push(match);
      return '\x00' + (saved.length - 1) + '\x00';
    });

    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    text = text.replace(/\x00(\d+)\x00/g, (_, i) => saved[parseInt(i)]);
    return text;
  }

  let body = `# ${name}\n\n`;
  if (deprecated) {
    body += `> **Deprecated** since ${deprecated.since}${deprecated.notes ? ': ' + deprecated.notes : ''}\n\n`;
  }
  if (summary) body += linkify(summary) + '\n\n';
  if (description) {
    body += copyImages(linkify(description), ymlDir) + '\n\n';
  }
  const meta = [];
  if (ext) meta.push(`**Extends:** \`${ext}\``);
  if (since) meta.push(`**Since:** ${fmtSince(since)}`);
  if (platforms) meta.push(`**Platforms:** ${fmtPlatforms(platforms)}`);
  if (meta.length > 0) body += meta.join(' · ') + '\n\n';

  body = escapeBodyHtml(body);

  if (fmData.properties) body += '<ApiProperties />\n\n';
  if (fmData.methods) body += '<ApiMethods />\n\n';
  if (fmData.events) body += '<ApiEvents />\n\n';
  if (fmData.examples) body += '<ApiExamples />\n\n';

  const frontmatter = `---\n${yaml.dump(fmData)}---\n\n`;
  const content = frontmatter + body;

  const pathSuffix = '/' + (pathInfo.dir ? pathInfo.dir + '/' : '') + pathInfo.file.replace(/\.md$/, '');
  return { outDir, outFile, content, name, shortName: doc.name, path: pathSuffix };
}

function walkYml(dir, list = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkYml(p, list);
    else if (e.name.endsWith('.yml')) list.push(p);
  }
  return list;
}

function sidebarTree(items) {
  const tree = {};
  for (const it of items) {
    const parts = it.path.replace('/api/', '').split('/').filter(Boolean);
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      if (i === parts.length - 1) {
        node[key] = { text: it.text, link: it.path };
      } else {
        if (!node[key] || node[key].link) {
          node[key] = node[key] && node[key].link ? { _link: { text: node[key].text, link: node[key].link } } : {};
        }
        node = node[key];
      }
    }
  }

  function toSidebar(obj) {
    const folders = [];
    const links = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith('_')) continue;
      if (val._link) {
        const children = toSidebar(val);
        children.unshift({ text: val._link.text, link: val._link.link });
        const label = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const displayLabel = label.replace(/\b(Ios|Ipad)\b/gi, match => match === 'Ios' ? 'iOS' : match === 'Ipad' ? 'iPad' : match);
        folders.push({ text: displayLabel, collapsed: true, items: children });
      } else if (val.link) {
        links.push(val);
      } else {
        const children = toSidebar(val);
        const label = key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const displayLabel = label.replace(/\b(Ios|Ipad)\b/gi, match => match === 'Ios' ? 'iOS' : match === 'Ipad' ? 'iPad' : match);
        folders.push({ text: displayLabel, collapsed: true, items: children });
      }
    }
    return [...folders, ...links].sort((a, b) => a.text.localeCompare(b.text));
  }
  return toSidebar(tree);
}

function run() {
  const files = walkYml(APIDOC_DIR);
  const items = [];

  for (const ymlPath of files) {
    const content = readFileSync(ymlPath, 'utf-8');
    const docs = yaml.loadAll(content);
    for (const doc of docs) {
      if (!doc || !doc.name) continue;
      const result = docToMd(doc, ymlPath);
      mkdirSync(result.outDir, { recursive: true });
      writeFileSync(result.outFile, result.content, 'utf-8');
      const fullPath = '/api' + result.path;
      const displayName = result.shortName.includes('.') ? result.shortName.split('.').pop() : result.shortName;
      items.push({ text: displayName, path: fullPath });
      console.log(`  ✓ ${doc.name} → ${result.path}`);
    }
  }

  const modEntries = [];
  for (const mod of MODULES) {
    const cacheDir = join(MODULES_CACHE, mod.name.toLowerCase());
    if (!existsSync(cacheDir)) {
      const url = `https://github.com/${mod.repo}.git`;
      console.log(`\n📦 Cloning ${mod.repo}...`);
      execSync(`git clone --depth 1 --single-branch ${url} "${cacheDir}"`, { stdio: 'inherit' });
    }
    const apidocDir = join(cacheDir, mod.apidoc);
    if (!existsSync(apidocDir)) {
      console.log(`  ⚠ No apidoc directory found at ${apidocDir}, skipping`);
      continue;
    }
    const prefix = 'Modules.' + mod.name;
    const modFiles = walkYml(apidocDir);
    for (const ymlPath of modFiles) {
      const content = readFileSync(ymlPath, 'utf-8');
      const docs = yaml.loadAll(content);
      for (const doc of docs) {
        if (!doc || !doc.name) continue;
        const result = docToMd(doc, ymlPath, { baseDir: apidocDir, prefix });
        mkdirSync(result.outDir, { recursive: true });
        writeFileSync(result.outFile, result.content, 'utf-8');
        const fullPath = '/api' + result.path;
        const displayName = result.shortName.includes('.') ? result.shortName.split('.').pop() : result.shortName;
        items.push({ text: displayName, path: fullPath });
        console.log(`  ✓ ${doc.name} → ${result.path}`);
      }
    }
    modEntries.push({ text: mod.name, link: '/api/modules/' + mod.name.toLowerCase() });
  }

  if (modEntries.length > 0) {
    const modIndexDir = join(API_OUT, 'modules');
    mkdirSync(modIndexDir, { recursive: true });
    const links = modEntries.map(e => `- [${e.text}](${e.link}/)`).join('\n');
    const modIndex = `---\ntitle: Modules\n---\n\n# Modules\n\n${links}\n`;
    writeFileSync(join(modIndexDir, 'index.md'), modIndex, 'utf-8');
    console.log(`\n📄 Generated modules index page`);
  }

  const sidebar = sidebarTree(items);
  // Ensure Titanium is first, auto-expand with link to index
  const tiIdx = sidebar.findIndex(s => s.text === 'Titanium');
  if (tiIdx > 0) {
    const [ti] = sidebar.splice(tiIdx, 1);
    sidebar.unshift(ti);
  }
  if (sidebar.length > 0 && sidebar[0].text === 'Titanium') {
    sidebar[0].collapsed = true;
    sidebar[0].link = '/api/titanium/';
  }

  const modIdx = sidebar.findIndex(s => s.text === 'Modules');
  if (modIdx !== -1) {
    sidebar[modIdx].collapsed = false;
    sidebar[modIdx].link = '/api/modules/';
  }

  const sidContent = `// Auto-generated by convert.mjs — do not edit manually
export default ${JSON.stringify(sidebar, null, 2)};
`;
  const sidPath = join(DOCS_DIR, '.vitepress', 'sidebar.mjs');
  writeFileSync(sidPath, sidContent, 'utf-8');

  const counts = {};
  for (const it of items) {
    const ns = it.text.split('.')[0];
    counts[ns] = (counts[ns] || 0) + 1;
  }

  console.log(`\n✅ Generated ${items.length} documentation pages`);
  for (const [ns, c] of Object.entries(counts)) {
    console.log(`   ${ns}: ${c} pages`);
  }
  console.log(`✅ Sidebar config written`);
}

run();
