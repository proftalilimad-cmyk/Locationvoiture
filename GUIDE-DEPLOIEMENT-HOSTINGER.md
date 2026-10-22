# Guide d'Exportation et de Mise en Ligne sur Hostinger — Abboud Location (Kénitra)

Ce projet a été compilé et préparé dans l’archive prête à l’emploi :
👉 **`abboud-location-hostinger.zip`**

Cette archive est directement compatible avec **tous les hébergements Web Hostinger** (Mutualisé Single / Premium / Business ou Cloud) sous Apache + PHP 8+.

---

## 1. Contenu de l’archive `abboud-location-hostinger.zip`

Lorsque vous décompressez `abboud-location-hostinger.zip` dans le dossier **`public_html/`** de Hostinger, vous obtenez :
- **`index.html`** : Point d’entrée du site trilingue (**Français / العربية / English**) optimisé pour Google SEO (Kénitra & axe Rabat).
- **`.htaccess`** :
  - Redirige automatiquement toutes les URLs lisibles (`/vehicules`, `/reservation`, `/agence`, `/faq`, `/contact`, `/mentions-legales`, `/admin`) vers l’application React sans erreur 404.
  - Redirige les appels `/api/abboud/*` vers le contrôleur PHP (`api/abboud/index.php`).
  - Bloque tout accès public direct au dossier de données privées (`api/abboud/data/`).
  - Active la compression **GZIP** et le **cache navigateur 1 an** sur les images et scripts pour un score maximal aux Core Web Vitals.
- **`assets/`** : Fichiers CSS et JavaScript minifiés et découpés (*Code Splitting* : le tableau de bord `/admin` est séparé du site public).
- **`abboud/`** : Photos détourées optimisées (`.png` < 95 Ko) des 5 modèles (**Peugeot 208, Opel Corsa, Hyundai Tucson, Renault Clio, Dacia Sandero**).
- **`api/abboud/index.php`** : Contrôleur PHP 8+ autonome qui sauvegarde automatiquement vos données d’administration (véhicules, contrats, factures, paiements, demandes) dans `api/abboud/data/abboud-db.json`.
- **`robots.txt` & `sitemap.xml`** : Fichiers d’indexation Google multilingues (`fr`, `ar`, `en`).

---

## 2. Étapes d’installation sur Hostinger (en 3 minutes)

1. Connectez-vous à votre panneau **hPanel Hostinger** (`https://hpanel.hostinger.com`).
2. Ouvrez **Sites Web** → cliquez sur **Gérer** à côté de votre domaine → ouvrez le **Gestionnaire de fichiers (File Manager)**.
3. Ouvrez le dossier **`public_html/`** (supprimez le fichier `default.php` d’origine s’il est présent).
4. Cliquez sur l’icône **Téléverser (Upload)** en haut à droite et sélectionnez le fichier **`abboud-location-hostinger.zip`**.
5. Une fois le fichier téléversé dans `public_html/`, faites un **clic droit sur `abboud-location-hostinger.zip` → Extraire (Extract)** et choisissez `.` (ou déplacez les fichiers extraits directement à la racine de `public_html/`).
6. Vérifiez que le fichier caché **`.htaccess`** est bien présent à la racine de `public_html/`.

---

## 3. Accès au site et à l’Espace Gestion (`/admin`)

- **Site public trilingue (FR / AR / EN)** :
  - `https://votredomaine.ma/`
  - `https://votredomaine.ma/vehicules`
  - `https://votredomaine.ma/reservation`
  - `https://votredomaine.ma/agence`
  - `https://votredomaine.ma/faq`
  - `https://votredomaine.ma/contact`
  - `https://votredomaine.ma/mentions-legales`
- **Espace Gestion privé (`/admin`)** :
  - URL : `https://votredomaine.ma/admin`
  - Mot de passe initial par défaut : **`abboud2026`** *(modifiable immédiatement depuis l’onglet Paramètres & Sauvegarde JSON de l’administration)*.

---

## 4. Comment modifier facilement les coordonnées, l’adresse ou le catalogue ?

Si vous souhaitez mettre à jour l’adresse exacte à Kénitra, les horaires d’ouverture, les numéros légaux (RC, ICE, IF) ou les véhicules avant un nouvel export :
1. Ouvrez le fichier **`src/config/abboudConfig.ts`**.
2. Modifiez les valeurs souhaitées dans `ABBOUD_AGENCY_CONFIG` ou `ABBOUD_MULTILINGUAL_VEHICLES`.
3. Exécutez `npm run build` pour régénérer le dossier `dist/`.
