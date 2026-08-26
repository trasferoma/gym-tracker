/* ============================================================
   Gym Tracker - prototipo grafico navigabile
   Dati fittizi in memoria. Nessun Dexie, nessun IndexedDB,
   nessuna persistenza: al ricaricamento tutto torna come prima.
   ============================================================ */

/* ---------------------- icone ---------------------- */

const I = {
  home: '<path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chart: '<path d="M4 19V5M4 19h16"/><path d="M7.5 15l3.5-4 3 2.5L20 7"/>',
  archive: '<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  chev: '<path d="M6 9.5l6 6 6-6"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  trash: '<path d="M4 7h16M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7M6.5 7l.8 12.3A.8.8 0 0 0 8.1 20h7.8a.8.8 0 0 0 .8-.7L17.5 7"/>',
  up: '<path d="M12 19V6M6 12l6-6 6 6"/>',
  down: '<path d="M12 5v13M6 12l6 6 6-6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 5.5h-9a2 2 0 0 0-2 2v9"/>',
  note: '<path d="M5 5h14M5 10h14M5 15h9"/>',
  info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5.5M12 7.9v.2"/>',
  warn: '<path d="M12 4.5l8.5 15h-17z"/><path d="M12 10v4M12 16.6v.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4A8.5 8.5 0 1 0 20 14.5z"/>',
  down_tray: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  up_tray: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>',
  refresh: '<path d="M19 11a7 7 0 1 0-2.2 5.1M19 5v6h-6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>',
  empty: '<rect x="3.5" y="6" width="17" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M3.5 11h17"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>'
};

function ico(name, cls) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + '>' +
    I[name] + '</svg>';
}

/* ---------------------- dominio ---------------------- */

const MUSCLE_GROUPS = [
  'Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Gambe', 'Addominali', 'Polpacci', 'Glutei', 'Avambracci', 'Altro'
];

let seq = 0;
const uid = () => 'id-' + (++seq);

/* ---------------------- dati fittizi ---------------------- */

const EX_DEF = {
  'Panca piana con manubri': { reps: [6, 6, 6, 6, 6], base: [20, 22, 24, 24, 22], inc: [0.5, 1, 0.5, 0.5, 0.5] },
  'Croci con manubri':       { reps: [12, 12, 10],    base: [12, 12, 14],         inc: [0.5, 0.5, 0.5] },
  'Curl con bilanciere':     { reps: [8, 8, 8, 8],    base: [20, 22, 22, 20],     inc: [0.5, 0.5, 0.5, 0.5] },
  'Curl a martello':         { reps: [12, 12, 10, 10],base: [10, 10, 12, 12],     inc: [0.5, 0.5, 0.5, 0.5] },
  'Lat machine':             { reps: [10, 10, 10, 10],base: [45, 50, 50, 45],     inc: [1, 1, 1, 1] },
  'Rematore con bilanciere': { reps: [8, 8, 8, 8],    base: [40, 45, 45, 40],     inc: [1, 1.5, 1, 1] },
  'Pushdown ai cavi':        { reps: [12, 10, 10],    base: [25, 30, 30],         inc: [1, 1, 1] },
  'French press':            { reps: [10, 10, 10],    base: [18, 20, 20],         inc: [0.5, 0.5, 0.5] },
  'Squat con bilanciere':    { reps: [5, 5, 5, 5, 5], base: [60, 65, 70, 70, 65], inc: [1.5, 1.5, 1.5, 1.5, 1.5] },
  'Leg press':               { reps: [10, 10, 10, 10],base: [90, 100, 100, 90],   inc: [2.5, 2.5, 2.5, 2.5] },
  'Calf in piedi':           { reps: [15, 15, 15, 15],base: [40, 45, 45, 40],     inc: [1, 1, 1, 1] },
  'Crunch a terra':          { reps: [20, 20, 20],    base: [0, 0, 0],            inc: [0, 0, 0] },
  'Lento avanti con manubri':{ reps: [8, 8, 8, 8],    base: [14, 16, 16, 14],     inc: [0.5, 0.5, 0.5, 0.5] },
  'Alzate laterali':         { reps: [12, 12, 12],    base: [8, 8, 10],           inc: [0.5, 0.5, 0.5] }
};

const EX_NOTE = {
  'Squat con bilanciere': 'Scendere sotto il parallelo, senza rimbalzo.',
  'Panca piana con manubri': 'Presa larga, pausa breve in basso.',
  'Pushdown ai cavi': 'Gomiti fermi lungo i fianchi.'
};

const TEMPLATES = {
  A: [['Petto', ['Panca piana con manubri', 'Croci con manubri']], ['Bicipiti', ['Curl con bilanciere', 'Curl a martello']]],
  B: [['Schiena', ['Lat machine', 'Rematore con bilanciere']], ['Tricipiti', ['Pushdown ai cavi', 'French press']]],
  C: [['Gambe', ['Squat con bilanciere', 'Leg press']], ['Polpacci', ['Calf in piedi']], ['Addominali', ['Crunch a terra']]],
  D: [['Spalle', ['Lento avanti con manubri', 'Alzate laterali']], ['Bicipiti', ['Curl con bilanciere']]]
};

const ORDER = ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'A', 'B', 'D', 'A', 'B', 'C', 'A', 'B', 'D', 'A', 'C'];

function isoDay(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function dayShift(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function buildSets(exName, k, allDone) {
  const def = EX_DEF[exName];
  return def.reps.map((r, i) => ({
    id: uid(),
    position: i,
    repetitions: r,
    weight: Math.round((def.base[i] + def.inc[i] * k) * 2) / 2,
    completed: allDone,
    notes: (exName === 'Squat con bilanciere' && i === def.reps.length - 1) ? 'Ultima serie tirata.' : ''
  }));
}

function buildWorkout(tpl, daysAgo, hour, minute, status, counters, partial) {
  const groups = TEMPLATES[tpl].map((entry, gi) => {
    const name = entry[0];
    return {
      id: uid(),
      name: name,
      position: gi,
      exercises: entry[1].map((exName, ei) => {
        const key = tpl + '|' + name + '|' + exName;
        const k = counters[key] || 0;
        counters[key] = k + 1;
        return {
          id: uid(),
          name: exName,
          position: ei,
          notes: EX_NOTE[exName] || '',
          sets: buildSets(exName, k, status === 'completed')
        };
      })
    };
  });

  if (partial) {
    groups[groups.length - 1].exercises.forEach((ex) => {
      ex.sets.forEach((s, i) => { s.completed = i < 1; });
    });
    groups[0].exercises.forEach((ex) => { ex.sets.forEach((s) => { s.completed = true; }); });
  }

  const day = dayShift(-daysAgo);
  const created = new Date(day);
  created.setHours(hour, minute, 0, 0);

  return {
    id: uid(),
    workoutDate: isoDay(day),
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    status: status,
    notes: daysAgo === 4 ? 'Poco tempo, riscaldamento ridotto.' : '',
    muscleGroups: groups
  };
}

function seedWorkouts() {
  const counters = {};
  const list = [];
  // dalla piu vecchia alla piu recente, una sessione ogni 2 giorni
  ORDER.forEach((tpl, i) => {
    const daysAgo = (ORDER.length - i) * 2;
    const hour = i % 3 === 0 ? 8 : 18;
    const minute = i % 2 === 0 ? 30 : 5;
    list.push(buildWorkout(tpl, daysAgo, hour, minute, 'completed', counters));
  });
  // due sessioni nello stesso giorno, quattro giorni fa
  list.push(buildWorkout('D', 4, 7, 45, 'completed', counters));
  list.push(buildWorkout('C', 4, 19, 10, 'completed', counters));
  // oggi: bozza in corso
  list.push(buildWorkout('A', 0, 18, 40, 'draft', counters, true));
  return list;
}

const DB = { workouts: seedWorkouts() };

/* ---------------------- helper ---------------------- */

const fmtDay = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dayOf = (iso) => new Date(iso + 'T12:00:00');
const timeOf = (iso) => new Date(iso).toTimeString().slice(0, 5);
const kg = (n) => (Number.isInteger(n) ? String(n) : String(n).replace('.', ','));
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

function countOf(w) {
  let ex = 0, sets = 0;
  w.muscleGroups.forEach((g) => {
    ex += g.exercises.length;
    g.exercises.forEach((e) => { sets += e.sets.length; });
  });
  return { ex: ex, sets: sets };
}

function schemeOf(sets) {
  const reps = sets.map((s) => s.repetitions);
  if (!reps.length) return '-';
  const uniform = reps.every((r) => r === reps[0]);
  return uniform ? reps.length + 'x' + reps[0] : reps.join('-');
}

function sortedWorkouts() {
  return DB.workouts.slice().sort((a, b) => {
    if (a.workoutDate !== b.workoutDate) return a.workoutDate < b.workoutDate ? 1 : -1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

function findWorkout(id) {
  return DB.workouts.find((w) => w.id === id);
}

function cloneStructure(src) {
  return {
    id: uid(),
    workoutDate: isoDay(dayShift(0)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    notes: '',
    muscleGroups: src.muscleGroups.map((g, gi) => ({
      id: uid(),
      name: g.name,
      position: gi,
      exercises: g.exercises.map((e, ei) => ({
        id: uid(),
        name: e.name,
        position: ei,
        notes: e.notes,
        sets: e.sets.map((s, si) => ({
          id: uid(),
          position: si,
          repetitions: s.repetitions,
          weight: s.weight,
          completed: false,
          notes: s.notes
        }))
      }))
    }))
  };
}

function exerciseHistory(groupName) {
  const seen = new Set();
  sortedWorkouts().forEach((w) => {
    w.muscleGroups.forEach((g) => {
      if (g.name !== groupName) return;
      g.exercises.forEach((e) => seen.add(e.name));
    });
  });
  return Array.from(seen);
}

/* ---------------------- statistiche ---------------------- */

function statEntries() {
  const out = [];
  DB.workouts.filter((w) => w.status === 'completed').forEach((w) => {
    w.muscleGroups.forEach((g, gi) => {
      g.exercises.forEach((e) => {
        if (!e.sets.length) return;
        out.push({
          pos: gi + 1,
          group: g.name,
          exercise: e.name,
          scheme: schemeOf(e.sets),
          date: w.workoutDate,
          weights: e.sets.map((s) => s.weight),
          reps: e.sets.map((s) => s.repetitions)
        });
      });
    });
  });
  return out;
}

function statSessions(pos, group, exercise, scheme) {
  return statEntries()
    .filter((e) => e.pos === pos && e.group === group && e.exercise === exercise && e.scheme === scheme)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* ---------------------- stato UI ---------------------- */

const S = {
  route: 'home',
  backTo: 'home',
  workoutId: null,
  filter: 'Tutti',
  collapsed: {},
  addingIn: null,
  saveState: 'saved',
  saveTimer: null,
  newDate: isoDay(dayShift(0)),
  copyFrom: null,
  stats: { pos: null, group: null, exercise: null, scheme: null, q: '' },
  confirm: null,
  toast: null,
  toastTimer: null,
  importReady: false,
  updateReady: false,
  theme: null
};

function go(route, id) {
  S.route = route;
  if (id) S.workoutId = id;
  S.addingIn = null;
  render();
  document.getElementById('view').scrollTop = 0;
}

function toast(msg) {
  S.toast = msg;
  clearTimeout(S.toastTimer);
  S.toastTimer = setTimeout(() => { S.toast = null; render(); }, 1900);
  render();
}

function touched(w) {
  if (w) w.updatedAt = new Date().toISOString();
  S.saveState = 'saving';
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(() => {
    S.saveState = 'saved';
    const pill = document.getElementById('savepill');
    if (pill) pill.outerHTML = savePill();
  }, 700);
  const pill = document.getElementById('savepill');
  if (pill) pill.outerHTML = savePill();
}

function savePill() {
  const map = {
    saved: ['save--saved', 'Salvato'],
    saving: ['save--saving', 'Salvataggio...'],
    error: ['save--error', 'Errore di salvataggio']
  };
  const v = map[S.saveState];
  return '<span class="save ' + v[0] + '" id="savepill"><i></i>' + v[1] + '</span>';
}

/* ---------------------- vista: home ---------------------- */

function viewHome() {
  const list = sortedWorkouts();
  const draft = list.find((w) => w.status === 'draft');
  const last = list.find((w) => w.status === 'completed');

  let html = '<div class="home">' +
    '<img class="home-logo" src="home.png" alt="" width="1254" height="1254">' +
    '<h2 class="home-name">Gym Tracker</h2>' +
    '<p class="home-sub">Il registro dei tuoi allenamenti, sempre offline.</p>';

  if (draft) {
    const c = countOf(draft);
    html += '<div class="card home-draft">' +
      '<div class="wk-top"><span class="badge badge--draft"><i></i>In corso</span>' +
        '<span class="wk-time num" style="margin-left:auto">' +
        esc(fmtDay.format(dayOf(draft.workoutDate))) + '</span></div>' +
      '<div class="wk-chips">' + draft.muscleGroups.map((g) =>
        '<span class="chip">' + esc(g.name) + '</span>').join('') + '</div>' +
      '<div class="wk-foot"><span class="num">' +
        plural(c.ex, 'esercizio', 'esercizi') + ' &middot; ' + plural(c.sets, 'serie', 'serie') +
      '</span></div>' +
      '<button class="btn btn--primary btn--block btn--sm" data-open="' + draft.id + '" style="margin-top:11px">' +
        'Riprendi</button>' +
    '</div>';
  }

  html += '<button class="btn' + (draft ? ' btn--outline' : ' btn--primary') + ' btn--block" data-go="new">' +
    ico('plus') + 'Nuovo allenamento</button>';

  if (last) {
    html += '<p class="home-last">Ultima giornata completata: <b>' +
      esc(fmtDay.format(dayOf(last.workoutDate))) + '</b><br>' +
      esc(last.muscleGroups.map((g) => g.name).join(' > ')) + '</p>';
  }

  html += '<button class="btn btn--ghost btn--block" data-go="history" style="margin-top:6px">' +
    'Vai allo storico' + ico('next') + '</button></div>';
  return html;
}

/* ---------------------- vista: storico ---------------------- */

function workoutCard(w, isToday) {
  const c = countOf(w);
  const groups = w.muscleGroups.map((g) => '<span class="chip">' + esc(g.name) + '</span>').join('');
  const badge = w.status === 'completed'
    ? '<span class="badge badge--done"><i></i>Completato</span>'
    : '<span class="badge badge--draft"><i></i>Bozza</span>';
  return '' +
    '<div class="wk' + (isToday ? ' wk--today' : '') + '">' +
      '<div class="wk-top" data-open="' + w.id + '" role="button" tabindex="0">' +
        '<span class="wk-date">' + esc(fmtDay.format(dayOf(w.workoutDate))) + '</span>' +
        '<span class="wk-time num">' + timeOf(w.createdAt) + '</span>' +
        '<span style="margin-left:auto">' + badge + '</span>' +
      '</div>' +
      '<div class="wk-chips">' + groups + '</div>' +
      '<div class="wk-foot">' +
        '<span class="num">' + plural(c.ex, 'esercizio', 'esercizi') + ' &middot; ' + plural(c.sets, 'serie', 'serie') + '</span>' +
        '<button class="icon-btn icon-btn--danger" data-del="' + w.id + '" aria-label="Elimina allenamento">' + ico('trash') + '</button>' +
      '</div>' +
    '</div>';
}

function viewHistory() {
  const all = sortedWorkouts();
  const shown = S.filter === 'Tutti'
    ? all
    : all.filter((w) => w.muscleGroups.some((g) => g.name === S.filter));
  const today = isoDay(dayShift(0));
  const todays = shown.filter((w) => w.workoutDate === today);
  const past = shown.filter((w) => w.workoutDate !== today);

  const used = MUSCLE_GROUPS.filter((g) => all.some((w) => w.muscleGroups.some((x) => x.name === g)));
  const opts = ['Tutti'].concat(used)
    .map((g) => '<option' + (g === S.filter ? ' selected' : '') + '>' + esc(g) + '</option>').join('');

  let html = '' +
    '<button class="btn btn--primary btn--block" data-go="new" style="margin-top:8px">' +
      ico('plus') + 'Nuovo allenamento</button>' +
    '<div style="margin-top:14px"><label class="field"><span>Filtra per gruppo muscolare</span>' +
      '<select id="filter">' + opts + '</select></label></div>';

  if (!shown.length) {
    html += '<div style="margin-top:22px" class="empty">' + ico('empty') +
      '<strong>Nessun allenamento con questo gruppo</strong>' +
      '<p>Cambia il filtro oppure registra una nuova giornata.</p></div>';
    return html;
  }

  if (todays.length) {
    html += '<div class="sec"><h2>Oggi</h2><span>' + esc(fmtLong.format(dayOf(today))) + '</span></div>' +
      '<div class="stack">' + todays.map((w) => workoutCard(w, true)).join('') + '</div>';
  }
  if (past.length) {
    html += '<div class="sec"><h2>Giornate precedenti</h2><span>' + past.length + '</span></div>' +
      '<div class="stack">' + past.map((w) => workoutCard(w, false)).join('') + '</div>';
  }
  return html;
}

/* ---------------------- vista: nuovo ---------------------- */

function viewNew() {
  const candidates = sortedWorkouts().slice(0, 20);
  const sameDate = DB.workouts.filter((w) => w.workoutDate === S.newDate).length;

  const picks = [{ id: null, label: 'Parti da zero', sub: 'Giornata vuota, aggiungi tu i gruppi' }]
    .concat(candidates.map((w) => {
      const c = countOf(w);
      return {
        id: w.id,
        label: fmtDay.format(dayOf(w.workoutDate)) + ' - ' + w.muscleGroups.map((g) => g.name).join(' > '),
        sub: plural(c.ex, 'esercizio', 'esercizi') + ' &middot; ' + plural(c.sets, 'serie', 'serie') +
             (w.status === 'draft' ? ' &middot; bozza' : '')
      };
    }));

  let html = '<div style="margin-top:8px"><label class="field"><span>Data dell allenamento</span>' +
    '<input type="date" id="newdate" value="' + S.newDate + '"></label></div>';

  if (sameDate > 0) {
    html += '<div class="banner banner--info" style="margin-top:10px">' + ico('info') +
      '<span>In questa data hai gi&agrave; ' + plural(sameDate, 'allenamento', 'allenamenti') +
      '. Ne verr&agrave; creato un altro, nulla viene sovrascritto.</span></div>';
  }

  html += '<div class="sec"><h2>Parti da una giornata precedente</h2></div><div class="stack">' +
    picks.map((p) => {
      const on = (S.copyFrom || null) === p.id;
      return '<button class="pick" aria-pressed="' + on + '" data-pick="' + (p.id || '') + '">' +
        '<span class="pick-mark">' + ico('check') + '</span>' +
        '<span class="pick-body"><b>' + esc(p.label) + '</b><small>' + p.sub + '</small></span>' +
        '</button>';
    }).join('') + '</div>';

  html += '<div class="banner banner--info" style="margin-top:14px">' + ico('info') +
    '<span>La copia porta gruppi, esercizi, serie, ripetizioni, pesi e note degli esercizi. ' +
    'Non copia la data, lo stato completato e le spunte delle serie.</span></div>';

  html += '<button class="btn btn--primary btn--block" data-create="1" style="margin-top:16px">' +
    ico('plus') + 'Crea allenamento</button>';
  return html;
}

/* ---------------------- vista: dettaglio ---------------------- */

function setsBlock(w, g, ex) {
  const head = '<div class="sets-row sets-head"><div>#</div><div>Ripetizioni</div><div>Peso</div><div></div><div></div></div>';
  const rows = ex.sets.map((s, i) => {
    const note = s.notes
      ? '<div class="set-note">' + ico('note') + '<span>' + esc(s.notes) + '</span></div>'
      : '';
    return '<div class="sets-row">' +
      '<div class="set-n">' + (i + 1) + '</div>' +
      '<div class="set-in"><input inputmode="numeric" pattern="[0-9]*" value="' + s.repetitions +
        '" aria-label="Ripetizioni serie ' + (i + 1) + '" data-set="' + s.id + '" data-fld="reps"><u>rip</u></div>' +
      '<div class="set-in"><input inputmode="decimal" value="' + kg(s.weight) +
        '" aria-label="Peso serie ' + (i + 1) + '" data-set="' + s.id + '" data-fld="kg"><u>kg</u></div>' +
      '<button class="set-ok" aria-pressed="' + !!s.completed + '" data-done="' + s.id +
        '" aria-label="Serie ' + (i + 1) + ' completata">' + ico('check') + '</button>' +
      '<button class="icon-btn icon-btn--danger" data-delset="' + s.id + '" aria-label="Elimina serie ' + (i + 1) + '">' +
        ico('trash') + '</button>' +
      note +
    '</div>';
  }).join('');

  return '<div class="sets">' + head + rows + '</div>' +
    '<div class="row-actions">' +
      '<button class="btn btn--outline btn--sm" data-addset="' + ex.id + '">' + ico('plus') + 'Serie</button>' +
      '<button class="btn btn--outline btn--sm" data-dupset="' + ex.id + '"' + (ex.sets.length ? '' : ' disabled') + '>' +
        ico('copy') + 'Duplica ultima</button>' +
      '<button class="btn btn--ghost btn--sm" data-trend="' + ex.id + '">' + ico('chart') + '</button>' +
    '</div>';
}

function exerciseBlock(w, g, ex, i, total) {
  const note = ex.notes ? '<p class="ex-note">' + ico('note') + '<span>' + esc(ex.notes) + '</span></p>' : '';
  return '<div class="ex">' +
    '<div class="ex-head">' +
      '<span class="ex-name">' + esc(ex.name) + '</span>' +
      '<span class="chip">' + schemeOf(ex.sets) + '</span>' +
      '<button class="icon-btn" data-exup="' + ex.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Sposta su">' + ico('up') + '</button>' +
      '<button class="icon-btn" data-exdown="' + ex.id + '"' + (i === total - 1 ? ' disabled' : '') + ' aria-label="Sposta giu">' + ico('down') + '</button>' +
      '<button class="icon-btn icon-btn--danger" data-delex="' + ex.id + '" aria-label="Elimina esercizio">' + ico('trash') + '</button>' +
    '</div>' + note + setsBlock(w, g, ex) + '</div>';
}

function addPanel(g) {
  const sugg = exerciseHistory(g.name);
  return '<div class="add-panel">' +
    '<label class="field"><span>Nome del nuovo esercizio</span>' +
    '<input id="newex" placeholder="Es. Panca inclinata" autocomplete="off"></label>' +
    (sugg.length
      ? '<div class="sec" style="margin:12px 0 0"><h2>Gi&agrave; usati per ' + esc(g.name) + '</h2></div>' +
        '<div class="sugg">' + sugg.map((n) =>
          '<button data-usex="' + esc(n) + '" data-ingrp="' + g.id + '">' + esc(n) + '</button>').join('') + '</div>'
      : '') +
    '<div class="row-actions">' +
      '<button class="btn btn--primary btn--sm" data-confirmex="' + g.id + '">Aggiungi</button>' +
      '<button class="btn btn--ghost btn--sm" data-cancelex="1">Annulla</button>' +
    '</div></div>';
}

function groupBlock(w, g, i) {
  const open = !S.collapsed[g.id];
  const c = { ex: g.exercises.length, sets: g.exercises.reduce((n, e) => n + e.sets.length, 0) };
  const body = open
    ? '<div class="grp-body">' +
        (g.exercises.length
          ? g.exercises.map((ex, k) => exerciseBlock(w, g, ex, k, g.exercises.length)).join('')
          : '<p class="faint" style="margin:2px 0 0;font-size:13px">Nessun esercizio in questo gruppo.</p>') +
        (S.addingIn === g.id
          ? addPanel(g)
          : '<div class="row-actions"><button class="btn btn--outline btn--sm" data-addex="' + g.id + '">' +
             ico('plus') + 'Esercizio</button></div>') +
      '</div>'
    : '';

  return '<section class="card grp' + (open ? ' open' : '') + '">' +
    '<div class="grp-head">' +
      '<span class="grp-pos">' + (i + 1) + '</span>' +
      '<span><span class="grp-name">' + esc(g.name) + '</span>' +
        '<span class="grp-meta" style="display:block">' + c.ex + ' es. &middot; ' + c.sets + ' serie</span></span>' +
      '<span class="spacer"></span>' +
      '<button class="icon-btn" data-grpup="' + g.id + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Sposta su">' + ico('up') + '</button>' +
      '<button class="icon-btn" data-grpdown="' + g.id + '"' + (i === w.muscleGroups.length - 1 ? ' disabled' : '') + ' aria-label="Sposta giu">' + ico('down') + '</button>' +
      '<button class="icon-btn icon-btn--danger" data-delgrp="' + g.id + '" aria-label="Elimina gruppo">' + ico('trash') + '</button>' +
      '<button class="icon-btn" data-toggle="' + g.id + '" aria-expanded="' + open + '" aria-label="Espandi o riduci">' + ico('chev', 'chev') + '</button>' +
    '</div>' + body + '</section>';
}

function viewWorkout() {
  const w = findWorkout(S.workoutId);
  if (!w) return '<div class="empty">Allenamento non trovato.</div>';
  const n = w.muscleGroups.length;

  let html = '<div class="card notes-box" style="margin-top:8px">' +
    '<label class="field"><span>Note della giornata</span>' +
    '<textarea id="wnotes" placeholder="Come e andata?">' + esc(w.notes) + '</textarea></label></div>';

  html += '<div class="sec"><h2>Gruppi muscolari</h2><span>' + n + ' di 3</span></div>';
  html += w.muscleGroups.map((g, i) => groupBlock(w, g, i)).join('');

  html += '<div class="row-actions">' +
    '<button class="btn btn--outline" data-addgrp="1"' + (n >= 3 ? ' disabled' : '') + '>' +
    ico('plus') + 'Gruppo muscolare</button></div>';

  if (n >= 3) {
    html += '<p class="faint" style="font-size:12.5px;margin:8px 2px 0">Massimo 3 gruppi per giornata.</p>';
  }

  if (w.status === 'draft') {
    if (n < 2) {
      html += '<div class="banner banner--warn" style="margin-top:16px">' + ico('warn') +
        '<span>Per completare la giornata servono almeno 2 gruppi muscolari. Come bozza va bene cos&igrave;.</span></div>';
    }
    html += '<button class="btn btn--primary btn--block" data-complete="1" style="margin-top:12px"' +
      (n < 2 ? ' disabled' : '') + '>' + ico('check') + 'Contrassegna come completato</button>';
  } else {
    html += '<div class="banner banner--info" style="margin-top:16px">' + ico('check') +
      '<span>Giornata completata. Entra nelle statistiche.</span></div>' +
      '<button class="btn btn--outline btn--block" data-reopen="1" style="margin-top:10px">Riporta a bozza</button>';
  }

  html += '<button class="btn btn--danger btn--block" data-del="' + w.id + '" style="margin-top:10px">' +
    ico('trash') + 'Elimina la giornata</button>';
  return html;
}

/* ---------------------- vista: statistiche ---------------------- */

function crumb() {
  const st = S.stats;
  const parts = [];
  parts.push('<button data-crumb="pos">Posizione</button>');
  if (st.pos) {
    parts.push(ico('next'));
    parts.push(st.group ? '<button data-crumb="group">' + st.pos + 'a pos.</button>' : '<b>' + st.pos + 'a pos.</b>');
  }
  if (st.group) {
    parts.push(ico('next'));
    parts.push(st.exercise ? '<button data-crumb="exercise">' + esc(st.group) + '</button>' : '<b>' + esc(st.group) + '</b>');
  }
  if (st.exercise) {
    parts.push(ico('next'));
    parts.push(st.scheme ? '<button data-crumb="scheme">' + esc(st.exercise) + '</button>' : '<b>' + esc(st.exercise) + '</b>');
  }
  if (st.scheme) {
    parts.push(ico('next'));
    parts.push('<b>' + esc(st.scheme) + '</b>');
  }
  return '<div class="crumb">' + parts.join('') + '</div>';
}

function drill(key, title, sub, attr, cls) {
  return '<button class="drill' + (cls || '') + '" ' + attr + '>' +
    '<span class="drill-k">' + esc(key) + '</span>' +
    '<span class="drill-b"><b>' + esc(title) + '</b><small>' + sub + '</small></span>' +
    ico('next') + '</button>';
}

function sparkline(sessions) {
  const nSets = Math.max.apply(null, sessions.map((s) => s.weights.length));
  const flat = sessions.reduce((a, s) => a.concat(s.weights), []);
  let lo = Math.min.apply(null, flat), hi = Math.max.apply(null, flat);
  if (hi === lo) { hi = lo + 1; }
  const pad = (hi - lo) * 0.18;
  lo -= pad; hi += pad;

  const W = 320, H = 120, L = 30, R = 6, T = 8, B = 20;
  const x = (i) => L + (sessions.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (sessions.length - 1));
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));

  let g = '';
  [0, 0.5, 1].forEach((f) => {
    const v = lo + (hi - lo) * f;
    g += '<line class="gl" x1="' + L + '" y1="' + y(v).toFixed(1) + '" x2="' + W + '" y2="' + y(v).toFixed(1) + '"/>' +
         '<text class="axl" x="0" y="' + (y(v) + 3).toFixed(1) + '">' + kg(Math.round(v * 2) / 2) + '</text>';
  });

  let lines = '';
  for (let s = 0; s < nSets; s++) {
    const cls = (s % 6) + 1;
    const pts = sessions.map((ss, i) => (ss.weights[s] == null ? null : x(i).toFixed(1) + ',' + y(ss.weights[s]).toFixed(1)))
      .filter(Boolean).join(' ');
    lines += '<polyline class="ln ln' + cls + '" points="' + pts + '"/>';
    sessions.forEach((ss, i) => {
      if (ss.weights[s] == null) return;
      lines += '<circle class="dt' + cls + '" cx="' + x(i).toFixed(1) + '" cy="' + y(ss.weights[s]).toFixed(1) + '" r="2.4"/>';
    });
  }

  const first = fmtShort.format(dayOf(sessions[0].date));
  const last = fmtShort.format(dayOf(sessions[sessions.length - 1].date));
  const axis = '<text class="axl" x="' + L + '" y="' + (H - 4) + '">' + esc(first) + '</text>' +
    '<text class="axl" x="' + W + '" y="' + (H - 4) + '" text-anchor="end">' + esc(last) + '</text>';

  let legend = '';
  for (let s = 0; s < nSets; s++) {
    legend += '<span><i class="lg' + ((s % 6) + 1) + '"></i>Serie ' + (s + 1) + '</span>';
  }

  return '<div class="card spark">' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Progressione del peso per serie">' +
    g + lines + axis + '</svg>' +
    '<div class="spark-legend">' + legend + '</div></div>';
}

function statTable(sessions) {
  const nSets = Math.max.apply(null, sessions.map((s) => s.weights.length));
  let head = '<tr><th>Data</th>';
  for (let s = 0; s < nSets; s++) head += '<th>S' + (s + 1) + '</th>';
  head += '</tr>';

  const rows = sessions.slice().reverse().map((ss) => {
    let tds = '<td class="date">' + esc(fmtDay.format(dayOf(ss.date))) + '</td>';
    for (let s = 0; s < nSets; s++) {
      tds += '<td>' + (ss.weights[s] == null ? '&ndash;' : kg(ss.weights[s])) + '</td>';
    }
    return '<tr>' + tds + '</tr>';
  }).join('');

  return '<div class="card tbl-wrap" style="margin-top:12px"><table class="tbl">' +
    '<thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="faint" style="font-size:12px;margin:9px 2px 0">Peso in kg. Le ripetizioni sono fissate dallo schema, ' +
    'quindi non vengono ripetute su ogni riga.</p>';
}

function viewStats() {
  const st = S.stats;
  const all = statEntries();
  if (!all.length) {
    return '<div class="empty" style="margin-top:16px">' + ico('chart') +
      '<strong>Nessuna statistica</strong><p>Le statistiche usano solo le giornate completate.</p></div>';
  }

  let html = crumb();

  if (!st.pos) {
    const positions = Array.from(new Set(all.map((e) => e.pos))).sort();
    html += '<div class="stack">' + positions.map((p) => {
      const sub = Array.from(new Set(all.filter((e) => e.pos === p).map((e) => e.group))).join(', ');
      return drill(p + 'a', p + 'a posizione della giornata', esc(sub), 'data-spos="' + p + '"');
    }).join('') + '</div>';
    return html;
  }

  if (!st.group) {
    const groups = Array.from(new Set(all.filter((e) => e.pos === st.pos).map((e) => e.group)));
    html += '<div class="stack">' + groups.map((g) => {
      const n = new Set(all.filter((e) => e.pos === st.pos && e.group === g).map((e) => e.date)).size;
      return drill(g.slice(0, 2), g, plural(n, 'giornata', 'giornate'), 'data-sgroup="' + esc(g) + '"');
    }).join('') + '</div>';
    return html;
  }

  if (!st.exercise) {
    const pool = all.filter((e) => e.pos === st.pos && e.group === st.group);
    const q = st.q.trim().toLowerCase();
    const names = Array.from(new Set(pool.map((e) => e.exercise)))
      .filter((n) => !q || n.toLowerCase().indexOf(q) >= 0);
    html += '<label class="field" style="margin-bottom:12px"><span>Cerca esercizio</span>' +
      '<input id="statq" value="' + esc(st.q) + '" placeholder="Nome esercizio" autocomplete="off"></label>';
    html += names.length
      ? '<div class="stack">' + names.map((n) => {
          const rows = pool.filter((e) => e.exercise === n);
          const schemes = new Set(rows.map((e) => e.scheme)).size;
          return drill(String(rows.length), n,
            plural(rows.length, 'sessione', 'sessioni') + ' &middot; ' + plural(schemes, 'schema', 'schemi'),
            'data-sex="' + esc(n) + '"');
        }).join('') + '</div>'
      : '<div class="empty">' + ico('search') + '<strong>Nessun esercizio</strong><p>Nessun nome corrisponde alla ricerca.</p></div>';
    return html;
  }

  if (!st.scheme) {
    const pool = all.filter((e) => e.pos === st.pos && e.group === st.group && e.exercise === st.exercise);
    const bySc = {};
    pool.forEach((e) => { (bySc[e.scheme] = bySc[e.scheme] || []).push(e); });
    const keys = Object.keys(bySc).sort((a, b) => bySc[b].length - bySc[a].length);
    html += '<div class="stack">' + keys.map((k) => {
      const rows = bySc[k].slice().sort((a, b) => (a.date < b.date ? -1 : 1));
      const lastDate = fmtDay.format(dayOf(rows[rows.length - 1].date));
      return drill(k, k,
        plural(rows.length, 'sessione', 'sessioni') + ' &middot; ultima ' + esc(lastDate),
        'data-ssch="' + esc(k) + '"', ' drill--scheme');
    }).join('') + '</div>';
    return html;
  }

  const sessions = statSessions(st.pos, st.group, st.exercise, st.scheme);
  if (!sessions.length) {
    return html + '<div class="empty">' + ico('chart') + '<strong>Nessuna sessione</strong><p>Nessun dato per questo schema.</p></div>';
  }
  if (sessions.length === 1) {
    html += '<div class="banner banner--info" style="margin-bottom:12px">' + ico('info') +
      '<span>Una sola sessione con questo schema: non c&egrave; ancora una progressione da mostrare.</span></div>';
  }
  html += sparkline(sessions) + statTable(sessions);
  return html;
}

/* ---------------------- vista: dati e backup ---------------------- */

function viewData() {
  const tot = DB.workouts.length;
  let ex = 0, sets = 0;
  DB.workouts.forEach((w) => { const c = countOf(w); ex += c.ex; sets += c.sets; });

  let html = '<div class="sec"><h2>Stato locale</h2></div><div class="card">' +
    '<div class="kv-row"><b>Storage persistente</b><span class="badge badge--done"><i></i>Concesso</span></div>' +
    '<div class="kv-row"><b>Ultimo backup</b><span>' + esc(fmtDay.format(dayShift(-6))) + '</span></div>' +
    '<div class="kv-row"><b>Allenamenti</b><span>' + tot + '</span></div>' +
    '<div class="kv-row"><b>Esercizi &middot; serie</b><span>' + ex + ' &middot; ' + sets + '</span></div>' +
    '</div>';

  html += '<div class="sec"><h2>Esportazione</h2></div>' +
    '<button class="btn btn--primary btn--block" data-export="1">' + ico('down_tray') + 'Esporta backup JSON</button>' +
    '<p class="faint" style="font-size:12.5px;margin:9px 2px 0">' +
    'gym-tracker-backup-' + isoDay(dayShift(0)) + '.json &middot; formato versione 1</p>';

  html += '<div class="sec"><h2>Importazione</h2></div>' +
    '<button class="btn btn--outline btn--block" data-import="1">' + ico('up_tray') + 'Scegli un file di backup</button>';

  if (S.importReady) {
    html += '<div class="card import-sum" style="margin-top:12px">' +
      '<b>File valido</b> <span class="chip chip--accent">versione 1</span>' +
      '<ul><li>19 allenamenti nel file</li><li>14 nuovi, 5 gi&agrave; presenti</li>' +
      '<li>3 con <span class="num">updatedAt</span> pi&ugrave; recente del locale</li></ul>' +
      '<div class="row-actions">' +
        '<button class="btn btn--primary btn--sm" data-merge="1">Unisci</button>' +
        '<button class="btn btn--danger btn--sm" data-replace="1">Sostituisci tutto</button>' +
      '</div></div>';
  } else {
    html += '<p class="faint" style="font-size:12.5px;margin:9px 2px 0">' +
      'Il file viene validato per intero prima di toccare il database. Un file non valido lascia i dati intatti.</p>';
  }

  html += '<div class="sec"><h2>Prototipo</h2></div><div class="stack">' +
    '<button class="btn btn--outline btn--block" data-fakeupdate="1">' + ico('refresh') +
    'Simula un aggiornamento disponibile</button>' +
    '<button class="btn btn--ghost btn--block" data-seterr="1">Simula un errore di salvataggio</button></div>';
  return html;
}

/* ---------------------- barra superiore ---------------------- */

function themeBtn() {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  return '<button class="icon-btn" data-theme="1" aria-label="Cambia tema">' + ico(dark ? 'sun' : 'moon') + '</button>';
}

function topbar() {
  if (S.route === 'home') {
    return '<div class="bar"><span style="flex:1 1 auto"></span>' + themeBtn() + '</div>';
  }
  if (S.route === 'history') {
    const n = DB.workouts.length;
    return '<div class="bar"><h1>Allenamenti<small>' + plural(n, 'giornata registrata', 'giornate registrate') +
      '</small></h1>' + themeBtn() + '</div>';
  }
  if (S.route === 'new') {
    return '<div class="bar"><button class="icon-btn" data-go="' + S.backTo + '" aria-label="Indietro">' + ico('back') +
      '</button><h1>Nuovo allenamento</h1>' + themeBtn() + '</div>';
  }
  if (S.route === 'workout') {
    const w = findWorkout(S.workoutId);
    const title = w ? fmtDay.format(dayOf(w.workoutDate)) : 'Allenamento';
    const sub = w ? timeOf(w.createdAt) + ' &middot; ' + (w.status === 'draft' ? 'bozza' : 'completato') : '';
    return '<div class="bar"><button class="icon-btn" data-go="' + S.backTo + '" aria-label="Indietro">' + ico('back') +
      '</button><h1 style="font-size:19px">' + esc(title) + '<small>' + sub + '</small></h1>' + savePill() + '</div>';
  }
  if (S.route === 'stats') {
    return '<div class="bar"><h1>Statistiche<small>solo giornate completate</small></h1>' + themeBtn() + '</div>';
  }
  return '<div class="bar"><h1>Dati e backup</h1>' + themeBtn() + '</div>';
}

function tabbar() {
  const tabs = [
    ['home', 'home', 'Home'],
    ['history', 'dumbbell', 'Allenamenti'],
    ['stats', 'chart', 'Statistiche'],
    ['data', 'archive', 'Dati']
  ];
  const tabRoutes = tabs.map((t) => t[0]);
  const active = tabRoutes.indexOf(S.route) >= 0 ? S.route : S.backTo;
  return tabs.map((t) => {
    const on = t[0] === active;
    return '<button class="tab" data-go="' + t[0] + '"' + (on ? ' aria-current="page"' : '') + '>' +
      ico(t[1]) + '<span>' + t[2] + '</span></button>';
  }).join('');
}

/* ---------------------- render ---------------------- */

function overlays() {
  let html = '';
  if (S.confirm) {
    html += '<div class="confirm"><div class="confirm-box">' +
      '<h3>' + esc(S.confirm.title) + '</h3><p>' + esc(S.confirm.body) + '</p>' +
      '<div class="row-actions">' +
        '<button class="btn btn--outline" data-cancel="1">Annulla</button>' +
        '<button class="btn btn--danger" data-ok="1">' + esc(S.confirm.ok) + '</button>' +
      '</div></div></div>';
  }
  if (S.updateReady) {
    html += '<div class="update-bar"><span>Nuova versione disponibile</span>' +
      '<button class="btn btn--primary btn--sm" data-doupdate="1">Aggiorna</button>' +
      '<button class="icon-btn" data-noupdate="1" aria-label="Ignora">' + ico('x') + '</button></div>';
  }
  if (S.toast) html += '<div class="toast">' + esc(S.toast) + '</div>';
  return html;
}

function render() {
  const views = { home: viewHome, history: viewHistory, new: viewNew, workout: viewWorkout, stats: viewStats, data: viewData };
  document.getElementById('topbar').innerHTML = topbar();
  document.getElementById('view').innerHTML = views[S.route]();
  document.getElementById('tabbar').innerHTML = tabbar();

  const app = document.getElementById('app');
  Array.prototype.forEach.call(app.querySelectorAll('.confirm,.update-bar,.toast'), (n) => n.remove());
  app.insertAdjacentHTML('beforeend', overlays());
}

/* ---------------------- mutazioni ---------------------- */

function locate(pred) {
  for (const w of DB.workouts) {
    for (const g of w.muscleGroups) {
      for (const ex of g.exercises) {
        for (const s of ex.sets) {
          if (pred.set && pred.set === s.id) return { w: w, g: g, ex: ex, s: s };
        }
        if (pred.ex && pred.ex === ex.id) return { w: w, g: g, ex: ex };
      }
      if (pred.g && pred.g === g.id) return { w: w, g: g };
    }
  }
  return null;
}

function reorder(list, id, delta) {
  const i = list.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return;
  const tmp = list[i];
  list[i] = list[j];
  list[j] = tmp;
  list.forEach((x, k) => { x.position = k; });
}

function askConfirm(title, body, ok, action) {
  S.confirm = { title: title, body: body, ok: ok, action: action };
  render();
}

/* ---------------------- eventi ---------------------- */

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-open],[data-del],[data-pick],[data-create],[data-toggle],' +
    '[data-addset],[data-dupset],[data-delset],[data-done],[data-addex],[data-confirmex],[data-cancelex],' +
    '[data-usex],[data-delex],[data-exup],[data-exdown],[data-grpup],[data-grpdown],[data-delgrp],[data-addgrp],' +
    '[data-complete],[data-reopen],[data-spos],[data-sgroup],[data-sex],[data-ssch],[data-crumb],[data-trend],' +
    '[data-export],[data-import],[data-merge],[data-replace],[data-fakeupdate],[data-doupdate],[data-noupdate],' +
    '[data-theme],[data-cancel],[data-ok],[data-seterr]');
  if (!t) return;
  const d = t.dataset;

  /* navigazione */
  if (d.go) {
    if (d.go === 'new' && S.route !== 'new') S.backTo = S.route;
    go(d.go); return;
  }
  if (d.open) {
    if (S.route !== 'workout') S.backTo = S.route;
    go('workout', d.open); return;
  }
  if (d.theme) {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
    render(); return;
  }

  /* conferme */
  if (d.cancel) { S.confirm = null; render(); return; }
  if (d.ok) { const a = S.confirm.action; S.confirm = null; a(); return; }

  /* storico e creazione */
  if (d.del) {
    const w = findWorkout(d.del);
    const c = countOf(w);
    askConfirm('Eliminare la giornata?',
      fmtLong.format(dayOf(w.workoutDate)) + ' - ' + plural(c.ex, 'esercizio', 'esercizi') + ', ' +
      plural(c.sets, 'serie', 'serie') + '. Operazione non reversibile.',
      'Elimina', () => {
        DB.workouts = DB.workouts.filter((x) => x.id !== w.id);
        if (S.route === 'workout') S.route = 'history';
        toast('Giornata eliminata');
      });
    return;
  }
  if (d.pick !== undefined) { S.copyFrom = d.pick || null; render(); return; }
  if (d.create) {
    const src = S.copyFrom ? findWorkout(S.copyFrom) : null;
    const w = src ? cloneStructure(src) : {
      id: uid(), workoutDate: S.newDate, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), status: 'draft', notes: '', muscleGroups: []
    };
    w.workoutDate = S.newDate;
    DB.workouts.push(w);
    S.copyFrom = null;
    S.backTo = 'history';
    go('workout', w.id);
    toast(src ? 'Struttura copiata con nuovi UUID' : 'Bozza creata');
    return;
  }

  /* dettaglio: gruppi */
  if (d.toggle) { S.collapsed[d.toggle] = !S.collapsed[d.toggle]; render(); return; }
  if (d.grpup || d.grpdown) {
    const w = findWorkout(S.workoutId);
    reorder(w.muscleGroups, d.grpup || d.grpdown, d.grpup ? -1 : 1);
    touched(w); render(); return;
  }
  if (d.delgrp) {
    const f = locate({ g: d.delgrp });
    const sets = f.g.exercises.reduce((n, x) => n + x.sets.length, 0);
    askConfirm('Eliminare ' + f.g.name + '?',
      plural(f.g.exercises.length, 'esercizio', 'esercizi') + ' e ' + plural(sets, 'serie', 'serie') + ' andranno persi.',
      'Elimina', () => {
        f.w.muscleGroups = f.w.muscleGroups.filter((g) => g.id !== f.g.id);
        f.w.muscleGroups.forEach((g, i) => { g.position = i; });
        touched(f.w); toast('Gruppo eliminato');
      });
    return;
  }
  if (d.addgrp) {
    const w = findWorkout(S.workoutId);
    const taken = w.muscleGroups.map((g) => g.name);
    const next = MUSCLE_GROUPS.find((g) => taken.indexOf(g) < 0) || 'Altro';
    w.muscleGroups.push({ id: uid(), name: next, position: w.muscleGroups.length, exercises: [] });
    touched(w); render(); return;
  }

  /* dettaglio: esercizi */
  if (d.addex) { S.addingIn = d.addex; render(); return; }
  if (d.cancelex) { S.addingIn = null; render(); return; }
  if (d.usex) { addExercise(d.ingrp, d.usex); return; }
  if (d.confirmex) {
    const input = document.getElementById('newex');
    const name = (input && input.value.trim()) || '';
    if (!name) { input.focus(); return; }
    addExercise(d.confirmex, name); return;
  }
  if (d.delex) {
    const f = locate({ ex: d.delex });
    askConfirm('Eliminare ' + f.ex.name + '?',
      plural(f.ex.sets.length, 'serie', 'serie') + ' andranno perse.', 'Elimina', () => {
        f.g.exercises = f.g.exercises.filter((x) => x.id !== f.ex.id);
        f.g.exercises.forEach((x, i) => { x.position = i; });
        touched(f.w); toast('Esercizio eliminato');
      });
    return;
  }
  if (d.exup || d.exdown) {
    const f = locate({ ex: d.exup || d.exdown });
    reorder(f.g.exercises, f.ex.id, d.exup ? -1 : 1);
    touched(f.w); render(); return;
  }
  if (d.trend) {
    const f = locate({ ex: d.trend });
    const pos = f.w.muscleGroups.findIndex((g) => g.id === f.g.id) + 1;
    S.stats = { pos: pos, group: f.g.name, exercise: f.ex.name, scheme: schemeOf(f.ex.sets), q: '' };
    go('stats'); return;
  }

  /* dettaglio: serie */
  if (d.addset) {
    const f = locate({ ex: d.addset });
    const last = f.ex.sets[f.ex.sets.length - 1];
    f.ex.sets.push({
      id: uid(), position: f.ex.sets.length,
      repetitions: last ? last.repetitions : 10,
      weight: last ? last.weight : 0,
      completed: false, notes: ''
    });
    touched(f.w); render(); return;
  }
  if (d.dupset) {
    const f = locate({ ex: d.dupset });
    const last = f.ex.sets[f.ex.sets.length - 1];
    if (!last) return;
    f.ex.sets.push({
      id: uid(), position: f.ex.sets.length,
      repetitions: last.repetitions, weight: last.weight, completed: false, notes: ''
    });
    touched(f.w); render(); toast('Ultima serie duplicata'); return;
  }
  if (d.delset) {
    const f = locate({ set: d.delset });
    f.ex.sets = f.ex.sets.filter((s) => s.id !== f.s.id);
    f.ex.sets.forEach((s, i) => { s.position = i; });
    touched(f.w); render(); return;
  }
  if (d.done) {
    const f = locate({ set: d.done });
    f.s.completed = !f.s.completed;
    t.setAttribute('aria-pressed', String(f.s.completed));
    touched(f.w); return;
  }

  /* stato della giornata */
  if (d.complete) {
    const w = findWorkout(S.workoutId);
    w.status = 'completed';
    touched(w); render(); toast('Giornata completata'); return;
  }
  if (d.reopen) {
    const w = findWorkout(S.workoutId);
    w.status = 'draft';
    touched(w); render(); return;
  }

  /* statistiche */
  if (d.spos) { S.stats.pos = Number(d.spos); render(); return; }
  if (d.sgroup) { S.stats.group = d.sgroup; render(); return; }
  if (d.sex) { S.stats.exercise = d.sex; render(); return; }
  if (d.ssch) { S.stats.scheme = d.ssch; render(); return; }
  if (d.crumb) {
    const st = S.stats;
    if (d.crumb === 'pos') { st.pos = st.group = st.exercise = st.scheme = null; st.q = ''; }
    if (d.crumb === 'group') { st.group = st.exercise = st.scheme = null; st.q = ''; }
    if (d.crumb === 'exercise') { st.exercise = st.scheme = null; }
    if (d.crumb === 'scheme') { st.scheme = null; }
    render(); return;
  }

  /* dati e backup */
  if (d.export) { toast('gym-tracker-backup-' + isoDay(dayShift(0)) + '.json'); return; }
  if (d.import) { S.importReady = true; render(); return; }
  if (d.merge) { S.importReady = false; render(); toast('14 allenamenti uniti'); return; }
  if (d.replace) {
    askConfirm('Sostituire tutti i dati?',
      'I 21 allenamenti locali verranno rimpiazzati dai 19 del backup, in una sola transazione.',
      'Sostituisci', () => { S.importReady = false; toast('Dati sostituiti'); });
    return;
  }
  if (d.fakeupdate) { S.updateReady = true; render(); return; }
  if (d.doupdate) { S.updateReady = false; render(); toast('Aggiornata'); return; }
  if (d.noupdate) { S.updateReady = false; render(); return; }
  if (d.seterr) { S.saveState = 'error'; clearTimeout(S.saveTimer); go('workout', DB.workouts[DB.workouts.length - 1].id); return; }
});

function addExercise(groupId, name) {
  const f = locate({ g: groupId });
  f.g.exercises.push({
    id: uid(), name: name, position: f.g.exercises.length, notes: '',
    sets: [{ id: uid(), position: 0, repetitions: 10, weight: 0, completed: false, notes: '' }]
  });
  S.addingIn = null;
  touched(f.w);
  render();
}

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'filter') { S.filter = el.value; render(); return; }
  if (el.id === 'newdate') { S.newDate = el.value; render(); return; }
  if (el.id === 'statq') { S.stats.q = el.value; render(); document.getElementById('statq').focus(); return; }
  if (el.id === 'wnotes') { findWorkout(S.workoutId).notes = el.value; touched(findWorkout(S.workoutId)); return; }
  if (el.dataset.set) {
    const f = locate({ set: el.dataset.set });
    if (!f) return;
    if (el.dataset.fld === 'reps') {
      const n = parseInt(el.value, 10);
      f.s.repetitions = Number.isFinite(n) && n > 0 ? n : f.s.repetitions;
    } else {
      const n = parseFloat(el.value.replace(',', '.'));
      f.s.weight = Number.isFinite(n) && n >= 0 ? n : f.s.weight;
    }
    touched(f.w);
  }
});

document.getElementById('view').addEventListener('scroll', (e) => {
  document.getElementById('topbar').classList.toggle('scrolled', e.target.scrollTop > 4);
});

render();
