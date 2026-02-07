# JO 2026 Milano Cortina - Menu Bar App

> **Projet a vocation pedagogique.** Cette application n'a pas vocation a etre distribuee sur les stores. Elle a ete creee pour explorer le developpement d'applications macOS menu bar avec Electron et l'exploitation d'APIs publiques.

Application macOS menu bar pour suivre les Jeux Olympiques d'hiver 2026 de Milano Cortina en temps reel depuis la barre de menu.

## Fonctionnalites

- **Tableau des medailles** — Classement des pays avec detail par discipline (clic pour developper)
- **Programme du jour** — Navigation jour par jour, indicateur d'epreuves a medaille, statut en direct
- **Medailles** — Liste filtrable par discipline, pays et type de medaille
- **Auto-refresh** — Mise a jour automatique toutes les 5 minutes
- **Lancement au demarrage** — Option dans les parametres

## Stack technique

- Electron + [menubar](https://github.com/nicketkick/menubar)
- HTML/CSS/JS vanilla
- API publique [olympics.com](https://www.olympics.com) (sans authentification)

## Installation rapide (macOS Apple Silicon)

```bash
curl -fsSL https://raw.githubusercontent.com/yoanbernabeu/JO2026/main/install.sh | bash
```

Ce script :
1. Detecte et supprime une eventuelle ancienne version
2. Telecharge la derniere release depuis GitHub
3. Decompresse l'archive
4. Copie l'application dans `/Applications`
5. Retire la quarantaine macOS (application non signee)

## Developpement

```bash
# Installer les dependances
npm install

# Lancer en mode developpement
npm start

# Builder le .app
npm run build
```

## Licence

[MIT](LICENSE) - Yoan Bernabeu 2026
