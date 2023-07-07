# Dependency drift tracker

Ce projet a pour but de suivre nos retards sur les mises à jour de dépendances pour nos projets Node.js.

## Installation

```bash
npm ci
```

## Utilisation

Tout d'abord, il faut remplir le fichier `repositories.txt` avec les urls des repositories à suivre.
Dans le cas d'un monorepo, vous pouvez suffixer l'url par `#path` pour indiquer le chemin vers le `package.json` à suivre.

Ensuite, il faut lancer le script `src/index.mjs` :  

```bash
npm run start
```

Nous avons fait le choix, de lancer le script toutes les 24h avec un cron dans une GitHub Action 
et qui commit les nouveaux résultats.

Enfin, la page `index.html` permet de visualiser les résultats.

## Limitations

Si les repositories ont dans leur `package.json` une partie `engine` avec une version de Node.js spécifique, 
vous devez alors être conforme à celle-ci pour lancer ce projet.