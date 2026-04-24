let currentTab = 'preview';
let generatedMarkdown = '';
let currentSideTab = 'config';
let customContent = {};

const badgeUrls = {
  license:   (n, a) => `[![License](https://img.shields.io/github/license/${a}/${n})](LICENSE)`,
  stars:     (n, a) => `[![Stars](https://img.shields.io/github/stars/${a}/${n}?style=social)](https://github.com/${a}/${n})`,
  issues:    (n, a) => `[![Issues](https://img.shields.io/github/issues/${a}/${n})](https://github.com/${a}/${n}/issues)`,
  forks:     (n, a) => `[![Forks](https://img.shields.io/github/forks/${a}/${n})](https://github.com/${a}/${n}/network)`,
  npm:       (n)    => `[![npm](https://img.shields.io/npm/v/${n})](https://npmjs.com/package/${n})`,
  ci:        (n, a) => `[![CI](https://img.shields.io/github/actions/workflow/status/${a}/${n}/ci.yml)](https://github.com/${a}/${n}/actions)`,
  coverage:  (n, a) => `[![Coverage](https://img.shields.io/codecov/c/github/${a}/${n})](https://codecov.io/gh/${a}/${n})`,
  version:   (n, a) => `[![Version](https://img.shields.io/github/v/release/${a}/${n})](https://github.com/${a}/${n}/releases)`,
  downloads: (n, a) => `[![Downloads](https://img.shields.io/github/downloads/${a}/${n}/total)](https://github.com/${a}/${n}/releases)`,
  prs:       ()     => `[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)`,
};

const templates = {
  cli:    { name:'my-cli-tool',  desc:'A fast, ergonomic command-line tool for developers',     cmd:'npm install -g my-cli-tool',  techs:['Node.js','TypeScript'],          sections:{features:true,install:true,usage:true,config:true,license:true,contributing:true} },
  lib:    { name:'my-lib',       desc:'A lightweight, zero-dependency utility library',          cmd:'npm install my-lib',           techs:['TypeScript'],                    sections:{features:true,install:true,usage:true,api:true,license:true,contributing:true} },
  webapp: { name:'my-app',       desc:'A modern web application built for speed and scale',     cmd:'npm install && npm run dev',   techs:['React','TypeScript','Tailwind'], sections:{features:true,install:true,usage:true,env:true,docker:true,contributing:true,license:true} },
  api:    { name:'my-api',       desc:'A RESTful API service with clean, expressive endpoints', cmd:'npm install && npm start',     techs:['Node.js','PostgreSQL','Docker'], sections:{features:true,install:true,api:true,env:true,docker:true,contributing:true,license:true} },
};

const sectionDefaults = {
  features:        `- **Fast** — optimised for performance with minimal overhead\n- **Simple API** — intuitive interface with sensible defaults\n- **Extensible** — plugin-friendly architecture for custom integrations\n- **Typed** — full TypeScript support with accurate types`,
  install:         ``,
  usage:           ``,
  api:             `### \`run(options)\`\n\nStarts the process with the given options.\n\n| Param | Type | Default | Description |\n|-------|------|---------|-------------|\n| \`options.timeout\` | \`number\` | \`5000\` | Max wait time in ms |\n| \`options.verbose\` | \`boolean\` | \`false\` | Enable debug logging |\n\n**Returns:** \`Promise<r>\``,
  config:          `Create a \`.projectrc.json\` file in your project root:\n\n\`\`\`json\n{\n  "option": "value",\n  "enabled": true,\n  "timeout": 5000\n}\n\`\`\``,
  env:             `Copy \`.env.example\` to \`.env\` and fill in the values:\n\n\`\`\`bash\nAPP_PORT=3000\nDATABASE_URL=postgres://localhost:5432/mydb\nSECRET_KEY=your-secret-key\n\`\`\``,
  docker:          `\`\`\`bash\n# Build and start containers\ndocker compose up -d\n\n# Run migrations\ndocker compose exec app npm run migrate\n\`\`\``,
  contributing:    `Contributions are welcome — thank you for helping make this better!\n\n1. Fork the repository\n2. Create your feature branch: \`git checkout -b feat/my-feature\`\n3. Commit your changes: \`git commit -m 'feat: add my feature'\`\n4. Push to the branch: \`git push origin feat/my-feature\`\n5. Open a pull request\n\nPlease read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct.`,
  license:         ``,
  roadmap:         `- [x] Core functionality\n- [x] TypeScript support\n- [ ] Plugin system\n- [ ] CLI companion\n- [ ] Official documentation site`,
  acknowledgements:`- [Awesome library](https://example.com) — inspiration and ideas\n- [Another tool](https://example.com) — used for building X`,
  faq:             `**Q: Does it work on Windows?**\nA: Yes, all major platforms are supported.\n\n**Q: Is it production-ready?**\nA: The library is stable and used in production by several teams.`,
};

const sectionLabels = {
  features:'Features', install:'Installation', usage:'Usage', api:'API Reference',
  config:'Configuration', env:'Environment Variables', docker:'Docker Setup',
  contributing:'Contributing', license:'License', roadmap:'Roadmap',
  acknowledgements:'Acknowledgements', faq:'FAQ',
};

const sectionHints = {
  features:        'List your key features. Supports markdown.',
  install:         'Leave blank to auto-generate from the install command above.',
  usage:           'Code examples and usage instructions. Supports markdown + code blocks.',
  api:             'Document your API methods, params, and return values.',
  config:          'Show configuration file format and options.',
  env:             'List required environment variables.',
  docker:          'Docker/compose setup commands.',
  contributing:    'Guidelines for contributors.',
  license:         'Leave blank to auto-generate from license selection.',
  roadmap:         'Future plans. Use `- [x]` for done, `- [ ]` for pending.',
  acknowledgements:'Credits and attributions.',
  faq:             'Common questions and answers.',
};

function switchSideTab(tab) {
  currentSideTab = tab;
  document.getElementById('vtab-config').classList.toggle('active', tab === 'config');
  document.getElementById('vtab-edit').classList.toggle('active', tab === 'edit');
  document.getElementById('side-config').style.display = tab === 'config' ? '' : 'none';
  const ep = document.getElementById('side-edit');
  if (tab === 'edit') { ep.classList.add('show'); buildEditPanel(); }
  else ep.classList.remove('show');
}

function buildEditPanel() {
  const list = document.getElementById('edit-sections-list');
  const allSecs = ['features','install','usage','api','config','env','docker','contributing','license','roadmap','acknowledgements','faq'];
  list.innerHTML = '';
  allSecs.forEach(key => {
    const checkbox = document.getElementById('sec-' + key);
    const isEnabled = checkbox && checkbox.checked;

    const wrap = document.createElement('div');
    wrap.className = 'edit-section';
    wrap.style.opacity = isEnabled ? '1' : '0.45';
    wrap.style.marginBottom = '8px';

    const hdr = document.createElement('div');
    hdr.className = 'edit-section-hdr';
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▼';
    const statusText = document.createElement('span');
    statusText.style.cssText = 'font-size:10px;color:var(--ink-4);margin-right:6px';
    statusText.textContent = isEnabled ? 'enabled' : 'disabled';
    const right = document.createElement('span');
    right.style.display = 'flex';
    right.style.alignItems = 'center';
    right.appendChild(statusText);
    right.appendChild(chevron);
    hdr.appendChild(document.createTextNode(sectionLabels[key]));
    hdr.appendChild(right);

    const body = document.createElement('div');
    body.className = 'edit-section-body';

    const hint = document.createElement('p');
    hint.className = 'edit-hint';
    hint.textContent = sectionHints[key];

    const ta = document.createElement('textarea');
    ta.className = 'edit-ta';
    ta.placeholder = 'Custom content (leave blank for auto-generated)...';
    ta.value = customContent[key] || '';
    ta.addEventListener('input', () => {
      customContent[key] = ta.value;
      generateReadme();
    });

    body.appendChild(hint);
    body.appendChild(ta);

    hdr.addEventListener('click', () => {
      const open = body.classList.toggle('show');
      chevron.style.transform = open ? 'rotate(180deg)' : '';
    });

    if (isEnabled) {
      body.classList.add('show');
      chevron.style.transform = 'rotate(180deg)';
    }

    wrap.appendChild(hdr);
    wrap.appendChild(body);
    list.appendChild(wrap);
  });
}

function getContent(key) {
  return (customContent[key] && customContent[key].trim()) ? customContent[key] : null;
}

function applyTemplate(t) {
  const tpl = templates[t];
  document.getElementById('proj-name').value = tpl.name;
  document.getElementById('proj-desc').value = tpl.desc;
  document.getElementById('install-cmd').value = tpl.cmd;
  document.querySelectorAll('.chip[data-tech]').forEach(b => b.classList.toggle('on', tpl.techs.includes(b.dataset.tech)));
  const secs = ['features','install','usage','api','config','env','docker','contributing','license','roadmap','acknowledgements','faq'];
  secs.forEach(s => { const el = document.getElementById('sec-' + s); if (el) el.checked = !!(tpl.sections[s]); });
  if (currentSideTab === 'edit') buildEditPanel();
  generateReadme();
}

document.querySelectorAll('.chip[data-badge]').forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); generateReadme(); }));
document.querySelectorAll('.chip[data-tech]').forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); generateReadme(); }));
document.querySelectorAll('#side-config input, #side-config textarea, #side-config select').forEach(el => {
  el.addEventListener('input', () => { if (currentSideTab === 'edit') buildEditPanel(); generateReadme(); });
});
document.querySelectorAll('.check input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', () => { if (currentSideTab === 'edit') buildEditPanel(); generateReadme(); });
});

function getSelectedTechs() {
  const sel = [...document.querySelectorAll('.chip[data-tech].on')].map(b => b.dataset.tech);
  const custom = document.getElementById('custom-tech').value.split(',').map(s => s.trim()).filter(Boolean);
  return [...sel, ...custom];
}
function getActiveBadges() { return [...document.querySelectorAll('.chip[data-badge].on')].map(b => b.dataset.badge); }
function toCamel(s) { return s.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^./, c => c.toLowerCase()); }
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function countSections(md) { return (md.match(/^## /gm) || []).length; }
function countWords(md) { return md.replace(/```[\s\S]*?```/g, '').trim().split(/\s+/).filter(Boolean).length; }

function buildMarkdown() {
  const name       = document.getElementById('proj-name').value.trim()   || 'my-project';
  const desc       = document.getElementById('proj-desc').value.trim()   || 'A description of your project.';
  const author     = document.getElementById('author').value.trim()      || 'yourusername';
  const installCmd = document.getElementById('install-cmd').value.trim() || `npm install ${name}`;
  const demoUrl    = document.getElementById('demo-url').value.trim();
  const license    = document.getElementById('license-type').value;
  const techs      = getSelectedTechs();
  const badges     = getActiveBadges();
  const g          = id => document.getElementById(id).checked;

  let md = `# ${name}\n\n`;
  if (badges.length) md += badges.map(b => badgeUrls[b](name, author)).join(' ') + '\n\n';
  md += `> ${desc}\n\n`;
  if (demoUrl) md += `[Live demo](${demoUrl}) · [Report bug](https://github.com/${author}/${name}/issues) · [Request feature](https://github.com/${author}/${name}/issues)\n\n`;
  else         md += `[Report bug](https://github.com/${author}/${name}/issues) · [Request feature](https://github.com/${author}/${name}/issues)\n\n`;
  if (techs.length) md += `## Built with\n\n${techs.map(t => `- ${t}`).join('\n')}\n\n`;

  if (g('sec-features')) {
    const c = getContent('features');
    md += `## Features\n\n${c || sectionDefaults.features}\n\n`;
  }
  if (g('sec-install')) {
    const c = getContent('install');
    md += `## Installation\n\n${c || `\`\`\`bash\n${installCmd}\n\`\`\``}\n\n`;
  }
  if (g('sec-usage')) {
    const c = getContent('usage');
    md += `## Usage\n\n${c || `\`\`\`js\nimport ${toCamel(name)} from '${name}';\n\nconst instance = ${toCamel(name)}({\n  option: 'value',\n});\n\ninstance.run();\n\`\`\``}\n\n`;
  }
  if (g('sec-api')) {
    const c = getContent('api');
    md += `## API reference\n\n${c || sectionDefaults.api}\n\n`;
  }
  if (g('sec-config')) {
    const c = getContent('config');
    md += `## Configuration\n\n${c || sectionDefaults.config}\n\n`;
  }
  if (g('sec-env')) {
    const c = getContent('env');
    md += `## Environment variables\n\n${c || sectionDefaults.env}\n\n`;
  }
  if (g('sec-docker')) {
    const c = getContent('docker');
    md += `## Docker setup\n\n${c || sectionDefaults.docker}\n\n`;
  }
  if (g('sec-roadmap')) {
    const c = getContent('roadmap');
    md += `## Roadmap\n\n${c || sectionDefaults.roadmap}\n\nSee [open issues](https://github.com/${author}/${name}/issues) for the full list.\n\n`;
  }
  if (g('sec-contributing')) {
    const c = getContent('contributing');
    md += `## Contributing\n\n${c || sectionDefaults.contributing}\n\n`;
  }
  if (g('sec-faq')) {
    const c = getContent('faq');
    md += `## FAQ\n\n${c || sectionDefaults.faq}\n\n`;
  }
  if (g('sec-acknowledgements')) {
    const c = getContent('acknowledgements');
    md += `## Acknowledgements\n\n${c || sectionDefaults.acknowledgements}\n\n`;
  }
  if (g('sec-license')) {
    const c = getContent('license');
    md += `## License\n\n${c || `[${license}](LICENSE) — © ${new Date().getFullYear()} [${author}](https://github.com/${author})`}\n`;
  }
  return md;
}

function markdownToHtml(md) {
  return md
    .replace(/^# (.+)$/gm,  '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, l, code) => `<pre><code>${escHtml(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[!\[([^\]]+)\]\(([^)]+)\)\]\(([^)]+)\)/g, '<a href="$3"><img src="$2" alt="$1"/></a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^\- \[x\] (.+)$/gm, '<li style="list-style:none">✓ <s>$1</s></li>')
    .replace(/^\- \[ \] (.+)$/gm, '<li style="list-style:none">&#9633; $1</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/(<\/ul>\s*<ul>)/g, '')
    .replace(/\|(.+)\|/g, m => {
      const cells = m.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => /^[-: ]+$/.test(c))) return '';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, m => `<table>${m}</table>`)
    .replace(/(<\/table>\s*<table[^>]*>)/g, '')
    .replace(/^(?!<[hbuptlosr])(.*\S.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n{2,}/g, '');
}

function generateReadme() {
  generatedMarkdown = buildMarkdown();
  const chars    = generatedMarkdown.length;
  const words    = countWords(generatedMarkdown);
  const sections = countSections(generatedMarkdown);
  document.getElementById('char-count').textContent    = chars.toLocaleString() + ' chars';
  document.getElementById('stat-chars').textContent    = chars.toLocaleString();
  document.getElementById('stat-words').textContent    = words.toLocaleString();
  document.getElementById('stat-sections').textContent = sections;
  document.getElementById('status-dot').className = 'status-dot' + (chars > 100 ? ' live' : '');
  if (currentTab === 'preview') document.getElementById('preview-content').innerHTML = markdownToHtml(generatedMarkdown);
  else document.getElementById('raw-content').textContent = generatedMarkdown;
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById('tab-preview').classList.toggle('active', tab === 'preview');
  document.getElementById('tab-raw').classList.toggle('active', tab === 'raw');
  document.getElementById('preview-content').style.display = tab === 'preview' ? '' : 'none';
  document.getElementById('raw-content').style.display     = tab === 'raw'     ? '' : 'none';
  if (tab === 'raw') document.getElementById('raw-content').textContent = generatedMarkdown;
  else document.getElementById('preview-content').innerHTML = markdownToHtml(generatedMarkdown);
}

function copyMarkdown() {
  if (!generatedMarkdown) return;
  navigator.clipboard.writeText(generatedMarkdown).then(() => {
    const n = document.getElementById('copy-notif');
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 1800);
  });
}

function downloadReadme() {
  if (!generatedMarkdown) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([generatedMarkdown], { type: 'text/markdown' }));
  a.download = 'README.md';
  a.click();
}

function resetForm() {
  document.getElementById('proj-name').value   = '';
  document.getElementById('proj-desc').value   = '';
  document.getElementById('author').value      = '';
  document.getElementById('install-cmd').value = '';
  document.getElementById('demo-url').value    = '';
  document.getElementById('custom-tech').value = '';
  customContent = {};
  document.querySelectorAll('.chip').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.chip[data-badge="license"], .chip[data-badge="stars"]').forEach(b => b.classList.add('on'));
  const defaults = ['sec-features','sec-install','sec-usage','sec-contributing','sec-license'];
  document.querySelectorAll('.check input[type=checkbox]').forEach(cb => cb.checked = defaults.includes(cb.id));
  if (currentSideTab === 'edit') buildEditPanel();
  generateReadme();
}

// Init
document.getElementById('side-config').style.display = '';
generateReadme();