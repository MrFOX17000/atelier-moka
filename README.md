# Atelier Moka

Café céramique fictif à Aix-en-Provence, construit avec **Vite, TypeScript vanilla et CSS**. Aucun framework, backend ou service externe n’est nécessaire pour utiliser la page.

## Lancer le projet

Avec Node.js 22.18 ou plus récent (vérifié avec Node.js 24) :

```sh
npm install
npm run dev
```

Vérifications et version de production :

```sh
npm test
npm run build
npm run preview
```

Les tests utilisent le module de test intégré à Node.js et importent directement les fichiers TypeScript. Aucune dépendance de test n’est ajoutée.

## Se repérer dans le code

```text
index.html                 Contenu de la page, sections et formulaires statiques
src/
  main.ts                  Événements et état de la page
  types.ts                 Types communs
  data/
    pieces.ts              Les six pièces du catalogue
    slots.ts               Créneaux et capacité des groupes
  state/
    booking.ts             État initial, sauvegarde et restauration du brouillon
  ui/
    renderPieces.ts        Cartes du catalogue et résultat vide
    renderFilters.ts       Filtres, tri et affichage des filtres
    renderBooking.ts       Les quatre étapes, erreurs et estimation
  utils/
    date.ts                Dates françaises et contrôle des dates
    price.ts               Prix total et format en euros
    validation.ts          Validation des champs et étapes
  style.css                Styles, responsive et focus
tests/
  booking.test.mjs         Tests de la logique de réservation et des filtres
public/images/             Toutes les photos utilisées, stockées localement
```

Le chemin d’une interaction est simple : un événement dans `main.ts` modifie l’état, sauvegarde le brouillon, puis appelle une fonction de rendu. Les objets `booking` et `filters` sont indépendants : filtrer le catalogue ne supprime jamais la pièce choisie.

Les imports TypeScript utilisent l’extension `.ts`, reconnue par Vite et par Node pour les tests. Le compilateur vérifie les types en mode strict.

## Parcours et règles

- Catalogue de six pièces, filtres combinés par difficulté, catégorie et disponibilité, tri par prix et réinitialisation.
- Sélection synchronisée entre le catalogue et l’étape Pièce, avec boutons utilisables au clavier.
- Quatre étapes : Créneau → Pièce → Informations → Récapitulatif. Chaque étape est validée avant de continuer ; on peut revenir en arrière.
- Groupes de 1 à 8 personnes. Les créneaux complets ou trop petits pour le groupe sont désactivés. Augmenter le groupe efface une heure devenue incompatible.
- Les dates doivent exister et être aujourd’hui ou plus tard, selon la date à Paris.
- Prix estimé = prix unitaire de la pièce × participants. La même pièce est estimée pour chaque personne. Peinture, émaillage et cuisson inclus ; boissons en supplément.
- Prénom et email obligatoires, contrôle simple du format email et erreurs près des champs.
- FAQ avec une seule réponse ouverte, menu mobile et animations respectant la préférence de réduction des mouvements.

## Brouillon dans le navigateur

La clé `atelier-moka-booking-v1` contient les participants, l’identifiant de la pièce, la date, l’heure, le prénom et l’email. Le prix et la pièce sont toujours retrouvés dans le catalogue actuel ; un prix enregistré ailleurs ne peut pas remplacer celui du catalogue.

La restauration contrôle le JSON, les types, les limites, la disponibilité, la validité de la date et la capacité du créneau. Un prénom ou email encore incomplet peut être conservé comme brouillon ; il est validé avant le récapitulatif. Si le stockage est bloqué, le formulaire continue de fonctionner et signale que la sauvegarde n’a pas réussi.

« Réinitialiser la réservation » remet l’état initial et supprime cette clé. Le formulaire n’envoie aucune donnée, ne réserve aucune table et ne déclenche aucun paiement. La confirmation valide uniquement le récapitulatif local.

## Visuels et contenu fictif

La planche de présentation existante a guidé la palette crème, terracotta, brun café et sauge. Les photos originales sont conservées ; des versions JPEG allégées sont utilisées par la page. Trois visuels ont été créés avec imagegen : la scène de café, le mug et le cache-pot. Les chemins et prompts sont documentés dans [docs/visuels.md](docs/visuels.md).

Les disponibilités sont des données de démonstration identiques pour chaque date. Les témoignages sont illustratifs, signalés comme tels. Les informations de l’atelier décrivent un concept fictif.

## Vérifications réalisées

- Build TypeScript strict et Vite.
- Tests automatisés des calculs, filtres, validations et du stockage, exécutables avec `npm test`.
- Vérifications dans Chrome : parcours complet sur desktop et mobile, clavier, restauration, données corrompues, stockage bloqué, navigation mobile et FAQ.
- Contrôle du débordement horizontal à 320, 390, 768, 1 024 et 1 440 px ; images locales chargées et absence d’erreurs JavaScript.

