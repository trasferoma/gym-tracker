# SPEC — superserie-circuiti

**Obiettivo:** togliere per intero le statistiche dall'app (Parte 1) e introdurre il **raggruppamento** di esercizi — singolo, superserie, circuito — con i suoi tempi di recupero, come livello autonomo fra gruppo muscolare ed esercizio (Parte 2), senza perdere nessun dato già registrato sul dispositivo.

**Contesto**
- Punti del codice interessati (Parte 1): rotta `statistics` e tipo `PrimaryRouteName` in `src/router/index.ts`; voce «Statistiche» in `src/components/shell/AppTabBar.vue` (griglia a 4 colonne); scorciatoia `viewTrend` in `src/components/workout/ExerciseBlock.vue` ed emit `view-trend` con pulsante `chart` in `src/components/workout/SetRegister.vue`; `src/views/StatisticsView.vue`; `src/domain/statistics/` (12 file: `statKey`, `statEntries`, `statSessions`, `statNavigation`, `sparklineGeometry`, `setProgress` e relativi `.spec.ts`); `src/components/statistics/` (5 componenti + `StatSetProgressList.spec.ts`); `src/composables/useStatisticsPath.ts` + spec; icona `chart` in `src/components/icon/AppIcon.vue` (usata solo da tab bar, `SetRegister`, `StatisticsView`); token `--line-1…6` in `src/styles/tokens.css` (usati solo da `StatSetProgressCard.vue`, in entrambi i temi); in `src/presentation/italianFormat.ts` le funzioni `formatWeightDifference` (riga 40) e `formatWorkoutDayCompact` (riga 31, con il formatter privato `formatCompactDay` e `compactDayFormatter`), usate solo da `StatSetProgressCard.vue` e `StatSetProgressList.vue`, con i relativi `describe` in `italianFormat.spec.ts` (righe 29–44). `schemeLabel` di `statKey.ts` è usata anche dalla chip dello schema in `ExerciseBlock.vue`: va **ricollocata**, non cancellata. `deriveStatKey`, `sameRepetitionScheme`, `sameStatKey` sono usate solo dentro le statistiche. Tutto il resto che le statistiche importano da codice condiviso (`EmptyState`, `InfoBanner`, `AppTopBar`, `sharedLoadingIndicator`, `formatCount`, `formatWeight`, `formatWorkoutDayShort`, `listAllWorkouts`) ha altri chiamanti e resta. Documenti con riferimenti: `CLAUDE.md`, `README.md`, `spec-gym-tracker.md`, `implementation-gym-tracker.md` (registro storico).
- Punti del codice interessati (Parte 2): tipi in `src/domain/workout.ts` (`MuscleGroupWorkout.exercises`); tutti i consumatori di `group.exercises`, che **smettono di compilare** appena il campo cambia nome: `workoutStructure.ts` (add/rename/remove/reorder esercizio, operazioni sulle serie via `replaceExerciseWithin`), `workoutCompletion.ts` (gruppo senza esercizi, esercizio senza serie valida), `workoutCounts.ts`, `workoutCopy.ts`, `exerciseSuggestions.ts`, `workoutFactory.ts` (`createMuscleGroupWorkout` con `exercises: []`), `backup/backupValidation.ts` (`parseMuscleGroup`, righe 58–61), `components/workout/MuscleGroupSection.vue` (itera `group.exercises`, conta inline). Altri punti toccati senza rottura di compilazione: `backup/backupFormat.ts` (`BACKUP_FORMAT_VERSION = 1 as const`, con `BackupFile.formatVersion` legato alla costante), `backup/backupValidation.ts` (`requireExactFormatVersion`, righe 181–185: rifiuta qualunque valore diverso dalla costante con «Versione del formato non supportata: attesa N, trovata …» — già sufficiente per rifiutare la versione 1 una volta portata la costante a 2), `backup/backupExport.ts` (prende la versione dalla costante); `persistence/gymTrackerDatabase.ts` (classe `GymTrackerDatabase` **non esportata**, nome `'gym-tracker'` fisso nel costruttore, `version(1)`, indici `id, workoutDate, status, createdAt`); `composables/useWorkoutDraft.ts` (un metodo per operazione, tutto passa da `commitWorkout`/`applyOutcome`); componenti `ExerciseBlock.vue`, `SetRegister.vue`, `SetRow.vue`; `views/WorkoutDetailView.vue` (conferma di eliminazione per gruppo ed esercizio). `setIssue.ts` e `useStorageStatus.ts` non scorrono esercizi (`totals.exercises` è un conteggio): non sono toccati.
- File di esempio: `gym-tracker-backup-esempio.json` in radice, `formatVersion: 1`, gitignorato (`.gitignore:20`), citato solo in `CLAUDE.md:192` (il `README.md` non lo nomina). Strumenti già presenti per rigenerarlo senza dipendenze nuove: `node_modules/.bin/vite-node` (dipendenza transitiva di Vitest 3) esegue un file TypeScript risolvendo l'alias `@/` da `vite.config.ts`; `scripts/check-node-version.mjs` è l'unico script del repository e non viene toccato.
- Test da adattare (Parte 2), verificati con `grep`: **costruiscono** `exercises` sotto il gruppo `backupValidation.spec`, `workoutCompletion.spec`, `exerciseSuggestions.spec`, `useWorkoutDraft.spec`, `useStorageStatus.spec`, `workoutRepository.spec`, `workoutCopy.spec`; **leggono** `.exercises` dal gruppo `workoutStructure.spec`, `presentation/italianFormat.spec` (riga 52), oltre a `backupValidation.spec`, `workoutCopy.spec`, `useWorkoutDraft.spec`. Cambiano per la **versione del formato**: le fixture valide dichiarano `formatVersion: 1` in `backupValidation.spec.ts` (righe 14, 25, 48), `backupExport.spec.ts` (7, 13) e `useBackup.spec.ts` (36, 69, 92, 111) e passano a 2; i tre test di «versione ignota» usano oggi `formatVersion: 2` (`backupValidation.spec.ts:37`, `backupImportService.spec.ts:58`, `useBackup.spec.ts:59`), che diventa la versione valida, e passano a 1. Non costruiscono esercizi e non vanno riscritti: `backupImportPlan.spec`, `useWorkoutHistory.spec`.
- Pattern da riusare: trasformazioni immutabili con `reindexPositions`/`reorderByPosition`/`replaceMuscleGroup` in `workoutStructure.ts`; `WorkoutOperationOutcome` per i rifiuti con `reason` italiana; `SetValueParseResult` e i parser di `setInput.ts` per l'input numerico; `requireXxx` + `BackupValidationError` in `backupValidation.ts`; `generateId()` in `domain/identity.ts`; componenti `workout/` che ricevono `draft: UseWorkoutDraft` e chiamano un metodo per azione; `ExercisePicker` per nome e suggerimenti; test di persistenza su `fake-indexeddb` con pulizia in `afterEach`; test di componente con `// @vitest-environment jsdom`.
- File / moduli coinvolti: vedi l'elenco effettivo in `implementation-superserie-circuiti.md`.

**Comportamento atteso**

*Parte 1 — Rimozione delle statistiche*
- Nessuna rotta `/statistiche`, nessuna vista, nessuna voce nella barra inferiore (che passa a tre voci: Home · Allenamenti · Dati), nessun pulsante «Statistiche di questo esercizio» nel registro delle serie, nessun composable, nessuna funzione di dominio o di presentazione, nessun componente, nessuna icona e nessun token CSS usati solo dalle statistiche. Rimozione totale, non codice dormiente: spariscono anche `formatWeightDifference` e `formatWorkoutDayCompact` con i loro test.
- La **chip dello schema** nell'intestazione dell'esercizio resta identica: `4x6` con ripetizioni uniformi, `12-12-10` altrimenti, `-` senza serie. La funzione si sposta in `src/presentation/repetitionScheme.ts` come `formatRepetitionScheme(sets)`: è la forma testuale di un valore mostrata all'utente, stesso concetto di `formatWeight` e `formatCount`.
- Nessun dato persistito cambia: le statistiche erano calcolate al volo.
- `CLAUDE.md`, `README.md` e `spec-gym-tracker.md` non descrivono più le statistiche; il numero di test della suite è aggiornato.

*Parte 2 — Raggruppamenti*

Modello di dominio (nomi inglesi nel codice; in interfaccia «raggruppamento», mai «gruppo», che è il gruppo muscolare):

```
Workout → 1..3 MuscleGroupWorkout → 1..N ExerciseCluster → 1..N Exercise → 1..N ExerciseSet
```

| Entità | Campi |
| --- | --- |
| `MuscleGroupWorkout` | `id`, `name`, `position`, **`clusters`** (lista ordinata; sostituisce `exercises`) |
| `ExerciseCluster` | `id`, `kind` (`single` \| `superset` \| `circuit`), `position`, `restAfterRoundSeconds` (intero ≥ 0, tutti i tipi), `restBetweenExercisesSeconds` (intero ≥ 0, **significativo solo per `circuit`**, sempre presente), `exercises` (lista ordinata, `position` contigua dentro il raggruppamento) |

- Il raggruppamento c'è **sempre**: `single` ha esattamente 1 esercizio; `superset` e `circuit` ne hanno ≥ 2; nessun raggruppamento vuoto. Queste invarianti sono verificate da una funzione di dominio (`checkClusterInvariants`) usata dal controllo di completamento e, in forma equivalente, dalla validazione del backup.
- Semantica (solo descrittiva, nessun timer): `single` → recupero fra una serie e l'altra = recupero a fine giro; `superset` → esercizi eseguiti di fila, recupero solo a fine giro; `circuit` → recupero fra un esercizio e l'altro **e** a fine giro. Il giro n è la serie n di ogni esercizio: non si salva e non si visualizza. Esercizi con numero di serie diverso nello stesso raggruppamento sono ammessi senza avviso; la visualizzazione delle serie resta com'è oggi.
- **Aggiunta di un esercizio al gruppo** («+ Esercizio» in fondo al gruppo): nasce un nuovo raggruppamento `single` in coda, tempi 0, esercizio in posizione 0.
- **Collega al successivo** (icona catena, fra due raggruppamenti adiacenti dello stesso gruppo muscolare): i due raggruppamenti si fondono in uno, ordine degli esercizi conservato (prima quelli del superiore). `single` + `single` → `superset`; `single` + multiplo (sopra o sotto) → il multiplo assorbe l'esercizio conservando tipo e tempi; multiplo + multiplo → un solo raggruppamento con tipo e tempi del superiore. Gli esercizi di un raggruppamento sono contigui per costruzione. L'ultimo raggruppamento non ha il pulsante.
- **Testata per ogni raggruppamento, anche il singolo**: mostra il tipo (etichetta «Singolo» / «Superserie» con fulmine / «Circuito» con freccia circolare — decisione presa D4), il campo del recupero a fine giro — etichettato **«Recupero fra le serie» sul singolo** e «Recupero a fine giro» sui multipli, stesso campo `restAfterRoundSeconds` (decisione presa D3) — e, solo per il circuito, il campo «Recupero fra esercizi». Sui multipli il tipo si cambia dalla testata (superserie ↔ circuito). I tempi sono secondi interi ≥ 0, `inputmode="numeric"`: input non valido → resta il valore precedente, come per ripetizioni e peso. Nella testata stanno anche le frecce su/giù del raggruppamento.
- **Cambio circuito → superserie**: `restBetweenExercisesSeconds` si conserva nel documento ma non si mostra; tornando a circuito riappare. Stessa regola quando un multiplo torna singolo.
- **Stacca** (far uscire un esercizio senza eliminarlo, solo nei multipli): l'esercizio diventa un `single` posizionato **subito dopo** il raggruppamento da cui esce, qualunque fosse la sua posizione (anche il primo); il nuovo singolo eredita il recupero a fine giro del blocco. Se il blocco resta con 1 esercizio torna `single`; un circuito di 3 che perde 1 resta circuito di 2.
- **Eliminazione di un esercizio** (conferma come oggi): in un multiplo di 2, l'altro torna `single`; l'unico esercizio di un singolo → il raggruppamento sparisce. Mai un raggruppamento vuoto.
- **Aggiungere un esercizio dentro un raggruppamento multiplo** («+ Esercizio» dentro la card, solo sui multipli — decisione presa D2): nuovo esercizio in coda al blocco, tipo e tempi invariati. Permette di sostituire A con C senza sciogliere il blocco (aggiungi C, stacca o elimina A).
- **Riordino con le frecce** (decisione presa D1): due livelli, senza attraversare i confini. Le frecce dell'esercizio (solo nei multipli) lo muovono dentro il suo raggruppamento e sono disabilitate ai bordi del blocco; le frecce in testata muovono l'intero raggruppamento fra quelli del gruppo. Nel singolo le frecce stanno solo in testata. `position` resta contigua a entrambi i livelli.
- **Sfondo**: i raggruppamenti multipli hanno uno sfondo diverso dallo standard, condiviso dai loro esercizi, scelto a rotazione fra 4 token `--cluster-1…4` (tema scuro e chiaro) in base all'indice del raggruppamento fra i multipli del gruppo, così due blocchi vicini non coincidono. I singoli restano con lo sfondo normale. Nessun colore fuori da `tokens.css`.
- **Copia dell'allenamento**: i raggruppamenti sono copiati con tipo e tempi; id nuovi anche per i raggruppamenti; il resto come oggi (niente data, stato, spunte, note generali, marcatore).
- **Backup**: esiste **un solo formato, il 2**. Export con `formatVersion: 2` e raggruppamenti inclusi. Import: il file è validato campo per campo (tipo ammesso, invarianti di cardinalità, tempi interi ≥ 0, posizioni contigue a tutti i livelli) prima di toccare il database. Qualunque altra versione, **la 1 compresa**, è rifiutata da `requireExactFormatVersion` con il messaggio già esistente («Versione del formato non supportata: attesa 2, trovata 1.»): nessuna lettura né conversione dei file in formato 1, perché non esistono backup in quel formato da leggere (decisione dell'utente). I tre test di «versione ignota» usano la **1**: è il caso realistico — l'unico file «vecchio» che possa capitare — e protegge da un ripristino accidentale della lettura v1; un valore inventato come 3 verificherebbe solo un futuro che non esiste.
- **File di esempio**: `gym-tracker-backup-esempio.json` viene **rigenerato nel formato 2**: gli stessi 21 allenamenti con ogni esercizio avvolto in un `single` a tempi 0, più almeno **due superserie e un circuito** realistici (≥ 2 esercizi adiacenti dello stesso gruppo, tempi > 0) in alcune giornate. Il file passa `validateBackupFile` e si importa da Dati → Scegli un file → Unisci. Si genera con uno script usa-e-getta **fuori dal repository** (procedura in `implementation-superserie-circuiti.md`, Fase 10), senza dipendenze nuove. `CLAUDE.md` lo descrive nel formato nuovo con i conteggi aggiornati.
- **Migrazione IndexedDB**: schema Dexie in versione 2 con `upgrade` che avvolge ogni esercizio di ogni gruppo in un `single` con tempi 0, senza perdere nulla (id, esercizi, serie, marcatori identici). La dichiarazione `version(1)` resta accanto a `version(2)`, come Dexie richiede per migrare. La classe `GymTrackerDatabase` viene esportata con nome del database parametrico (default `'gym-tracker'`) solo per rendere la migrazione provabile su un database di test; il singleton `gymTrackerDatabase` non cambia. La conversione (`wrapExercisesInSingleClusters`) è una funzione pura di dominio e **la migrazione è il suo unico consumatore**: resta in `domain/exerciseClusters.ts` perché espressa in tipi di dominio (`Exercise[]` → `ExerciseCluster[]`) e perché `persistence/` deve restare l'unico punto che conosce Dexie, non il posto dove si costruiscono oggetti di dominio.
- **Completamento**: regola 1..3 gruppi invariata; «gruppo senza esercizi» ed «esercizio senza serie valida» attraversano i raggruppamenti; un raggruppamento che viola le invarianti rende la giornata non completabile con motivo.
- **Conteggi, suggerimenti, eliminazione con conteggio, totali in Dati** attraversano i raggruppamenti e danno gli stessi numeri di prima a parità di esercizi.
- **Autosave invariato**: ogni operazione sui raggruppamenti esposta da `useWorkoutDraft` passa da `commitWorkout` (aggiorna `updatedAt` e schedula il salvataggio).
- **Vincolo di design dichiarato**: in un passo futuro («strada A», fuori ambito) il gruppo muscolare diventerà un'etichetta dell'esercizio e l'allenamento una sequenza di raggruppamenti anche trasversali ai gruppi (circuito total body). Il raggruppamento è quindi un livello autonomo, con operazioni che ragionano sulla lista di raggruppamenti del suo contenitore e non sul gruppo muscolare in sé: domani cambierà solo il contenitore.
- Al termine di ciascuna parte: `APP_VERSION` incrementata, build e deploy secondo `CLAUDE.md`, checkpoint di commit (eseguito dal processo principale su richiesta dell'utente).

**Vincoli**
- Retrocompatibile sui **dati già nel dispositivo**: nessun record perso o alterato oltre all'avvolgimento in raggruppamenti; `workoutDate` non slitta. **Nessuna compatibilità con i backup in formato 1**: non ne esistono e non vanno supportati. Conseguenza da dichiarare onestamente: un backup esportato dal telefono *prima* dell'aggiornamento è in formato 1 e la nuova versione lo rifiuta; serve come copia leggibile dei dati e come materiale per una conversione manuale fuori dall'app, non come ripristino dall'interno dell'app (rete di sicurezza e alternative in `implementation-superserie-circuiti.md`, Fase 17).
- Riusare i pattern presenti: trasformazioni immutabili, `WorkoutOperationOutcome` per i rifiuti rivolti all'utente ed eccezioni per gli errori di programmazione (tipo `single` imposto a un multiplo, cambio tipo su un singolo, id inesistente), parser di input nello stile di `setInput.ts`, validazione backup nello stile `requireXxx`.
- Dexie solo in `persistence/`; nessuna logica di dominio in componenti e viste; nessun colore fuori da `tokens.css`; nessuna dipendenza nuova (nemmeno per rigenerare il file di esempio); icone SVG inline in `AppIcon.vue` (`link` catena per «collega», `bolt` fulmine per la superserie, `cycle` freccia circolare per il circuito, `unlink` per «stacca» — decisione presa D4); 4 spazi, alias `@/`, test `*.spec.ts` accanto al codice.
- Nessun timer, cronometro o notifica: i tempi si leggono e si impostano soltanto.
- Nessun aggregato o campo derivato persistito (niente «giro»).
- `prototype/` non si tocca e non si usa.
- Durante la Parte 2 nessun gate «verde» (typecheck, lint, suite) è preteso finché resta un consumatore di `group.exercises` non adattato: il primo gate completo arriva quando dominio, validazione del backup, componente provvisorio e fixture sono tutti passati a `clusters`.

**Fuori scope**
- Importazione, lettura o conversione di backup in formato 1 (non esistono); qualsiasi forma di compatibilità all'indietro del formato di backup.
- Timer e cronometri di recupero; visualizzazione per giro; avvisi su numero di serie diverso dentro un raggruppamento.
- Raggruppamenti trasversali ai gruppi muscolari e gruppo muscolare come etichetta dell'esercizio («strada A»).
- Eliminazione di un intero raggruppamento in un colpo; drag & drop; spostamento di un esercizio fra gruppi muscolari.
- Qualsiasi forma di statistica, grafico o storico di progressione.
- Riscrittura del registro storico `implementation-gym-tracker.md` (riceve solo una nota datata).

**Decisioni prese** — chiuse dall'utente, non più in discussione; il resto del documento le dà per acquisite
- **D1. Riordino al confine del blocco**: due livelli **senza attraversamento**; la freccia dell'esercizio al bordo del blocco è disabilitata.
- **D2. «+ Esercizio» dentro il raggruppamento solo sui multipli**: la catena resta l'unica via per trasformare un singolo in multiplo.
- **D3. Etichetta del recupero sulla testata del singolo**: **«Recupero fra le serie»** (sui multipli «Recupero a fine giro»); il dato è `restAfterRoundSeconds` in entrambi i casi, cambia solo l'etichetta.
- **D4. Mappa delle icone**: fulmine (`bolt`) = superserie, freccia circolare (`cycle`) = circuito, catena (`link`) = azione «collega al successivo», `unlink` = «stacca».
- **D5. Nessun supporto ai backup in formato 1**: il formato passa a 2 e la versione 1 è rifiutata come qualunque altra versione ignota; la conversione «ogni esercizio → singolo» serve solo alla migrazione IndexedDB; il file di esempio viene rigenerato nel formato 2.

**Punti da decidere** — ciascuno con la proposta adottata nel resto del documento; se la scelta cambia, cambiano le voci corrispondenti di comportamento e DoD
1. **Unione singolo + singolo**: tempi del raggruppamento **superiore** (proposta) · alternative: il massimo dei due; azzeramento.
2. **Unione multiplo + multiplo con tipi diversi**: tipo e tempi del **superiore** (proposta) · alternativa: rifiuto con `reason` («Stacca prima gli esercizi…»), che richiede di sciogliere uno dei due.
3. **Stacca il primo esercizio**: sempre **dopo** il blocco (proposta, regola unica e prevedibile) · alternativa: il primo esce **prima** del blocco.
4. **Circuito → superserie e multiplo → singolo**: recupero fra esercizi **conservato** e nascosto (proposta: non si perde il valore a un tocco) · alternativa: azzerato, così il documento riflette la semantica.
5. **Frecce nel singolo solo in testata** (proposta, evita due coppie identiche) · alternativa: anche sulla riga dell'esercizio.
6. **Tempi in secondi interi con suffisso «s»** sia in lettura sia in input (proposta) · alternativa: `mm:ss`.
7. **Sfondo a rotazione sull'indice fra i soli multipli del gruppo** (proposta) · alternativa: sulla posizione fra tutti i raggruppamenti.
8. **Nome inglese del concetto**: `ExerciseCluster` / `single` · `superset` · `circuit` (proposta tecnica; `ExerciseBlock` è già il componente dell'esercizio, `Group` è il gruppo muscolare).
9. **Documenti storici**: `spec-gym-tracker.md` sostituisce le parti sulle statistiche con un rimando a questa SPEC conservando la numerazione delle decisioni; `implementation-gym-tracker.md` riceve una nota nel registro e non viene riscritto (proposta).

**Definition of done** — criteri verificabili; i criteri 2, 4–17b sono coperti da almeno un test automatico; 1, 3, 18–21 sono verificati in revisione
1. Nessun riferimento residuo alle statistiche in `src/`: `grep -i` (senza distinguere maiuscole) su `statistic|statKey|sparkline|setProgress|statNavigation|statSessions|statEntries|schemeLabel|sameStatKey|sameRepetitionScheme|deriveStatKey|viewTrend|view-trend|--line-|chart|formatWeightDifference|formatWorkoutDayCompact` non trova nulla (stesso pattern del censimento di Fase 1); la barra ha tre voci e il registro delle serie non ha il pulsante grafico; `PrimaryRouteName` non contiene `statistics`; `italianFormat.ts` non esporta più `formatWeightDifference` né `formatWorkoutDayCompact`.
2. `formatRepetitionScheme` restituisce `4x6` con ripetizioni uniformi, `12-12-10` altrimenti, `-` senza serie; la chip dell'esercizio la usa.
3. Dopo la Parte 1: build, typecheck, lint e test verdi; `CLAUDE.md`, `README.md`, `spec-gym-tracker.md` aggiornati; `APP_VERSION` incrementata e build pubblicata in `Production`.
4. `addExercise` su un gruppo crea un nuovo raggruppamento `single` in coda con tempi 0 ed esercizio in posizione 0; `createMuscleGroupWorkout` nasce con `clusters: []`.
5. Collega al successivo: `single`+`single` → `superset` di 2 con i tempi del superiore; `single`+multiplo e multiplo+`single` → il multiplo assorbe conservando tipo e tempi e l'ordine degli esercizi; multiplo+multiplo → uno solo con tipo e tempi del superiore; posizioni contigue a entrambi i livelli.
6. Stacca: l'esercizio diventa `single` subito dopo il blocco di origine, anche se era il primo; il blocco rimasto con 1 esercizio torna `single`; un circuito di 3 che perde 1 resta `circuit` di 2.
7. Eliminazione: in un multiplo di 2 l'altro esercizio torna `single`; l'unico esercizio di un singolo elimina il raggruppamento; nessun raggruppamento vuoto resta nel gruppo.
8. Tipo e tempi: `superset` ↔ `circuit` solo sui multipli (sul singolo, o imponendo `single` a un multiplo, è un errore di programmazione); `restBetweenExercisesSeconds` si conserva passando a `superset`; il parser dei secondi accetta interi ≥ 0 e rifiuta vuoto, negativi, decimali e testo.
9. Aggiunta dentro un raggruppamento multiplo: esercizio in coda, tipo e tempi invariati.
10. Riordino: un esercizio non supera i confini del suo raggruppamento (ai bordi la struttura resta invariata); un raggruppamento si muove su/giù fra quelli del gruppo; posizioni contigue a entrambi i livelli.
11. Completamento: 1..3 gruppi come prima; un gruppo i cui raggruppamenti non hanno esercizi e un esercizio senza serie valida dentro un raggruppamento sono rifiutati con motivo; `checkClusterInvariants` segnala singolo con 2 esercizi, multiplo con 1, raggruppamento vuoto.
12. Copia: i raggruppamenti sono copiati con tipo e tempi, con id nuovi a tutti i livelli (raggruppamento incluso), e il resto della copia si comporta come oggi.
13. Export: `formatVersion: 2` e i raggruppamenti sono nel JSON; `backupExport.spec` e `useBackup.spec` attendono la versione 2.
14. Import: un file in versione 2 è accettato se valido e rifiutato con motivo per tipo sconosciuto, singolo con 2 esercizi, multiplo con 1, raggruppamento vuoto, tempo negativo o decimale, posizioni non contigue; un file con `formatVersion: 1` — e qualunque valore diverso da 2 — è rifiutato con «Versione del formato non supportata» (nei tre test di «versione ignota» esistenti, portati da 2 a 1); in ogni caso di rifiuto il database resta identico.
15. Migrazione: un database creato con Dexie grezza in versione 1 (stesso nome e stessi indici) con `exercises` sotto il gruppo, chiuso e riaperto con `new GymTrackerDatabase(nome)` in versione 2, espone `clusters` con un `single` per esercizio, tempi 0, esercizi e serie identici agli originali; `gymTrackerDatabase.ts` dichiara sia `version(1)` sia `version(2).upgrade(...)`.
16. **Tutte** le operazioni sui raggruppamenti esposte da `useWorkoutDraft` (`linkClusterToNext`, `detachExercise`, `changeClusterKind`, `updateClusterRestAfterRound`, `updateClusterRestBetweenExercises`, `reorderCluster`, `addExerciseToCluster`) aggiornano `updatedAt` e persistono tramite l'autosave: un test per operazione, o un `it.each` sulle sette.
17. a. `countWorkout`/`countMuscleGroup` e `suggestExerciseNames` attraversano i raggruppamenti e danno gli stessi risultati di prima a parità di esercizi (test di dominio).
    b. La testata del raggruppamento mostra il campo «Recupero fra esercizi» solo per il circuito, i pulsanti di tipo solo per i multipli, e sul singolo l'etichetta «Recupero fra le serie» (D3) (test di componente in `jsdom`).
18. Interfaccia: testata su ogni raggruppamento, singolo compreso; icone fulmine, freccia circolare, catena e stacca presenti in `AppIcon` secondo la mappa D4; sfondi a rotazione sui 4 token solo per i multipli; singoli con sfondo normale; nessun colore fuori da `tokens.css`.
19. Dopo la Parte 2: build, typecheck, lint e test verdi; documentazione aggiornata al modello esteso (compresa la riga di `README.md` sulla versione del formato e la descrizione del file di esempio in `CLAUDE.md`); `APP_VERSION` incrementata e build pubblicata in `Production`.
20. Nessuna modifica non richiesta a modello, contratti, altre viste o `prototype/`.
21. File di esempio: `gym-tracker-backup-esempio.json` dichiara `formatVersion: 2`, contiene 21 allenamenti, almeno 2 raggruppamenti `superset` e almeno 1 `circuit` con tempi > 0, `validateBackupFile` sul suo contenuto restituisce `valid: true`, e l'importazione da Dati → Unisci su un database vuoto mostra 21 allenamenti con superserie e circuito visibili con la loro testata. Nessuno script di generazione è entrato nel repository.

**Esempio** (istanza concreta — solo illustrativo)
```ts
// Gruppo «Petto» con tre esercizi: Panca, Croci, Push-up.
// Stato iniziale: tre raggruppamenti single, ciascuno con un esercizio.
//   [single: Panca] [single: Croci] [single: Push-up]
//
// Tocco «collega al successivo» fra Panca e Croci:
//   [superset: Panca, Croci]  [single: Push-up]       ← tempi presi dal superiore (Panca)
//
// Tocco «collega al successivo» fra la superserie e Push-up:
//   [superset: Panca, Croci, Push-up]                  ← il multiplo assorbe il singolo
//
// Dalla testata passo a circuito e imposto 30 s fra esercizi, 120 s a fine giro.
// «Stacca» su Croci (il secondo):
//   [circuit: Panca, Push-up]  [single: Croci]         ← il singolo nasce subito dopo il blocco
//
// Il giro 2 è la serie 2 di Panca seguita dalla serie 2 di Push-up: non si salva.

export type ExerciseClusterKind = 'single' | 'superset' | 'circuit';

export interface ExerciseCluster {
    readonly id: string;
    readonly kind: ExerciseClusterKind;
    readonly position: number;
    readonly restAfterRoundSeconds: number;
    readonly restBetweenExercisesSeconds: number;
    readonly exercises: readonly Exercise[];
}

export function linkClusterToNext(group: MuscleGroupWorkout, clusterId: string): MuscleGroupWorkout {
    const upperIndex = findClusterIndex(group, clusterId);
    const upper = group.clusters[upperIndex];
    const lower = group.clusters[upperIndex + 1];
    if (!upper || !lower) {
        throw new Error(`Nessun raggruppamento successivo a: ${clusterId}`);
    }
    const merged = mergeClusters(upper, lower);          // kind: single+single → superset, altrimenti quello del superiore
    const clusters = reindexPositions([
        ...group.clusters.slice(0, upperIndex), merged, ...group.clusters.slice(upperIndex + 2)
    ]);
    return { ...group, clusters };
}

// Backup: un solo formato. Un file in versione 1 è rifiutato dal controllo già esistente:
//   validateBackupFile({ formatVersion: 1, ... })
//   → { valid: false, reason: 'Versione del formato non supportata: attesa 2, trovata 1.' }
```
