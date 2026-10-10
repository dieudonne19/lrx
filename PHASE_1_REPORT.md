# Rapport Phase 1 - Initialisation mobile

Date : 2026-05-21

## Perimetre verifie

Ce rapport verifie l'etat du projet `mobile/` par rapport a la Phase 1 du plan d'implementation LRX :

1. Initialiser Expo avec TypeScript.
2. Ajouter Expo Router.
3. Installer NativeWind/Uniwind et configurer le theme.
4. Installer React Native Reusables.
5. Installer les dependances audio, gestures, animations, SVG et fichiers.
6. Definir les aliases d'import et la structure de base.

## Statut global

Phase 1 : validee techniquement.

Le projet mobile est bien initialise avec Expo, TypeScript, Expo Router, Uniwind/Tailwind et React Native Reusables. Les composants UI de base sont presents. Les dependances fonctionnelles LRX principales sont maintenant installees et la verification TypeScript passe.

## Elements deja en place

### Projet Expo / React Native

- `expo` installe en version `~57.0.27` (SDK 57, migre depuis le SDK 55).
- `react-native` installe en version `0.86.3`.
- `react` installe en version `19.2.3`.
- `main` configure sur `expo-router/entry` dans `package.json`.
- Scripts disponibles :
  - `pnpm dev`
  - `pnpm android`
  - `pnpm ios`
  - `pnpm web`

### TypeScript

- `tsconfig.json` present.
- `strict: true` active.
- Alias `@/*` configure vers la racine du projet.
- TypeScript `~6.0.3` ; `ignoreDeprecations: "6.0"` ajoute pour `baseUrl`.

### Expo Router

- `expo-router` installe en version `~57.0.25`.
- Plugin `expo-router` declare dans `app.json`.
- Routes de base presentes :
  - `app/_layout.tsx`
  - `app/index.tsx`
  - `app/+html.tsx`
  - `app/+not-found.tsx`
- `typedRoutes` active dans `app.json`.

### Theme / styling

- `global.css` present.
- `uniwind` installe et configure.
- `metro.config.js` configure avec `withUniwindConfig`.
- `app/_layout.tsx` importe `@/global.css`.
- `ThemeProvider` React Navigation branche via `NAV_THEME`.
- `StatusBar` adaptee au theme clair/sombre.

### React Native Reusables

`components.json` est present et pointe vers :

- `components`: `@/components`
- `ui`: `@/components/ui`
- `utils`: `@/lib/utils`
- `lib`: `@/lib`
- `hooks`: `@/hooks`

Composants UI presents dans `components/ui/` :

- `accordion.tsx`
- `alert-dialog.tsx`
- `badge.tsx`
- `button.tsx`
- `checkbox.tsx`
- `dialog.tsx`
- `icon.tsx`
- `input.tsx`
- `label.tsx`
- `progress.tsx`
- `select.tsx`
- `separator.tsx`
- `skeleton.tsx`
- `switch.tsx`
- `tabs.tsx`
- `text.tsx`
- `textarea.tsx`

La liste prioritaire demandee est donc installee.

### Dependances deja utiles pour LRX

Sont deja presentes :

- `expo-audio` (a installer) pour l'audio ; `expo-av` a ete retire car deprecie.
- `expo-document-picker` pour l'import de fichiers.
- `expo-file-system` pour les fichiers locaux et l'export.
- `expo-haptics` pour le feedback tactile TAP TIME.
- `expo-sharing` pour le partage de fichier `.lrc`.
- `expo-clipboard` pour la copie du contenu `.lrc`.
- `lucide-react-native` pour remplacer les icones SVG custom de la maquette.
- `react-native-gesture-handler` pour les interactions tactiles.
- `react-native-mmkv` pour la persistance locale rapide.
- `react-native-reanimated` pour les animations.
- `react-native-svg` pour la waveform.
- `react-native-safe-area-context`.
- `react-native-screens`.
- `zustand` pour le store applicatif.

## Points restants hors Phase 1 stricte

### Identite app encore generique

`app.json` utilise encore les valeurs du starter :

- `name`: `minimal`
- `slug`: `minimal`
- `scheme`: `minimal`
- splash/icon/adaptive icon generiques

Pour LRX, il faudra remplacer par :

- `name`: `LRX`
- `slug`: `lrx`
- `scheme`: `lrx`
- icons/splash dedies
- `userInterfaceStyle`: probablement `dark` ou `automatic` selon decision produit

### Ecran de depart encore starter

`app/index.tsx` affiche encore l'ecran par defaut React Native Reusables :

- logo React Native Reusables
- liens vers la documentation
- bouton theme

Il faudra le remplacer par `HomeScreen` ou `OnboardingScreen` LRX pendant la Phase 3.

### Theme pas encore LRX

`global.css` et `lib/theme.ts` utilisent le theme neutral/shadcn generique.

Il faudra convertir les tokens de `maquette/lrx-tokens.css` :

- background `#08090B`
- surfaces `#0E0F12`, `#131418`, `#1A1C21`
- accent violet `#7C5CFF`
- success/warning/danger
- radii LRX
- typographie cible

Cette conversion appartient plutot a la Phase 2, mais elle bloque l'identite visuelle LRX.

## Verification technique

Commande lancee :

```bash
pnpm exec tsc --noEmit
```

Resultat : succes.

Le blocage initial sur `placeholderClassName` dans `components/ui/input.tsx` et `components/ui/textarea.tsx` a ete corrige en etendant les props locales et en evitant de passer cette prop native-only directement a `TextInput`.

## Point Git

La commande `git status --short` dans `mobile/` echoue :

```txt
fatal: detected dubious ownership in repository
```

Git demande d'ajouter le repertoire comme safe directory :

```bash
git config --global --add safe.directory 'C:/Users/Dédé/Documents/Do/Music_lab/lrx/mobile'
```

Je ne l'ai pas execute car cela modifie la configuration Git globale de l'utilisateur.

## Conclusion

La Phase 1 est validee :

- Expo est en place.
- Expo Router est en place.
- TypeScript strict est configure.
- Uniwind/Tailwind est configure.
- React Native Reusables est installe.
- Les composants UI principaux sont presents.
- Les dependances audio/fichiers/export/persistence sont installees.
- La verification TypeScript passe.

## Prochaine action recommandee

Demarrer la Phase 2 : convertir le theme de `maquette/lrx-tokens.css` vers `global.css` et `lib/theme.ts`, puis preparer les composants UI partages LRX (`Screen`, `TopBar`, `IconButton`, `ProjectCover`, `EmptyState`).

## Mise a jour - migration Expo SDK 57

- Migration du SDK 55 vers le SDK 57 (Expo `~57.0.27`, React Native `0.86.3`, React `19.2.3`).
- `@expo/dom-webview` `~57.0.1` installe explicitement (il restait en 55.0.6).
- `app.json` : la cle `splash` a ete deplacee dans la config du plugin `expo-splash-screen`.
- `expo-av` retire (deprecie) ; la lecture audio utilisera `expo-audio`, a installer quand elle sera branchee.
- Verification : `expo-doctor` 21/21 et `tsc --noEmit` sans erreur. Execution de l'app non testee.
- Sauvegardes : `package.json.bak-sdk55b`, `pnpm-lock.yaml.bak-sdk55`.
- Correctif SDK 56+ : `expo-router` n'est plus compatible avec `@react-navigation` ; `ThemeProvider`, `DefaultTheme`, `DarkTheme` et `Theme` s'importent desormais depuis `expo-router/react-navigation` (`app/_layout.tsx`, `lib/theme.ts`) et la dependance `@react-navigation/native` a ete retiree.
- Verification : `expo export --platform android` construit le bundle (3300 modules).
- Refactor : l'editeur a ete extrait de `app/index.tsx` vers `components/lrx/editor/`.
- Store source-of-truth : `EditorScreen` prend un `projectId` et lit/ecrit les paroles via le store (nouvelle action `restoreLyrics` pour undo/redo) ; `index.tsx` utilise `activeProjectId` du store ; les Settings sont branches sur `settings`/`updateSettings` ; le mock `PROJECTS` est supprime.
