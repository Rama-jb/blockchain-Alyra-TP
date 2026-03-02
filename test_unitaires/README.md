## Tests unitaires du contrat Voting

Une nouvelle suite de tests en TypeScript (`test/Voting.ts`) exerce le smart contract `Voting.sol`. Elle couvre le flux principal 
montrant comment vérifier les événements, les raisons de revert, les erreurs personnalisées et les changements d'état.

Points clés du fichier de tests :

1. **Fixtures** – `deployVoting` et d'autres helpers utilisent `networkHelpers.loadFixture` afin que chaque
   scénario démarre à partir d'un snapshot propre.
2. **Vérifications d'initialisation** – enregistrement du propriétaire à la construction et statut de workflow par défaut.
3. **Contrôle des rôles** – seul le propriétaire peut enregistrer des votants ou changer les états du workflow ; les non‑propriétaires
   déclenchent l'erreur personnalisée `OwnableUnauthorizedAccount` d'OpenZeppelin.
4. **Flux de vote** – progression à travers l'enregistrement des propositions, l'ajout de propositions, l'ouverture/fermeture du vote,
   le dépôt des votes et le comptage des résultats ; les tests vérifient les événements émis et les données on‑chain.
5. **Cas négatifs** – effectuer des opérations dans le mauvais ordre, duplications d'enregistrement/vote, propositions vides,
   identifiants de proposition invalides et appels non autorisés entraînent tous les reverts attendus.

Lancer la suite avec :

```shell
npx hardhat test
```

