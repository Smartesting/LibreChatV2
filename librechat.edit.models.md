# Ajouter ou modifier un modèle

Un modèle se déclare à **deux endroits** de `librechat.yaml` :

| Bloc | Rôle | Si le modèle n'y est pas |
| --- | --- | --- |
| `endpoints.custom[].models.default` | Autorise le modèle côté serveur | Erreur `Illegal model request` |
| `modelSpecs.list` | L'affiche dans le sélecteur | Le modèle n'apparaît pas |

## Ajouter un modèle

Récupérer l'identifiant exact sur [openrouter.ai/models](https://openrouter.ai/models), puis :

**1. L'autoriser** dans `endpoints.custom[].models.default` :

```yaml
- "anthropic/claude-opus-5.5"
```

**2. L'afficher** dans `modelSpecs.list` :

```yaml
- name: "openrouter-claude-opus-5-5"     # identifiant unique
  label: "Claude Opus 5.5"               # nom affiché
  iconURL: "/assets/anthropic.svg"       # fichier de client/public/assets
  group: "Anthropic"                     # groupe du sélecteur
  preset:
    endpoint: "OpenRouter"               # = name de l'endpoint
    model: "anthropic/claude-opus-5.5"   # = valeur de models.default
    modelLabel: "Claude Opus 5.5"        # nom affiché dans la conversation
```

Pour créer un groupe, indiquer un nouveau `group` et ajouter `groupIcon` sur son premier modèle.

## Modifier un modèle

| Changement | À modifier |
| --- | --- |
| Nom affiché | `label` et `preset.modelLabel` |
| Version du modèle | `models.default` et `preset.model` (mêmes valeurs) |
| Groupe ou icône | `group`, `groupIcon`, `iconURL` |
| Modèle par défaut | `default: true` sur le modèle choisi |

## Retirer un modèle

Supprimer ses deux déclarations. S'il est utilisé comme `titleModel`, en choisir un autre.
