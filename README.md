# Onkostenboekje

Een budget- en uitgavenboekje in de stijl van Onkosten (Expense) en ExpensePlus op de Palm-PDA. Het draait los, zonder account: alles staat in de browser op je eigen apparaat.

- **Budgetten**: maak groepen met een bedrag per maand, bijvoorbeeld Brandstof € 100. Tik op het bedrag dat nog over is en tik `25` of `-25`, met een notitie als "autowassen". Er opent geen nieuw venster. Met `+` stort je geld bij.
- **Snel afboeken**: bovenaan het Budget-scherm tik je een bedrag, kies je het budget uit de lijst en vul je in waarvoor het was.
- **Historie**: tik op de naam van een budget voor alles wat je deze maand hebt afgeboekt, of gebruik de knop Historie voor alle budgetten samen.
- **Rest meenemen**: per budget kies je of wat over is meegaat naar de volgende maand.
- Verder: uitgaven met icoontjes, rapporten (declaratie, weekstaat, rittenstaat), kilometerstanden, bonnetjes, wisselkoersen, export naar Excel en import van Palm-bestanden (`ExpenseDB.pdb`) en CSV.

## Gebruiken

**Op een computer**: open `index.html` in Chrome, Edge, Firefox of Safari. Je gegevens blijven in die browser op die computer staan.

**Op een telefoon**: zet de map op een website met https (je eigen hosting, of GitHub Pages). Open het adres op de telefoon en kies *Zet op beginscherm* (iPhone: deelknop; Android: menu). Daarna werkt het ook zonder internet.

## Backup

Omdat alles op één apparaat staat: maak af en toe een backup via het menu (tik op het zwarte tabje) → **Backup maken**. Het boekje herinnert je daaraan. Met **Backup terugzetten…** zet je alles terug, of over naar een ander apparaat.

## Opbouw

| Bestand | Wat |
|---|---|
| `src/app.html` | de app zelf, zoals hij ook op claude.ai draait |
| `src/lokaal.js` | opslag in de browser (localStorage) en downloads, voor als hij los draait |
| `build.py` | maakt `index.html` en de app-iconen uit `src/` |
| `sw.js`, `manifest.webmanifest` | werken zonder internet en op het beginscherm zetten |

Na een wijziging in `src/`: `python build.py`.
