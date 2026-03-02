# Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.



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

