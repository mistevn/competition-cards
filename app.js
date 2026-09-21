const $ = (id) => document.getElementById(id);
let rows = [];

const ALIASES = {
  division: ['division', 'cardtype', 'card', 'divisiontype', 'group', '组别', '分组'],
  name: ['name', '姓名', 'competitor', 'fullname', 'competitorname'],
  id: ['id', 'id#', 'idno', 'idnumber', '参赛号', 'number', 'no', 'bib', 'competitorid'],
  age: ['age', '年龄'],
  gender: ['gender', 'sex', '性别'],
  level: ['level', '级别', 'rank'],
  event: ['event', '项目', 'form', 'eventname'],
  weight: ['weight', '体重', 'wt', 'weightclass', 'weightdivision', '体重级别', '级别体重'],
  category: ['category', 'type', 'weapon', 'weapontype', '类别', 'formtype'],
  open: ['openhand', 'open', '拳术'],
  short: ['short', 'shortweapon', '短器械'],
  long: ['long', 'longweapon', '长器械'],
  other: ['other', '其他']
};
const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s_\-\/\.:()（）]/g, '');
const truthy = (v) => /^(x|✓|✔|yes|y|true|1|是)$/i.test(String(v ?? '').trim());

// '', 'form' or 'combat' — '' means the row did not say.
function divisionOf(value) {
  const v = norm(value);
  if (!v) return '';
  if (/combat|spar|fight|对抗|散打|散手|sanda|sanshou|推手|pushhands|tuishou/.test(v)) return 'combat';
  if (/form|taolu|套路|routine/.test(v)) return 'form';
  return '';
}

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
  const weight = pick('weight');
  // No Division column? A weight means combat, a category or a ticked box means form.
  let division = divisionOf(pick('division'));
  if (!division && weight) division = 'combat';
  if (!division && (cat || checks.open || checks.short || checks.long || checks.other)) division = 'form';
  return { division, name: pick('name'), id: pick('id'), age: pick('age'), gender: pick('gender'),
           level: pick('level'), event: pick('event'), weight, checks };
}

// The card each row prints on, given the Card type control.
function typeOf(r) {
  const mode = $('cardtype').value;
  if (mode !== 'auto') return mode;
  return r.division || 'form';
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
    ['Division', 'Name', 'ID', 'Age', 'Gender', 'Level', 'Event', 'Category', 'Weight'],
    ['Form', 'Li Wei 李伟', '101', '34', 'M', 'Intermediate', 'Bagua Zhang 八卦掌', 'Open Hand', ''],
    ['Form', 'Sarah Chen', '102', '27', 'F', 'Advanced', 'Jian 剑', 'Short', ''],
    ['Form', 'Marcus Hall', '103', '45', 'M', 'Beginner', 'Gun 棍', 'Long', ''],
    ['Form', 'Zhang Min 张敏', '104', '16', 'F', 'Advanced', 'Chang Quan 长拳', 'Open Hand', ''],
    ['Form', 'Priya Nair', '105', '52', 'F', 'Intermediate', 'Rope Dart 绳镖', 'Other', ''],
    ['Combat', 'Tom Ortiz', '106', '38', 'M', 'Beginner', 'Sanda 散打', '', '75 kg'],
    ['Combat', 'Wang Jun 王军', '107', '29', 'M', 'Advanced', 'Sanda 散打', '', '65 kg'],
    ['Combat', 'Ana Ruiz', '108', '31', 'F', 'Intermediate', 'Push Hands 推手', '', '56 kg']
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

['cardtype', 'paper', 'perpage', 'blanks'].forEach(id => $(id).addEventListener('input', render));

$('print').addEventListener('click', () => window.print());

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function field(en, zh, val) {
  return `<div class="line">
    <div class="label-row"><span class="lab">${en}</span><span class="val" title="${esc(val)}">${esc(val)}</span></div>
    <span class="zhlab">${zh}</span>
  </div>`;
}
const sq = (on) => `<span class="sq" aria-hidden="true">${on ? '✓' : ''}</span>`;

// Form divisions: Event across the card, then the Open Hand / Weapon boxes.
function formRows(r) {
  const c = r.checks;
  return `<div class="line"><div class="label-row"><span class="lab">Event/项目</span><span class="val" title="${esc(r.event)}">${esc(r.event)}</span></div></div>
      <div class="boxes">
        <span class="box">${sq(c.open)} Open Hand</span>
        <span class="sep">|</span>
        <span>Weapon:</span>
        <span class="box">${sq(c.short)} Short</span>
        <span class="box">${sq(c.long)} Long</span>
        <span class="box">${sq(c.other)} Other</span>
      </div>`;
}

// Combat divisions: Event shares its row with Weight, and there are no boxes.
function combatRows(r) {
  return `<div class="r3">${field('Event', '项目', r.event)}${field('Weight', '体重', r.weight)}</div>`;
}

function cardHTML(r, type, lastRow) {
  const combat = type === 'combat';
  return `<article class="card${lastRow ? ' last-row' : ''}">
    <div>
      <div class="title">Competition Card参赛卡</div>
      <div class="sub">(${combat ? 'Combat Divisions 对抗组' : 'Form Divisions 套路组'})</div>
    </div>
    <div class="fields">
      <div class="r1">${field('Name', '姓名', r.name)}${field('ID#', '参赛号', r.id)}</div>
      <div class="r2">${field('Age', '年龄', r.age)}${field('Gender', '性别', r.gender)}${field('Level', '级别', r.level)}</div>
      ${combat ? combatRows(r) : formRows(r)}
    </div>
  </article>`;
}

const BLANK = { division: '', name: '', id: '', age: '', gender: '', level: '', event: '', weight: '', checks: {} };

function render() {
  const mode = $('cardtype').value;
  const paper = $('paper').value;
  const per = parseInt($('perpage').value, 10);
  const blanks = Math.max(0, Math.min(200, parseInt($('blanks').value, 10) || 0));
  $('page-rule').textContent = `@page { size: ${paper === 'a4' ? 'A4' : 'letter'}; margin: 0; }`;

  // Blank cards follow the control; on auto they follow whichever card the sheet mostly uses.
  const combatRowCount = rows.filter(r => typeOf(r) === 'combat').length;
  const blankType = mode !== 'auto' ? mode : (combatRowCount > rows.length / 2 ? 'combat' : 'form');

  let cards = rows.map(r => [r, typeOf(r)]);
  for (let i = 0; i < blanks; i++) cards.push([BLANK, blankType]);
  if (!cards.length) cards = Array(per).fill([BLANK, blankType]);

  const out = [];
  for (let i = 0; i < cards.length; i += per) {
    const chunk = cards.slice(i, i + per);
    while (chunk.length < per) chunk.push(null);
    const cols = 2, lastRowStart = per - cols;
    const inner = chunk.map((c, j) => c ? cardHTML(c[0], c[1], j >= lastRowStart) : `<div class="card${j >= lastRowStart ? ' last-row' : ''}" style="border-color:transparent"></div>`).join('');
    out.push(`<section class="page ${paper} up${per}" aria-label="Page ${out.length + 1}">${inner}</section>`);
  }
  $('pages').innerHTML = out.join('');
}

render();
