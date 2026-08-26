# IMPLEMENTATION — Gym Tracker (PWA personale per il registro degli allenamenti)

**Specifica di riferimento:** `spec-gym-tracker.md`  — nel resto del documento: «la SPEC».
**Stato:** `COMPLETED`  <!-- NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED -->

Documento di lavoro: la SPEC (il "cosa") resta stabile; qui vivono stato, piano, decisioni e problemi (il "come").

> **Attenzione leggendo il piano operativo qui sotto.** Le fasi descrivono il lavoro **come è stato pianificato ed eseguito**, e sono lasciate come storia. Un requisito è cambiato **dopo** la chiusura, su richiesta dell'utente: il numero minimo di gruppi muscolari di una giornata completata è passato **da 2 a 1** (il massimo resta 3). Dove le Fasi 2 e 8 dicono «2..3 gruppi» va letto «1..3». La fonte autorevole sul comportamento attuale è la SPEC; il perché sta in § *Modifiche successive alla chiusura*.

## Regole per l'agente
- Leggere `CLAUDE.md` (se presente) e la SPEC prima di toccare codice.
- Alla ripresa del lavoro, leggere prima questo file e riprendere dallo stato corrente.
- Prima di modificare, elencare i file che verranno toccati. Nessun refactoring fuori scope.
- Non modificare i requisiti della SPEC senza decisione esplicita.
- Dopo ogni fase: eseguire i test pertinenti e aggiornare questo file. Spuntare una voce solo dopo verifica reale, mai a priori.
- Scelta che **non** cambia il comportamento osservabile → procedi e annotala in *Decisioni*.
- Scelta che **cambia** comportamento o criteri di accettazione, o ambiguità non risolvibile dalla SPEC → **fermati**, imposta lo stato a `BLOCKED` e registra in *Problemi aperti* / *Deviazioni*.
- `prototype/` è **riferimento visivo in sola lettura**: non importarlo, non modificarlo, non includerlo nel bundle.
- Ogni fase produce codice compilabile e testabile: niente fase che lascia il progetto rosso.
- Cartelle: **nessuna** delle cartelle sotto `src/` elencate qui esiste oggi (il repository contiene solo `prototype/` e `home.png`); vanno create insieme al primo file che le abita.

## Piano operativo

### Fase 1 — Analisi dello scaffold e delle convenzioni
- [x] Verificare lo scaffold creato in parallelo: versioni effettive di Vue, Vite 6, Dexie 4, Vitest 3, `vite-plugin-pwa`, `fake-indexeddb`, Node 18.
- [x] Confermare `strict: true` in TypeScript, ESLint 9 flat config attiva, assenza di Prettier e di dipendenze vietate (Pinia, framework CSS, librerie di grafici e di icone).
- [x] Confermare la configurazione Vitest: `environment`, `setupFiles` per `fake-indexeddb`, pattern `src/**/*.spec.ts`, script `test` / `lint` / `typecheck` / `build`.
- [x] Rilevare lo stile dei test esistenti (se ne esistono) e la convenzione di import (`@/` o percorsi relativi).
- [x] Rileggere `prototype/app.js` e `prototype/styles.css` per fissare testi italiani, token e geometrie da riprodurre.
- [x] Aggiornare "File coinvolti (effettivi)" confermando o correggendo i percorsi provvisori di questo piano.
- **File letti:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.ts`, `src/App.vue`, `prototype/app.js`, `prototype/styles.css`, `prototype/README.md`, `spec-gym-tracker.md`.
- **File modificati:** nessuno.
- **File da creare:** nessuno.

### Fase 2 — Modello di dominio e funzioni pure
- [x] Definire i tipi della gerarchia `Workout → MuscleGroupWorkout → Exercise → ExerciseSet` con i campi della SPEC, `readonly` dove sensato.
- [x] Catalogo dei gruppi muscolari come costante, nell'ordine della SPEC.
- [x] Creazione di bozza, gruppo, esercizio e serie con nuovi UUID e `position` contigue.
- [x] Riordino su/giù, inserimento ed eliminazione con rinumerazione delle `position`.
- [x] Copia da giornata precedente: nuovi UUID a tutti i livelli, esclusione di data, stato completato, spunte e note generali.
- [x] Validazione di completamento: 2..3 gruppi, ogni gruppo con almeno un esercizio, ogni esercizio con almeno una serie valida; esito con motivo.
- [x] Parsing degli input numerici: ripetizioni intere > 0, peso con virgola o punto e `0` ammesso, valore precedente conservato sugli input non validi.
- [x] Data locale `YYYY-MM-DD` senza conversioni UTC; formattazione italiana separata dal dominio.
- [x] Suggerimenti esercizi dallo storico: dedup per (gruppo, nome normalizzato), filtro sul gruppo, ordinamento per uso più recente, ripiego su tutti.
- [x] Test dei criteri 1, 2, 3 (parte pura), 4, 5, 6, 12 (parte pura) della *Definition of done*. Il criterio **15** (etichetta dello schema) è stato **spostato in Fase 8**: questo piano lo elencava qui, ma il file che lo realizza (`statistics/statKey.ts`) è assegnato alla Fase 8 dallo stesso piano — incoerenza interna corretta.
- **File letti:** `spec-gym-tracker.md`, `prototype/app.js` (`cloneStructure`, `schemeOf`, `exerciseHistory`, `isoDay`).
- **File modificati:** nessuno.
- **File da creare** — cartella `src/domain/` **nuova**, e `src/presentation/` **nuova**:
  - `src/domain/workout.ts` — i tipi della gerarchia stanno nel concetto «allenamento», non in un contenitore `models`: è il vocabolario da cui dipende tutto il resto.
  - `src/domain/muscleGroups.ts` — il catalogo è un dato di dominio con una ragione di cambiare propria (l'elenco dei gruppi), separato da chi lo interroga.
  - `src/domain/identity.ts` — unico punto di generazione degli UUID: isola `crypto.randomUUID` e l'eventuale ripiego (punto da decidere 6).
  - `src/domain/localDate.ts` — algebra della data locale `YYYY-MM-DD`: concetto a sé, richiamato da dominio, persistenza e backup.
  - `src/domain/workoutFactory.ts` — costruzione di bozza, gruppo, esercizio e serie: la creazione ha regole proprie (UUID, `position`, valori iniziali).
  - `src/domain/workoutStructure.ts` — riordino, inserimento, eliminazione e rinumerazione `position`: mutazioni strutturali pure, distinte dalla creazione.
  - `src/domain/workoutCopy.ts` — la copia da giornata precedente ha regole di esclusione proprie e cambia per motivi suoi.
  - `src/domain/workoutCompletion.ts` — regole di validazione del completamento (2..3 gruppi, 1..N): cambiano quando cambiano i vincoli, non quando cambia la struttura.
  - `src/domain/workoutCounts.ts` — conteggi di esercizi e serie usati da home, storico e schermata Dati.
  - `src/domain/setInput.ts` — parsing e validazione dei valori di serie digitati (virgola/punto): confine fra testo dell'utente e dominio.
  - `src/domain/exerciseSuggestions.ts` — derivazione dei suggerimenti dallo storico: funzione pura sui workout, non un catalogo.
  - `src/presentation/italianFormat.ts` — resa testuale in italiano di date, pesi e plurali: è presentazione, tenuta fuori dal dominio e fuori dai componenti.
  - `src/domain/workoutCompletion.spec.ts`, `src/domain/workoutCopy.spec.ts`, `src/domain/localDate.spec.ts`, `src/domain/setInput.spec.ts`, `src/domain/workoutStructure.spec.ts`, `src/domain/exerciseSuggestions.spec.ts` — test accanto al codice testato, come da pattern `src/**/*.spec.ts`.

### Fase 3 — Livello di persistenza Dexie
- [x] Database Dexie con **unica tabella `workouts`**, schema versione 1, indici su `id`, `workoutDate`, `status`, `createdAt`, predisposto a migrazioni.
- [x] Repository con lettura per id, elenco completo, `put` del workout intero, eliminazione, scrittura multipla e sostituzione completa in **una transazione**.
- [x] Richiesta di storage persistente e lettura dello stato, isolate dietro un modulo dedicato.
- [x] Nessun accesso a Dexie fuori da questo livello (verifica per grep alla fine della fase).
- [x] Test dei criteri 3 (round-trip annidato con `position`), 11 (sostituzione transazionale) e 12 (data locale attraverso salvataggio e rilettura) su `fake-indexeddb`.
- **File letti:** `src/domain/workout.ts`, `src/domain/localDate.ts`, `vite.config.ts`.
- **File modificati:** `vite.config.ts` (solo se `setupFiles` per `fake-indexeddb` non è già configurato).
- **File da creare** — cartella `src/persistence/` **nuova**:
  - `src/persistence/gymTrackerDatabase.ts` — definizione dello schema e delle versioni: unico punto che conosce Dexie e le migrazioni.
  - `src/persistence/workoutRepository.ts` — superficie di accesso ai dati con nomi di business; nasconde Dexie al resto dell'app.
  - `src/persistence/storagePersistence.ts` — `navigator.storage.persist()`/`estimate()`: capacità del browser, non del dominio.
  - `src/persistence/appMetaStore.ts` — **condizionale al punto da decidere 5**: piccolo store per la data dell'ultimo backup; da creare solo se si scarta `localStorage`.
  - `vitest.setup.ts` (radice del progetto) — registrazione di `fake-indexeddb/auto`: configurazione di test, non codice applicativo. Da creare solo se lo scaffold non lo prevede già.
  - `src/persistence/workoutRepository.spec.ts` — test di round-trip, transazione e data locale.

### Fase 4 — Composables e servizi applicativi
- [x] Composable del workout aperto: caricamento, mutazioni strutturali delegate al dominio, aggiornamento di `updatedAt`, salvataggio via repository.
- [x] Autosave unico: debounce ~500 ms, **flush forzato** su blur, navigazione e `visibilitychange`, tre stati esposti (in corso, salvato, errore), nessuna scrittura persa all uscita. **Chiuso in Fase 6**: blur sui campi di serie e sulle note, guardia `onBeforeRouteLeave` che attende il flush prima di lasciare il Dettaglio, e `visibilitychange` su `document` con listener rimosso in `onUnmounted`. Il debito segnalato dopo la tranche 2 non esiste piu.
- [x] Composable dello storico: ordinamento decrescente per data e crescente per ora a pari data, sezione «Oggi», filtro per gruppo sui soli gruppi usati, candidati alla copia (ultime 20 giornate, bozze incluse).
- [x] Composable dello stato dello storage e dei conteggi per la schermata Dati.
- [x] Test dell'autosave (debounce, flush, stato di errore) con timer falsi.
- **File letti:** `src/domain/*`, `src/persistence/workoutRepository.ts`.
- **File modificati:** nessuno.
- **File da creare** — cartella `src/composables/` **nuova**:
  - `src/composables/useAutosave.ts` — meccanismo di debounce e flush riusabile, indipendente dal contenuto salvato.
  - `src/composables/useWorkoutDraft.ts` — stato reattivo del workout aperto e cablaggio con dominio, repository e autosave.
  - `src/composables/useWorkoutHistory.ts` — elenco, filtro e raggruppamento per le viste Home, Allenamenti e Nuovo.
  - `src/composables/useStorageStatus.ts` — stato dello storage persistente e conteggi per la schermata Dati.
  - `src/composables/useAutosave.spec.ts` — test con timer falsi.

### Fase 5 — Fondazioni UI: token, shell e routing
- [x] Token CSS custom properties per tema scuro (identità) e chiaro automatico via `prefers-color-scheme`; nessun colore hardcodato nei componenti.
- [x] Stili di base: reset minimo, tipografia, controlli touch ≥ 46 px, focus visibile, nessuno scorrimento orizzontale, aree sicure.
- [x] Router con le sei rotte (home, storico, nuovo, dettaglio, statistiche, dati) e memoria della provenienza per il pulsante indietro.
- [x] Shell: barra superiore appiccicata, barra inferiore a quattro voci con voce attiva, area di contenuto scrollabile.
- [x] Componenti trasversali: icona SVG inline, banner informativo/avviso, stato vuoto, dialogo di conferma generica, messaggio temporaneo.
- [x] Verifica visiva contro il prototipo su larghezza da smartphone e da desktop.
- **File letti:** `prototype/styles.css`, `prototype/index.html`, `prototype/app.js` (icone, `topbar`, `tabbar`, `overlays`).
- **File modificati:** `src/main.ts` (router e stili globali), `src/App.vue` (shell), `index.html` (`lang="it"`, `theme-color`, viewport con `viewport-fit=cover`).
- **File da creare** — cartelle `src/styles/`, `src/router/`, `src/components/shell/`, `src/components/feedback/`, `src/components/icon/` **tutte nuove**:
  - `src/styles/tokens.css` — sede unica dei token di tema: cambia quando cambia l'identità visiva, non quando cambia un componente.
  - `src/styles/base.css` — reset, tipografia e regole di accessibilità globali.
  - `src/router/index.ts` — definizione delle rotte: la navigazione è un concetto a sé, non un dettaglio di `App.vue`.
  - `src/components/shell/AppTopBar.vue` — intestazione contestuale con titolo, indietro e stato del salvataggio.
  - `src/components/shell/AppTabBar.vue` — navigazione inferiore a quattro voci.
  - `src/components/icon/AppIcon.vue` — set di icone SVG inline: sostituisce una libreria di icone, che è vietata.
  - `src/components/feedback/InfoBanner.vue`, `EmptyState.vue`, `ConfirmDialog.vue`, `ToastMessage.vue` — componenti di riscontro all'utente, condivisi da tutte le viste; sottocartella dedicata perché cambiano per la loro ragione (linguaggio dei messaggi), non per quella delle viste.

### Fase 6 — Viste principali: Home, Allenamenti, Nuovo, Dettaglio
- [x] Home: logo, nome, sottotitolo, card «In corso» con «Riprendi» solo in presenza di bozza, pulsante «Nuovo allenamento», ultima giornata completata, accesso allo storico.
- [x] Allenamenti: sezione «Oggi», giornate precedenti, filtro per gruppo, badge, conteggi, apertura ed eliminazione con conferma; stato vuoto per filtro senza risultati.
- [x] Nuovo: data, avviso non bloccante sulle date già usate, elenco delle ultime 20 giornate copiabili con riepilogo, nota su cosa la copia porta e cosa no, creazione immediata della bozza e apertura del dettaglio.
- [x] Dettaglio: note della giornata, sezioni gruppo espanse per default e collassabili, riordino su/giù, esercizi con etichetta dello schema e note, registro delle serie con intestazioni di colonna, `inputmode` corretti, duplica ultima serie, spunte, aggiunta esercizio con suggerimenti, vincolo 2–3 gruppi al completamento, riapertura ed eliminazione. **Nessuna modale annidata.**
- [x] Stato del salvataggio visibile nell'intestazione nei tre stati.
- [x] Verifica manuale dei percorsi utente del prototipo, incluso il ritorno alla schermata di provenienza.
- **File letti:** `prototype/app.js` (`viewHome`, `viewHistory`, `viewNew`, `viewWorkout`), `src/composables/*`, `src/domain/*`.
- **File modificati:** `src/router/index.ts` (rotte definitive e provenienza).
- **File da creare** — cartelle `src/views/` e `src/components/workout/` **nuove**:
  - `src/views/HomeView.vue`, `src/views/WorkoutHistoryView.vue`, `src/views/NewWorkoutView.vue`, `src/views/WorkoutDetailView.vue` — una vista per rotta, thin: compongono componenti e composables senza logica di dominio.
  - `src/components/workout/WorkoutCard.vue` — card di giornata riusata da home e storico.
  - `src/components/workout/MuscleGroupSection.vue` — sezione collassabile di gruppo con riordino e conteggi.
  - `src/components/workout/ExerciseBlock.vue` — esercizio con schema, note e azioni.
  - `src/components/workout/SetRegister.vue` — registro delle serie con intestazioni di colonna e input numerici.
  - `src/components/workout/ExercisePicker.vue` — nome nuovo esercizio più suggerimenti dallo storico.
  - `src/components/workout/SaveStateBadge.vue` — i tre stati dell'autosave.
  - `src/components/workout/MuscleGroupPicker.vue` — **condizionale al punto da decidere 1**: selettore esplicito del gruppo da aggiungere.
  - Sottocartella `workout/` motivata dalla coesione lessicale: questi componenti nascono e cambiano insieme al concetto «giornata di allenamento», e nessuno di essi serve alle statistiche o al backup.

### Fase 7 — Backup: esportazione e importazione
- [x] Formato di backup con `formatVersion: 1`, istante di esportazione, elenco degli allenamenti; nome file `gym-tracker-backup-YYYY-MM-DD.json`.
- [x] Validazione **integrale** prima di qualunque scrittura: versione, struttura, tipi, gerarchia, `workoutDate` locale, `position`, valori delle serie.
- [x] Riepilogo dell'importazione: totale nel file, nuovi, già presenti, più recenti del locale.
- [x] Unione per `id` con `updatedAt` più recente, **unità di merge il workout intero**; sostituzione completa in una transazione, previa conferma.
- [x] Vista Dati: stato storage, ultimo backup, conteggi, esportazione, importazione con riepilogo e le due strade. **Non fatta**: è UI, tranche successiva.
- [x] Test dei criteri 7, 8, 9, 10, 11.
- **File letti:** `src/persistence/workoutRepository.ts`, `src/domain/workout.ts`, `prototype/app.js` (`viewData`).
- **File modificati:** nessuno.
- **File da creare** — cartelle `src/backup/` e `src/components/backup/` **nuove**:
  - `src/backup/backupFormat.ts` — tipo del file e costante di versione: il formato è un contratto con l'esterno e ha una ragione di cambiare propria.
  - `src/backup/backupValidation.ts` — validazione integrale del file: funzione pura, nessun accesso al database.
  - `src/backup/backupExport.ts` — costruzione dell'oggetto, nome file e download.
  - `src/backup/backupImportPlan.ts` — riepilogo e decisioni di merge, pure e testabili senza IndexedDB.
  - `src/backup/backupImportService.ts` — applicazione del piano via repository (unione o sostituzione transazionale): unico punto con effetti.
  - `src/composables/useBackup.ts` — cablaggio della vista Dati con export, validazione e import.
  - `src/views/DataView.vue` — vista Dati e backup.
  - `src/components/backup/ImportSummaryCard.vue` — riepilogo del file valido con le due azioni.
  - `src/backup/backupValidation.spec.ts`, `src/backup/backupExport.spec.ts`, `src/backup/backupImportPlan.spec.ts`, `src/backup/backupImportService.spec.ts`.

### Fase 8 — Statistiche
- [x] Chiave `posizione × gruppo × esercizio × schema`, con la sequenza completa dei gruppi **esclusa** dalla chiave; etichetta `NxR` o tupla con trattini.
- [x] Raccolta delle voci dai soli allenamenti `completed`, includendo **tutte** le serie a prescindere dal flag della singola serie; funzioni pure, nessuna scrittura.
- [x] Navigazione a quattro passi con breadcrumb, opzioni presenti nello storico, conteggi, ricerca per nome al passo degli esercizi, nessun filtro che nasconda gli schemi con una sola sessione. **Chiuso in Fase 8 (UI)**.
- [x] Vista finale: tabella con sessioni in ordine decrescente e colonne `S1…Sn`, più sparkline SVG scritta a mano con una linea per posizione di serie, legenda e assi; gestione di sessione unica e di pesi tutti uguali. **Non fatta**: è UI, tranche successiva.
- [x] Scorciatoia contestuale dall'esercizio in compilazione alla vista finale, con messaggio dedicato quando lo schema è nuovo. **Non fatta**: è UI, tranche successiva.
- [x] Test dei criteri 13, 14, 15, 16 e della geometria della sparkline.
- **File letti:** `prototype/app.js` (`statEntries`, `statSessions`, `sparkline`, `statTable`, `crumb`), `src/domain/workout.ts`.
- **File modificati:** `src/components/workout/ExerciseBlock.vue` (scorciatoia), `src/router/index.ts` (parametri della scorciatoia).
- **File da creare** — cartelle `src/domain/statistics/` e `src/components/statistics/` **nuove**:
  - `src/domain/statistics/statKey.ts` — chiave ed etichetta dello schema: è il cuore delicato della SPEC, in un file proprio e testato da solo. Sottopackage di `domain` perché le statistiche sono un concetto del dominio con più moduli coesi fra loro.
  - `src/domain/statistics/statEntries.ts` — estrazione delle voci dagli allenamenti completati.
  - `src/domain/statistics/statNavigation.ts` — opzioni e conteggi dei quattro passi, ricerca inclusa.
  - `src/domain/statistics/statSessions.ts` — sessioni di una chiave, in ordine cronologico.
  - `src/domain/statistics/sparklineGeometry.ts` — scala e coordinate: calcolo puro, separato dal componente che disegna, così è testabile senza DOM.
  - `src/composables/useStatisticsPath.ts` — stato del percorso a quattro passi e ingresso dalla scorciatoia.
  - `src/views/StatisticsView.vue` — vista delle statistiche.
  - `src/components/statistics/StatBreadcrumb.vue`, `StatDrillItem.vue`, `StatSparkline.vue`, `StatWeightTable.vue` — componenti dedicati alle statistiche, coesi fra loro e inutili altrove.
  - `src/domain/statistics/statKey.spec.ts`, `statEntries.spec.ts`, `sparklineGeometry.spec.ts`.

### Fase 9 — PWA: manifest, icone, service worker, aggiornamento
- [x] Manifest con nome, nome breve, descrizione, `display: standalone`, colori di tema e sfondo coerenti con i token.
- [x] Icone derivate da `home.png`: 192, 512 e maskable 512.
- [x] Service worker con precache degli asset applicativi e funzionamento offline dopo il primo caricamento; **nessuna cache manuale di IndexedDB**.
- [x] `registerType: 'prompt'` con barra di notifica discreta e ignorabile.
- [x] Verifica: installabilità su Android, avvio offline, aggiornamento proposto e non imposto.
- **File letti:** `home.png`, `vite.config.ts`, `prototype/README.md` (comportamento della barra di aggiornamento).
- **File modificati:** `vite.config.ts` (configurazione `vite-plugin-pwa`), `index.html`, `src/App.vue` (montaggio della barra di aggiornamento).
- **File da creare** — cartella `public/icons/` **nuova**:
  - `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png` — asset statici serviti così come sono: `public/` è la sede prevista da Vite, la sottocartella `icons/` separa le icone di installazione dagli altri asset.
  - `public/home.png` — copia del logo servita all'app (l'originale in radice resta il file sorgente).
  - `src/composables/usePwaUpdate.ts` — stato dell'aggiornamento disponibile, isolato dal componente che lo mostra.
  - `src/components/shell/UpdateBar.vue` — barra di aggiornamento, parte della shell.

### Fase 10 — Suite di test e verifica della Definition of done
- [x] Matrice criterio → test: uno per ciascuno dei criteri 1–16 della *Definition of done*.
- [x] Suite completa verde su `fake-indexeddb`; nessun test dipendente dall'ora o dal fuso della macchina (fuso non UTC verificato esplicitamente per il criterio 12).
- [x] `vue-tsc` senza errori, ESLint senza errori, build di produzione riuscita.
- [~] Verifica in revisione dei criteri 17–20. **19 e 20 chiusi** (grep: zero `dexie` fuori da `persistence/`, zero `localStorage`, zero `any` espliciti; `prototype/` intatto e assente da `dist/`, verificato per contenuto). **17 chiuso in revisione** dalla fase di verifica, che ha confrontato riga per riga testi, label, badge, icone, token e geometria della sparkline con il prototipo — resta la conferma a occhio dell'utente, che il processo non può sostituire. **18 parziale**: manifest, icone con `purpose` corretti, `registerType: 'prompt'`, service worker con precache di 41 voci e assenza di cache manuale di IndexedDB sono verificati sull'output di build; **installazione reale su Android e prova offline su dispositivo restano da fare all'utente**.
- **File letti:** tutti i `*.spec.ts` creati, `spec-gym-tracker.md`.
- **File modificati:** i `*.spec.ts` che risultassero scoperti rispetto alla matrice.
- **File da creare:** eventuali `src/**/*.spec.ts` mancanti per coprire un criterio scoperto.

### Fase 11 — Documentazione e chiusura
- [x] `README.md`: cosa fa l'app, requisiti (Node 18), avvio, test, lint, build, pubblicazione su Cloudflare Pages, formato del backup versione 1, nota che `prototype/` è un mockup eliminabile.
- [x] Registro di questo file completo: decisioni, deviazioni, esiti dei test.
- [x] Esito finale compilato e stato portato a `COMPLETED`.
- **File letti:** `spec-gym-tracker.md`, `package.json`.
- **File modificati:** `implementation-gym-tracker.md` (stato, spunte, registro, esito).
- **File da creare:** `README.md` (radice del progetto) — documentazione d'ingresso del repository, sede canonica.

## File coinvolti (effettivi)
Pre-compilati in via **provvisoria** dall'analisi del prototipo e della SPEC; **da confermare e correggere in Fase 1**. Formato: `` `path` — motivo``.

- `src/domain/workout.ts` — tipi della gerarchia
- `src/domain/muscleGroups.ts` — catalogo costante dei gruppi
- `src/domain/identity.ts` — generazione UUID
- `src/domain/localDate.ts` — data locale `YYYY-MM-DD`
- `src/domain/workoutFactory.ts` — creazione di bozza, gruppo, esercizio, serie
- `src/domain/workoutStructure.ts` — riordino, inserimento, eliminazione, `position`
- `src/domain/workoutCopy.ts` — copia da giornata precedente
- `src/domain/workoutCompletion.ts` — validazione del completamento
- `src/domain/workoutCounts.ts` — conteggi esercizi e serie
- `src/domain/setInput.ts` — parsing di ripetizioni e peso
- `src/domain/exerciseSuggestions.ts` — suggerimenti dallo storico
- `src/domain/statistics/statKey.ts` — chiave statistica ed etichetta dello schema
- `src/domain/statistics/statEntries.ts` — voci dalle giornate completate
- `src/domain/statistics/statNavigation.ts` — opzioni dei quattro passi
- `src/domain/statistics/statSessions.ts` — sessioni di una chiave
- `src/domain/statistics/sparklineGeometry.ts` — geometria della sparkline
- `src/presentation/italianFormat.ts` — date, pesi e plurali in italiano
- `src/persistence/gymTrackerDatabase.ts` — schema Dexie v1, tabella `workouts`
- `src/persistence/workoutRepository.ts` — accesso ai dati
- `src/persistence/storagePersistence.ts` — storage persistente
- `src/persistence/appMetaStore.ts` — data dell'ultimo backup (condizionale)
- `src/backup/backupFormat.ts`, `backupValidation.ts`, `backupExport.ts`, `backupImportPlan.ts`, `backupImportService.ts` — formato e flusso di backup
- `src/composables/useAutosave.ts`, `useWorkoutDraft.ts`, `useWorkoutHistory.ts`, `useStorageStatus.ts`, `useStatisticsPath.ts`, `useBackup.ts`, `usePwaUpdate.ts` — servizi applicativi
- `src/router/index.ts` — rotte e provenienza
- `src/styles/tokens.css`, `src/styles/base.css` — token e stili di base
- `src/components/shell/AppTopBar.vue`, `AppTabBar.vue`, `UpdateBar.vue` — shell
- `src/components/icon/AppIcon.vue` — icone SVG inline
- `src/components/feedback/InfoBanner.vue`, `EmptyState.vue`, `ConfirmDialog.vue`, `ToastMessage.vue` — riscontri all'utente
- `src/components/workout/WorkoutCard.vue`, `MuscleGroupSection.vue`, `ExerciseBlock.vue`, `SetRegister.vue`, `ExercisePicker.vue`, `SaveStateBadge.vue`, `MuscleGroupPicker.vue` — compilazione della giornata
- `src/components/statistics/StatBreadcrumb.vue`, `StatDrillItem.vue`, `StatSparkline.vue`, `StatWeightTable.vue` — statistiche
- `src/views/HomeView.vue`, `WorkoutHistoryView.vue`, `NewWorkoutView.vue`, `WorkoutDetailView.vue`, `StatisticsView.vue`, `DataView.vue` — una vista per rotta
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `public/home.png` — asset PWA
- `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.vue`, `vitest.setup.ts` — configurazione, shell e test
- `README.md` — documentazione d'ingresso

**Cartelle che non esistono ancora:** `src/domain/`, `src/domain/statistics/`, `src/presentation/`, `src/persistence/`, `src/backup/`, `src/composables/`, `src/router/`, `src/styles/`, `src/components/` con `shell/`, `icon/`, `feedback/`, `workout/`, `statistics/`, `src/views/`, `public/icons/`. L'asse di organizzazione scelto è il **livello** (dominio, persistenza, backup, composables, presentazione, componenti, viste) con sottocartelle per **concetto** dove i file sono coesi (`statistics`, `workout`); nessun contenitore generico (`utils`, `common`, `helpers`, `models`).

## Registro
Voci datate (`YYYY-MM-DD`), append-only.

- **Decisioni tecniche** (non cambiano il comportamento) — `Decisione · Motivazione · Impatto`:
  - `2026-08-26` · Gli **otto punti aperti della SPEC sono tutti risolti** dal processo principale prima dell'inizio dell'implementazione · vedi § *Punti decisi* della SPEC, che ora è la fonte autorevole · nessuna fase resta bloccata; `MuscleGroupPicker.vue` e `appMetaStore.ts`, prima condizionali, sono **da creare**.
  - `2026-08-26` · **Dipendenze installate e `package.json` scritto dal processo principale**, non dalla Fase 1 · il prompt dell'utente assegna esplicitamente a Claude Code la preparazione dell'ambiente · versioni effettive: Vite 6.4.3, Vitest 3.2.7, Vue 3.5.41, Vue Router 4.6.4, Dexie 4.4.5, fake-indexeddb 6.2.5, vite-plugin-pwa 0.21.2, TypeScript 5.7.3, vue-tsc 2.2.12, ESLint 9.39.5, typescript-eslint 8.68.0, eslint-plugin-vue 9.33.0, @vue/eslint-config-typescript 14.9.0, @vitejs/plugin-vue 5.2.4. `npm audit`: 0 vulnerabilità. Node 18.20.8, npm 10.8.2.
  - `2026-08-26` · **I file di configurazione non esistono ancora**: `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.ts`, `src/App.vue`, `vitest.setup.ts` sono **da creare** in Fase 1 · lo scaffold interattivo di Vue è stato evitato per pinnare le versioni compatibili con Node 18 · la Fase 1 passa da «verificare» a «creare e verificare».
  - `2026-08-26` · **Asset PWA già generati** in `public/` dal processo principale, con nomi diversi da quelli previsti in Fase 9 · vedi punto 9 dei *Punti decisi* della SPEC · la Fase 9 non genera icone: consuma quelle esistenti. `public/icons/` **non** va creata.
  - `2026-08-26` · **Git inizializzato** (branch `master`, `.gitignore` scritto, nessun commit) · i commit passano da `git-specialist` su richiesta dell'utente · nessun impatto sul codice.
- **Deviazioni dalla SPEC** (da motivare) — `Descrizione · Motivazione · Impatto · Aggiorna la SPEC? sì/no`: nessuna.
- **Problemi aperti** (bloccano l'avanzamento) — `Descrizione · Impatto · Opzioni · Decisione richiesta`: nessuno.
- **Test eseguiti** — `data · fase · comando · esito`:
  - `2026-08-26` · ambiente · `npm install` + `npm audit fix` · 548 pacchetti, 0 vulnerabilità
  - `2026-08-26` · ambiente · `npx vite --version`, `npx vitest --version`, `npx eslint --version`, `npx vue-tsc --version` · tutti eseguibili su Node 18.20.8
  - `2026-08-26` · Fasi 1-3 · `npm run lint` · 0 errori, 0 warning
  - `2026-08-26` · Fasi 1-3 · `npm run typecheck` · pulito
  - `2026-08-26` · Fasi 1-3 · `npm test` · **8 file, 49 test, tutti verdi**
  - `2026-08-26` · Fasi 1-3 · `npm run build` · riuscita, bundle 61,5 kB (24,5 kB gzip)
  - `2026-08-26` · Fasi 1-3 · verifica indipendente dei quattro comandi dal processo principale · confermati tutti e quattro
  - `2026-08-26` · Fasi 4/7/8 senza UI · `npm run lint` · 0 errori, 0 warning
  - `2026-08-26` · Fasi 4/7/8 senza UI · `npm run typecheck` · pulito su **entrambi** gli scope
  - `2026-08-26` · Fasi 4/7/8 senza UI · `npm test` · **22 file, 119 test, tutti verdi** (49 + 70 nuovi)
  - `2026-08-26` · Fasi 4/7/8 senza UI · `npm run build` · riuscita, bundle invariato a 61,5 kB — atteso: i nuovi moduli non sono ancora referenziati da alcuna vista
  - `2026-08-26` · Fasi 4/7/8 senza UI · verifica indipendente del processo principale · quattro comandi confermati; `grep` di `dexie` → solo `src/persistence/gymTrackerDatabase.ts`; `grep` di `localStorage` → nessuna occorrenza; scope del type-check confermati con `--listFiles`
  - `2026-08-26` · Fasi 5-6 · `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` · **23 file, 135 test verdi**; verificati indipendentemente dal processo principale
  - `2026-08-26` · Fasi 7-9 · `npm run build` · **FALLITO** su `ReferenceError: crypto is not defined` — vedi la sezione su `serialize-javascript`
  - `2026-08-26` · Fasi 7-9 · `npm run build` dopo l'`overrides` · **riuscita**; `dist/sw.js`, `dist/workbox-2fbc6a65.js`, `dist/manifest.webmanifest`, precache 42 voci; chunk `dexie-*.js` 96,6 kB (32,5 kB gzip), `index-*.js` 102,9 kB (40,3 kB gzip)
  - `2026-08-26` · Fasi 7-9 · `npm run lint`, `npm run typecheck`, `npm test` · **24 file, 147 test verdi**; verificati indipendentemente dal processo principale
  - `2026-08-26` · criterio 20 · `prototype/` invariato (timestamp anteriori all'implementazione) e assente da `dist/`, verificato per contenuto e non per nome di file
  - `2026-08-26` · criterio 18 (parziale) · contenuto di `dist/manifest.webmanifest` ispezionato: nome, `display: standalone`, `lang: it`, colori `#0f1211`, tre icone con `purpose` corretti (`any`, `any`, `maskable`)

### Decisioni della tranche 1 (Fasi 1-3), prese dall'implementer e ratificate

- `notes` è `string` obbligatoria con default `''` invece di `notes?` opzionale, su `Workout`, `Exercise` e `ExerciseSet` · evita l'attrito di `exactOptionalPropertyTypes` in ogni punto che costruisce o copia; coerente con il prototipo, che valorizza sempre `notes: ''` · comportamento equivalente.
- Un solo `tsconfig.json` senza project references · con `vue-tsc --noEmit` (senza `-b`) un tsconfig radice di sole referenze controllerebbe zero file **in silenzio**: è il modo peggiore di sbagliare · vedi sotto per la correzione su `@types/node`.
- `vitest.setup.ts` polyfilla `globalThis.crypto` da `node:crypto` · l'ambiente `node` di Vitest 3 non espone il global `crypto` che Node 18 e i browser forniscono; verificato empiricamente, altrimenti `identity.ts` falliva nei test su entrambi i rami · nessun effetto sul codice spedito.
- `identity.ts` legge `globalThis.crypto` e non `crypto` nudo · l'identificatore nudo solleverebbe `ReferenceError` dove non esiste, invece di far scattare il ripiego.
- `addMuscleGroup` rifiuta i duplicati ma **non** applica il tetto di 3 · la SPEC dice che in bozza qualsiasi numero è ammesso e salvabile; il tetto è una cortesia della UI in Fase 6.
- Le funzioni strutturali non toccano `updatedAt` · restano pure e deterministiche; l'aggiornamento è del composable di Fase 4.
- `WorkoutOperationOutcome` condiviso in `workout.ts` fra `workoutStructure.ts` e `workoutCompletion.ts` · stesso esito a due rami, evita di duplicare il tipo.
- Aggiunto `src/domain/identity.spec.ts`, non previsto dall'elenco del piano · copre sia `crypto.randomUUID` sia il ripiego `getRandomValues`, ed è l'unico punto di generazione UUID dell'app.
- **Note della singola serie azzerate nella copia** · la SPEC elencava fra ciò che si copia le «note degli esercizi» e non le note di serie, e fra ciò che non si copia le spunte delle serie: una nota di serie («ultima serie tirata») è il resoconto di *quella* sessione, come la spunta, quindi segue la spunta · scelta dell'implementer, **ratificata dal processo principale**; il prototipo la copiava, ed è il prototipo a sbagliare.

### Decisioni della tranche 2 (Fasi 4, 7 e 8 senza UI), prese dall'implementer e ratificate

- **Type-check a solution file**: `tsconfig.json` di sole `references`, `tsconfig.app.json` (scope `src/**`, tipi `vite/client`, **nessun** tipo Node) e `tsconfig.node.json` (scope `vite.config.ts` + `vitest.setup.ts`, tipi `node` + `DOM`). Script: `vue-tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit`. La trappola è stata **dimostrata** — `vue-tsc --noEmit` sul solo solution file esce 0 senza controllare nulla — e la correzione verificata con un errore volontario per scope. Verifica indipendente del processo principale: 55 file nello scope app, 2 nello scope node, e nessun uso di `process`, `Buffer` o `node:*` nel codice di produzione sotto `src/`.
- ESLint salito da `vueTsConfigs.recommended` a **`recommendedTypeChecked`**, ora che i tipi risolvono: regole come `no-floating-promises` e `require-await` sono attive, verificate con codice sentinella. Lint resta a 0.
- `useAutosave` **non registra da sé** i listener di blur, navigazione e `visibilitychange`: espone `flush()`. L'ambiente di test è `node`, senza DOM né router. **Debito esplicito per la Fase 6**, senza il quale «nessuna scrittura persa all'uscita» non è soddisfatto.
- `useBackup.prepareImport` accetta **il testo** del file, non un `File` del DOM: la lettura del file resta alla UI e il composable resta testabile senza browser.
- `useStatisticsPath` si autocarica dal repository con `reload()`, per coerenza con `useWorkoutHistory` e `useStorageStatus`, invece di ricevere i workout come parametro.
- `isValidLocalDate` aggiunta a `localDate.ts`, e `sameRepetitionScheme`/`sameStatKey` estratte in `statKey.ts` per evitare duplicazione fra `statNavigation` e `statSessions`: riuso reale, non anticipato.
- L'editing di note, ripetizioni e peso **non** è in `useWorkoutDraft`: il mandato della Fase 4 riguardava le mutazioni **strutturali**. Da coprire in Fase 6.
- `useBackup.ts` è l'unico modulo della tranche **senza spec proprio**: le sue dipendenze sono testate a valle. Da chiudere in Fase 10.
- Scansione anti-densità dichiarata dall'implementer: 8 violazioni reali corrette (chiamate annidate negli argomenti) in `useWorkoutDraft`, `useStorageStatus`, `useBackup`, `backupImportPlan`, `backupValidation`, `statNavigation`, `sparklineGeometry`, `localDate`.

### Tranche 4 (Fasi 7 UI, 8 UI, 9 PWA + tre correzioni), ratificata

- **Aree di tocco portate a 46×46** con uno pseudo-elemento `::after` trasparente, **senza cambiare le dimensioni visive** dei controlli del prototipo. Effetto collaterale trovato e risolto dall'implementer: con `gap` di 6-8 px le aree estese di due pulsanti adiacenti si **sovrapponevano**, col rischio concreto di toccare «elimina» invece di «sposta su». Ha allargato i soli `gap` in tre righe (`.ex-head` 6→12, `.grp-head` 8→12, `.sets-row` 6→10) fino ad azzerare la sovrapposizione. Nessuna riga è risultata irrecuperabile.
- **Chunk di Dexie isolato e nominato** via `manualChunks`: era mascherato da `italianFormat` perché Rollup battezza il chunk condiviso col nome di uno dei suoi moduli. Ora `dexie-*.js`, 96,6 kB (32,5 kB gzip). Splitting per rotta invariato.
- `useBackup.spec.ts` scritto: la lacuna della tranche 2 è chiusa.
- `sparklineGeometry.ts` esteso con `computeWeightGridLines`, così il componente **disegna** senza ricalcolare la scala. `italianFormat.ts` esteso con `formatWorkoutDayCompact`. `useStorageStatus.ts` esteso con `requestPersistence()`. Tutti con test.
- Tipi PWA risolti aggiungendo `vite-plugin-pwa/client` ai `types` di `tsconfig.app.json`, senza `any`.
- `usePwaUpdate.ts` resta senza spec: wrapper sottile di `virtual:pwa-register/vue`, modulo virtuale non disponibile nell'ambiente `node` di Vitest.
- `StatSession` non porta un id stabile: la `key` di riga nella tabella usa `workoutDate + weights` come surrogato. Segnalato, non modificato perché fuori perimetro.

### `serialize-javascript`: il build della PWA era rotto, ed era colpa mia

- `2026-08-26` · **Diagnosi.** Con `vite-plugin-pwa` attivo, `npm run build` falliva con `ReferenceError: crypto is not defined` in `serialize-javascript/index.js:54`, dentro la catena `vite-plugin-pwa → workbox-build → @rollup/plugin-terser → serialize-javascript`. L'implementer l'aveva attribuito a un artefatto di questa shell e aggirato con un preload esterno non committato: **diagnosi sbagliata**. Verificato dal processo principale: `NODE_OPTIONS` vuoto, nessun `.npmrc`, `package.json` pulito, e in un file reale su Node 18.20.8 `globalThis.crypto` è **`undefined`** — il global di Web Crypto arriva con Node 19. `serialize-javascript@7.1.0` chiama `crypto.getRandomValues()` **al caricamento del modulo**, quindi il build non può che rompersi.
- **Causa a monte**: l'`npm audit fix` eseguito dal processo principale all'inizio del progetto ha portato `serialize-javascript` da 6.x a 7.1.0, e la 7 è passata da `randomBytes` di Node al global di Web Crypto. La correzione di sicurezza ha rotto il build su Node 18.
- **Rimedio applicato**: `overrides: { "serialize-javascript": "^6.0.2" }` in `package.json`. La 6.0.2 non usa `crypto` affatto. Build riparata e verificata: `dist/sw.js`, `dist/workbox-*.js`, `dist/manifest.webmanifest`, precache di 42 voci (451 KiB).
- **Costo accettato**: `npm audit` torna a segnalare 1 alta e 3 moderate, **tutte nella catena di build**, nulla che finisca nel bundle servito al browser, e con l'unico input che è il nostro stesso service worker. Le alternative sono peggiori o fuori portata: `--experimental-global-webcrypto` nello script di build propaga un flag su un Node già EOL; passare a Node ≥ 20 risolve tutto e permette di **rimuovere l'`overrides`**, ma cambia l'ambiente dell'utente, che in Q1 aveva scelto di restare su Node 18. Documentato nel README.

### Correzioni del processo principale dopo la tranche 1

- `2026-08-26` · Aggiunta la devDependency **`@types/node@22.20.1`** (`npm audit`: 0 vulnerabilità) · l'implementer aveva dovuto tenere `vite.config.ts` e `vitest.setup.ts` **fuori dal type-check** perché i tipi di Node mancavano, e in Fase 9 quel file cresce con la configurazione di `vite-plugin-pwa`, dove i tipi servono davvero · da cablare all'inizio della tranche 2: i file di configurazione tornano sotto type-check, con i tipi di Node **non** in scope per il codice del browser.

## Modifiche successive alla chiusura, richieste dall'utente dopo la prova sul campo

`2026-08-26` — l'utente ha provato l'app e ha segnalato tre cose. Tutte affrontate.

**1. Minimo dei gruppi muscolari da 2 a 1** (il massimo resta 3). *Cambio di requisito*, non correzione: **supera** la richiesta originale «un allenamento completato deve contenere almeno 2 e al massimo 3 gruppi muscolari». La segnalazione era «non è possibile creare un allenamento con un solo gruppo»; la verifica ha mostrato che **creare** funzionava già — solo la data è validata — e che il blocco era sul **completamento**. Il fastidio vero stava a valle: le statistiche considerano solo le giornate `completed`, quindi una sessione su un solo gruppo restava bozza per sempre e non entrava mai nei grafici. Scelta fra tre alternative (`1..3`, `1..N`, lasciare `2..3`) portata all'utente, che ha scelto `1..3`. Aggiornati dominio, messaggi, test, SPEC (punto 10 dei «Punti decisi», col punto 4 storico lasciato intatto) e README.
   - Trovato e rimosso un **numero magico**: il messaggio di rifiuto in `workoutStructure.ts` conteneva il `2` scritto a mano invece di derivarlo dalla costante. Riscritto senza numero, per non introdurre un problema di concordanza singolare/plurale.
   - Trovato un test che il cambio avrebbe reso **falsamente verde**: `useWorkoutDraft.spec.ts` verificava un rifiuto su una scena ora legittima. Riscritto.

**2. Azzeramento di tutti i dati locali con doppia conferma**, richiesto dall'utente. Sezione «Zona pericolosa» distinta in fondo alla schermata Dati; prima conferma che **quantifica** la perdita e invita a esportare, seconda che dichiara l'irreversibilità; `resetAllLocalData` svuota `workouts` **e** la data dell'ultimo backup in `appMeta` in **una sola transazione**, con test sia dello svuotamento sia dell'atomicità su fallimento a metà. Pulsante disabilitato con spiegazione quando non c'è nulla da azzerare. Un unico stato discriminato in `DataView.vue` rende **impossibile per costruzione** che i due passi coesistano fra loro o col dialogo di sostituzione da import.

**3. Il pulsante «Richiedi» dello storage persistente non faceva nulla di visibile.** Diagnosi: il codice chiamava `navigator.storage.persist()` ma **scartava il valore di ritorno**. Chrome su desktop, su `http://localhost`, con l'app non installata, risponde `false`; lo stato si ricaricava identico e all'utente non arrivava niente. Non era il browser a sbagliare, era l'interfaccia a tacere. Corretto: `requestPersistentStorage` restituisce ora `'granted' | 'denied' | 'unavailable'` invece di un booleano che confondeva **rifiuto** e **API assente**, l'esito arriva alla vista, ogni caso produce un riscontro, e il rifiuto **spiega che serve installare l'app** invece di sembrare un guasto. Se l'API non c'è, il pulsante non compare affatto. Tre rami coperti da test con `navigator.storage` sostituito da un doppio.

**Correzione di collocazione applicata dopo**: `DataView.vue` era l'unica vista del progetto a importare comportamento da `src/persistence/`. La chiamata di azzeramento è stata spostata in `useBackup.ts`, che già possiede le operazioni sui dati di quella schermata — non è un passacarte, è la famiglia giusta.

**Verifiche dopo queste modifiche**: `npm run lint` 0, `npm run typecheck` pulito su entrambi gli scope, `npm test` **157 test verdi in 24 file**, `npm run build` riuscita con precache di 41 voci (455 KiB). Confine architetturale confermato per grep: zero riferimenti a Dexie fuori da `src/persistence/`.

**Conferma dall'utente sul criterio 17**: uno screenshot della schermata Dati in tema chiaro ha mostrato layout, barra a quattro voci, cifre in colonna e gerarchia coerenti col prototipo approvato. È la parte del criterio che il processo non poteva chiudere da sé.

## Richieste successive dell'utente, dopo l'uso reale (secondo giro)

`2026-08-26` — tre richieste, tutte evase.

**1. Aiuto alla compilazione del nome esercizio.** Il motore esisteva già (`suggestExerciseNames`: filtro sul gruppo, dedup, ordine per uso recente), ma le pastiglie erano **statiche**. Aggiunta `filterSuggestionsByQuery`, funzione pura: corrispondenza **in qualunque punto** del nome, insensibile a maiuscole e ad **accenti** (NFD più rimozione dei diacritici combinanti). Tetto di 8 pastiglie con indicazione «+N altri»; campo vuoto mostra i più recenti; nessuna corrispondenza dichiara che sarà un esercizio nuovo invece di lasciare un'intestazione sul vuoto.

**2. Ambiente per i test di componente.** Aggiunte `jsdom` 25.0.1 e `@vue/test-utils` 2.4.11 in sviluppo. Il default resta `node`: i soli file di componente si dichiarano `jsdom` con il docblock per-file, così nessun glob troppo largo cattura per sbaglio un test puro. Verificato **empiricamente** che i test puri non vedano il DOM e quelli di componente sì. È una revisione di una mia scelta precedente: avevo escluso i test di componente perché mancava l'ambiente, ma «filtra mentre digito» è comportamento, e va provato.

**3. Indicatore di caricamento** (barra sottile più stato nei pulsanti, forma scelta dall'utente). Tre regole, imposte perché su IndexedDB locale quasi tutto finisce in 1–20 ms e un indicatore ingenuo **lampeggia**: soglia di comparsa 180 ms, permanenza minima 300 ms, e un **contatore** di operazioni in volo invece di un booleano — con un booleano la seconda operazione che finisce spegne la barra mentre la prima lavora ancora. Barra da 2 px montata una volta nella barra superiore; `BusyButton` riusabile invece di sei copie dello stesso stato; `ConfirmDialog` esteso con uno stato occupato che blocca anche Annulla, Escape e il tocco fuori. `prefers-reduced-motion` rispettato. Il ripristino del pulsante avviene in `finally`, anche in caso di errore.

### Due difetti trovati verificando, non dichiarati dagli agenti

**Byte NUL grezzo in un sorgente.** `grep` segnalava `exerciseSuggestions.ts` come **file binario**: dentro c'era un NUL (`0x00`) infilato in un template literal come separatore della chiave di storico, al posto di uno spazio. L'intento era difendibile — un separatore che non può comparire nei nomi elimina una collisione teorica fra «Petto»+«piana» e «Petto piana»+«» — ma come **byte grezzo** è un difetto: invisibile nel sorgente, rende il file binario per gli strumenti, rompe la ricerca testuale. Scansionati tutti i sorgenti del progetto: un solo punto colpito. Sostituito con la sequenza di escape visibile, comportamento a runtime identico, verificato dai test ancora verdi.

> Nota di metodo: il primo tentativo di correzione **dichiarò successo senza aver modificato il file** — il quoting della shell aveva mangiato gli escape. Scoperto ricontrollando i byte all'offset esatto invece di fidarsi del messaggio di successo. Lo stesso inciampo si è ripetuto due volte in questa sessione su contenuti con backtick e sequenze di escape: per quei contenuti va usato un file di script o il tool di scrittura, mai una riga di shell.

**La soglia dell'indicatore si azzerava fra due span consecutivi.** L'agente l'aveva liquidato come «sotto il millisecondo, irrilevante». Non lo era: `end()` **cancellava** il timer di comparsa quando il contatore toccava zero, e il caricamento di una schermata è fatto di **due span consecutivi** — la navigazione, chiusa da `router.afterEach`, e il caricamento dati della vista, aperto in `onMounted`. Navigazione da 150 ms più dati da 150 ms danno 300 ms di attesa reale in cui la barra non compariva **mai**, perché ogni tratto rimetteva l'orologio a zero. Invisibile su `localhost`, dove tutto sta in una decina di millisecondi; realistico su telefono in rete mobile al primo ingresso in Statistiche, fra scaricamento del chunk della rotta e scansione dello storico.

Corretto facendo **decidere il timer alla propria scadenza** in base allo stato di quel momento: se c'è ancora lavoro in volo mostra, altrimenti si spegne da sé. Così non resta mai appeso e gli span consecutivi si **sommano** ai fini della soglia. `begin()` non programma un secondo timer se ce n'è già uno pendente. Tre test nuovi, incluso quello che protegge dal rischio opposto — un timer pendente che accende la barra a vuoto mentre l'utente è fermo — verificato con `vi.getTimerCount()`.

### L'indicatore era corretto e invisibile

L'utente ha segnalato di non vedere l'indicatore. Verificato: **non era rotto** — barra montata nella barra superiore, span aperti e chiusi dal router, guardie corrette. Non aveva nulla da segnalare. Misurato con uno spec temporaneo poi rimosso: leggere 21 allenamenti dal database dura **0,9 ms**, contro una soglia di comparsa a 180 — duecento volte di scarto. Su questa app un indicatore onesto resta invisibile quasi sempre: corretto in teoria, inutile in pratica.

Portate all'utente tre opzioni (barra sempre visibile al cambio schermata, soglia abbassata a 60 ms, lasciare invariato). Ha scelto la prima. Realizzata come **seconda politica sullo stesso contatore**, non come seconda macchina a stati: `beginImmediate()` mostra subito con permanenza minima di 220 ms (`LOADING_NAVIGATION_MINIMUM_VISIBLE_MS`) ed è usata dalla sola guardia di navigazione del router; `begin()` resta soggetta a soglia ed è usata da viste e pulsanti, con comportamento **invariato**. Il punto delicato — i due ordini di chiusura di span sovrapposti — è coperto da quattro test nuovi con timer falsi, compresa la verifica che non resti alcun timer appeso (`vi.getTimerCount()`).

Rilettura mirata del processo principale su `useLoadingIndicator.ts`, alla terza modifica del file: il rischio di `show()` invocata a barra già visibile — che azzererebbe `minimumHoldElapsed` allungando la permanenza oltre il dovuto — **non è raggiungibile**, perché `begin()` programma il timer solo a barra invisibile e `beginImmediate()` cancella quello pendente prima di mostrare. Esiste al massimo un ciclo di permanenza attivo per volta.

**Verifiche dopo il secondo giro**, eseguite dal processo principale: `npm run lint` 0 errori, `npm run typecheck` pulito su entrambi gli scope, `npm test` **194 test verdi in 29 file**, `npm run build` riuscita con precache di 43 voci (460 KiB). Nessun byte di controllo in tutto `src/`.

## Esito finale

`2026-08-26` — **implementazione completa**. Tutte e undici le fasi chiuse. Due criteri di accettazione su venti restano in attesa dell'utente, perché richiedono un occhio umano e un telefono: non sono lavoro mancante, sono verifiche non delegabili.

**Come è stato lavorato.** Un prototipo grafico usa-e-getta approvato dall'utente prima di scrivere una riga di codice definitivo, poi SPEC e piano approvati, poi quattro tranche di implementazione sequenziali affidate ad altrettante invocazioni con contesto separato, ciascuna chiusa verde, e infine una fase di verifica con contesto pulito e mandato di controllo. `solid-srp-reviewer` **non** è stato invocato: le regole di progetto lo escludono in modo assoluto sul codice non-Java, e qui si tratta di TypeScript e Vue.

**Cosa è stato costruito.** 64 file sorgente sotto `src/` più 24 file di test. Organizzazione per livello con sottocartelle per concetto: `domain` (con il sottopackage `statistics`), `persistence`, `backup`, `composables`, `presentation`, `components` (con `shell`, `icon`, `feedback`, `workout`, `statistics`, `backup`), `views`, `router`, `styles`. Nessun contenitore generico.

**Verifiche finali eseguite.**

- `npm run lint` → 0 errori, 0 warning
- `npm run typecheck` → pulito su entrambi gli scope (`tsconfig.app.json`, `tsconfig.node.json`)
- `npm test` → **24 file, 148 test, tutti verdi**
- `npm run build` → riuscita; `dist/sw.js`, `dist/workbox-2fbc6a65.js`, `dist/manifest.webmanifest`, precache di 41 voci (452 KiB)
- Confini architetturali per grep: **0** riferimenti a Dexie fuori da `src/persistence/`, **0** usi di `localStorage`, **0** `any` espliciti
- `prototype/` intatto e assente da `dist/`, verificato per contenuto e non per nome di file
- Un file di backup di esempio generato dallo storico del prototipo (21 allenamenti, 47 gruppi, 80 esercizi, 306 serie, 454 UUID senza duplicati) è stato fatto passare attraverso `validateBackupFile`, il validatore dell'applicazione: **accettato**. Lo spec temporaneo usato per la prova è stato rimosso.

**Il difetto trovato dalla fase di verifica**, e la ragione per cui quella fase esiste: l'eliminazione di un gruppo muscolare e di un esercizio nel Dettaglio avveniva **senza conferma**, mentre SPEC e prototipo la richiedono e non esiste undo. Perdita di dati irreversibile a ogni tocco involontario del cestino. Nessuna delle quattro tranche l'aveva notato. Corretto con un unico stato di conferma nella vista, un discriminated union che rende impossibile per costruzione la coesistenza di due dialoghi, e un testo che quantifica cosa si perde. L'eliminazione di una singola serie resta senza conferma, come nel prototipo. La fase di verifica ha inoltre rimosso due porzioni di codice morto in superficie pubblica.

**Note residue.**

1. **Criterio 17**: l'aderenza visiva al prototipo è stata verificata in revisione riga per riga su testi, label, badge, icone, token e geometria della sparkline, ma la conferma a occhio dell'utente non è sostituibile dal processo.
2. **Criterio 18**: manifest, icone, `registerType: 'prompt'` e service worker sono verificati sull'output di build; **installazione su Android e prova offline su dispositivo restano da fare**.
3. **`overrides` su `serialize-javascript`**: `npm audit` segnala 1 alta e 3 moderate, tutte nella catena di build. Passando a Node ≥ 20 l'`overrides` si rimuove e l'audit torna pulito. Decisione dell'utente, ancora aperta.
4. **`usePwaUpdate.ts` senza spec**: wrapper sottile di un modulo virtuale non risolvibile in Vitest. Giudicato accettabile anche dalla fase di verifica.
5. **`StatSession` senza id stabile**: la `key` di riga nella tabella delle statistiche usa `workoutDate + weights` come surrogato. Segnalato, non corretto perché fuori perimetro.
6. **Il repository non ha commit**: manca una baseline per i diff, e la fase di verifica non ha potuto confermare che `prototype/` sia bit per bit invariato. Un primo commit chiuderebbe la questione per il futuro.

## Esempio (concreto: file previsti e test previsti)
```ts
// File previsti per il cuore della SPEC (chiave statistica e persistenza):
//   src/domain/workout.ts                        — tipi della gerarchia
//   src/domain/statistics/statKey.ts             — posizione × gruppo × esercizio × schema
//   src/domain/statistics/statEntries.ts         — voci dalle sole giornate completed
//   src/domain/workoutCopy.ts                    — copia con nuovi UUID
//   src/persistence/gymTrackerDatabase.ts        — unica tabella `workouts`, schema v1
//   src/backup/backupValidation.ts               — validazione integrale prima di scrivere
//   src/backup/backupImportPlan.ts               — merge per id con updatedAt

// Test previsti: uno per criterio della Definition of done (1-16).
// I criteri 17-20 si verificano in revisione, non con un test unitario.
describe('workoutCompletion', () => {
    it('accetta la giornata con gruppi, esercizi e serie validi', () => {});          // 1
    it('accetta 2 e 3 gruppi, rifiuta 1 e 4, non vincola la bozza', () => {});        // 2
});
describe('workoutStructure / workoutRepository', () => {
    it('mantiene le serie sotto l esercizio con position contigue', () => {});        // 3
    it('ammette ripetizioni e pesi diversi nella stessa serie, peso 0 valido', () => {}); // 4
});
describe('workoutCopy', () => {
    it('genera nuovi UUID a tutti e quattro i livelli', () => {});                    // 5
    it('non copia data, stato completato, spunte e note generali', () => {});         // 6
});
describe('backup', () => {
    it('esporta formatVersion 1 e il nome file della giornata', () => {});            // 7
    it('valida un file corretto e produce il riepilogo senza scrivere', () => {});    // 8
    it('rifiuta un file non valido lasciando il database intatto', () => {});         // 9
    it('unisce per id tenendo l updatedAt piu recente, workout intero', () => {});    // 10
    it('sostituisce tutto in una transazione, intatto se fallisce', () => {});        // 11
});
describe('localDate', () => {
    it('non sposta il giorno fra creazione, salvataggio, export e import', () => {});  // 12
});
describe('statKey', () => {
    it('stessa posizione con sequenze diverse produce la stessa chiave', () => {});   // 13
    it('12-12-10-10 e 10-10-12-12 sono schemi diversi, come 4x6 e 3x8', () => {});    // 14
    it('etichetta NxR con schema uniforme, tupla con trattini altrimenti', () => {}); // 15
});
describe('statEntries', () => {
    it('usa solo le giornate completed e tutte le loro serie', () => {});             // 16
});
```
