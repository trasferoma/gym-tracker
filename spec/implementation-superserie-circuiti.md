# IMPLEMENTATION — superserie-circuiti

**Specifica di riferimento:** `spec-superserie-circuiti.md`  — nel resto del documento: «la SPEC».
**Stato:** `COMPLETED`  <!-- NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED -->

Documento di lavoro: la SPEC (il "cosa") resta stabile; qui vivono stato, piano, decisioni e problemi (il "come").

## Regole per l'agente
- Leggere `CLAUDE.md` del repository (`c:\build\git\gym-tracker\CLAUDE.md`) e la SPEC prima di toccare codice.
- All'apertura di ogni fase, annunciare la fase in una riga sola prima di qualunque altra cosa: `Fase <N> delegata: <obiettivo>` se la fase passa a un subagent, `Fase <N> in corso: <obiettivo>` altrimenti. L'obiettivo si copia dalla riga **Annuncio:** della fase. Mai `faccio partire la fase <N>` senza obiettivo.
- Alla ripresa del lavoro, leggere prima questo file e riprendere dallo stato corrente.
- Prima di modificare, elencare i file che verranno toccati. Nessun refactoring fuori scope.
- Non modificare i requisiti della SPEC senza decisione esplicita. Le **Decisioni prese** D1–D5 della SPEC sono chiuse; i 9 «Punti da decidere» vanno chiusi con l'utente **prima** della Fase 7; fino ad allora valgono le proposte scritte nella SPEC.
- Dopo ogni fase: eseguire i test pertinenti e aggiornare questo file. Spuntare una voce solo dopo verifica reale, mai a priori.
- Scelta che **non** cambia il comportamento osservabile → procedi e annotala in *Decisioni*.
- Scelta che **cambia** comportamento o criteri di accettazione, o ambiguità non risolvibile dalla SPEC → **fermati**, imposta lo stato a `BLOCKED` e registra in *Problemi aperti* / *Deviazioni*.
- Le due parti sono sequenziali: la Parte 2 (Fasi 7–17) parte solo dopo il checkpoint di commit della Parte 1 (Fase 6). Il commit lo esegue il processo principale su richiesta dell'utente.
- **Finestra rossa della Parte 2**: dalla Fase 7 alla fine della Fase 9 typecheck e suite completa sono attesi rossi, perché il campo `exercises` del gruppo cambia nome e i suoi consumatori vengono adattati in tre fasi. In quella finestra girano solo i test dei file toccati dalla fase; il primo gate completo (typecheck, lint, suite, build) è l'ultima voce della Fase 9. Nessuna fase precedente pretende «verde».
- **Nessun supporto al formato di backup 1** (D5): nessuna fase legge, converte o importa file in versione 1; chi incontra un bisogno del genere si ferma e lo registra in *Problemi aperti* invece di aggiungerlo.
- Comandi di verifica: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (Node 22 via `fnm`, vedi `CLAUDE.md`). Un singolo file, per esempio: `npx vitest run src/domain/exerciseClusters.spec.ts`.
- Progetto TypeScript/Vue: le skill `java-*` non si applicano; valgono `clean-code` e `package-placement`.

## Piano operativo

### Parte 1 — Rimozione delle statistiche

**Fase 1 — Censimento dei riferimenti alle statistiche**
**Annuncio:** `Fase 1 in corso: censimento di ogni file e riferimento alle statistiche da togliere o ricollocare`
- [x] Confermare con `grep -i` l'elenco della SPEC (file da eliminare, punti da modificare, documenti) e aggiungere quanto emerge: pattern `statistic|statKey|sparkline|setProgress|statNavigation|statSessions|statEntries|schemeLabel|sameStatKey|sameRepetitionScheme|deriveStatKey|viewTrend|view-trend|--line-|chart|formatWeightDifference|formatWorkoutDayCompact` su `src/`, `CLAUDE.md`, `README.md`, `spec-gym-tracker.md`, `implementation-gym-tracker.md`. È lo stesso pattern del criterio 1 della SPEC.
- [x] Confermare che `schemeLabel` è l'unica funzione di `domain/statistics/` usata fuori dalle statistiche (oggi: solo `ExerciseBlock.vue`).
- [x] Confermare che `formatWeightDifference` e `formatWorkoutDayCompact` di `src/presentation/italianFormat.ts` hanno come unici chiamanti `StatSetProgressCard.vue` e `StatSetProgressList.vue`, e che `formatCompactDay`/`compactDayFormatter` servono solo a `formatWorkoutDayCompact`.
- [x] Per ogni import che i file delle statistiche fanno da codice condiviso (`EmptyState`, `InfoBanner`, `AppTopBar`, `sharedLoadingIndicator`, `formatCount`, `formatWeight`, `formatWorkoutDayShort`, `listAllWorkouts`, `workoutFactory`), confermare che restano altri chiamanti: ciò che ne resta senza va aggiunto all'elenco da eliminare in Fase 3.
- [x] Confermare che l'icona `chart` e i token `--line-1…6` non hanno altri usi.
- [x] Contare i test della suite prima della rimozione (`npm test`) per aggiornare i numeri in `CLAUDE.md` e `README.md` a fine Parte 1.
- [x] Compilare "File coinvolti (effettivi)" per la Parte 1.

**Fase 2 — Ricollocazione dell'etichetta dello schema delle ripetizioni**
**Annuncio:** `Fase 2 delegata: spostamento dell'etichetta dello schema (4x6 / 12-12-10) in presentation`
- [x] Creare `src/presentation/repetitionScheme.ts` con `formatRepetitionScheme(sets: readonly ExerciseSet[]): string`, stessa semantica di `schemeLabel` (`-` senza serie, `NxR` se uniformi, tupla con trattini altrimenti).
- [x] Spostare i test di `schemeLabel` da `statKey.spec.ts` in `src/presentation/repetitionScheme.spec.ts`.
- [x] `ExerciseBlock.vue`: la chip usa `formatRepetitionScheme(props.exercise.sets)`; sparisce l'import da `domain/statistics`.
- [x] Test del criterio 2 della SPEC verdi.

**Fase 3 — Rimozione di vista, rotta, voce di menu, scorciatoia, dominio, formattatori, componenti, icona e token delle statistiche**
**Annuncio:** `Fase 3 delegata: eliminazione completa delle statistiche da rotte, barra, registro serie, dominio, formattatori, componenti, icone e token`
- [x] Eliminare `src/views/StatisticsView.vue`, `src/domain/statistics/` (12 file), `src/components/statistics/` (6 file), `src/composables/useStatisticsPath.ts` e `.spec.ts`.
- [x] `src/router/index.ts`: togliere la rotta `statistics`, il membro di `PrimaryRouteName` e di `PRIMARY_ROUTE_NAMES`.
- [x] `AppTabBar.vue`: togliere la voce «Statistiche»; griglia a 3 colonne.
- [x] `SetRegister.vue`: togliere emit `view-trend` e pulsante con icona `chart`. `ExerciseBlock.vue`: togliere `viewTrend`, `@view-trend`, import di `router` e `sharedStatisticsPath`, prop `groupPosition` (serviva solo alla chiave statistica). `MuscleGroupSection.vue`: non passa più `group-position` a `ExerciseBlock` (lo usa ancora per la propria testata).
- [x] `src/presentation/italianFormat.ts`: togliere `formatWeightDifference`, `formatWorkoutDayCompact`, `formatCompactDay` e `compactDayFormatter`; in `italianFormat.spec.ts` togliere i `describe` corrispondenti e i due import. Più ogni altra funzione rimasta senza chiamanti emersa in Fase 1.
- [x] `AppIcon.vue`: togliere `chart` da `IconName` e dal template. `tokens.css`: togliere `--line-1…6` in entrambi i temi.
- [x] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` verdi.
- [x] `grep -i` del criterio 1 della SPEC su `src/` senza risultati.

**Fase 4 — Aggiornamento dei documenti del repository dopo la rimozione**
**Annuncio:** `Fase 4 in corso: aggiornamento di CLAUDE.md, README e spec originaria senza le statistiche`
- [x] `CLAUDE.md`: righe su `statKey.spec.ts` (comando di esempio), `components/… statistics`, sparkline, sezione «Chiave statistica», riga 192 sul file di esempio (toglie «per vedere statistiche e sparkline»; la descrizione del contenuto verrà riscritta in Fase 15 dopo la rigenerazione), numero di test e file.
- [x] `README.md`: righe 13, 31, 121, 126, 134 (conteggio test), sezione «Statistiche» (168–181).
- [x] `spec-gym-tracker.md`: obiettivo, navigazione a tre voci, scorciatoia dall'esercizio, sezione *Statistiche*, caso limite sparkline, invariante, decisioni 8–11, fuori scope, DoD 13–16, punti decisi 2–3 e 7, esempio: sostituire con un rimando a `spec-superserie-circuiti.md` conservando la numerazione (punto da decidere 9 della SPEC).
- [x] `implementation-gym-tracker.md`: una sola nota datata nel registro («statistiche rimosse, vedi …»), nessuna riscrittura.

**Fase 5 — Verifica della rimozione**
**Annuncio:** `Fase 5 in corso: verifica che le statistiche siano sparite senza residui e che l'app resti integra`
- [x] Seconda invocazione di `clean-code-implementer` in modalità verifica sui file toccati nelle Fasi 2–3 (obiettivo: criteri 1–3 della SPEC).
- [x] Gate del progetto: typecheck, lint, test, build verdi; `grep -i` dei residui vuoto; `prototype/` e `implementation-gym-tracker.md` sono gli unici posti dove la parola «statistiche» può ancora comparire.
- [x] Aggiornare *Decisioni* e *Test eseguiti*.

**Fase 6 — Pubblicazione della Parte 1 e checkpoint di commit**
**Annuncio:** `Fase 6 in corso: incremento di APP_VERSION, build e deploy della Parte 1, poi commit`
- [x] `src/appVersion.ts`: `v1.0.007` → `v1.0.008`.
- [ ] Node 22 attivo (`fnm use 22`), `npm run build`, `npx wrangler pages deploy dist --project-name gym-tracker --branch production --commit-dirty=true`; controllo `Environment = Production` e bundle servito coincidente con `dist/index.html` (procedura in `CLAUDE.md`, da riportare a schermo).
- [x] Conservare una copia di `dist/` della Parte 1 nella cartella di lavoro (`c:\build\git\gym-tracker-lavoro\dist-parte1\`): serve alla prova di migrazione in browser della Fase 17.
- [x] Chiedere all'utente il commit della Parte 1 (lo esegue il processo principale). La Parte 2 non inizia prima.

### Parte 2 — Raggruppamenti: singolo, superserie, circuito

**Fase 7 — Modello del raggruppamento, factory e invarianti**
**Annuncio:** `Fase 7 delegata: tipi del raggruppamento, factory e verifica delle invarianti singolo/multiplo`
- [x] `src/domain/workout.ts`: `ExerciseClusterKind`, `ExerciseCluster` (`id`, `kind`, `position`, `restAfterRoundSeconds`, `restBetweenExercisesSeconds`, `exercises`); `MuscleGroupWorkout.clusters` al posto di `exercises`.
- [x] `src/domain/workoutFactory.ts`: `createMuscleGroupWorkout` con `clusters: []`; `createExerciseCluster(exercise, position)` → `single`, tempi 0.
- [x] `src/domain/exerciseClusters.ts`: `listGroupExercises(group)` (attraversamento piatto), `wrapExercisesInSingleClusters(exercises)` (funzione pura `Exercise[]` → `ExerciseCluster[]`; **unico consumatore: la migrazione Dexie di Fase 12**, oltre alle fixture dei test; resta in `domain/` perché espressa in tipi di dominio e perché `persistence/` non costruisce oggetti di dominio — la collocazione non cambia col venir meno dell'import v1), `checkClusterInvariants(group)` (singolo = 1, multiplo ≥ 2, nessun vuoto; restituisce `reason` italiana o `undefined`), `isMultipleCluster(cluster)`.
- [x] Test: criterio 11 (parte invarianti) e criterio 4 (parte factory); girano solo `exerciseClusters.spec.ts` e `workoutFactory.spec.ts` se esiste.
- [ ] Da qui typecheck è **rosso** finché le Fasi 8 e 9 non adattano tutti i consumatori di `group.exercises`: `backupValidation.ts` (Fase 8), `workoutStructure.ts`, `workoutCompletion.ts`, `workoutCounts.ts`, `workoutCopy.ts`, `exerciseSuggestions.ts`, `MuscleGroupSection.vue` e le fixture (Fase 9). Non spuntare «verde» qui.

**Fase 8 — Formato di backup 2: export, validazione dei raggruppamenti e rifiuto delle altre versioni**
**Annuncio:** `Fase 8 delegata: export con formatVersion 2, validazione dei raggruppamenti nel backup e rifiuto della versione 1 come versione ignota`
- [x] `backupFormat.ts`: `BACKUP_FORMAT_VERSION = 2 as const`; `BackupFile.formatVersion` resta legato alla costante. Nessun tipo «versione accettata in ingresso»: la versione valida è una sola.
- [x] `backupValidation.ts`: `parseMuscleGroup` (oggi righe 58–61) legge `clusters` e delega a un nuovo `parseExerciseCluster` — `kind` ammesso (`requireClusterKind`), tempi interi ≥ 0 (nuovo `requireNonNegativeInteger` nello stile dei `requireXxx`), invarianti di cardinalità (stesse regole di `checkClusterInvariants`), posizioni contigue; `parseExercise` e `parseExerciseSet` invariati; messaggi italiani nello stile esistente. `requireExactFormatVersion` **non cambia**: con la costante a 2 rifiuta già la 1 e qualunque altro valore con «Versione del formato non supportata: attesa 2, trovata …». Nessuna lettura di `exercises` al livello del gruppo, nessun ramo per versione.
- [x] `backupExport.ts` invariato nella forma, versione 2 dal formato.
- [x] Fixture di `backupValidation.spec.ts` riscritte con `wrapExercisesInSingleClusters`/`createExerciseCluster` (costruiscono `exercises: [...]` e leggono `.exercises[0]` alle righe 62, 99–170).
- [x] Versioni nelle fixture **valide**: `formatVersion: 1` → `2` in `backupValidation.spec.ts` (riga 14 `buildBackupFilePayload`, riga 25 attesa sul risultato, riga 48 — il caso «manca `workouts`» deve dichiarare la 2, altrimenti fallirebbe per la versione e non per il motivo testato), `backupExport.spec.ts` (titolo riga 7 e attesa riga 13), `useBackup.spec.ts` (righe 36, 69, 92, 111).
- [x] Versione **ignota**: `formatVersion: 2` → `1` nei tre test esistenti `backupValidation.spec.ts:37`, `backupImportService.spec.ts:58`, `useBackup.spec.ts:59`. Scelta della 1 e non della 3: è il caso realistico (l'unico file «vecchio» che possa capitare) e protegge da un ripristino accidentale della lettura v1; in `backupValidation.spec.ts:37` aggiungere l'attesa sul messaggio «Versione del formato non supportata».
- [x] Test: criteri 13 e 14 (export a 2; nuovi casi di rifiuto v2; versione 1 rifiutata; database identico dopo il rifiuto, come già in `backupImportService.spec`). Girano `src/backup/*.spec.ts`; `useBackup.spec.ts` si verifica al gate di Fase 9.

**Fase 9 — Adattamento delle funzioni di dominio, del componente e delle fixture che scorrono gli esercizi**
**Annuncio:** `Fase 9 delegata: completamento, conteggi, copia, suggerimenti, operazioni su esercizi e serie attraverso i raggruppamenti, poi primo gate verde della Parte 2`
- [x] `workoutStructure.ts`: `addExercise` crea un `single` in coda; `renameExercise`, `removeExercise`, `reorderExercise`, operazioni sulle serie e `updateExerciseSet` trovano l'esercizio attraverso i raggruppamenti (`replaceExerciseWithin` via raggruppamento); `removeExercise` applica le regole del criterio 7 (torna `single` / sparisce); `reorderExercise` resta nel blocco (criterio 10, parte esercizio).
- [x] `workoutCompletion.ts`: gruppo senza esercizi ed esercizio senza serie valida via `listGroupExercises`; `checkClusterInvariants` nel controllo di idoneità.
- [x] `workoutCounts.ts`, `workoutCopy.ts` (copia raggruppamento con tipo, tempi e id nuovo), `exerciseSuggestions.ts`.
- [x] `MuscleGroupSection.vue` usa `countMuscleGroup` al posto dei conteggi inline e itera `group.clusters` in via provvisoria (la UI definitiva è in Fase 14).
- [x] Fixture riscritte con `wrapExercisesInSingleClusters` o `createExerciseCluster`: costruiscono `exercises` `workoutCompletion.spec`, `exerciseSuggestions.spec`, `useWorkoutDraft.spec`, `useStorageStatus.spec`, `workoutRepository.spec`, `workoutCopy.spec`; leggono `.exercises` `workoutStructure.spec`, `presentation/italianFormat.spec` (riga 52), `useWorkoutDraft.spec`, `workoutCopy.spec`. (`backupValidation.spec` è già passata in Fase 8; `backupImportPlan.spec` e `useWorkoutHistory.spec` non toccano esercizi.)
- [x] Test: criteri 4, 7, 10 (parte esercizio), 11, 12, 17a.
- [x] **Primo gate verde della Parte 2**: typecheck, lint, suite completa e build verdi; `grep '\.exercises'` su `src/` trova solo accessi a `ExerciseCluster.exercises` e ai conteggi (`counts.exercises`, `totals.exercises`).

**Fase 10 — Rigenerazione del file di esempio nel formato 2**
**Annuncio:** `Fase 10 in corso: rigenerazione di gym-tracker-backup-esempio.json nel formato 2 con superserie e circuito realistici`
- [x] Prima di sovrascrivere, copiare il file v1 corrente in `c:\build\git\gym-tracker-lavoro\backup-esempio-v1.json`: serve alla prova di migrazione in browser della Fase 17 e non deve finire nel repository.
- [x] Script usa-e-getta in TypeScript **nello scratchpad della sessione** (non nel repository, nessuna voce in `package.json`), eseguito con Node 22 tramite `npx vite-node --root c:\build\git\gym-tracker <percorso dello script>`: `vite-node` è già in `node_modules/.bin` come dipendenza transitiva di Vitest 3 e risolve l'alias `@/` da `vite.config.ts`, quindi lo script importa direttamente `wrapExercisesInSingleClusters` da `@/domain/exerciseClusters`, `generateId` da `@/domain/identity` e `validateBackupFile` da `@/backup/backupValidation`. Se `vite-node` rifiutasse un file fuori dalla radice, copiarlo temporaneamente nella radice del repository ed eliminarlo prima del commit (annotare in *Decisioni*).
- [x] Lo script: legge il file v1; per ogni gruppo `clusters = wrapExercisesInSingleClusters(exercises)` e toglie `exercises`; in almeno tre giornate scelte fonde esercizi adiacenti dello stesso gruppo costruendo direttamente i raggruppamenti (le operazioni di collegamento arrivano in Fase 11 e non servono qui): **due `superset`** (2 esercizi, es. recupero a fine giro 90 s, fra esercizi 0) e **un `circuit`** (3 esercizi, es. 30 s fra esercizi e 120 s a fine giro); `position` ricalcolate contigue a entrambi i livelli; `formatVersion: 2`, `exportedAt` nuovo; chiama `validateBackupFile` sull'oggetto prodotto e **si rifiuta di scrivere** se `valid` è `false`, stampando il motivo; altrimenti scrive `gym-tracker-backup-esempio.json` in radice con `JSON.stringify(…, null, 2)` come l'export.
- [x] Annotare nel registro i conteggi del file nuovo (allenamenti, gruppi, raggruppamenti per tipo, esercizi, serie): servono alla riga 192 di `CLAUDE.md` in Fase 15.
- [x] Conservare lo script in `c:\build\git\gym-tracker-lavoro\scripts\` (fuori dal repository): la sua parte di conversione «ogni esercizio → singolo» è anche la via di recupero manuale del backup v1 del telefono descritta in Fase 17.
- [x] Criterio 21 (parte automatica): `validateBackupFile` sul file restituisce `valid: true`; il file è ancora ignorato da git (`git status` pulito rispetto a esso). L'importazione manuale si verifica in Fase 16 quando l'interfaccia dei raggruppamenti è pronta.

**Fase 11 — Operazioni sui raggruppamenti: collega, stacca, tipo, tempi, riordino, aggiunta interna**
**Annuncio:** `Fase 11 delegata: collega al successivo, stacca, cambio tipo, tempi di recupero, riordino del blocco e aggiunta dentro il blocco`
- [x] `exerciseClusters.ts`: `linkClusterToNext(group, clusterId)`, `detachExercise(group, exerciseId)`, `changeClusterKind(group, clusterId, kind)` (solo `superset`/`circuit` su multipli; altrimenti errore di programmazione), `updateClusterRestAfterRound`, `updateClusterRestBetweenExercises` (interi ≥ 0, altrimenti errore), `reorderCluster(group, clusterId, direction)`, `addExerciseToCluster(group, clusterId, name)`.
- [x] `workoutStructure.ts`: funzioni a livello `Workout` che delegano alle precedenti via `replaceMuscleGroup`, con gli stessi nomi.
- [x] `src/domain/restInput.ts`: `parseRestSecondsInput(raw): SetValueParseResult<number>` (intero ≥ 0; vuoto, negativo, decimale, testo → non valido), stesso stile di `setInput.ts`.
- [x] Test: criteri 5, 6, 8, 9, 10 (parte raggruppamento). Typecheck, lint e suite verdi.

**Fase 12 — Migrazione IndexedDB alla versione 2 dello schema**
**Annuncio:** `Fase 12 delegata: schema Dexie versione 2 con avvolgimento degli esercizi esistenti in raggruppamenti singoli`
- [x] `gymTrackerDatabase.ts`: la classe diventa `export class GymTrackerDatabase` con `constructor(databaseName = 'gym-tracker')`; la dichiarazione `this.version(1).stores({...})` **resta** e sotto di essa si aggiunge `this.version(2).stores({ stessi indici }).upgrade(...)`, che per ogni record riscrive i gruppi con `clusters: wrapExercisesInSingleClusters(group.exercises)` e toglie `exercises`. Il singleton `export const gymTrackerDatabase = new GymTrackerDatabase()` non cambia; nessun altro file importa Dexie. È l'unico punto dell'app che legge ancora la forma `exercises` sotto il gruppo, e lo fa sul record grezzo dentro `upgrade`.
- [x] `src/persistence/gymTrackerDatabase.spec.ts`: con un nome di database di prova, crea `new Dexie(nome)` grezza con `version(1).stores({ workouts: 'id, workoutDate, status, createdAt', appMeta: 'key' })`, inserisce un record a tre livelli con `exercises` sotto il gruppo, chiude; riapre con `new GymTrackerDatabase(nome)` e verifica il criterio 15 (un `single` per esercizio, tempi 0, esercizi e serie identici); `afterEach` elimina il database di prova con `Dexie.delete(nome)`.
- [x] Suite verde.

**Fase 13 — Composable della bozza: nuove operazioni sui raggruppamenti**
**Annuncio:** `Fase 13 delegata: operazioni sui raggruppamenti esposte da useWorkoutDraft con autosave`
- [x] `useWorkoutDraft.ts`: `linkClusterToNext(groupId, clusterId)`, `detachExercise(groupId, exerciseId)`, `changeClusterKind(groupId, clusterId, kind)`, `updateClusterRestAfterRound(groupId, clusterId, seconds)`, `updateClusterRestBetweenExercises(groupId, clusterId, seconds)`, `reorderCluster(groupId, clusterId, direction)`, `addExerciseToCluster(groupId, clusterId, name)`; tutte via `commitWorkout`.
- [x] Test: criterio 16 su **tutte e sette** le operazioni (`it.each` o un `it` per operazione): `updatedAt` cambia e il record persiste dopo `flushPendingSave()`.

**Fase 14 — Interfaccia dei raggruppamenti: testata, catena, stacca, sfondi, icone**
**Annuncio:** `Fase 14 delegata: card e testata del raggruppamento, pulsante catena, stacca, aggiunta nel blocco, sfondi a rotazione e icone`
- [x] `AppIcon.vue`: `link` (catena, azione «collega»), `bolt` (fulmine, superserie), `cycle` (freccia circolare, circuito), `unlink` (stacca), secondo la decisione presa D4 della SPEC. `tokens.css`: `--cluster-1…4` nei due temi.
- [x] `ExerciseClusterHeader.vue`: etichetta del tipo con icona, pulsanti superserie/circuito (solo multipli), campo del recupero a fine giro etichettato «Recupero fra le serie» sul singolo e «Recupero a fine giro» sui multipli (D3), campo «Recupero fra esercizi» (solo circuito), frecce su/giù del raggruppamento; input numerici con `parseRestSecondsInput`, suffisso «s», ripristino del valore su blur come in `SetRow.vue`.
- [x] `ExerciseClusterCard.vue`: contenitore con classe di sfondo `cluster--N` per i multipli, `ExerciseClusterHeader`, gli `ExerciseBlock` del raggruppamento, «+ Esercizio» interno (solo multipli, D2) con `ExercisePicker`.
- [x] `ExerciseBlock.vue`: nuove prop `cluster`/indice nel blocco; frecce solo nei multipli e disabilitate ai bordi del blocco (D1); pulsante «Stacca» (solo multipli); resta rinomina/elimina/chip.
- [x] `MuscleGroupSection.vue`: itera `group.clusters` con `ExerciseClusterCard`, pulsante catena «Collega al successivo» fra due card consecutive, indice di colore calcolato fra i soli multipli; «+ Esercizio» di gruppo invariato. `WorkoutDetailView.vue`: conferma di eliminazione invariata.
- [x] `src/components/workout/ExerciseClusterCard.spec.ts` (`// @vitest-environment jsdom`): criterio 17b. Criterio 18 verificato in revisione e a occhio su `npm run dev`.

**Fase 15 — Documentazione del modello esteso**
**Annuncio:** `Fase 15 in corso: CLAUDE.md, README e spec originaria aggiornati alla gerarchia con i raggruppamenti e al formato di backup 2`
- [x] `CLAUDE.md`: modello dei dati (nuovo livello, invarianti, tempi), schema Dexie v2 con migrazione, backup in formato 2 con la 1 rifiutata come versione ignota, riga 192 sul file di esempio riscritta (formato 2, conteggi e raggruppamenti annotati in Fase 10, «si importa da Dati → Scegli un file → Unisci»), numero di test.
- [x] `README.md`: albero dei file, tabella delle entità, sezione backup con la riga 187 «versione del formato (`1`)» → `2`.
- [x] `spec-gym-tracker.md`: gerarchia e tabella delle entità con rimando a questa SPEC; righe 60 e 119 (`formatVersion: 1`) sostituite da un rimando alla SPEC.

**Fase 16 — Verifica della Parte 2**
**Annuncio:** `Fase 16 in corso: verifica di dominio, backup, migrazione, file di esempio e interfaccia dei raggruppamenti rispetto alla SPEC`
- [x] Seconda invocazione di `clean-code-implementer` in modalità verifica sui file delle Fasi 7–14.
- [x] Revisione funzionale con `spec-adversarial-reviewer` sull'intera Parte 2 (SPEC articolata in più fasi; difetti su migrazione o invarianti costano rielaborazioni).
- [x] Gate: typecheck, lint, test, build verdi; criteri 18 e 20 della SPEC verificati; `Dexie` importato solo in `persistence/`; nessun colore fuori dai token; `grep -n 'formatVersion: 1'` su `src/` trova solo i tre test di versione ignota.
- [x] Criterio 21 (parte manuale): su `npm run dev` con database vuoto, importare `gym-tracker-backup-esempio.json` da Dati → Unisci: 21 allenamenti, superserie e circuito visibili con la loro testata, tempi mostrati.
- [x] Aggiornare *Decisioni/Deviazioni*.

**Fase 17 — Pubblicazione della Parte 2 e checkpoint di commit**
**Annuncio:** `Fase 17 in corso: prova della migrazione in browser, backup di sicurezza dichiarato nei suoi limiti, incremento di APP_VERSION, deploy della Parte 2, poi commit`
- [x] **Prova della migrazione reale in browser** (rete di sicurezza principale, oltre al test di Fase 12): servire `dist-parte1/` (copia conservata in Fase 6) con `npx vite preview --outDir c:\build\git\gym-tracker-lavoro\dist-parte1` o equivalente sulla stessa porta, importare `backup-esempio-v1.json` (copia della Fase 10) da Dati → Unisci; fermare, servire il build nuovo sulla **stessa origin**, aprire l'app: i 21 allenamenti compaiono con ogni esercizio in un singolo, nessun errore in console. Se fallisce: **non pubblicare**, stato `BLOCKED`.
- [x] Ricordare all'utente di **esportare un backup dal telefono prima di aggiornare**, dichiarando onestamente il limite: quel file è in formato 1 e la nuova versione **lo rifiuta** («Versione del formato non supportata»); è una copia leggibile dei dati, non un ripristino dall'app. La migrazione Dexie corre alla prima apertura e non è reversibile dall'app.
- [x] Alternative da proporre all'utente, dalla più semplice: (a) tenere comunque il backup v1 come copia leggibile e affidarsi alla prova in browser appena fatta; (b) in caso di migrazione fallita sul telefono, convertire il backup v1 con lo script conservato in Fase 10 (`c:\build\git\gym-tracker-lavoro\scripts\`) e importare il risultato: è una conversione manuale fuori dall'app, non una compatibilità dell'app; (c) rinviare l'aggiornamento sul telefono finché l'utente non ha fatto l'esportazione. Nessuna di queste reintroduce la lettura del formato 1 nell'app.
- [x] `src/appVersion.ts`: `v1.0.008` → `v1.0.009`; build e deploy con `--branch production`; controllo `Environment = Production` (procedura in `CLAUDE.md`, da riportare a schermo).
- [x] Chiedere all'utente il commit della Parte 2; portare lo stato a `COMPLETED`.

## File coinvolti (effettivi)
Pre-compilati dall'analisi, **da confermare in Fase 1** (Parte 1) e **in Fase 7** (Parte 2) — formato: `` `path/File.ts` — motivo``.

*Da creare* (nessuna cartella nuova):
- `src/presentation/repetitionScheme.ts` + `.spec.ts` — etichetta dello schema; in `presentation/` perché è la forma testuale di un valore mostrata all'utente, come `formatWeight`; file proprio perché il concetto è lo schema delle ripetizioni, non il formato italiano di date e plurali.
- `src/domain/exerciseClusters.ts` + `.spec.ts` — operazioni e invarianti del raggruppamento dentro un gruppo muscolare, compresa `wrapExercisesInSingleClusters` (consumata solo dalla migrazione di Fase 12: resta qui perché pura ed espressa in tipi di dominio, e `persistence/` non costruisce oggetti di dominio); in `domain/` perché funzioni pure senza Vue né Dexie; file separato da `workoutStructure.ts` perché il raggruppamento ha una ragione di cambiare propria e domani cambierà contenitore («strada A»).
- `src/domain/restInput.ts` + `.spec.ts` — parsing dei secondi di recupero digitati; accanto a `setInput.ts` e nello stesso stile, in un file proprio perché il concetto è il recupero del raggruppamento, non la serie.
- `src/components/workout/ExerciseClusterCard.vue`, `ExerciseClusterHeader.vue`, `ExerciseClusterCard.spec.ts` — card e testata del raggruppamento; in `workout/` per coesione con `MuscleGroupSection` ed `ExerciseBlock`, con cui nascono e cambiano insieme.
- `src/persistence/gymTrackerDatabase.spec.ts` — prova della migrazione v1 → v2 su `fake-indexeddb`.

*Da rigenerare* (fuori da `src/`, gitignorato): `gym-tracker-backup-esempio.json` in radice — formato 2 con superserie e circuito (Fase 10).

*Fuori dal repository* (cartella di lavoro `c:\build\git\gym-tracker-lavoro\`): `backup-esempio-v1.json` (copia del file v1, Fase 10), `dist-parte1\` (build della Parte 1, Fase 6), `scripts\` (script di rigenerazione/conversione, Fase 10). Nessuno di questi entra nel repository né in `package.json`.

Nessun `backupLegacyValidation.ts`, nessun ramo per versione in `backupValidation.ts`: il formato 1 non è letto da nessuna parte dell'app (D5).

*Da eliminare* (Parte 1): `src/views/StatisticsView.vue`; `src/domain/statistics/**` (12 file); `src/components/statistics/**` (6 file); `src/composables/useStatisticsPath.ts`, `useStatisticsPath.spec.ts`.

*Da modificare* (Parte 1): `src/router/index.ts`, `src/components/shell/AppTabBar.vue`, `src/components/workout/ExerciseBlock.vue`, `SetRegister.vue`, `MuscleGroupSection.vue`, `src/components/icon/AppIcon.vue`, `src/styles/tokens.css`, `src/presentation/italianFormat.ts` (+ `.spec.ts`), `src/appVersion.ts`, `CLAUDE.md`, `README.md`, `spec-gym-tracker.md`, `implementation-gym-tracker.md` (solo nota nel registro).

*Da modificare* (Parte 2): `src/domain/workout.ts`, `workoutFactory.ts`, `workoutStructure.ts`, `workoutCompletion.ts`, `workoutCounts.ts`, `workoutCopy.ts`, `exerciseSuggestions.ts` e relativi `.spec.ts`; `src/persistence/gymTrackerDatabase.ts`, `workoutRepository.spec.ts`; `src/backup/backupFormat.ts`, `backupValidation.ts` (+ spec), `backupExport.spec.ts` (versione attesa 2), `backupImportService.spec.ts` (solo versione ignota → 1); `src/composables/useWorkoutDraft.ts` (+ spec), `useBackup.spec.ts` (versioni delle fixture → 2, versione ignota → 1), `useStorageStatus.spec.ts`; `src/presentation/italianFormat.spec.ts` (fixture); `src/components/workout/MuscleGroupSection.vue`, `ExerciseBlock.vue`, `src/components/icon/AppIcon.vue`, `src/styles/tokens.css`; `src/appVersion.ts`; `CLAUDE.md` (riga 192 compresa), `README.md` (riga 187 compresa), `spec-gym-tracker.md` (righe 60 e 119 comprese).

## Registro
Voci datate (`YYYY-MM-DD`), append-only.

- **Decisioni tecniche** (non cambiano il comportamento) — `Decisione · Motivazione · Impatto`
  - 2026-10-10 · Fase 1: censimento conforme alla SPEC; gli import condivisi dalle statistiche (AppTopBar, EmptyState, InfoBanner, formatCount, formatWorkoutDayShort, formatWeight, listAllWorkouts, sharedLoadingIndicator, workoutFactory) hanno altri chiamanti e restano · nessun file aggiuntivo da eliminare · nessuno.
  - 2026-10-10 · L'utente ha risposto «procedi» alla richiesta di conferma dei 9 punti da decidere: valgono le proposte della SPEC · da riconfermare in breve prima della Fase 7 · nessuno.
  - 2026-10-10 · Prima della Fase 7 l'utente ha confermato esplicitamente tutti i 9 punti da decidere come da proposta della SPEC · chiusi · nessuno.
  - 2026-10-10 · Fase 7: `checkClusterInvariants` prende `readonly ExerciseCluster[]` invece del gruppo · vincolo strada A, la funzione non dipende dal contenitore · chiamata con `group.clusters`. Rilevato dal processo principale: `createExerciseCluster` conserva la `position` dell'esercizio nel gruppo, mentre la SPEC vuole posizioni contigue dentro il raggruppamento (da 0) · correzione affidata alla Fase 8.
  - 2026-10-10 · Fase 10: `vite-node` rifiuta file fuori dalla radice; lo script è stato copiato temporaneamente nella radice del repo come `regenerateBackupExample.tmp.ts`, eseguito e cancellato (verificato). Copia permanente in `gym-tracker-lavoro/scripts/`. Superserie: Curl con bilanciere + Curl a martello (90 s), Pushdown ai cavi + French press (75 s); circuito di 2: Squat + Leg press (45 s fra esercizi, 150 s a fine giro) — nessun gruppo del file ha 3 esercizi; singoli con 90 s. Per usarlo come recupero del backup del telefono vanno svuotati `CLUSTER_PLANS` e messo `SINGLE_REST_SECONDS = 0`.
  - 2026-10-10 · Fase 11: le operazioni di `exerciseClusters.ts` lavorano su `readonly ExerciseCluster[]` (strada A); `workoutStructure.ts` le espone a livello Workout con gli stessi nomi del piano. Helper di raggruppamento spostati da workoutStructure a exerciseClusters; `ReorderDirection`, `reindexPositions`, `reorderByPosition` nel nuovo `domain/positions.ts` (condivisi). Tutti i casi non validi delle sette operazioni sono errori di programmazione (la UI non li offre), nessun esito rejected. Staccato: id nuovo, eredita il recupero a fine giro, fra esercizi 0. `parseRestSecondsInput` accetta solo cifre (più stretto di setInput).
- **Deviazioni dalla SPEC** (da motivare) — `Descrizione · Motivazione · Impatto · Aggiorna la SPEC? sì/no`
  - 2026-10-10 · Nel file di esempio i 46 singoli hanno `restAfterRoundSeconds: 90` invece di 0 (SPEC riga 47) · dati di prova più realistici, si vede subito la testata con un tempo · nessuno sull'app; criterio 21 soddisfatto per il resto · no (rilevato da spec-adversarial-reviewer, R1).
- **Problemi aperti** (bloccano l'avanzamento) — `Descrizione · Impatto · Opzioni · Decisione richiesta` — nessuno (i 9 «Punti da decidere» della SPEC vanno chiusi con l'utente prima della Fase 7; D1–D5 sono già chiuse).
- **Test eseguiti** — `data · fase · comando · esito`
  - 2026-10-10 · Fase 1 · `npx vitest run` (Node 22.23.2) · 33 file, 233 test verdi (baseline prima della rimozione; CLAUDE.md dichiarava 202/30, README 194/29).
  - 2026-10-10 · Fase 3 · typecheck, lint, `npm test`, build (Node 22) · verdi; suite 26 file, 180 test; grep dei residui su src, vite.config.ts, index.html vuoto. Incidente: l'implementer ha eseguito per errore `git rm -r --cached .`, annullato con `git reset`; stato git verificato dal processo principale, conforme.
  - 2026-10-10 · Fase 5 · verifica di clean-code-implementer (seconda invocazione): typecheck, lint, `npm test` (180/26), build verdi; grep residui vuoto; formatRepetitionScheme equivalente a schemeLabel; nessun export orfano; nessuna correzione applicata. Proposto e non fatto: redirect per l'URL obsoleto `/statistiche`.
  - 2026-10-10 · Fase 6 · APP_VERSION v1.0.008, `npm run build` verde (precache 40 voci, bundle assets/index-BabMj3yf.js), copia in dist-parte1. Deploy NON eseguito: negato dal classificatore dei permessi (Production Deploy); lo esegue l'utente.
  - 2026-10-10 · Fase 6 · commit della Parte 1 eseguito dall'utente (efd0450 «Rimosse le statistiche»). Deploy: in produzione è servito assets/index-O3CKY-4V.js, diverso dal build BabMj3yf; segnalato all'utente, da chiarire prima della Fase 17.
  - 2026-10-10 · Fase 7 · `npx vitest run src/domain/exerciseClusters.spec.ts` · 11/11 verdi; typecheck rosso atteso (99 errori in 14 file, tutti consumatori previsti in Fasi 8–9).
  - 2026-10-10 · Fase 8 · `npx vitest run src/backup src/domain/exerciseClusters.spec.ts` · 5 file, 55 test verdi; src/backup senza errori di typecheck; correzione della position (0 dentro il singolo) fatta in `createExerciseCluster`.
  - 2026-10-10 · Fase 9 · gate: typecheck, lint, `npm test` 227 test in 28 file, build verdi. Verifica di clean-code-implementer (seconda invocazione): criteri 4, 7, 10 (esercizio), 11, 12, 13, 14, 17a confermati; corretti 2 casi di densità in workoutStructure.ts; nessuna proposta. Transitorio accettato: frecce dell'esercizio disabilitate fino alla Fase 11.
  - 2026-10-10 · Fase 10 · `npx vite-node` dello script `scripts/regenerateBackupExample.ts` · `validateBackupFile` valido, file scritto. Conteggi: 21 allenamenti, 47 gruppi, 63 raggruppamenti (46 single, 12 superset, 5 circuit), 80 esercizi, 306 serie. File ancora ignorato da git.
  - 2026-10-10 · Fase 11 · typecheck, lint, `npm test` · 266 test in 29 file verdi.
  - 2026-10-10 · Fase 12 · typecheck, lint, `npm test` 269 test in 30 file, build verdi; Dexie importato solo in persistence/. Migrazione: `version(2).upgrade` con `modify` sui soli `muscleGroups`; gruppi già nella forma nuova invariati; gruppo vuoto → `clusters: []`.
  - 2026-10-10 · Verifica Fasi 11–12 (clean-code-implementer, seconda invocazione): criteri 5, 6, 8, 9, 10, 15 confermati; API Dexie verificata su dexie.d.ts; corretto un caso di densità preesistente in removeExerciseSet. Proposte: (1) tollerare record senza muscleGroups nell'upgrade — RESPINTA dal processo principale (i record nascono sempre con la lista; mascherare un dato corrotto viola le regole del progetto); (2) test espliciti di checkClusterInvariants dopo collega/stacca/aggiungi — ACCOLTA, affidata alla Fase 13.
  - 2026-10-10 · Fase 14: colore a rotazione per gruppo muscolare (due multipli in gruppi diversi possono avere lo stesso colore: conforme alla SPEC). Sulla superserie l'etichetta del campo non è visibile per mancanza di spazio, resta come nome accessibile e tooltip.
  - 2026-10-10 · Dopo la prova sul campo l'utente ha confermato la rotazione dei colori per gruppo muscolare e il pulsante interno «+ Esercizio» così com'è · nessuna modifica · nessuno.
  - 2026-10-10 · Fase 13 · typecheck, lint, `npm test` 287 test in 30 file verdi; criterio 16 con it.each sulle sette operazioni; aggiunti i test di buona forma (invarianti e posizioni) su collega/stacca/aggiungi. Verifica separata non eseguita: sette metodi identici al pattern esistente, coperti dalla verifica complessiva della Fase 16.
  - 2026-10-10 · Fase 14 · gate verde (321 test in 32 file). Prova a occhio del processo principale con Playwright a 390×844, tema chiaro e scuro, file di esempio importato da Dati → Unisci: 21 allenamenti, superserie e circuito con testata, tempi e sfondo, «Collega al successivo» funzionante, console senza errori. Trovati 3 difetti: testi «versione 1» scritti a mano in DataView e ImportSummaryCard; testata troppo alta (3 righe); riga delle azioni dell'esercizio a capo nei multipli. Corretti da clean-code-implementer (nuovo RestSecondsField.vue, versione dal file validato in useBackup, chip spostato nella riga del nome); gate verde 326 test in 33 file; ricontrollo a occhio conforme.
  - 2026-10-10 · Fase 15 · documenti aggiornati (CLAUDE.md: modello, sezione Raggruppamenti, schema Dexie v2, formato 2, conteggi del file di esempio, 326/33, stato git non più «senza commit»; README; spec-gym-tracker.md con rimandi datati). Nota: `npx vitest run` con il Node 18 di sistema fa fallire i 3 test di migrazione (`CustomEvent is not defined`, assente in Node 18); su Node 22 verdi. Annotato in CLAUDE.md.
  - 2026-10-10 · Fase 16 · verifica clean-code-implementer su Fasi 13–14 e documenti: nessun difetto funzionale, +2 test sul campo dei secondi (328 in 33 file), typecheck/lint/build verdi, Dexie solo in persistence/, `formatVersion: 1` solo nei 3 test di versione ignota. Proposta non applicata: etichetta visibile anche sulla superserie (scelta di layout, da proporre all'utente). spec-adversarial-reviewer sull'intera Parte 2 (base efd0450): criteri 4–18 e 21 verificati, un solo rilievo minore (R1, registrato fra le deviazioni). Criterio 21 parte manuale: già eseguito dal processo principale nella prova a occhio della Fase 14.
  - 2026-10-10 · Fase 17 · APP_VERSION v1.0.009, `npm run build` verde (bundle assets/index-D8z2CJxo.js, precache 40 voci). Prova della migrazione reale con Playwright: `dist-parte1` servito su :4173, importato `backup-esempio-v1.json` (IndexedDB versione 10 = Dexie 1, gruppi con `exercises`); poi build nuovo sulla stessa porta: barra «Nuova versione disponibile» → Aggiorna → v1.0.009, IndexedDB versione 20 (Dexie 2), 21 allenamenti, 47 gruppi, 80 raggruppamenti tutti single, 80 esercizi, 306 serie, nessun gruppo con `exercises`, console senza errori, allenamento aperto correttamente. Deploy non eseguito dal processo principale (negato dai permessi in Parte 1): lo esegue l'utente.

## Esito finale
**Stato finale:** `COMPLETED` il 2026-10-10.

- **Parte 1** — statistiche rimosse del tutto; commit `efd0450`, v1.0.008.
- **Parte 2** — raggruppamenti singolo/superserie/circuito dentro il gruppo muscolare, backup formato 2, migrazione Dexie v1→v2, interfaccia con testata, catena, stacca e sfondi a rotazione; commit `873faf0` «Aggiunto concetto di super serie e circuito», v1.0.009 pubblicata in produzione dall'utente (bundle servito `assets/index-D8z2CJxo.js`, verificato).
- **Test:** 328 in 33 file, verdi su Node 22; i 3 test di migrazione falliscono su Node 18 (`CustomEvent`).
- **Verifiche:** clean-code-implementer in modalità verifica dopo le Fasi 9, 12 e 16; spec-adversarial-reviewer sull'intera Parte 2 (un rilievo minore, registrato come deviazione); prova a occhio con Playwright; prova della migrazione reale in browser. solid-srp-reviewer non invocato: codice non Java.
- **Note residue:** «strada A» (raggruppamenti fra gruppi muscolari diversi, gruppo muscolare come etichetta dell'esercizio) rinviata dall'utente il 2026-10-10. Il raggruppamento è già un livello autonomo: le operazioni lavorano sulla lista di raggruppamenti, quindi cambierà solo il contenitore; servirà una nuova migrazione Dexie e un formato di backup 3.

## Esempio
```ts
// File previsti (nuovi):
//   src/presentation/repetitionScheme.ts          — formatRepetitionScheme(sets) → '4x6' | '12-12-10' | '-'
//   src/domain/exerciseClusters.ts                — listGroupExercises, wrapExercisesInSingleClusters,
//                                                   checkClusterInvariants, linkClusterToNext, detachExercise,
//                                                   changeClusterKind, updateClusterRest*, reorderCluster,
//                                                   addExerciseToCluster
//   src/domain/restInput.ts                       — parseRestSecondsInput
//   src/components/workout/ExerciseClusterCard.vue, ExerciseClusterHeader.vue
//   src/persistence/gymTrackerDatabase.spec.ts    — migrazione v1 → v2
// Rigenerato (gitignorato): gym-tracker-backup-esempio.json — formatVersion 2, 21 allenamenti, 2+ superserie, 1+ circuito

// Test previsti: uno per criterio della DoD (1, 3, 18, 19, 20, 21 sono verificati in revisione o a mano)
// repetitionScheme.spec.ts
it('etichetta NxR con ripetizioni uniformi, tupla con trattini altrimenti, "-" senza serie', ...);      // 2
// workoutStructure.spec.ts / exerciseClusters.spec.ts
it('addExercise crea un raggruppamento singolo in coda con tempi 0', ...);                              // 4
it('collega singolo+singolo → superserie di 2 con i tempi del superiore', ...);                          // 5
it('collega singolo+multiplo e multiplo+singolo → il multiplo assorbe conservando tipo e tempi', ...);   // 5
it('collega multiplo+multiplo → tipo e tempi del superiore, posizioni contigue', ...);                   // 5
it('stacca il primo esercizio → singolo subito dopo il blocco; blocco di 2 torna singolo', ...);         // 6
it('stacca da un circuito di 3 → resta circuito di 2', ...);                                             // 6
it('elimina un esercizio in un multiplo di 2 → l\'altro torna singolo', ...);                            // 7
it('elimina l\'unico esercizio di un singolo → il raggruppamento sparisce', ...);                        // 7
it('cambio tipo solo sui multipli; il recupero fra esercizi si conserva passando a superserie', ...);    // 8
it('parseRestSecondsInput accetta interi ≥ 0 e rifiuta vuoto, negativi, decimali, testo', ...);          // 8
it('aggiunge un esercizio in coda a un raggruppamento senza cambiarne tipo e tempi', ...);               // 9
it('reorderExercise non supera i confini del blocco; reorderCluster muove il blocco', ...);              // 10
// workoutCompletion.spec.ts
it('rifiuta gruppo senza esercizi ed esercizio senza serie valida attraverso i raggruppamenti', ...);    // 11
it('checkClusterInvariants segnala singolo con 2, multiplo con 1, raggruppamento vuoto', ...);           // 11
// workoutCopy.spec.ts
it('copia i raggruppamenti con tipo e tempi e id nuovi a tutti i livelli', ...);                         // 12
// backupExport.spec.ts / useBackup.spec.ts
it('produce formatVersion 2, l istante di esportazione e l elenco completo degli allenamenti', ...);     // 13
// backupValidation.spec.ts / backupImportService.spec.ts / useBackup.spec.ts
it('accetta un backup in versione 2 con raggruppamenti validi', ...);                                    // 14
it('rifiuta v2 con tipo ignoto, cardinalità violata, tempi negativi o decimali, posizioni non contigue', ...); // 14
it('rifiuta una versione del formato ignota', ...);   // formatVersion: 1 → «Versione del formato non supportata: attesa 2, trovata 1.», nei tre spec esistenti // 14
it('la validazione fallisce e il contenuto del database resta identico', ...);                           // 14
// gymTrackerDatabase.spec.ts
it('apre con la classe v2 un database creato in v1 e migra ogni esercizio in un singolo senza perdere nulla', ...); // 15
// useWorkoutDraft.spec.ts
it.each([linkClusterToNext, detachExercise, changeClusterKind, updateClusterRestAfterRound,
         updateClusterRestBetweenExercises, reorderCluster, addExerciseToCluster])
  ('%s aggiorna updatedAt e persiste via autosave', ...);                                                // 16
// workoutCounts.spec.ts / exerciseSuggestions.spec.ts
it('conteggi e suggerimenti attraversano i raggruppamenti con gli stessi risultati di prima', ...);      // 17a
// ExerciseClusterCard.spec.ts (jsdom)
it('la testata mostra il recupero fra esercizi solo per il circuito, i pulsanti di tipo solo sui multipli e «Recupero fra le serie» sul singolo', ...); // 17b
// Criterio 21 (non è un test della suite: il file è gitignorato) — script usa-e-getta nello scratchpad, Fase 10:
//   const outcome = validateBackupFile(regenerated); if (!outcome.valid) { console.error(outcome.reason); process.exit(1); }
```
