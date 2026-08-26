# Prototipo grafico — Gym Tracker

Mockup **usa-e-getta** per approvare la direzione grafica prima di scrivere l'applicazione reale.

- Dati **fittizi in memoria**: 21 giornate generate all'avvio, di cui 20 completate e una bozza di oggi.
- **Nessuna persistenza**: niente Dexie, niente IndexedDB, niente `localStorage`. Al ricaricamento tutto torna come prima.
- **Nessuna dipendenza e nessuna build**: tre file, HTML + CSS + JavaScript.
- Nessun file fuori da questa cartella. Si elimina con `rm -rf prototype`.

## Avvio

Doppio clic su `index.html`, oppure da terminale nella radice del progetto:

```bash
npx --yes serve prototype
```

Poi apri l'indirizzo mostrato. Da desktop l'app appare dentro una cornice da 392×812 px; a larghezza da smartphone occupa tutto lo schermo.

## Cosa è navigabile

Navigazione inferiore a quattro voci: **Home · Allenamenti · Statistiche · Dati**. La voce «Nuovo» è assorbita dalla home, dove è un pulsante grande.

| Schermata | Contenuto |
| --- | --- |
| **Home** | Logo `home.png`, nome dell'app, card «In corso» con «Riprendi» quando esiste una bozza, pulsante «Nuovo allenamento», ultima giornata completata, accesso allo storico |
| **Allenamenti** | Storico decrescente, sezione «Oggi», filtro per gruppo, badge bozza/completato, conteggio esercizi e serie, eliminazione con conferma |
| **Nuovo** | Data, avviso quando la data ha già allenamenti, scelta della giornata da copiare, creazione reale della copia con nuovi id |
| **Dettaglio** | Gerarchia gruppo → esercizi → serie → ripetizioni e peso, riordino su/giù, aggiunta e duplicazione serie, spunte, pannello esercizio con suggerimenti dallo storico, stato del salvataggio, vincolo 2–3 gruppi |
| **Statistiche** | Percorso posizione → gruppo → esercizio → schema, poi sparkline multi-serie e tabella per posizione di serie |
| **Dati** | Stato storage, ultimo backup, conteggi, esportazione, riepilogo di importazione con unione o sostituzione |

## Controlli presenti solo nel prototipo

Nella barra superiore, l'icona sole/luna forza il tema chiaro o scuro senza cambiare le impostazioni del sistema. Nella schermata **Dati**, in fondo, due pulsanti simulano la barra di aggiornamento della PWA e lo stato di errore del salvataggio.

## Cosa il prototipo non fa

Non salva, non esporta file veri, non importa file veri, non registra service worker. Le operazioni di backup mostrano solo il riscontro visivo.
