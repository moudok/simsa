# Manuel d'utilisation — Simsa

## Présentation

**Simsa** (심사) est une application de notation pour les passages de grades de taekwondo. Elle fonctionne **100% hors ligne**, sans connexion internet. Toutes les pages sont pré-téléchargées à l'installation. Les données restent sur votre appareil.

La page d'accueil donne accès à **Élèves**, **Démarrer l'examen**, **Résultats**, **Échange de données** et **Paramètres**.

---

## Fonctionnement général

Les noms des élèves sont saisis soit directement sur le téléphone du Maître, soit depuis un ou plusieurs téléphones d'élèves. Les informations sont transmises au Maître par QR code. Aucune information n'est jamais envoyée sur Internet (aucune connexion à Internet n'est requise) et il n'est pas nécessaire de créer un compte pour utiliser l'application.

Il est possible de définir manuellement des binômes ; sinon, le système les forme automatiquement au mieux (même grade, même genre, triés par année de naissance).

Le Maître peut modifier les épreuves, en ajouter ou en supprimer. Si un jury composé de plusieurs membres est présent, ceux-ci peuvent scanner l'ensemble des informations (liste des élèves et des épreuves) sur leurs propres téléphones.

L'application permet de noter les performances des élèves en leur attribuant des bons points ou des mauvais points : un clic pour incrémenter, double clic pour décrémenter. En glissant vers la droite, le Maître ou le jury passe à l'épreuve suivante. Un compte à rebours paramétrable est disponible dans la barre en bas de l'écran (pratique pour les combats par exemple).

À l'issue des épreuves, la page de résultats permet de visualiser un récapitulatif global et de décider du résultat de chaque élève. Les membres du jury peuvent également exporter leurs résultats vers le téléphone du Maître. Un export PDF permet de visualiser le résultat final.

---

## Installation

Simsa est une application web progressive (PWA). Elle s'utilise directement dans le navigateur, mais on recommande de l'installer pour un accès rapide et un fonctionnement hors ligne.

### Android (Chrome)

1. Ouvrir **simsa.moudok.fr** dans Chrome
2. Appuyer sur le menu **⋮** (trois points en haut à droite)
3. Appuyer sur **Installer l'application** ou **Ajouter à l'écran d'accueil**

### Android (Firefox)

1. Ouvrir **simsa.moudok.fr** dans Firefox
2. Appuyer sur le menu **⋮** (trois points)
3. Appuyer sur **Installer**

### Android (Samsung Internet)

1. Ouvrir **simsa.moudok.fr** dans Samsung Internet
2. Appuyer sur le menu **☰** (trois barres)
3. Appuyer sur **Ajouter la page à** → **Écran d'accueil**

### iPhone / iPad (Safari)

1. Ouvrir **simsa.moudok.fr** dans Safari
2. Appuyer sur le bouton **Partager** (carré avec une flèche vers le haut)
3. Faire défiler et appuyer sur **Sur l'écran d'accueil**

### Ordinateur — Chrome / Edge

1. Ouvrir **simsa.moudok.fr** dans Chrome ou Edge
2. Cliquer sur l'icône d'installation dans la barre d'adresse (ou menu **⋮** → **Installer Simsa**)

### Ordinateur — Firefox

Firefox ne prend pas en charge l'installation des PWA. Utilisez Simsa directement depuis le navigateur.

### Ordinateur — Safari (macOS)

1. Ouvrir **simsa.moudok.fr** dans Safari (macOS Sonoma ou ultérieur)
2. Menu **Fichier** → **Ajouter au Dock**

---

## Élèves

La page **Élèves** donne accès à plusieurs fonctions :

- **Inscrire des élèves** : formulaire d'inscription manuelle
- **Scanner des QR codes élèves** : scanner les QR codes générés par les élèves sur leurs propres téléphones
- **Données de démonstration** : charger des élèves fictifs pour tester l'application (certains avec des binômes aléatoires)
- **Supprimer les données des élèves** : effacer tous les élèves inscrits (avec confirmation par slider)

### Inscription d'un élève

1. Ouvrir l'application et choisir **Élèves** puis **Inscrire des élèves**
2. Remplir le formulaire : prénom, nom, grade (ceinture), année de naissance, genre
3. Si souhaité, indiquer le prénom et nom d'un binôme
4. Appuyer sur **OK**
5. Le QR code de l'élève est généré et affiché

Plusieurs élèves peuvent s'inscrire à la suite sur le même téléphone. Chaque QR code est conservé dans un onglet. Il est possible de naviguer entre les QR codes en glissant vers la gauche ou la droite. Le bouton **＋** en haut à droite permet de revenir au formulaire d'inscription.

---

## Démarrer l'examen

Ce bouton ouvre directement la **vue de notation**.

Si aucun élève n'est inscrit, un écran d'aide s'affiche avec des liens vers l'inscription, le scan QR, les données de démonstration et les paramètres.

### Notation

1. Le nom de l'épreuve en cours s'affiche dans la barre de titre avec des flèches ← → pour naviguer. Il est aussi possible de glisser (swipe) vers la gauche ou la droite pour changer d'épreuve.
2. Ouvrir le menu **☰** (en haut à droite) pour accéder aux filtres et options :
   - Filtrer par grade ou genre
   - Ajuster le nombre d'élèves par rangée
3. Les élèves sont affichés en grille, groupés par grade décroissant (noirs en premier). Chaque carte affiche le genre (♂/♀) en haut à gauche et l'année de naissance en haut à droite, et est entourée d'une bordure de la couleur de la ceinture (double pour les grades +, triple pour ++). Les binômes manuels (demandes réciproques) sont placés côte à côte et reliés par un trait vertical. Appuyer sur une carte pour masquer/afficher un élève.
4. Chaque élève a deux boutons de notation :
   - **＋** (vert) : un appui = +1 bon point, double appui = -1
   - **－** (rouge) : un appui = +1 erreur, double appui = -1

### Export PDF

Le bouton de téléchargement (en haut à droite, à côté du menu) génère un PDF des résultats au format paysage A4, avec les élèves triés par grade croissant puis par ordre alphabétique.

### Chronomètres

La barre permanente en bas de l'écran affiche :
- L'**heure courante**
- La **durée de la session** depuis le lancement
- Le **compte à rebours** : appuyer sur une durée (30s, 1', etc.) pour le lancer. Boutons pause ⏸ et stop disponibles. Un bip sonore retentit et le téléphone vibre à la fin.

---

## Système de notation

Pour chaque élève et chaque épreuve, deux boutons sont disponibles :
- **＋** (vert) : nombre de bons points (mouvements réussis)
- **－** (rouge) : nombre d'erreurs

Un appui simple incrémente de 1. Un double appui décrémente de 1. Les compteurs ne descendent pas en dessous de 0.

---

## Échange de données

Accessible depuis le bouton **Échange de données** sur la page d'accueil :

### Importer

| Fonction | Description |
|---|---|
| **Importer des QR codes** | Scanner universel qui détecte automatiquement le type de QR code : inscription élève, lot d'élèves, configuration complète ou résultats du jury. Les doublons sont ignorés. En cas de divergence sur les résultats (élèves ou épreuves en plus/en moins), un avertissement détaillé est affiché. |
| **Importer la base (YAML)** | Restaure la configuration depuis un fichier YAML (écrase les données existantes) |

### Exporter

| Fonction | Description |
|---|---|
| **Exporter la base (YAML)** | Télécharge un fichier YAML contenant les épreuves, paramètres, élèves et notes |
| **Tout exporter (QR)** | Affiche un ou plusieurs QR codes contenant la configuration complète et les élèves |
| **Exporter les élèves (QR)** | Exporte uniquement la liste des élèves en QR code |
| **Exporter les résultats (QR)** | Le jury saisit son nom, puis génère un QR code contenant ses notes et verdicts. Un hash des élèves et épreuves est inclus pour vérification d'intégrité. |

Si les données sont trop volumineuses, les QR codes sont automatiquement découpés en plusieurs fragments affichés en boucle. La vitesse d'affichage est réglable via un slider.

---

## Résultats

Accessible depuis le bouton **Résultats** sur la page d'accueil :

- Tableau interactif avec tous les élèves triés par grade
- Filtres par grade
- Pour chaque élève : notes agrégées par épreuve et verdict (reçu ✓ / refusé ✗, cliquable)
- Si des notes de jury ont été importées, elles apparaissent en sous-lignes (plus petites) sous chaque élève, avec le verdict du jury (✓ vert / ✗ rouge, non modifiable). Si un jury n'a aucune note ni verdict pour un élève, il n'apparaît pas.
- Export PDF (bouton en haut à droite) : reprend le même tableau avec les sous-lignes jury

---

## Paramètres

Accessible depuis le bouton **Paramètres** sur la page d'accueil :

- **Épreuves** : modifier les libellés (français et coréen), ajouter, dupliquer ou supprimer des épreuves
- **Durées du compte à rebours** : ajouter ou supprimer des durées
- **Élèves par rangée** : nombre d'élèves affichés par ligne dans la grille de notation (4 par défaut)
- **Tout supprimer** : effacer toutes les données (élèves, notes et paramètres) avec confirmation par slider

Ces paramètres sont conservés même après la suppression des données des élèves.

---

## Données personnelles

Simsa traite des données à caractère personnel (prénom, nom, grade, année de naissance, genre) dans le cadre de l'exécution du contrat (article 6(1)(b) du RGPD). Conformément à la loi n°78-17 du 6 janvier 1978 modifiée (loi Informatique et Libertés) et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de modification et de suppression des données vous concernant.

- Les données ne quittent **jamais** l'appareil
- Seule l'**année de naissance** est collectée (pas la date de naissance complète)
- Les données de session (élèves et notes) peuvent être supprimées à tout moment
- Les paramètres (épreuves) sont conservés séparément
- Responsable du traitement : le Maître
- **Aucune télémétrie** n'est effectuée lorsque l'application est installée sur un appareil. Un suivi analytique anonyme (sans cookies, respectant Do Not Track) peut être actif uniquement lors de la consultation via un navigateur web

---

## Avertissement

Cette application est fournie **gratuitement**, en l'état, sans aucune garantie d'aucune sorte, expresse ou implicite. L'auteur décline toute responsabilité quant à l'utilisation de cette application et ses éventuelles conséquences. L'utilisateur utilise cette application à ses propres risques.

---

## Licence

- **Code source** : [AGPL v3](https://www.gnu.org/licenses/agpl-3.0.en.html) — libre d'exécution, d'étude, de modification et de redistribution sous les mêmes conditions
- **Logo** : [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (domaine public)

- Code source : [github.com/moudok/simsa](https://github.com/moudok/simsa)
- Signaler un bug ou une demande : [créer un ticket](https://github.com/moudok/simsa/issues/new)
- Contact : Benjamin Bellamy — [benjamin@moudok.fr](mailto:benjamin@moudok.fr) — [moudok.fr/simsa](https://moudok.fr/simsa)

*Créé par IA avec [Claude.ai](https://claude.ai)*
