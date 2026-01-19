# Guia Técnico: JSON do Hex Flower Engine (v2)

Este documento detalha o formato JSON para importação de Hexflowers no Foundry VTT, incluindo as funcionalidades avançadas para minigames.

## 1. Estrutura Principal

### 1.1 Campos Principais

| Campo | Obrigatório? | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `cells` | **Sim** | - | Lista de hexágonos. Se vazio, o grid não existe. |
| `name` | Não | "New Hex Flower" | Nome exibido no navegador e gerenciador. |
| `version` | Não | - | Metadado. Não afeta o funcionamento. |
| `edgeBehavior` | Não | "stop" | Comportamento nas bordas do grid. |
| `navigationRules` | Não | "Stay" | Regras de navegação padrão. |
| `activeHex` | Não | `{q:0,r:0,s:0}` | Posição inicial do grupo. |
| `partyActorId` | Não | - | ID do ator (Foundry ID) para o ícone do grupo. |
| `tags` | Não | `[]` | Lista de strings para organização. |

### 1.2 Campos Avançados (Minigames)

| Campo | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| `hexClass` | String (Enum) | - | Classe do HFGE (I-VI). Ajuda a UI a oferecer as ferramentas certas. |
| `turn` | Object | - | Contador de turnos para jogos com limite de tempo (Classe VI). |
| `situationalRules` | Array | `[]` | Múltiplos conjuntos de regras de navegação para gameplay dinâmico. |
| `activeRuleSet` | String | - | ID do conjunto de regras situacionais ativo. |
| `gamePoints` | Object | - | Sistema de pontos para dar agência ao jogador. |
| `linkedFlowerId` | String | - | ID de um HF competidor/pareado (Classe IV). |

## 2. Estrutura das Células (`cells`)

### 2.1 Campos Básicos

| Campo | Uso Técnico |
| :--- | :--- |
| `coord` | **CRÍTICO**. Objeto `{q, r, s}`. |
| `title` ou `name` | Título principal no painel de detalhes. |
| `description` | Texto descritivo (HTML permitido). |
| `bioma` | Exibido como "Type" no painel. |
| `emoji` | Renderizado no centro do hexágono. |
| `color` | Cor de fundo (`#RRGGBB`). |
| `properties` | Objeto JSON livre para dados customizados. |

### 2.2 Campos Avançados (Minigames)

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `isTerminal` | Boolean | Se `true`, marca o hex como um evento terminal (fim de jogo). |
| `terminalType` | String | Classifica o resultado do evento terminal (ex: "win", "loss"). |
| `onEnter` | String | ID de uma macro a ser executada ao **entrar** neste hex. |
| `onExit` | String | ID de uma macro a ser executada ao **sair** deste hex. |
| `wildCardJump` | Object | Define uma navegação excepcional a partir deste hex. |
| `customEdgeBehavior` | String (Enum) | Sobrescreve o `edgeBehavior` global apenas para este hex. |

## 3. Detalhamento Técnico

### `turn` (Objeto)
- `current`: (Number) O turno atual do jogo. Começa em 0.
- `limit`: (Number, opcional) O número máximo de turnos. Se `current >= limit`, o jogo termina.

### `situationalRules` (Array)
- Cada item é um objeto com `id`, `name`, `description` e `rules` (uma lista de regras de navegação).
- Permite que o comportamento do NH mude dinamicamente via macros.

### `gamePoints` (Objeto)
- `name`: (String) O nome da "moeda" (ex: "Sorte", "Recursos").
- `current`: (Number) A quantidade atual de pontos.
- `max`: (Number, opcional) O máximo de pontos que podem ser acumulados.

### `wildCardJump` (Objeto)
- `roll`: (Number) O resultado do 2d6 que ativa o salto.
- `targetCoord`: (Object) A coordenada `{q, r, s}` de destino.

## 4. Exemplos

### Exemplo Mínimo (Funcional)

```json
{
  "name": "Grid Mínimo",
  "cells": [{ "coord": { "q": 0, "r": 0, "s": 0 }, "title": "Centro" }]
}
```

### Exemplo Classe II: Volcano Eruption Tracker

Este exemplo demonstra um jogo com um evento terminal e um limite de tempo.

```json
{
  "name": "Volcano Eruption Tracker",
  "hexClass": "II",
  "edgeBehavior": "stop",
  "turn": { "current": 0, "limit": 12 },
  "cells": [
    {
      "coord": { "q": 0, "r": 0, "s": 0 },
      "title": "Calm"
    },
    {
      "coord": { "q": 0, "r": -2, "s": 2 },
      "title": "ERUPTION!",
      "isTerminal": true,
      "terminalType": "loss",
      "onEnter": "VolcanoEruptionMacro"
    }
  ]
}
```

### Exemplo Classe III: Trial by Jury

Este exemplo demonstra um jogo com dois finais, NHs situacionais e game points.

```json
{
  "name": "Trial by Jury",
  "hexClass": "III",
  "activeRuleSet": "innocent",
  "situationalRules": [
    {
      "id": "innocent",
      "name": "PCs are Innocent",
      "rules": [ { "min": 2, "max": 8, "dir": "N" } ]
    },
    {
      "id": "guilty",
      "name": "PCs are Guilty",
      "rules": [ { "min": 2, "max": 8, "dir": "S" } ]
    }
  ],
  "gamePoints": { "name": "Legal Points", "current": 3 },
  "cells": [
    { "coord": { "q": 0, "r": 0, "s": 0 }, "title": "Trial Begins" },
    { "coord": { "q": 0, "r": -2, "s": 2 }, "title": "INNOCENT!", "isTerminal": true, "terminalType": "win" },
    { "coord": { "q": 0, "r": 2, "s": -2 }, "title": "GUILTY!", "isTerminal": true, "terminalType": "loss" }
  ]
}
```
