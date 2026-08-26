# Gym Tracker

PWA mobile-first per registrare gli allenamenti in palestra. Funziona **offline**, non ha backend, non ha autenticazione, e tutti i dati restano nel browser del dispositivo.

Uso personale. Interfaccia in italiano, codice in inglese.

## Cosa fa

- Registra una **giornata di allenamento** da 1 a 3 gruppi muscolari, i loro esercizi e le serie di ciascun esercizio, con ripetizioni e peso indipendenti serie per serie.
- Salva **automaticamente** mentre compili: nessun pulsante «salva». Lo stato del salvataggio è sempre visibile.
- Permette di **copiare la struttura** di una giornata precedente e ripartire da lì.
- Mostra lo **storico** in ordine decrescente, con filtro per gruppo muscolare.
- Deriva le **statistiche di progressione del peso**, per posizione di serie.
- **Esporta e importa** tutti i dati in un unico file JSON.

Più allenamenti nello stesso giorno sono ammessi: nello storico si distinguono per ora di creazione e gruppi muscolari.

## Stack

| | |
| --- | --- |
| Framework | Vue 3 con Composition API e `<script setup>` |
| Linguaggio | TypeScript in modalità `strict` |
| Build | Vite 6 |
| Routing | Vue Router 4 |
| Persistenza | Dexie 4 su IndexedDB |
| PWA | `vite-plugin-pwa` (Workbox) |
| Test | Vitest 3 con `fake-indexeddb` |
| Qualità | ESLint 9 flat config con `typescript-eslint` type-checked, `vue-tsc` |

Nessun framework CSS, nessuna libreria di grafici, nessuna libreria di icone, nessuno store globale. La sparkline delle statistiche è SVG scritto a mano; le icone sono SVG inline.

## Prerequisiti

- **Node.js ≥ 20.19** e npm. Sviluppato su Node 18, poi migrato e verificato su **Node 22.23.2** con npm 10.9.8.
- Nessun database, nessun servizio esterno, nessuna variabile d'ambiente.

Il file `.node-version` dichiara `22`: se usi un gestore di versioni come [fnm](https://github.com/Schniz/fnm) o [Volta](https://volta.sh/), entrando nella cartella la versione giusta viene selezionata da sé.

**Perché Node 20.19 come minimo.** Il build della PWA passa da `workbox-build`, che minifica il service worker con `terser`, che dipende da `serialize-javascript`. Dalla versione 7 quel pacchetto chiama il global di Web Crypto **al caricamento del modulo**, e Node 18 non lo espone: il build si interrompe con `ReferenceError: crypto is not defined`. Su Node 18 servivano un `overrides` che fissava `serialize-javascript` alla linea 6 e la convivenza con alcune segnalazioni di `npm audit`; su Node 20+ nessuno dei due è necessario e `npm audit` riporta **0 vulnerabilità**.

Se sei costretto a restare su Node 18: reintroduci `"overrides": { "serialize-javascript": "^6.0.2" }` in `package.json`, e per pubblicare usa `npx wrangler@3` invece di `wrangler@4`, che pretende Node 22.

## Installazione

```bash
npm install
```

Installa tutte le dipendenze di runtime e di sviluppo. Non serve altro.

## Comandi

```bash
npm run dev          # server di sviluppo su http://localhost:5173
npm run lint         # ESLint
npm run typecheck    # vue-tsc sullo scope applicativo + tsc su quello di build
npm test             # suite Vitest, una volta
npm run test:watch   # suite Vitest in watch
npm run check-node   # verifica la versione di Node e spiega come cambiarla
npm run build        # check-node + typecheck + build di produzione in dist/
npm run preview      # serve dist/ in locale, con service worker attivo
```

Il type-check gira su **due scope distinti**: `tsconfig.app.json` copre `src/**` senza i tipi di Node, così il codice del browser non può usare `process` o i moduli `node:*` per distrazione; `tsconfig.node.json` copre `vite.config.ts` e `vitest.setup.ts`.

Per provare la PWA vera — service worker, installazione, funzionamento offline — serve `npm run build` seguito da `npm run preview`: in sviluppo il service worker non è rappresentativo.

## Pubblicazione su Cloudflare Pages

Sito completamente statico, progetto Pages `gym-tracker`, indirizzo [gym-tracker-4tm.pages.dev](https://gym-tracker-4tm.pages.dev). Non c'è connessione a git: i deploy sono **caricamenti diretti** da riga di comando, non automatici sul push.

**Da rifare a ogni implementazione che va provata sul telefono**, nell'ordine:

```bash
# 1. incrementa APP_VERSION in src/appVersion.ts (v1.0.000 -> v1.0.001 -> ...)
npm run build
npx wrangler pages deploy dist --project-name gym-tracker --branch production --commit-dirty=true
```

Il numero mostrato in fondo alla schermata iniziale dell'app è quello di `APP_VERSION`: se dal telefono leggi ancora il numero precedente, stai usando la versione vecchia e non hai un problema di codice.

**`--branch production` non è facoltativo.** Il ramo di produzione del progetto Pages si chiama `production`, mentre `wrangler` deduce il ramo da git e trova `master`: senza quel parametro il caricamento finisce in **anteprima**, su `master.gym-tracker-4tm.pages.dev`, e l'indirizzo pubblico continua a servire la build precedente. È già costato una sessione di diagnosi su un difetto che era già stato corretto. Per controllare dove è finito un caricamento:

```bash
npx wrangler pages deployment list --project-name gym-tracker
```

La colonna `Environment` deve dire `Production`. In dubbio, confronta il bundle servito con quello locale:

```bash
grep -o 'assets/index-[A-Za-z0-9_-]*\.js' dist/index.html
curl -s https://gym-tracker-4tm.pages.dev/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

`wrangler` 4 pretende Node 22: attivalo con `fnm` prima del build, come descritto sopra. Su Node 18 serve `npx wrangler@3`.

Sul telefono l'aggiornamento non è immediato: il service worker è in modalità `prompt`, quindi va chiusa l'app dalle app recenti, riaperta, e va accettata la barra **«Nuova versione disponibile»**. I dati in IndexedDB non vengono toccati.

In alternativa il progetto si può collegare a git da **Workers & Pages → Create → Pages → Connect to Git** (build command `npm run build`, output `dist`, variabile `NODE_VERSION` = `22`), e allora ogni push produrrebbe un deploy. Oggi non è così.

L'app va servita in **HTTPS**: il service worker e l'installabilità lo richiedono. Cloudflare Pages lo fornisce da sé.

## Struttura del progetto

L'organizzazione è per **livello**, con sottocartelle per concetto dove i file sono coesi. Nessun contenitore generico tipo `utils` o `common`.

```
src/
├── domain/              logica di dominio, funzioni pure, nessuna dipendenza da Vue o Dexie
│   ├── workout.ts             tipi della gerarchia
│   ├── muscleGroups.ts        catalogo dei gruppi, costante nel codice
│   ├── identity.ts            generazione UUID, unico punto
│   ├── localDate.ts           algebra della data locale YYYY-MM-DD
│   ├── workoutFactory.ts      creazione di bozza, gruppo, esercizio, serie
│   ├── workoutStructure.ts    riordino, inserimento, eliminazione, position
│   ├── workoutCopy.ts         copia da giornata precedente
│   ├── workoutCompletion.ts   validazione del completamento
│   ├── setInput.ts            parsing di ripetizioni e peso digitati
│   ├── exerciseSuggestions.ts suggerimenti dallo storico
│   └── statistics/            chiave statistica, voci, navigazione, geometria sparkline
├── persistence/         unico punto che conosce Dexie
├── backup/              formato, validazione, export, piano e servizio di import
├── composables/         stato applicativo reattivo, autosave, percorsi
├── presentation/        formattazione italiana di date, pesi e plurali
├── components/          shell, icone, riscontri, workout, statistiche, backup
├── views/               una vista per rotta
├── router/              rotte e provenienza
└── styles/              token di tema e stili di base
```

Regole architetturali mantenute e verificate: **nessun accesso a Dexie fuori da `persistence/`**, nessuna logica di dominio nei componenti, viste thin, nessun colore fuori dai token CSS, nessun uso di `localStorage` per i dati applicativi.

I test stanno accanto al codice che testano, come `src/**/*.spec.ts`. Sono 194 in 29 file, comprese le prove di componente che montano davvero i componenti Vue.

### `prototype/`

Contiene il **mockup grafico** usa-e-getta con cui è stata approvata la direzione visiva: HTML, CSS e JavaScript vanilla, dati finti, nessuna persistenza. Non fa parte dell'applicazione, non entra nel bundle e **si può eliminare** con `rm -rf prototype` senza conseguenze.

## Modello dei dati

```
Giornata di allenamento (Workout)
└── da 1 a 3 gruppi muscolari (MuscleGroupWorkout)
    └── N esercizi (Exercise)
        └── N serie (ExerciseSet)
            ├── ripetizioni
            └── peso in kg
```

Un gruppo muscolare **non contiene serie**: contiene esercizi, e ogni esercizio contiene le proprie serie. Ogni serie è autonoma, quindi ripetizioni e peso possono differire fra una serie e l'altra dello stesso esercizio.

| Entità | Campi |
| --- | --- |
| `Workout` | `id`, `workoutDate` (data locale `YYYY-MM-DD`), `status` (`draft` \| `completed`), `notes`, `muscleGroups`, `createdAt`, `updatedAt` |
| `MuscleGroupWorkout` | `id`, `name` (nome italiano del gruppo), `position`, `exercises` |
| `Exercise` | `id`, `name`, `position`, `notes`, `sets` |
| `ExerciseSet` | `id`, `position`, `repetitions`, `weight`, `completed`, `notes` |

Il vincolo da 1 a 3 gruppi si applica al **completamento**, non alla compilazione: una bozza può avere qualsiasi numero di gruppi ed essere salvata. Una giornata già completata invece mantiene l'invariante: un'eliminazione che la lascerebbe senza gruppi viene rifiutata, spiegando il motivo.

### Perché un unico documento invece di tabelle normalizzate

IndexedDB contiene **una sola tabella `workouts`**, dove ogni record è il `Workout` intero con i suoi array annidati, più una piccola tabella `appMeta` per la data dell'ultimo backup.

I quattro casi d'uso reali dell'app sono leggere una giornata completa, copiarla, aggiornarla atomicamente ed esportarla: con l'aggregato sono tutti un `get` o un `put`, senza join da scrivere a mano e senza transazioni multi-tabella. Il prezzo è che ogni salvataggio riscrive il documento del giorno — pochi KB — e che le interrogazioni trasversali sono scansioni complete della tabella. Con un uso personale, cioè qualche centinaio di record in anni, il costo non si misura. Lo schema è versionato e pronto alle migrazioni.

### Statistiche

Una serie statistica è identificata da:

```
posizione del gruppo nella giornata  ×  gruppo  ×  esercizio  ×  schema delle ripetizioni
```

- La **sequenza completa** dei gruppi non entra nella chiave: `Petto > Bicipiti` e `Petto > Spalle` confluiscono nella stessa statistica, purché il Petto sia nella stessa posizione. Conta l'affaticamento accumulato, non cosa hai allenato dopo.
- Lo **schema** è la tupla delle ripetizioni nell'ordine di esecuzione: `4x6` e `3x8` sono schemi distinti, e così `12-12-10-10` e `10-10-12-12`. L'etichetta è `NxR` quando le ripetizioni sono uniformi, altrimenti la tupla con i trattini.
- La metrica è **solo il peso, per posizione di serie**: dentro una chiave il numero di serie è fissato dallo schema, quindi la serie 2 è sempre confrontabile con la serie 2.
- Entrano **solo le giornate completate** e, dentro quelle, **tutte** le serie, spuntate o no.

Tutto è calcolato al volo da funzioni pure: nessun aggregato precalcolato, quindi nessun rischio di statistiche disallineate dai dati.

## Importazione ed esportazione

Schermata **Dati**.

L'esportazione produce `gym-tracker-backup-YYYY-MM-DD.json` con la versione del formato (`1`), l'istante di esportazione e tutti gli allenamenti.

L'importazione **valida il file per intero prima di toccare il database**: versione, struttura, tipi, gerarchia, date, `position`, valori delle serie. Un file non valido viene rifiutato spiegando il motivo, e i dati esistenti restano identici. Superata la validazione compare un riepilogo — quanti allenamenti nel file, quanti nuovi, quanti già presenti, quanti più recenti del locale — e due strade:

- **Unisci**: confronto per `id`, e a parità di `id` vince il record con `updatedAt` più recente. L'unità di merge è il **workout intero**, mai il singolo campo o la singola serie: un merge parziale produrrebbe giornate che nessuno ha mai registrato.
- **Sostituisci tutto**: previa conferma, in **una sola transazione** Dexie. Se fallisce a metà, i dati preesistenti restano intatti.

È anche il modo per spostare i dati da un dispositivo a un altro: esporta da uno, importa nell'altro.

### Azzeramento

In fondo alla schermata Dati, una sezione distinta permette di **cancellare tutti i dati locali**. Richiede **due conferme in sequenza**: la prima quantifica cosa stai perdendo e ti invita a esportare prima, la seconda dichiara che l'operazione è irreversibile. Svuota gli allenamenti e la data dell'ultimo backup in un'unica transazione, riportando l'app allo stato di primo avvio. Non c'è undo, perché non esiste per nessuna operazione dell'app.

## Limiti della persistenza locale

I dati vivono **solo** in IndexedDB, nel browser, su quel dispositivo. Nessuna copia altrove, nessuna sincronizzazione.

Vanno persi se: disinstalli l'app o cancelli i dati del sito; il browser fa pulizia dello spazio sotto pressione; usi una finestra anonima; passi a un altro browser o a un altro dispositivo.

### Storage persistente

Per default IndexedDB è memoria **sacrificabile**: quando lo spazio si stringe, il browser può cancellare i dati dei siti senza avvisare. `navigator.storage.persist()` chiede di marcarli come non sacrificabili, e se il permesso è concesso i dati sopravvivono alla pulizia automatica.

La schermata Dati mostra lo stato e, quando serve, un pulsante per chiedere il permesso. **Il browser può rifiutare**, e non è un guasto: Chrome tende a concederlo quando l'app è **installata** sul dispositivo o quando il sito ha una storia di visite, mentre su `localhost` senza installazione rifiuta quasi sempre. L'app te lo dice invece di restare zitta.

Non è comunque una garanzia, e non protegge da niente che tu faccia deliberatamente: **il backup periodico è l'unica vera protezione**, ed è il motivo per cui accanto allo stato c'è la data dell'ultimo.

## Installazione su Android

1. Apri il sito pubblicato in **Chrome** (serve HTTPS).
2. Menu **⋮ → Installa app** oppure «Aggiungi a schermata Home». Su alcune versioni compare da sé un banner di installazione.
3. L'app si apre a tutto schermo, senza barra del browser, con la propria icona.

Dopo il primo caricamento funziona **offline**: gli asset sono in precache nel service worker, e i dati sono già locali per costruzione. Il service worker non prova a mettere in cache IndexedDB: non è il suo mestiere.

Quando pubblichi una versione nuova, l'app **non** si aggiorna a tradimento: compare una barra discreta in basso, «Nuova versione disponibile», con un pulsante per aggiornare e la possibilità di ignorarla. Nessun ricaricamento mentre stai digitando un peso.

Su iOS l'aggiunta alla schermata Home funziona da Safari, ma non è stata verificata.
