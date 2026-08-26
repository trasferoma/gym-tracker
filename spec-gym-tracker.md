# SPEC — Gym Tracker (PWA personale per il registro degli allenamenti)

**Obiettivo:** realizzare una PWA mobile-first, offline e senza backend, che registri gli allenamenti in palestra con la gerarchia giornata → gruppi muscolari → esercizi → serie, e ne derivi al volo le statistiche di progressione del peso per posizione di serie.

**Contesto**
- Punti del codice interessati: nessuno preesistente. Il repository contiene solo `prototype/` (mockup usa-e-getta HTML/CSS/JS senza persistenza) e `home.png` (logo PNG RGBA 1254×1254, fondo trasparente, manubrio grafite con accento). Lo scaffold Vite/Vue viene creato in parallelo a questa SPEC.
- Pattern o meccanismi esistenti da riusare: `prototype/` è la **specifica visiva approvata** — layout, spaziature, gerarchia, testi italiani, percorsi utente. Da lì si riprendono, come riferimento e non come codice: i token CSS di `prototype/styles.css` (`--bg #0f1211`, `--surface`, `--border`, `--text`, `--accent #c2f53d` sullo scuro e `#8bc10f` sul chiaro, `--line-1…6` per la sparkline, `--r-*`, `--tap 46px`, `--gutter 16px`), il set di icone SVG inline di `prototype/app.js`, i nomi di campo del dominio già usati là (`muscleGroups`, `exercises`, `sets`, `workoutDate`, `createdAt`, `updatedAt`), la derivazione dello schema (`schemeOf`), la raccolta delle voci statistiche (`statEntries`), la copia strutturale (`cloneStructure`), la geometria della sparkline (`sparkline`).
- File / moduli coinvolti: tutto nuovo sotto `src/` e `public/`. `prototype/` **non** è un componente dell'applicazione: non va importato, riusato a runtime, rifattorizzato né spedito nel bundle.

**Modello di dominio** — cardinalità non negoziabili

```
Workout → 1..3 MuscleGroupWorkout → 1..N Exercise → 1..N ExerciseSet
```

Un gruppo muscolare **non** contiene serie: contiene esercizi, e ogni esercizio contiene le proprie serie. Ogni serie è autonoma: ripetizioni e peso possono differire fra serie dello stesso esercizio.

| Entità | Campi |
| --- | --- |
| `Workout` | `id` (UUID), `workoutDate` (data **locale** `YYYY-MM-DD`, mai un `Date` UTC), `status` (`draft` \| `completed`), `notes?`, `muscleGroups` (lista ordinata), `createdAt`, `updatedAt` (ISO 8601) |
| `MuscleGroupWorkout` | `id`, `name` (**nome italiano del gruppo salvato nel record**: stringa, non un id inglese, non una FK), `position`, `exercises` (lista ordinata) |
| `Exercise` | `id`, `name`, `position`, `notes?`, `sets` (lista ordinata) |
| `ExerciseSet` | `id`, `position`, `repetitions` (intero > 0), `weight` (kg, decimali ammessi, **0 valido** per il corpo libero), `completed`, `notes?` |

La cardinalità 1..3 dei gruppi è verificata **solo al completamento**; in bozza qualsiasi numero è ammesso e salvabile. La cardinalità 1..N di esercizi e serie è verificata anch'essa al completamento.

**Comportamento atteso** — requisiti funzionali

*Navigazione*
- Barra inferiore a quattro voci: **Home · Allenamenti · Statistiche · Dati**. «Nuovo» non è una voce: è un pulsante grande nella home.
- Il pulsante indietro torna alla schermata di provenienza (`Nuovo` e `Dettaglio` ricordano la provenienza).

*Home*
- Logo `home.png`, nome dell'app, card «In corso» con «Riprendi» **solo se esiste una bozza**, pulsante «Nuovo allenamento», riga con l'ultima giornata completata (data e sequenza dei gruppi), accesso allo storico.

*Allenamenti (storico)*
- Elenco decrescente per data e, a pari data, crescente per ora di creazione; sezione «Oggi» separata; filtro per gruppo muscolare limitato ai gruppi effettivamente usati; badge bozza/completato; conteggio esercizi e serie; apertura del dettaglio ed eliminazione con conferma generica.

*Nuovo allenamento*
- Campo data (default oggi); **avviso non bloccante** quando in quella data esistono già allenamenti («ne verrà creato un altro, nulla viene sovrascritto»); scelta della giornata da copiare fra «Parti da zero» e le **ultime 20 giornate** dalla più recente, bozze incluse.
- Alla conferma la **bozza viene creata subito** e si apre il dettaglio. Nessuna modalità «non ancora salvato».
- La copia porta gruppi, esercizi, ordine, numero e ordine delle serie, ripetizioni, pesi e note degli esercizi. **Non** copia data, stato `completed` dell'allenamento, spunte delle serie, note generali. Tutti gli elementi ricevono **nuovi UUID** e sono indipendenti dall'originale.

*Dettaglio allenamento*
- Pagina unica, **nessuna modale annidata**. Intestazione appiccicata con data, ora, stato della giornata e stato del salvataggio. Note della giornata.
- Sezioni gruppo **espanse per default**, collassabili; posizione mostrata; riordino con **pulsanti su/giù** (mai drag & drop) per gruppi ed esercizi; eliminazione con conferma generica; aggiunta gruppo disabilitata oltre 3.
- Esercizi editabili inline con etichetta dello schema; aggiunta con campo nome e **suggerimenti dallo storico**: dedup per (gruppo, nome normalizzato), filtrati sul gruppo corrente, ordinati per uso più recente, con ripiego su tutti i nomi se quel gruppo non ha storia.
- Serie presentate come **registro con intestazioni di colonna** (`#`, Ripetizioni, Peso, spunta, elimina). `inputmode="numeric"` per le ripetizioni, `inputmode="decimal"` per il peso accettando **sia virgola sia punto**. Pulsante «duplica ultima serie» (nuovo UUID, spunta a `false`).
- **Autosave unico** con debounce ~500 ms su qualsiasi modifica, con **flush forzato** su blur del campo, navigazione e `visibilitychange`. Tre stati visibili: salvataggio in corso, salvato, errore.
- Completamento: consentito solo da 1 a 3 gruppi, ciascuno con almeno un esercizio e almeno una serie valida; altrimenti avviso non bloccante e pulsante disabilitato. Il completamento non richiede che le serie siano spuntate.
- Scorciatoia dal singolo esercizio alla vista finale delle statistiche (posizione, gruppo, esercizio e schema sono noti dal contesto). Se lo schema non ha storia, dirlo invece di mostrare una tabella vuota.

*Statistiche*
- Chiave: `posizione del gruppo nella giornata × gruppo × esercizio × schema delle ripetizioni`. Solo allenamenti `status === 'completed'` e, dentro questi, **tutte** le serie, indipendentemente dal flag `completed` della singola serie.
- Percorso a quattro passi **posizione → gruppo → esercizio → schema**, con breadcrumb che permette di risalire, e poi la vista finale. Ogni passo mostra **solo ciò che esiste nello storico**, con i conteggi. Ricerca per nome al passo degli esercizi. Nessun filtro nasconde gli schemi con una sola sessione: si mostra il conteggio e si avvisa che non c'è progressione.
- Vista finale: **tabella** con righe = sessioni (la più recente in cima) e colonne `S1…Sn` con il peso, più una **sparkline SVG scritta a mano** con n linee sovrapposte, una per posizione di serie, in ordine cronologico da sinistra a destra. Le ripetizioni non si ripetono su ogni riga: sono fissate dallo schema.

*Dati e backup*
- Stato dello storage persistente, data dell'ultimo backup, numero totale di allenamenti (ed esercizi/serie), esportazione, importazione.
- Export: un unico JSON con `formatVersion: 1`, data e ora dell'esportazione e gli allenamenti; nome file `gym-tracker-backup-YYYY-MM-DD.json`.
- Import: **validazione integrale di struttura e versione prima di toccare il database**, riepilogo mostrato all'utente, rifiuto dei file non validi senza alterare nulla. Poi due strade: **unione** per `id` (a parità di id vince l'`updatedAt` più recente; **l'unità di merge è il workout intero**, non i singoli campi o serie) oppure **sostituzione completa** con conferma, eseguita in una transazione Dexie. I dati correnti non vengono cancellati prima che il backup sia validato per intero.

*Casi limite*
- Più allenamenti nello stesso giorno **sono ammessi**: nessun indice unico su `workoutDate`, nessuna etichetta di sessione, nessuna ora inserita dall'utente; nello storico si distinguono per ora di creazione e gruppi.
- Ripetizioni non intere, `<= 0` o non numeriche: input rifiutato, resta il valore precedente. Peso negativo o non numerico: idem; `0` è valido.
- Esercizio senza serie e gruppo senza esercizi: ammessi in bozza, bloccano il completamento.
- Storico vuoto: stati vuoti espliciti in home, storico, statistiche e suggerimenti.
- Sparkline con una sola sessione o con tutti i pesi uguali: nessuna divisione per zero, banda verticale minima garantita.
- Aggiornamento della PWA disponibile: barra di notifica discreta e **ignorabile** (`registerType: 'prompt'`).

*Invarianti*
- `workoutDate` non slitta di giorno in nessun passaggio (creazione, salvataggio, rilettura, export, import), in nessun fuso e a nessuna ora.
- `position` di gruppi, esercizi e serie è sempre l'indice contiguo dell'array dopo qualsiasi inserimento, eliminazione o riordino.
- Le funzioni statistiche non modificano né persistono nulla.

**Requisiti non funzionali**
- Mobile-first, controlli touch ampi (≥ 46 px), nessuno scorrimento orizzontale della pagina, focus visibile, label accessibili, stati vuoti espliciti; usabilità accettabile anche su desktop.
- Tema **scuro come identità, chiaro automatico** via `prefers-color-scheme`, interamente su token CSS custom properties. Accento verde lime. Icone SVG inline.
- Funzionamento **offline** dopo il primo caricamento; installabile su Android; sito statico pubblicabile su Cloudflare Pages.
- Testi visibili in **italiano**, identificatori nel codice in **inglese**.
- TypeScript **strict** senza `any` di comodo; `vue-tsc` ed ESLint puliti; test in `src/**/*.spec.ts`.

**Decisioni tecniche già prese** — vanno rispettate, non ridiscusse
1. **Persistenza: un'unica tabella Dexie `workouts`**, dove ogni record è il `Workout` intero con gli array annidati. *Motivazione:* leggere, copiare, aggiornare atomicamente ed esportare una giornata diventano un `get`/`put`, senza join né transazioni multi-tabella. *Costo accettato:* ogni salvataggio riscrive il documento del giorno, e le query cross-workout sono scansioni complete — irrilevante per un uso personale con poche centinaia di record. Schema **versionato** e predisposto a migrazioni.
2. **Catalogo gruppi muscolari: una costante nel codice**, nessuna tabella anagrafica: Petto, Schiena, Spalle, Bicipiti, Tricipiti, Gambe, Addominali, Polpacci, Glutei, Avambracci, Altro. Il nome italiano è salvato nel record del gruppo, non referenziato: un backup resta leggibile e indipendente dal catalogo del momento.
3. **Più allenamenti nello stesso giorno ammessi.** Ribalta esplicitamente la richiesta iniziale «non devono esistere due allenamenti per la stessa data»: nessun vincolo di unicità su `workoutDate`.
4. **Vincolo 1–3 gruppi verificato solo al completamento**, per non ostacolare la compilazione della bozza.
5. **Bozza creata subito** alla conferma di data e sorgente di copia.
6. **Autosave unico** con debounce ~500 ms e flush forzato; nessun pulsante «salva».
7. **Riordino con pulsanti su/giù**, non drag & drop: più affidabile col pollice e senza dipendenze.
8. **Chiave statistica: la sequenza completa dei gruppi NON entra nella chiave.** `Petto>Bicipiti` e `Petto>Spalle` confluiscono nella **stessa** statistica, purché il Petto sia nella stessa posizione. *Motivazione:* la posizione nella giornata cattura l'affaticamento accumulato, che è ciò che rende confrontabili i pesi; includere l'intera sequenza frammenterebbe lo storico in classi con una sessione ciascuna. Decisione finale dell'utente, che supera una sua precedente indicazione opposta.
9. **Schema delle ripetizioni = tupla delle ripetizioni nell'ordine di esecuzione.** `12-12-10-10` e `10-10-12-12` sono schemi **diversi**; `4x6` e `3x8` sono distinti. Etichetta compatta `NxR` quando tutte le serie hanno le stesse ripetizioni, altrimenti la tupla con i trattini.
10. **Metrica: solo il peso, per posizione di serie.** Nessun volume, nessuna media, nessun massimale di sessione: dentro una chiave il numero di serie è fissato dallo schema, quindi la serie 2 è sempre confrontabile con la serie 2.
11. **Statistiche derivate al volo** da funzioni pure sulla tabella `workouts`: nulla di precalcolato, nulla persistito, nessuna tabella di aggregati. Con questi volumi il costo della scansione è trascurabile e non esiste il rischio di aggregati disallineati.
12. **Conferme generiche** sulle operazioni distruttive, senza quantificare cosa si perde; **nessun undo**.

**Vincoli**
- Stack obbligatorio: Vue 3 Composition API con `<script setup>`, TypeScript strict, Vite 6, Vue Router, Dexie 4, `vite-plugin-pwa`, Vitest 3, `fake-indexeddb` per i test di persistenza, Node 18 (Vite 6 e Vitest 3 sono pinnati per questo), ESLint 9 flat config + `vue-tsc`, **senza Prettier**.
- **Vietati**: qualsiasi backend, database remoto, autenticazione, servizio cloud, Pinia, framework CSS, librerie di grafici, librerie di icone, `localStorage` per i dati applicativi.
- Nessuna nuova dipendenza oltre a quelle elencate senza decisione esplicita.
- Solo IndexedDB via Dexie per i dati applicativi, con schema versionato. Date e timestamp ISO 8601; `workoutDate` trattato come data **locale**. `navigator.storage.persist()` richiesto quando supportato.
- PWA: manifest con nome e colori, modalità standalone, icone derivate da `home.png` (192, 512, maskable), service worker, cache degli asset applicativi, `registerType: 'prompt'`. **Nessuna cache manuale di IndexedDB nel service worker.**
- Logica di dominio e statistiche in funzioni pure fuori dai componenti; i componenti renderizzano dati già preparati. Nessun accesso diretto a Dexie dai componenti: si passa da repository e composables.
- `prototype/` resta immutato e fuori dal build; è riferimento visivo, non codice da riusare.

**Fuori scope**
- Timer di recupero; schede e programmi di allenamento; gruppi muscolari personalizzati; etichette di sessione; ora dell'allenamento inserita dall'utente; undo.
- Statistiche oltre a quelle descritte (volume, medie, massimali, 1RM, confronti fra gruppi) e grafici oltre alla sparkline.
- Autenticazione, sincronizzazione, backend, condivisione, multi-utente, multi-dispositivo automatico (il trasferimento avviene via export/import).
- Refactoring o evoluzione di `prototype/`; supporto a browser senza IndexedDB; installabilità iOS come requisito verificato.

**Definition of done** — criteri verificabili; i criteri 1–16 sono coperti da almeno un test automatico, i criteri 17–20 sono verificati in revisione
1. Un allenamento da 1 a 3 gruppi, ciascuno con almeno un esercizio e almeno una serie valida, supera la validazione di completamento; mancando uno di questi requisiti il completamento è rifiutato con il motivo.
2. Il completamento è ammesso con 1, 2 e 3 gruppi e rifiutato con 0 e con 4; in bozza qualsiasi numero è ammesso e salvabile.
3. La gerarchia è rispettata: le serie appartengono all'esercizio e non al gruppo; salvataggio e rilettura restituiscono la stessa struttura annidata con le stesse `position` contigue.
4. Nello stesso esercizio coesistono serie con ripetizioni e pesi diversi, incluso `weight = 0`; `repetitions <= 0` o non intero è rifiutato.
5. La copia da giornata precedente produce **nuovi UUID a tutti e quattro i livelli** e nessun identificatore coincide con l'originale.
6. La copia riporta gruppi, esercizi, ordine, numero e ordine delle serie, ripetizioni, pesi e note degli esercizi, e **non** riporta data, stato `completed` dell'allenamento, spunte delle serie e note generali.
7. L'esportazione produce un JSON con `formatVersion: 1`, istante di esportazione e l'elenco completo degli allenamenti, con nome file `gym-tracker-backup-YYYY-MM-DD.json`.
8. Un backup valido supera la validazione e produce il riepilogo (totale nel file, nuovi, già presenti, più recenti del locale) **senza scrivere nel database**.
9. Un backup non valido (versione ignota, struttura errata, campo mancante, gerarchia violata) è rifiutato e il contenuto del database resta identico.
10. L'unione confronta per `id` e a parità di id conserva il workout con `updatedAt` più recente, sostituendo il **record intero**.
11. La sostituzione completa avviene in una sola transazione Dexie: se fallisce a metà, i dati preesistenti restano intatti.
12. `workoutDate` non slitta di giorno lungo creazione, salvataggio, rilettura, export e import, anche a ore limite e con fuso diverso da UTC.
13. Due giornate con sequenze di gruppi diverse ma gruppo nella stessa posizione producono la **stessa** chiave statistica; la stessa combinazione in posizione diversa produce chiavi **diverse**.
14. Schemi con la stessa tupla ordinata coincidono; `12-12-10-10` e `10-10-12-12` sono diversi, come `4x6` e `3x8`.
15. L'etichetta dello schema è `NxR` con ripetizioni uniformi e la tupla con trattini altrimenti.
16. Le statistiche considerano solo `status === 'completed'` e, dentro quelle giornate, **tutte** le serie indipendentemente dal flag `completed`; le funzioni non scrivono nulla.
17. Le sei schermate riproducono layout, gerarchia visiva e testi italiani del prototipo, con tema scuro di default e chiaro automatico via `prefers-color-scheme`, su token CSS.
18. L'applicazione è installabile su Android e funziona offline dopo il primo caricamento; l'aggiornamento disponibile appare come barra discreta e ignorabile; il service worker non tenta di cachare IndexedDB.
19. Nessuna dipendenza vietata nel `package.json`, nessun `localStorage` per i dati applicativi, nessun accesso a Dexie dai componenti; `vue-tsc`, ESLint e la suite Vitest sono verdi.
20. `prototype/` è invariato e non entra nel bundle di produzione.

**Punti decisi** — tutti risolti dal processo principale il 2026-08-26, prima dell'implementazione. Vanno rispettati come le «Decisioni tecniche».

1. **Aggiunta di un gruppo al dettaglio: selettore esplicito.** Elenco dei gruppi del catalogo, con esclusione di quelli già presenti nella giornata. *Motivazione:* nel prototipo l'assegnazione automatica del primo gruppo libero era una scorciatoia da mockup; nell'app reale scegli «Petto» perché lo vuoi, non perché viene primo nel catalogo. Il selettore è un pannello espandibile inline, non una modale.
2. **Gruppi ripetuti nella stessa giornata: non ammessi.** Il selettore del punto 1 non offre i gruppi già presenti. *Motivazione:* la chiave statistica è posizionale, e due sezioni «Petto» nella stessa giornata produrrebbero due classi statistiche per lo stesso gruppo nello stesso allenamento, senza che l'utente possa distinguerle. Vincolo facile da allentare in futuro senza migrazioni.
3. **«Riporta a bozza»: nel MVP.** *Motivazione:* senza di esso un tocco sbagliato su «Contrassegna come completato» è irreversibile. Riaprire fa uscire la giornata dalle statistiche finché non viene ricompletata: è il comportamento corretto, perché le statistiche considerano solo `completed`.
4. **Eliminazione che porterebbe una giornata `completed` sotto i 2 gruppi: operazione bloccata**, con messaggio che spiega il motivo. *Motivazione:* l'invariante è «un allenamento completato ha 2 o 3 gruppi» e va mantenuto per tutta la vita del record, non solo nell'istante del completamento. Le alternative sono peggiori: il passaggio automatico a `draft` cambierebbe lo stato senza che l'utente l'abbia chiesto, e tollerare lo stato incoerente sporcherebbe le statistiche. Per modificare la struttura di una giornata completata, prima la si riapre (punto 3).
5. **Data dell'ultimo backup: tabella Dexie `appMeta`** con schema chiave/valore, nella versione 1 dello schema. *Motivazione:* un solo meccanismo di archiviazione invece di due, stesso ciclo di vita dei dati, e la data resta fuori dal file di backup in modo deliberato. `localStorage` sarebbe legittimo (è preferenza, non dato applicativo) ma introdurrebbe un secondo posto dove guardare per una sola informazione.
6. **UUID: `crypto.randomUUID()` con ripiego su `crypto.getRandomValues`.** *Motivazione:* `randomUUID` esiste solo in contesto sicuro, e l'accesso da telefono via `http://IP-locale` durante lo sviluppo non lo è. `getRandomValues` invece è disponibile anche in contesto non sicuro, quindi il ripiego costruisce un UUID v4 valido senza dipendenze. Unico punto di generazione: `src/domain/identity.ts`.
7. **Ordine delle sessioni a pari data: `createdAt` crescente**, nella sparkline e nella derivazione delle voci statistiche. La tabella resta in ordine decrescente.
8. **Nessun toggle manuale del tema.** Il tema segue solo `prefers-color-scheme`, come da requisito «scuro come identità, chiaro automatico». Il toggle del prototipo era un ausilio alla revisione.
9. **Asset PWA già generati** (fuori dalla Fase 9, dal processo principale): `public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png` (fondo lime `#c2f53d`), `public/apple-touch-icon.png` (fondo lime), `public/favicon.png`, `public/logo-320.png`. Nomi e percorsi **sostituiscono** quelli previsti in `public/icons/` dal piano. La home usa `logo-320.png` (36 KB) e **non** `home.png` (360 KB), che resta il file sorgente in radice. *Motivazione del fondo lime:* il manubrio del logo è grafite, e su fondo grafite l'icona maskable risultava un blob illeggibile.
10. **Minimo gruppi muscolari per il completamento: da 2 a 1, il massimo resta 3.** Il requisito originario «un allenamento completato deve contenere almeno 2 e al massimo 3 gruppi muscolari» (punto 4) è superato dall'utente il 2026-08-26. *Motivazione:* le statistiche considerano solo le giornate `completed`; col minimo a 2, una sessione corta su un solo gruppo restava bozza per sempre e non entrava mai nei grafici. Il blocco dell'eliminazione descritto al punto 4 resta in vigore, ma con il nuovo minimo scatta solo quando l'operazione toglierebbe l'ultimo gruppo rimasto.

**Esempio** (istanza concreta — solo illustrativo)
```ts
// Chiave statistica: posizione × gruppo × esercizio × schema.
// La sequenza completa dei gruppi NON entra nella chiave:
//   Petto>Bicipiti  e  Petto>Spalle  →  stessa chiave per il Petto in posizione 1.
// Lo schema è la tupla ORDINATA delle ripetizioni: 12-12-10-10 ≠ 10-10-12-12.

export interface StatKey {
    readonly groupPosition: number;   // 1-based: posizione del gruppo nella giornata
    readonly groupName: string;       // nome italiano salvato nel record
    readonly exerciseName: string;
    readonly repetitionScheme: readonly number[];
}

export function deriveStatKey(
        groupPosition: number,
        group: MuscleGroupWorkout,
        exercise: Exercise): StatKey {
    const repetitionScheme = exercise.sets.map((set) => set.repetitions);
    return {
        groupPosition,
        groupName: group.name,
        exerciseName: exercise.name,
        repetitionScheme
    };
}

export function schemeLabel(repetitionScheme: readonly number[]): string {
    if (repetitionScheme.length === 0) {
        return '-';
    }
    const firstRepetitions = repetitionScheme[0];
    const uniform = repetitionScheme.every((repetitions) => repetitions === firstRepetitions);
    return uniform
            ? `${repetitionScheme.length}x${firstRepetitions}`   // 4x6
            : repetitionScheme.join('-');                        // 12-12-10-10
}
```
