# LRX

Application mobile pour créer des fichiers de paroles synchronisées **`.lrc`** à partir de ses propres morceaux : on importe un fichier audio, on colle les paroles, puis on tape le rythme ligne par ligne pendant la lecture.

Construite avec [Expo](https://expo.dev/) (SDK 57), [Expo Router](https://docs.expo.dev/router/introduction/), [Uniwind](https://uniwind.dev/) (Tailwind CSS v4) et [React Native Reusables](https://reactnativereusables.com). Elle tourne dans **Expo Go**, sans build natif.

## Fonctionnalités

- **Projets** : un projet par morceau, avec filtres (tous, en cours, finalisés, brouillons), renommage et suppression. Un même fichier audio (même nom et même taille) ne peut pas être importé deux fois.
- **Import audio** : MP3, WAV, M4A, AAC, FLAC et OGG, 100 Mo maximum. Le fichier est copié dans le dossier de l'app pour survivre au vidage du cache.
- **Import des paroles** : coller le texte, nettoyé et découpé en lignes. Une ligne se corrige par appui long dans l'éditeur.
- **TAP TIME** : un tap pendant la lecture date la ligne courante.
  - Déclenché dès le contact du doigt, avec retour haptique.
  - Décalage réglable (80 ms par défaut, de 0 à 300 ms) pour compenser le temps de réaction et la latence audio.
  - Annuler / rétablir.
- **Lecteur** : lecture/pause, avance et retour de 5 s, seek sur la forme d'onde, vitesses 0.5x, 1x et 1.5x.
- **Ajustement fin** : corriger le timestamp de la ligne active par pas de ±0,05 s ou ±0,25 s.
- **Aperçu karaoké** : les paroles défilent sur la ligne en cours de lecture.
- **Métadonnées** : titre, artiste, album, auteur et genre, écrits comme tags LRC (`[ti:]`, `[ar:]`, `[al:]`, `[by:]`, `[re:]`).
- **Export** : partager, copier ou enregistrer le `.lrc` dans un dossier choisi. Le fichier porte le nom du morceau (`chanson.mp3` → `chanson.lrc`). Une confirmation est demandée s'il reste des lignes non synchronisées.
- **Réglages** : thème (système, sombre, clair), vitesse par défaut, vibrations, défilement automatique, confirmation d'export, décalage TAP TIME.

Les timestamps sont au format `[mm:ss.cc]`, arrondis au centième de seconde :

```text
[ti:Ma chanson]
[ar:Artiste]

[00:12.40] Première ligne
[00:15.05] Deuxième ligne
```

## Démarrer

Prérequis : Node.js et [pnpm](https://pnpm.io/). Pour tester sur téléphone, l'app [Expo Go](https://expo.dev/go).

```bash
pnpm install
```

```bash
pnpm dev
```

Dans le serveur Expo, `a` ouvre l'émulateur Android, `i` le simulateur iOS (Mac uniquement), `w` le navigateur. On peut aussi scanner le QR code avec Expo Go.

### Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Lance le serveur Expo (cache vidé) |
| `pnpm android` / `pnpm ios` / `pnpm web` | Lance directement sur une plateforme |
| `pnpm test` | Lance les tests Jest |
| `pnpm exec tsc --noEmit` | Vérifie les types |
| `pnpm clean` | Supprime `.expo` et `node_modules` |

> Sur un clone neuf, lance `pnpm dev` une fois avant `tsc` : c'est Expo qui génère `expo-env.d.ts`, le fichier qui déclare les imports `.css`. Sans lui, `tsc` signale `Cannot find module '@/global.css'`.

## Télécharger l'APK Android

Le workflow [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) construit un APK de release sur GitHub Actions, sans compte EAS.

- **Lancer un build** : onglet *Actions* > *Build Android APK* > *Run workflow*, ou pousser un tag `v*` (par exemple `v1.0.0`).
- **Récupérer l'APK** : dans *Releases*, chaque build publie le fichier `lrx-<version>-<build>.apk`, téléchargeable directement depuis le téléphone. Il est aussi joint au run dans *Actions* (artefact, gardé 30 jours).

Pour réduire la taille, l'APK ne contient que l'architecture `arm64-v8a` (quasiment tous les téléphones Android récents), le code est réduit par R8, les ressources inutilisées sont retirées et les bibliothèques natives sont compressées.

L'APK est signé avec la clé de debug du template Expo : il s'installe hors Play Store (autoriser les sources inconnues), et chaque nouveau build s'installe par-dessus le précédent.

## Structure

```text
app/                      Routes Expo Router
  index.tsx               Accueil (liste des projets)
  onboarding.tsx          Présentation, affichée au premier lancement
  settings.tsx            Réglages
  editor/[projectId].tsx  Éditeur d'un projet
components/
  lrx/                    Composants propres à LRX
    editor/               Éditeur, forme d'onde, TAP TIME, mode karaoké, lecteur audio
    screens/              Écrans accueil, onboarding, réglages
    sheets/               Feuilles du bas : audio, paroles, métadonnées, export, ajustement, actions
  ui/                     Composants React Native Reusables
lib/
  lrx-store.ts            Store Zustand persistant (projets, paroles, réglages)
  lrx-editor-utils.ts     Découpage des paroles, formatage des temps, génération du .lrc
  audio-files.ts          Choix, validation et copie des fichiers audio
  theme.ts, brand.ts      Couleurs de navigation et de la marque
  __tests__/              Tests Jest
global.css                Tokens du thème (clair et sombre)
```

## Choix techniques

- **Persistance** : `expo-sqlite/kv-store`, inclus dans Expo Go. `react-native-mmkv` a été retiré car il demande un build natif. Les écritures sont groupées (au plus une toutes les 500 ms, et forcées quand l'app passe en arrière-plan).
- **Audio** : `expo-audio`. L'éditeur ne suit que les changements d'état rares (chargé, lecture, durée, erreur) ; le timecode, la forme d'onde et l'aperçu lisent la position dans leurs propres composants, pour garder TAP TIME réactif.
- **Forme d'onde** : enveloppe simulée, stable pour chaque projet. Extraire les vraies amplitudes demande un module natif absent d'Expo Go.
- **Polices** : Geist et Geist Mono. React Native ne synthétise pas les graisses des polices personnalisées, donc `lib/fonts.ts` associe chaque classe (`font-medium`, `font-bold`, `font-mono`…) à la bonne famille.
- **Thème** : les couleurs sont définies dans `global.css`. Un test vérifie que les copies en JavaScript (`lib/theme.ts`, `lib/brand.ts`) restent identiques.

## Tests

```bash
pnpm test
```

Les tests couvrent les utilitaires de l'éditeur (découpage, formatage des temps, nom de fichier, export LRC), le store (création, statuts, timestamps, annulation, import, suppression, réglages, persistance groupée), la validation des fichiers audio et la cohérence du thème.
