# Camion Express

Jeu mobile Android de simulation de camion, en 3D. On prend des chargements au dépôt **FRET** d'une ville, on les livre dans une autre ville avant l'heure limite et sans abîmer la marchandise, puis on dépense ses gains en carburant, réparations et améliorations.

Le jeu est écrit en JavaScript avec [Three.js](https://threejs.org/) et tourne dans une WebView Android plein écran, à l'horizontale. Il fonctionne hors ligne : tout est inclus dans l'APK.

## Installer l'APK

Le workflow GitHub **Camion Express APK** construit l'APK à chaque modification de `truck-game/` (ou depuis l'onglet Actions → *Run workflow*) et le publie dans les **Releases** du dépôt (`camion-express-build-N`).

1. Sur le téléphone, ouvre la dernière release et télécharge `camion-express-1.0.N.apk`.
2. Ouvre le fichier ; autorise l'installation depuis cette source si Android le demande.

Chaque build a un numéro de version plus grand et la même clé de signature, donc il s'installe par-dessus le précédent en gardant la progression.

## Jouer

| Commande | Écran tactile | Clavier (navigateur) |
| --- | --- | --- |
| Tourner | ◀ ▶ (ou inclinaison du téléphone, dans le menu) | ← → / A D |
| Accélérer | GAZ | ↑ / W |
| Freiner, puis marche arrière à l'arrêt | FREIN (maintenu) | ↓ / S |
| Frein à main | P | Espace |
| Klaxon | 📯 | H |
| Caméra (poursuite, éloignée, cabine, dessus) | 🎥 | C |
| Dépôt / station | bouton jaune quand on est arrêté dessus | E |
| Pause, carte, réglages | ☰ (ou bouton retour Android) | Échap |

- **Livraisons** : arrête-toi sur le marquage jaune **FRET** et choisis un chargement. La remorque s'attelle ; une colonne lumineuse, la flèche du bandeau et la mini-carte indiquent le dépôt de destination. Arrête-toi dessus pour livrer.
- **Paiement** : prix de base selon la distance et la marchandise, moins les dégâts sur la marchandise (le verre et l'électroménager sont fragiles), moins 30 % en cas de retard.
- **Conduite** : la charge rend le camion plus lent à accélérer et à freiner. Hors de la route, le camion ralentit et s'abîme à vive allure. Un virage trop serré avec la remorque provoque une mise en portefeuille.
- **Stations** (marquage bleu) : plein de carburant, réparations, moteur plus puissant (350 → 680 ch), réservoir plus grand, peinture.
- **Dépanneuse** (menu ☰) : en cas de panne sèche ou de camion détruit, remorque jusqu'à la station la plus proche pour 900 $.
- Le jour et la nuit alternent (une minute de jeu par seconde) ; les phares s'allument la nuit. La progression est sauvegardée automatiquement.

## Développer

Prérequis : Node.js 22.

```bash
cd truck-game
npm install
npm run dev     # http://localhost:8080, reconstruit à chaque modification
npm test        # physique du camion, carte, paiements
npm run build   # www/game.js, copié dans android/app/src/main/assets/www
```

Pour construire l'APK en local (Android SDK et Java 17 requis) :

```bash
cd truck-game && npm run build && cd android && ./gradlew assembleRelease
```

L'APK se trouve dans `android/app/build/outputs/apk/release/`.

### Organisation

- `src/physics.js` : modèle du camion (bicyclette cinématique, remorque articulée, boîte automatique, carburant).
- `src/worldgen.js` : villes, routes courbes, bâtiments, arbres, collisions et distances entre villes.
- `src/world-mesh.js`, `src/models.js` : maillages Three.js du décor, du camion, de la remorque et des voitures.
- `src/traffic.js` : voitures qui roulent à droite et s'arrêtent derrière le camion.
- `src/jobs.js` : marchandises, offres de fret et paiement.
- `src/hud.js`, `src/input.js`, `src/audio.js`, `src/save.js` : interface, commandes, sons synthétisés, sauvegarde.
- `src/main.js` : boucle de jeu, dépôts, stations, caméra, jour et nuit.
- `android/` : projet Android minimal (une activité avec une WebView).

La clé `android/app/camion-express.keystore` est publique : elle sert seulement à ce que les builds successifs se mettent à jour. Pour publier sur un store, signe avec ta propre clé gardée secrète.
