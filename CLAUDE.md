# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cos'è

PWA mobile-first per registrare gli allenamenti in palestra. **Nessun backend, nessuna autenticazione, nessuna rete**: tutti i dati vivono in IndexedDB sul dispositivo. Uso personale.

**Interfaccia e testi in italiano, codice e identificatori in inglese.** Anche i messaggi di errore e di rifiuto restituiti dal dominio sono stringhe italiane rivolte all'utente.

Documenti di riferimento: `spec-gym-tracker.md` è la fonte autorevole sul comportamento atteso; `implementation-gym-tracker.md` (stato `COMPLETED`) contiene piano, decisioni prese e registro delle modifiche successive.

## Stack tecnologico

| Ruolo | Tecnologia | Versione |
| --- | --- | --- |
| Runtime di sviluppo | Node.js | **22.23.2** (minimo 20.19) · npm 10.9.8 |
| Framework | Vue 3, Composition API con `<script setup>` | 3.5.41 |
| Linguaggio | TypeScript `strict` | 5.7.3 |
| Build | Vite | 6.4.3 |
| Routing | Vue Router | 4.6.4 |
| Persistenza | Dexie su IndexedDB | 4.4.5 |
| PWA | `vite-plugin-pwa` (Workbox), `registerType: 'prompt'` | 0.21.2 |
| Test | Vitest | 3.2.7 |
| Test di persistenza | `fake-indexeddb` | 6.2.5 |
| Test di componente | `jsdom` + `@vue/test-utils` | 25.0.1 · 2.4.11 |
| Qualità | ESLint 9 flat config, `typescript-eslint` type-checked, `vue-tsc` | 9.39.5 · 8.68.0 · 2.2.12 |
| Hosting | Cloudflare Pages (sito statico) | — |

**Tre sole dipendenze di runtime**: `vue`, `vue-router`, `dexie`. Tutto il resto è sviluppo. Niente Pinia, niente framework CSS, niente librerie di grafici o di icone, nessun backend.

Vite e Vitest erano fermi alle linee 6 e 3 per compatibilità con Node 18; il vincolo non c'è più, ma l'aggiornamento non è stato fatto e resta possibile.

## Comandi

```bash
npm run dev          # dev server su http://localhost:5173
npm test             # Vitest, una passata
npm run test:watch   # Vitest in watch
npm run lint         # ESLint 9 flat config (lint:fix per correggere)
npm run typecheck    # vue-tsc su tsconfig.app.json + tsc su tsconfig.node.json
npm run build        # check-node + typecheck + build in dist/
npm run preview      # serve dist/ con service worker attivo
```

Un singolo file o test: `npx vitest run src/domain/statistics/statKey.spec.ts`, `npx vitest run -t "nome del test"`.

**Node ≥ 20.19 obbligatorio** (`npm run check-node` lo verifica prima del build): su Node 18 il build della PWA si rompe con `ReferenceError: crypto is not defined` dentro `serialize-javascript`. Il README spiega il workaround se si è costretti a restare indietro.

Il service worker in `npm run dev` non è rappresentativo: per provare offline, installazione e aggiornamento serve `build` + `preview`.

## Build e pubblicazione

L'app è **già pubblicata** su Cloudflare Pages, progetto `gym-tracker`, all'indirizzo [gym-tracker-4tm.pages.dev](https://gym-tracker-4tm.pages.dev). Verificato dall'esterno: `/`, `/manifest.webmanifest`, `/sw.js` e le icone rispondono tutti `200`.

**Ogni volta che si chiude un'implementazione che l'utente deve provare, si ripubblica.** La procedura è di tre passi, verificata sul campo:

```bash
# 1. incrementa APP_VERSION in src/appVersion.ts (v1.0.000 -> v1.0.001 -> ...)
Se la shell è nuova:
- $env:PATH = "$env:LOCALAPPDATA\fnm;$env:PATH"   
- fnm env --use-on-cd --shell power-shell | Out-String | Invoke-Expression
- fnm use 22  
Poi a seguire: 

- npm run build
- npx wrangler pages deploy dist --project-name gym-tracker --branch production --commit-dirty=true
```

L'incremento della versione non è un vezzo: il numero compare in fondo alla schermata iniziale ed è l'unico modo che l'utente ha, dal telefono, di sapere se sta guardando la build nuova o quella vecchia rimasta nel service worker.

**Ogni volta che serve ripubblicare, riporta a schermo i passaggi**, anche quando li esegui tu e anche se sono già scritti qui: l'utente deve poterli rileggere e rieseguire da sé senza aprire questo file. Come minimo, testuale e copiabile:

```bash
npx wrangler pages deploy dist --project-name gym-tracker --branch production --commit-dirty=true
```

Insieme al comando dichiara sempre: la versione a cui hai portato `APP_VERSION`, se il build è stato rifatto, e l'esito del controllo `Environment` = `Production`. Non dare per scontato che l'utente ricordi il parametro del ramo: è esattamente ciò che era già andato storto.

**`--branch production` è obbligatorio.** Il ramo di produzione del progetto Pages si chiama `production`, mentre `wrangler` deduce il ramo da git e ora trova `master`: senza quel parametro il caricamento finisce in **Preview** su `master.gym-tracker-4tm.pages.dev`, e l'indirizzo pubblico continua a servire la build precedente. È già successo, ed è costato una diagnosi su un difetto che era già stato corretto. Il controllo dopo il deploy:

```bash
npx wrangler pages deployment list --project-name gym-tracker
curl -s https://gym-tracker-4tm.pages.dev/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'
```

La colonna `Environment` dell'ultimo deployment deve dire `Production`, e il bundle servito deve coincidere con quello di `dist/index.html`.

Il progetto esiste già, quindi `wrangler` non chiede più di crearlo: carica e stampa l'indirizzo. Non c'è connessione a git (`No Git connection` nella dashboard): i deploy sono **caricamenti diretti**, non automatici sul push.

Sul telefono l'app installata non si aggiorna da sola: il service worker è in `registerType: 'prompt'` e il controllo avviene all'avvio. Va chiusa dalle app recenti, riaperta, e va accettata la barra «Nuova versione disponibile». IndexedDB non viene toccato.

### Prima, attivare Node 22

Sulla macchina di sviluppo il Node di sistema è il **18.20.8** e il 22 è gestito da [fnm](https://github.com/Schniz/fnm), installato in `%LOCALAPPDATA%\fnm` senza privilegi di amministratore. In una shell PowerShell dove `fnm` non è ancora attivo servono tre righe:

```powershell
$env:PATH = "$env:LOCALAPPDATA\fnm;$env:PATH"
fnm env --use-on-cd --shell power-shell | Out-String | Invoke-Expression
fnm use 22
```

La riga centrale non è facoltativa: senza di essa `fnm use` fallisce con *«We can't find the necessary environment variables»*. Mettendo le prime due nel profilo PowerShell, il file `.node-version` del progetto fa passare a Node 22 da sé entrando nella cartella.

Se si dimentica, `npm run build` **non** produce l'errore criptico su `crypto`: si ferma prima con `check-node`, che spiega cosa fare.

### Nota sul deploy

`wrangler` 4 richiede Node 22; su Node 18 serve `npx wrangler@3`. La pubblicazione dalla dashboard esiste ma la voce è sotto **Build → Compute → Workers & Pages**, riorganizzata di recente: la riga di comando è più affidabile.

**L'app va servita in HTTPS**: service worker, installabilità e storage persistente lo richiedono. Aprire i file dal filesystem o via `http://IP-locale` dà un'app funzionante ma **senza** funzioni PWA — è lo scenario per cui `domain/identity.ts` ha il ripiego su `crypto.getRandomValues`, dato che `crypto.randomUUID` esiste solo in contesto sicuro.

## Architettura

Organizzazione **per livello**, con la dipendenza che punta sempre verso il basso. Nessun contenitore generico (`utils`, `common`, `helpers`).

```
domain/       funzioni pure e tipi. Zero import da Vue, Dexie, browser API
persistence/  UNICO punto che conosce Dexie
backup/       formato, validazione, piano e servizio di import/export
composables/  stato reattivo, autosave, orchestrazione domain ↔ persistence
presentation/ formattazione italiana di date, pesi, plurali
components/   presentazionali, per concetto (shell, feedback, workout, statistics, icon, backup)
views/        una per rotta, thin
router/       rotte + memoria della provenienza + indicatore di caricamento
styles/       tokens.css (variabili) + base.css
appVersion.ts numero di versione mostrato in fondo alla Home, da incrementare a ogni deploy
```

Regole architetturali da non violare — sono state verificate e vanno mantenute:

- **Dexie solo in `persistence/`.** Nessun altro file importa `dexie` o `gymTrackerDatabase`.
- **Nessuna logica di dominio nei componenti e nelle viste.** Le viste chiamano composables e funzioni di `presentation/`; il calcolo sta in `domain/`.
- **Nessun colore fuori dai token CSS** in `styles/tokens.css`. Niente framework CSS, niente librerie di grafici o di icone: la sparkline è SVG scritto a mano, le icone sono SVG inline in `AppIcon.vue`.
- **`localStorage` non è usato per i dati applicativi.** Solo IndexedDB.
- **Nessuno store globale** (niente Pinia): lo stato condiviso è nei composables, esportati come singleton solo dove serve davvero (`sharedLoadingIndicator`).
- **Nessuna dipendenza nuova** senza motivo forte: il progetto vive su Vue + Vue Router + Dexie e basta.

`prototype/` è un mockup usa-e-getta in HTML/CSS/JS vanilla: **riferimento visivo in sola lettura**, escluso da ESLint e dal bundle, eliminabile senza conseguenze. Non importarlo mai da `src/`.

## Modello dei dati

Una sola tabella `workouts` in IndexedDB, dove ogni record è il **documento intero** con gli array annidati (`Workout > MuscleGroupWorkout > Exercise > ExerciseSet`), più una tabella `appMeta` chiave/valore per la data dell'ultimo backup. Scelta deliberata: i casi d'uso reali sono leggi-tutto, copia, aggiorna atomicamente, esporta — tutti un `get` o un `put`. Le interrogazioni trasversali sono scansioni complete, e va bene così.

Un gruppo muscolare **non contiene serie**: contiene esercizi, e le serie stanno negli esercizi. Ogni serie ha ripetizioni e peso propri.

Tutti i tipi di dominio sono `readonly` in profondità e le trasformazioni restituiscono nuovi oggetti: nessuna mutazione in place, mai.

Il vincolo **1..3 gruppi muscolari** si applica al *completamento*, non alla bozza. Un'operazione che violerebbe l'invariante su una giornata già completata viene **rifiutata**, non eseguita.

### Esito invece di eccezione

Le operazioni di dominio che possono legittimamente fallire restituiscono `WorkoutOperationOutcome` (`{ outcome: 'applied', workout }` | `{ outcome: 'rejected', reason }`), o un tipo discriminato analogo (`CompletionEligibility`). Le eccezioni restano per gli errori di programmazione. Chi introduce una nuova regola di rifiuto segue questo schema e fornisce una `reason` italiana comprensibile all'utente.

### Chiave statistica

Una serie statistica è `posizione del gruppo nella giornata × gruppo × esercizio × schema delle ripetizioni`. La sequenza completa dei gruppi **non** entra nella chiave (conta l'affaticamento accumulato, non cosa è venuto dopo); lo schema è la tupla ordinata delle ripetizioni, quindi `12-12-10-10` e `10-10-12-12` sono chiavi distinte. La metrica è solo il peso, per posizione di serie. Entrano solo le giornate completate, e di quelle tutte le serie.

Tutto è calcolato al volo da funzioni pure in `domain/statistics/`: **nessun aggregato precalcolato o persistito**.

### Autosave

Non esiste un pulsante «salva». `useAutosave` fa debounce (500 ms), serializza i salvataggi concorrenti ed espone lo stato `saving | saved | error`, che l'interfaccia mostra sempre. Chi cambia i dati chiama `commitWorkout`, che aggiorna `updatedAt` e schedula. Prima di navigare o ricaricare, `flushPendingSave()`.

### Import/export

L'importazione **valida il file per intero prima di toccare il database** (`backup/backupValidation.ts`). L'unità di merge è il **workout intero**, mai il singolo campo o la singola serie, e a parità di `id` vince l'`updatedAt` più recente. «Sostituisci tutto» e l'azzeramento passano da una singola transazione Dexie.

## Convenzioni di codice

- **Indentazione a 4 spazi**, punto e virgola sempre, apici singoli in TS.
- Import da `src/` con l'alias **`@/`**; percorsi relativi solo fra file della stessa cartella.
- TypeScript `strict` più `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`/`Parameters`: gli accessi indicizzati vanno gestiti, non ignorati.
- Vue 3 con `<script setup lang="ts">`; interfacce `UseXxx` esplicite come tipo di ritorno dei composables.
- `tsconfig.app.json` copre `src/**` **senza i tipi di Node**: dentro `src/` non esistono `process` né `node:*`. `tsconfig.node.json` copre `vite.config.ts` e `vitest.setup.ts`.

## Test

Vitest, file `*.spec.ts` **accanto al codice che testano**. L'ambiente di default è `node`; i test che montano componenti Vue aprono con il docblock:

```ts
// @vitest-environment jsdom
```

`vitest.setup.ts` installa `fake-indexeddb/auto` e il polyfill di `crypto`, quindi i test di `persistence/` girano su un IndexedDB vero in memoria: vanno ripuliti fra un test e l'altro, non mockati.

Stato attuale della suite: **202 test in 30 file**, tutti verdi, con lint e typecheck puliti.

## Stato del repository

- **Git inizializzato ma senza alcun commit.** Branch `master`, tutto non tracciato. Non c'è quindi una baseline per i diff: le verifiche di «cosa è cambiato» oggi si fanno leggendo, non con `git diff`. Un primo commit chiuderebbe la questione.
- `gym-tracker-backup-esempio.json` in radice (gitignorato) contiene **21 allenamenti su sette settimane** — 47 gruppi, 80 esercizi, 306 serie, UUID veri — generati dallo storico finto del prototipo e validati con `validateBackupFile`. Serve a vedere statistiche e sparkline con dati realistici invece di un database vuoto: si importa da **Dati → Scegli un file → Unisci**.
- `public/` contiene le icone PWA generate da `home.png` con uno script ad hoc, senza aggiungere dipendenze: `pwa-192`, `pwa-512`, `pwa-maskable-512` (fondo lime, perché il manubrio grafite su fondo grafite era illeggibile), `apple-touch-icon`, `favicon`, e `logo-320` usato dalla home al posto dei 360 kB dell'originale.
