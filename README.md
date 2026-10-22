# ABBOUD CAR RENTAL — Location de voitures à Kénitra, Maroc

Application web complète pour **ABBOUD Car Rental** (Kénitra, Maroc), composée de :
1. **Un site public immersif 3D** (ambiance showroom sombre, éclairage rouge, reflets au sol, présentation des 5 modèles et des 9 véhicules du parc, formulaire de demande de réservation et contact direct).
2. **Un dashboard privé de gestion complète** (interface claire à menu latéral anthracite, 14 rubriques opérationnelles, persistance serveur JSON et impression PDF des contrats, factures et rapports).

---

## 1. Identité de l’Agence
- **Nom** : `ABBOUD CAR RENTAL`
- **Activité** : Location de voitures à Kénitra, Maroc
- **Slogan** : *« Roulez librement, louez facilement. »*
- **Téléphone 1** : `07 24 77 44 40`
- **Téléphone 2** : `07 01 12 36 37`
- **E-mail** : `abboudcar59@gmail.com`

---

## 2. Parc Automobile Initial (9 Véhicules Individuels)
| Réf. interne | Modèle | Quantité modèle | État initial |
| :--- | :--- | :---: | :--- |
| `P208-01` | Peugeot 208 | 1 / 2 | `À renseigner` |
| `P208-02` | Peugeot 208 | 2 / 2 | `À renseigner` |
| `COR-01` | Opel Corsa | 1 / 2 | `À renseigner` |
| `COR-02` | Opel Corsa | 2 / 2 | `À renseigner` |
| `TUC-01` | Hyundai Tucson | 1 / 1 | `À renseigner` |
| `CLI-01` | Renault Clio | 1 / 2 | `À renseigner` |
| `CLI-02` | Renault Clio | 2 / 2 | `À renseigner` |
| `SAN-01` | Dacia Sandero | 1 / 2 | `À renseigner` |
| `SAN-02` | Dacia Sandero | 2 / 2 | `À renseigner` |

---

## 3. Commandes
```bash
npm install
npm test        # Exécute la suite de validation Vitest (src/__tests__/acceptance.test.ts)
npm run build   # Compile TypeScript et le bundle de production Vite
npm run dev     # Démarre le serveur sur 0.0.0.0:5173
```
