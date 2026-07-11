# DOCUMENT DE CONCEPTION : MODULE 10 - GESTION DES STOCKS

## 1. Objectifs
Ce module a pour but de fournir un suivi précis et en temps réel de tous les stocks de cacao, depuis l'entrée en magasin jusqu'à l'expédition, tout en permettant une traçabilité totale des lots, une valorisation financière et une gestion rigoureuse des inventaires.

Les principaux objectifs sont :
* Suivre le stock en temps réel (quantité, valeur).
* Gérer les entrées (achats, transferts, ajustements) et les sorties (ventes, expéditions, pertes).
* Suivre les lots de cacao pour une traçabilité complète.
* Connaître la valeur du stock à tout moment.
* Historiser tous les mouvements sans possibilité de suppression.
* Détecter les écarts via des inventaires complets ou tournants.
* Préparer les expéditions avec un système de réservation.

---

## 2. Structure des stocks
La gestion s'organise selon une hiérarchie stricte permettant une granularité fine :
1. **Société** : L'entité globale gérant l'ERP.
2. **Magasin** : Le site physique global (ex: Magasin Central Douala).
3. **Entrepôt** : Un bâtiment spécifique au sein d'un magasin.
4. **Zone** : Une division logique ou physique dans l'entrepôt (ex: Zone A - Grade 1).
5. **Emplacement** : L'unité de stockage minimale (ex: Allée 1, Rayon 2).
6. **Lot** : Le groupement de cacao partageant les mêmes caractéristiques.
7. **Produit** : Le type de fève (Cacao).

---

## 3. Gestion des lots
Chaque lot est une entité unique garantissant la traçabilité.

**Attributs d'un lot :**
* `NumeroLot` : Généré automatiquement (ex: LOT-2026-07-001).
* `DateCreation` : Date de création du lot.
* `OrigineId` : Référence vers le planteur, sous-acheteur ou chef de zone.
* `CampagneId` : Référence de la campagne agricole.
* `Qualite` : Grade (ex: Grade 1, Grade 2, Sous-Grade).
* `PoidsInitial` (kg) : Poids à la création.
* `PoidsActuel` (kg) : Poids disponible.
* `NombreSacs` : Quantité physique.
* `ValeurAchat` (FCFA) : Valeur lors de l'acquisition.
* `ValeurActuelle` (FCFA) : Valeur réévaluée (si applicable).
* `EmplacementId` : Référence de la localisation physique.
* `Statut` : Enumération (`DISPONIBLE`, `RESERVE`, `EXPEDIE`, `BLOQUE`).

---

## 4. Entrées de stock
Les entrées augmentent le stock d'un emplacement et mettent à jour ou créent un lot.

**Sources :**
* Achats (Module 7).
* Transfert inter-magasins.
* Retour de marchandise.
* Ajustement d'inventaire validé.

**Actions automatiques :**
* Mise à jour du `PoidsActuel` et `NombreSacs` de l'emplacement et du lot.
* Création d'un enregistrement dans l'historique des mouvements.
* Mise à jour des tableaux de bord.

---

## 5. Sorties de stock
Les sorties diminuent le stock.

**Causes :**
* Vente ou expédition (Export).
* Transfert vers un autre magasin.
* Perte ou destruction constatée.
* Correction d'inventaire validée.

**Règles :**
* Vérification de la disponibilité du stock.
* Le stock ne peut pas être négatif.
* Validation obligatoire pour les pertes et destructions.
* Historisation obligatoire.

---

## 6. Mouvements de stock
Tout changement de quantité ou d'emplacement génère un mouvement inaltérable.

**Structure d'un mouvement :**
* `MouvementId` : UUID.
* `NumeroMouvement` : Ex: MVT-20260711-0001.
* `Type` : `ENTREE`, `SORTIE`, `TRANSFERT`.
* `Motif` : `ACHAT`, `VENTE`, `AJUSTEMENT`, `PERTE`, etc.
* `DateMouvement` : Timestamp précis.
* `UtilisateurId` : Qui a effectué l'action.
* `MagasinOrigineId` / `EmplacementOrigineId` : Si sortie ou transfert.
* `MagasinDestinationId` / `EmplacementDestinationId` : Si entrée ou transfert.
* `LotId` : Lot concerné.
* `Quantite` (kg) et `NombreSacs`.
* `Observations` : Texte libre.

---

## 7. Valorisation du stock
Le système doit fournir des outils d'analyse financière du stock.

**Indicateurs :**
* Quantité totale (Tonnes et kg).
* Nombre total de sacs.
* Valeur totale du stock.
* Coût Moyen Unitaire Pondéré (CMUP).
* Valeur détaillée par magasin, par lot et par campagne.

**Méthode de valorisation par défaut :** CMUP calculé à chaque entrée. (Peut être paramétré sur FIFO si besoin comptable spécifique).

---

## 8. Inventaires
Permet de s'assurer que le stock physique correspond au stock théorique (informatique).

**Types :** Général, Tournant, Par magasin, Par lot, Par zone.

**Processus :**
1. Création d'une session d'inventaire (Fige le stock théorique de la zone).
2. Saisie du comptage physique (sur mobile ou desktop).
3. Calcul des écarts (`PoidsPhysique` - `PoidsTheorique`).
4. Justification des écarts.
5. Soumission pour validation.
6. Validation par un superviseur (Génère automatiquement les mouvements d'ajustement).

---

## 9. Réservation des stocks
Processus permettant d'allouer des lots spécifiques à une opération future (export, commande).

**Règles :**
* Modifier le statut du lot en `RESERVE`.
* Le stock de ce lot ne peut plus être utilisé pour d'autres opérations.
* Possibilité d'annuler la réservation (retourne au statut `DISPONIBLE`).

---

## 10. Alertes
Le système surveille activement l'état des stocks.

**Triggers :**
* Stock sous le seuil minimal (Configurable par magasin/qualité).
* Lot stagnant (ex: > 90 jours).
* Écart d'inventaire détecté (alerte superviseur).
* Lot bloqué suite à un contrôle qualité.
* Zone de stockage à > 95% de sa capacité.

---

## 11. Tableau de bord
Vue synthétique pour les gestionnaires et la direction.

**Composants :**
* KPI : Stock Total (T), Valeur (FCFA), Nb Sacs.
* Graphique : Évolution du stock sur 30 jours.
* Répartition : Camembert du stock par magasin et par qualité.
* Tableau : Derniers mouvements.
* Alertes : Liste des seuils critiques et lots bloqués.

---

## 12. Permissions

| Rôle | Consultation | Entrées/Sorties | Inventaires | Réservations | Valorisation | Validation Écarts |
|---|---|---|---|---|---|---|
| **Administrateur** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Directeur** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Responsable Magasin**| ✅ | ✅ | ✅ | ✅ | ✅ (son mag.) | ✅ (jusqu'à seuil) |
| **Magasinier** | ✅ (son mag.) | ✅ | Saisie unique | ❌ | ❌ | ❌ |
| **Comptable** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Auditeur** | ✅ | ❌ | ✅ (lecture) | ❌ | ✅ | ❌ |

---

## 13. Modélisation Base de données (Prisma)

```prisma
model Lot {
  id              String      @id @default(uuid())
  numeroLot       String      @unique
  campagneId      String
  origineId       String?     // Planteur/Sous-acheteur/Chef de zone
  qualite         String      // GRADE_1, GRADE_2, SOUS_GRADE
  poidsInitial    Float
  poidsActuel     Float
  nombreSacs      Int
  valeurAchat     Float
  valeurActuelle  Float
  emplacementId   String
  emplacement     StorageLocation @relation(fields: [emplacementId], references: [id])
  statut          String      @default("DISPONIBLE") // DISPONIBLE, RESERVE, EXPEDIE, BLOQUE
  
  mouvements      StockMovement[]
  reservations    Reservation[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model StockMovement {
  id              String      @id @default(uuid())
  numeroMouvement String      @unique
  type            String      // ENTREE, SORTIE, TRANSFERT
  motif           String      // ACHAT, VENTE, AJUSTEMENT, PERTE...
  quantite        Float
  nombreSacs      Int
  
  lotId           String
  lot             Lot         @relation(fields: [lotId], references: [id])
  
  emplacementOrigineId String?
  emplacementDestId    String?
  
  utilisateurId   String
  utilisateur     User        @relation(fields: [utilisateurId], references: [id])
  
  observations    String?
  dateMouvement   DateTime    @default(now())
}

model Reservation {
  id              String      @id @default(uuid())
  lotId           String
  lot             Lot         @relation(fields: [lotId], references: [id])
  quantite        Float
  motif           String
  statut          String      @default("ACTIVE") // ACTIVE, ANNULEE, TERMINEE
  utilisateurId   String
  createdAt       DateTime    @default(now())
}

// Les tables Store, Warehouse, StorageZone, StorageLocation et Inventory existent déjà dans le module 9, 
// elles devront être reliées au modèle Lot.
```

---

## 14. API REST

Toutes les requêtes doivent inclure un token JWT valide. `GET /api/v1/stocks/...`

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/stocks/lots` | Lister les lots (avec filtres, pagination) |
| `GET` | `/api/v1/stocks/lots/:id` | Détails d'un lot + historique de ses mouvements |
| `POST`| `/api/v1/stocks/movements` | Créer un mouvement (entrée/sortie/transfert) |
| `GET` | `/api/v1/stocks/movements` | Lister le journal des mouvements |
| `POST`| `/api/v1/stocks/reservations` | Réserver un ou plusieurs lots |
| `PUT` | `/api/v1/stocks/reservations/:id/cancel`| Annuler une réservation |
| `GET` | `/api/v1/stocks/stats` | KPI globaux (valorisation, quantités) |
| `GET` | `/api/v1/stocks/alerts` | Récupérer les alertes actives |

---

## 15. Interface utilisateur (UI)

* **Design System** : Utilisation de Tailwind CSS, thèmes sombres (slate, indigo, cocoa).
* **Vue Liste des Lots** : Tableau paginé avec recherche (numéro de lot), filtres (magasin, statut, qualité). Colonnes : N° Lot, Qualité, Poids, Statut (avec badge coloré), Emplacement.
* **Fiche Lot** : Vue détaillée montrant les caractéristiques, la valeur, et la timeline des mouvements associés. Boutons : "Transférer", "Bloquer", "Réserver".
* **Journal des Mouvements** : Tableau en lecture seule avec filtres de date et d'utilisateur.
* **Tableau de Bord Stock** : Graphiques Recharts (AreaChart pour l'évolution, PieChart pour la répartition), cartes KPI avec icônes Lucide.
* **Formulaire de Mouvement** : Sélection du type, du lot, saisie des quantités, et champ d'observation. Validation stricte côté client avant soumission.

---

## 16. Mode hors ligne
Pour les magasiniers travaillant dans des zones sans couverture réseau (ex: au fond de l'entrepôt) :
* Utilisation d'un PWA (Progressive Web App) ou stockage LocalStorage/IndexedDB.
* L'utilisateur peut saisir des mouvements ou des comptages d'inventaire.
* Les données sont stockées dans une file d'attente locale (`pending_sync`).
* Dès qu'une connexion est détectée (évènement `online`), une synchronisation en arrière-plan est déclenchée vers l'API.
* Gestion des conflits : Si le lot a déjà été modifié entre temps, une alerte est levée pour résolution manuelle par le superviseur.

---

## 17. Sécurité
* **Audit et Traçabilité** : Chaque mouvement est signé avec l'`UtilisateurId` et l'horodatage.
* **Immutabilité** : L'API ne possède aucune route `DELETE` pour les mouvements de stock. Les corrections doivent se faire via de nouveaux mouvements d'ajustement.
* **Validation des transactions** : L'utilisation de transactions SQL (Prisma `$transaction`) est obligatoire pour garantir que la mise à jour du poids de l'emplacement et la création du mouvement se font de manière atomique.
* **Autorisations** : Utilisation de Guards NestJS (`@Roles`) pour empêcher la création de mouvements ou d'inventaires par des utilisateurs non autorisés.

---

## 18. Tests
* **Tests Unitaires** : Tester les calculs de valeur du stock (CMUP), les validations de limites (ex: interdiction d'une sortie > stock actuel).
* **Tests d'Intégration** : Tester la création d'un mouvement avec transaction (vérifier que l'emplacement, le lot et la table des mouvements sont bien mis à jour ensemble).
* **Tests de Concurrence** : Simuler deux utilisateurs essayant de sortir le même lot simultanément pour vérifier le verrouillage de la base de données.
* **Tests E2E** : Dérouler un scénario complet : Achat -> Entrée en stock -> Transfert inter-magasin -> Réservation -> Sortie (Export).
