import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

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
    if (!typeName || typeName.split('.').length < 2) return match;
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

function renderTable(headers, rows) {
  if (rows.length === 0) return '';
  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  for (const row of rows) {
    md += '| ' + row.join(' | ') + ' |\n';
  }
  md += '\n';
  return md;
}

function cell(text) {
  return (text || '').toString().replace(/\n/g, ' ').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  // Infer namespace for types without a dot-separated prefix
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

  let body = '';
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
  if (meta.length > 0) body += meta.join(' &middot; ') + '\n\n';

  const props = doc.properties || [];
  const methods = doc.methods || [];
  const events = doc.events || [];
  const examples = doc.examples || [];

  if (props.length) {
    body += '## Properties\n\n';
    for (const p of props) {
      const name = p.name + (p.deprecated ? ' *(deprecated)*' : '');
      body += `### ${name}\n\n`;
      body += `**Type:** \`${fmtType(p.type)}\`\n\n`;
      if (p.summary) body += linkify(p.summary) + '\n\n';
      if (p.description) body += copyImages(linkify(p.description), ymlDir) + '\n\n';
      const PLATFORM_DEFAULT_SINCE = { android: '1.0', iphone: '1.0', ipad: '1.0', macos: '9.2.0' };
      function platSince(plat, ver) {
        const names = { android: 'Android', iphone: 'iOS', ipad: 'iPad', macos: 'macOS' };
        return `${names[plat] || plat.charAt(0).toUpperCase() + plat.slice(1)}: ${ver}`;
      }
      const info = [];
      const platforms = p.platforms ? (Array.isArray(p.platforms) ? p.platforms : [p.platforms]) : [];
      if (typeof p.since === 'object') {
        const parts = Object.entries(p.since).map(([plat, ver]) => platSince(plat, ver));
        info.push(parts.join(' | '));
      } else if (p.since && platforms.length) {
        const parts = platforms.map(plat => platSince(plat, p.since));
        info.push(parts.join(' | '));
      } else if (p.since) {
        info.push(`Since: ${p.since}`);
      } else if (platforms.length) {
        const parts = platforms.map(plat => platSince(plat, PLATFORM_DEFAULT_SINCE[plat] || '?'));
        info.push(parts.join(' | '));
      }

      if (info.length) {
        body += `> ${info.join(' · ')}\n\n`;
      }
    }
  }

  if (methods.length) {
    body += '## Methods\n\n';
    for (const m of methods) {
      body += `### ${m.name}\n\n`;
      if (m.summary) body += linkify(m.summary) + '\n\n';
      if (m.description) body += linkify(m.description) + '\n\n';
      const params = m.parameters || [];
      if (params.length) {
        body += '**Parameters:**\n\n';
        const headers = ['Name', 'Type', 'Summary', 'Optional'];
        const rows = params.map(p => [
          `\`${p.name}\``,
          `\`${fmtType(p.type)}\``,
          cell(linkify(p.summary || '')),
          p.optional ? 'Yes' : 'No',
        ]);
        body += renderTable(headers, rows);
      }
      if (m.returns) {
        const rt = Array.isArray(m.returns) ? m.returns.map(r => fmtType(r.type)).join(', ') : fmtType(m.returns.type);
        const rs = m.returns.summary ? ' &mdash; ' + m.returns.summary : '';
        body += `**Returns:** \`${rt}\`${rs}\n\n`;
      }
    }
  }

  if (events.length) {
    body += '## Events\n\n';
    for (const e of events) {
      body += `### ${e.name}\n\n`;
      if (e.summary) body += linkify(e.summary) + '\n\n';
      if (e.description) body += linkify(e.description) + '\n\n';
      const eProps = e.properties || [];
      if (eProps.length) {
        body += '**Event Properties:**\n\n';
        const headers = ['Name', 'Type', 'Summary'];
        const rows = eProps.map(p => [
          `\`${p.name}\``,
          `\`${fmtType(p.type)}\``,
          cell(linkify(p.summary || '')),
        ]);
        body += renderTable(headers, rows);
      }
    }
  }

  if (examples.length) {
    body += '## Examples\n\n';
    for (const ex of examples) {
      if (ex.title) body += `### ${ex.title}\n\n`;
      if (ex.example) body += ex.example + '\n\n';
    }
  }

  const frontmatter = `---\ntitle: ${name}\n---\n\n`;
  const content = frontmatter + `# ${name}\n\n` + body;

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
