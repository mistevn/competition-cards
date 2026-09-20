const $ = (id) => document.getElementById(id);
let rows = [];

const ALIASES = {
  name: ['name', '姓名', 'competitor', 'fullname', 'competitorname'],
  id: ['id', 'id#', 'idno', 'idnumber', '参赛号', 'number', 'no', 'bib', 'competitorid'],
  age: ['age', '年龄'],
  gender: ['gender', 'sex', '性别'],
  level: ['level', '级别', 'rank'],
  event: ['event', '项目', 'form', 'eventname'],
  category: ['category', 'type', 'weapon', 'weapontype', '类别', 'division', 'formtype'],
  open: ['openhand', 'open', '拳术'],
  short: ['short', 'shortweapon', '短器械'],
  long: ['long', 'longweapon', '长器械'],
  other: ['other', '其他']
};
const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s_\-\/\.:()（）]/g, '');
const truthy = (v) => /^(x|✓|✔|yes|y|true|1|是)$/i.test(String(v ?? '').trim());

function mapRow(raw) {
  const byKey = {};
  for (const [k, v] of Object.entries(raw)) byKey[norm(k)] = v;
  const pick = (field) => {
    for (const a of ALIASES[field]) if (a in byKey && String(byKey[a]).trim() !== '') return String(byKey[a]).trim();
    return '';
  };
  const cat = norm(pick('category'));
  const checks = {
    open: /open|hand|拳|徒手/.test(cat) || truthy(pick('open')),
    short: /short|短/.test(cat) || truthy(pick('short')),
    long: /long|长/.test(cat) || truthy(pick('long')),
    other: /other|其他|其它/.test(cat) || truthy(pick('other'))
  };
  return { name: pick('name'), id: pick('id'), age: pick('age'), gender: pick('gender'),
           level: pick('level'), event: pick('event'), checks };
}

function loadWorkbook(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  rows = json.map(mapRow).filter(r => r.name || r.id || r.event);
  const status = $('status');
  if (!rows.length) {
    status.textContent = 'No competitors found in the first sheet. Check that row 1 has headers such as Name, ID, Event.';
    status.className = 'status error';
  } else {
    status.textContent = `Loaded ${rows.length} competitor${rows.length === 1 ? '' : 's'} from "${wb.SheetNames[0]}".`;
    status.className = 'status';
  }
  render();
}

$('file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const buf = await f.arrayBuffer();
    loadWorkbook(XLSX.read(buf, { type: 'array' }));
  } catch (err) {
    $('status').textContent = `Could not read ${f.name}. Save it as .xlsx or .csv and try again.`;
    $('status').className = 'status error';
  }
  e.target.value = '';
});

$('usePaste').addEventListener('click', () => {
  const text = $('paste').value.trim();
  if (!text) { $('status').textContent = 'The paste box is empty. Paste rows with a header row first.'; $('status').className = 'status error'; return; }
  const tabbed = text.includes('\t');
  const wb = XLSX.read(text, { type: 'string', FS: tabbed ? '\t' : ',' });
  loadWorkbook(wb);
});

$('sample').addEventListener('click', () => {
  const data = [
    ['Name', 'ID', 'Age', 'Gender', 'Level', 'Event', 'Category'],
    ['Li Wei 李伟', '101', '34', 'M', 'Intermediate', 'Bagua Zhang 八卦掌', 'Open Hand'],
    ['Sarah Chen', '102', '27', 'F', 'Advanced', 'Jian 剑', 'Short'],
    ['Marcus Hall', '103', '45', 'M', 'Beginner', 'Gun 棍', 'Long'],
    ['Zhang Min 张敏', '104', '16', 'F', 'Advanced', 'Chang Quan 长拳', 'Open Hand'],
    ['Priya Nair', '105', '52', 'F', 'Intermediate', 'Rope Dart 绳镖', 'Other'],
    ['Tom Ortiz', '106', '38', 'M', 'Beginner', 'Dao 刀', 'Short'],
    ['Wang Jun 王军', '107', '61', 'M', 'Masters', 'Qiang 枪', 'Long']
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sample');
  loadWorkbook(wb);
});

$('clear').addEventListener('click', () => {
  rows = [];
  $('paste').value = '';
  $('status').textContent = 'No spreadsheet loaded. Load one, or print blank cards.';
  $('status').className = 'status';
  render();
});

['paper', 'perpage', 'blanks'].forEach(id => $(id).addEventListener('input', render));

$('print').addEventListener('click', () => window.print());

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function field(en, zh, val) {
  return `<div class="line">
    <div class="label-row"><span class="lab">${en}</span><span class="val" title="${esc(val)}">${esc(val)}</span></div>
    <span class="zhlab">${zh}</span>
  </div>`;
}
const sq = (on) => `<span class="sq" aria-hidden="true">${on ? '✓' : ''}</span>`;

function cardHTML(r, lastRow) {
  const c = r.checks;
  return `<article class="card${lastRow ? ' last-row' : ''}">
    <div>
      <div class="title">Competition Card参赛卡</div>
      <div class="sub">(Form Divisions 套路组)</div>
    </div>
    <div class="fields">
      <div class="r1">${field('Name', '姓名', r.name)}${field('ID#', '参赛号', r.id)}</div>
      <div class="r2">${field('Age', '年龄', r.age)}${field('Gender', '性别', r.gender)}${field('Level', '级别', r.level)}</div>
      <div class="line"><div class="label-row"><span class="lab">Event/项目</span><span class="val" title="${esc(r.event)}">${esc(r.event)}</span></div></div>
      <div class="boxes">
        <span class="box">${sq(c.open)} Open Hand</span>
        <span class="sep">|</span>
        <span>Weapon:</span>
        <span class="box">${sq(c.short)} Short</span>
        <span class="box">${sq(c.long)} Long</span>
        <span class="box">${sq(c.other)} Other</span>
      </div>
    </div>
  </article>`;
}

function render() {
  const paper = $('paper').value;
  const per = parseInt($('perpage').value, 10);
  const blanks = Math.max(0, Math.min(200, parseInt($('blanks').value, 10) || 0));
  $('page-rule').textContent = `@page { size: ${paper === 'a4' ? 'A4' : 'letter'}; margin: 0; }`;

  const blank = { name: '', id: '', age: '', gender: '', level: '', event: '', checks: {} };
  let cards = rows.concat(Array(blanks).fill(blank));
  if (!cards.length) cards = Array(per).fill(blank);

  const out = [];
  for (let i = 0; i < cards.length; i += per) {
    const chunk = cards.slice(i, i + per);
    while (chunk.length < per) chunk.push(null);
    const cols = 2, lastRowStart = per - cols;
    const inner = chunk.map((r, j) => r ? cardHTML(r, j >= lastRowStart) : `<div class="card${j >= lastRowStart ? ' last-row' : ''}" style="border-color:transparent"></div>`).join('');
    out.push(`<section class="page ${paper} up${per}" aria-label="Page ${out.length + 1}">${inner}</section>`);
  }
  $('pages').innerHTML = out.join('');
}

render();
