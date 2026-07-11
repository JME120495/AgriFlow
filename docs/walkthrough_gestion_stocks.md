# Walkthrough — Module 10 : Gestion des Stocks

Ce walkthrough présente l'implémentation et la validation de la **Gestion des Stocks** dans AgriFlow.

---

## 1. Modélisation de base de données (Prisma)
- Ajout des enums `LotStatus` (`DISPONIBLE`, `RESERVE`, `EXPEDIE`, `BLOQUE`) et `ReservationStatus` (`ACTIVE`, `ANNULEE`, `TERMINEE`).
- Création du modèle `Lot` contenant toutes les propriétés physiques et financières (poids initial/actuel, sacs, valeur d'achat et actuelle).
- Création du modèle `Reservation` pour lier les lots réservés pour les ventes ou exports.
- Mise à jour de `DetailedStockMovement` pour intégrer des liaisons optionnelles aux lots.
- Mise à jour de `StorageLocation` pour intégrer la relation avec les lots.
- Toutes les modifications ont été appliquées avec succès via `npx prisma db push`.

---

## 2. Développement Backend (NestJS)
- **DTOs** : Validation des types et valeurs lors de la création de lot, de réservation et de mouvement.
- **Service** (`StocksService`) :
  - Création et gestion des lots avec génération de numéro automatique (`LOT-YYYYMM-XXXX`).
  - Réservation de lots avec transaction Prisma.
  - Journalisation de mouvements de stock reliés à un lot (Entrée, Sortie, Transfert) avec mise à jour automatique des quantités en stock de l'emplacement et du statut du lot.
  - Calcul de valorisation en temps réel (CMUP comptable global et par magasin, campagne, qualité).
- **Contrôleur** (`StocksController`) :
  - Exposition de 7 routes REST avec gardes et rôles utilisateur (`JwtAuthGuard`, `RolesGuard`).
- **Module** (`StocksModule`) : Enregistré et lié dans `app.module.ts`.
- **Tests** : 8/8 tests unitaires passés avec succès (`npx jest --testPathPatterns=stocks`).

---

## 3. Développement Frontend (React)
- **StocksDashboard.jsx** : Tableau de bord complet de valorisation comptable avec Recharts (répartition par qualité en camembert, stock par magasin en diagramme à barres) et suivi des alertes critiques (lots bloqués, stock bas).
- **LotsList.jsx** : Liste générale de tous les lots de cacao filtrable (statut, qualité, campagne) avec barre de recherche en temps réel.
- **LotDetail.jsx** : Fiche d'un lot montrant ses caractéristiques, sa localisation précise dans l'entrepôt, l'historique complet de ses mouvements physiques et formulaires d'action (réservation, transfert, expédition).
- **Routes & Navigation** : Enregistrement des routes dans `App.jsx` et lien direct inséré dans la barre de navigation du `Dashboard.jsx`.

---

## 4. Vérification et Peuplement (Seed)
- Version courte du script de seeding exécutée avec succès (`npx prisma db seed`).
- Données insérées pour 4 lots de cacao distincts :
  - `LOT-2026-07-001` (GRADE_1, disponible, 4 500 kg, valeur 6 750 000 FCFA)
  - `LOT-2026-07-002` (GRADE_2, disponible, 3 000 kg, valeur 4 425 000 FCFA)
  - `LOT-2026-07-003` (GRADE_1, réservé, 3 200 kg, valeur 4 800 000 FCFA)
  - `LOT-2026-07-004` (GRADE_2, bloqué, 1 200 kg, valeur 1 770 000 FCFA)
- Réservation de 3 200 kg créée pour le lot 3 par le magasinier.
- Compilation et démarrage du serveur réussis sur le port 3000.
