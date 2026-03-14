# 심사 Simsa

> Application PWA de notation pour passages de grades de taekwondo
> 태권도 승급심사 채점 애플리케이션

🌐 **https://simsa.moudok.fr/**

![Simsa](simsa.svg)

---

## Documentation

- [Manuel d'utilisation (FR)](public/manual.fr.md)
- [사용 설명서 (한국어)](public/manual.ko.md)
- [Glossaire taekwondo / 태권도 용어](glossary.yaml) — Romanisation révisée (National Institute of Korean Language, 2000) avec termes en hangul, utilisable comme référence pour les épreuves

---

## Présentation

**Simsa** (심사, *examen* en coréen) est une application web progressive (PWA) permettant la gestion complète des passages de grades de taekwondo. L'application fonctionne **100% hors ligne**, sur mobile, tablette et laptop. Aucune information n'est jamais envoyée sur Internet et il n'est pas nécessaire de créer un compte.

![Passage de grade](og-preview.svg)

---

## Fonctionnalités

- 🌐 **Bilingue** — Interface en français et en 한국어 (coréen), extensible à d'autres langues
- 📴 **100% offline** — Aucune connexion internet requise, toutes les pages sont pré-téléchargées à l'installation
- 📱 **Multi-support** — Mobile iOS/Android, tablette, laptop
- 🔒 **Données personnelles** — Données stockées uniquement en local, suppression immédiate en fin de session
- 📷 **QR codes** — Échanges de données sans réseau (séquencés automatiquement si > 3KB)
- ⏱ **Chronomètres** — Heure, durée session, compte à rebours avec bip et vibration
- 📊 **Résultats** — Tableau interactif avec verdicts (reçu/refusé), détail par jury, export PDF
- 📤 **Échange de données** — YAML ou QR codes (épreuves, élèves, notes), export/import des résultats du jury avec vérification d'intégrité
- 🔢 **Versioning** — Numéro de version inclus dans tous les échanges, détection d'incompatibilité

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework UI | [Ionic](https://ionicframework.com/) |
| Framework JS | [Vue 3](https://vuejs.org/) + TypeScript |
| Build | [Vite](https://vitejs.dev/) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) |
| State | [Pinia](https://pinia.vuejs.org/) |
| i18n | [vue-i18n](https://vue-i18n.intlify.dev/) |
| Stockage | IndexedDB via [idb](https://github.com/jakearchibald/idb) |
| QR génération | [qrcode](https://github.com/soldair/node-qrcode) |
| QR scan | [html5-qrcode](https://github.com/mebjas/html5-qrcode) |
| Export YAML | [js-yaml](https://github.com/nodeca/js-yaml) |
| Export PDF | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| Compression | [lz-string](https://github.com/pieroxy/lz-string) |
| Police | Noto Sans KR (support Hangul, bundlée offline) |

---

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/moudok/simsa.git
cd simsa

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

---

## Modèle de notation

Pour chaque élève et chaque épreuve, chaque membre du jury enregistre :
- **＋** : nombre de mouvements particulièrement réussis
- **－** : nombre d'erreurs

Les notes sont **non agrégées** — chaque membre du jury conserve sa lecture indépendante.

---

## Conformité RGPD

- **Base légale** : exécution du contrat (article 6(1)(b) du RGPD)
- **Responsable du traitement** : le Maître
- **Stockage** : local uniquement (IndexedDB), jamais transmis sur Internet
- **Minimisation** : année de naissance uniquement (pas de date de naissance complète)
- **Suppression** : immédiate et complète en fin de session
- **Droits** : accès, modification et suppression (loi n°78-17 du 6 janvier 1978)

---

## Analytics (optionnel)

Le fichier `public/analytics.js` (non commité, dans `.gitignore`) permet d'ajouter un script de suivi analytique (ex : Matomo). Ce script est chargé **uniquement** lorsque l'application est consultée via un navigateur web. Lorsque l'application est installée en tant que PWA, aucun script analytique n'est chargé et aucune donnée de télémétrie n'est transmise.

Pour activer l'analytics, créer le fichier `public/analytics.js` avec le code de suivi souhaité. Le chargement conditionnel est géré dans `index.html`.

---

## Licence

- **Code source** : AGPL v3 — voir [LICENSE](LICENSE)
- **Logo (`simsa.svg`)** : [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (domaine public)
- **Police Noto Sans KR** : [SIL Open Font License](https://scripts.sil.org/OFL)
- **Icônes Ionicons** : MIT

---

*심사 Simsa (2026)*
*🇫🇷 Fabriqué en France avec ❤️ pour toutes celles et tous ceux qui aiment le Taekwondo 🇰🇷*
