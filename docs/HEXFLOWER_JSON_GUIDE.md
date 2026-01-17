# Guia Técnico: JSON do Hex Flower Engine

Este documento detalha o formato JSON para importação de Hexflowers no Foundry VTT.
Este guia foi revisado tecnicamente para garantir compatibilidade com a versão atual do módulo.

## Resumo dos Campos

| Campo             | Obrigatório? | Default (se omitido) | Observações                                               |
| :---------------- | :----------- | :------------------- | :-------------------------------------------------------- |
| `cells`           | **Sim**      | -                    | Lista de hexágonos. Se vazio, o grid não existe.          |
| `name`            | Não          | "New Hex Flower"     | Nome exibido no navegador e gerenciador.                  |
| `version`         | Não          | -                    | Metadado. Não afeta o funcionamento.                      |
| `edgeBehavior`    | Não          | "stop"               | Define o que acontece nas bordas.                         |
| `navigationRules` | Não          | "Stay" (Ficar)       | Se vazio, o token não se moverá automaticamente ao rolar. |
| `activeHex`       | Não          | `{q:0,r:0,s:0}`      | Posição inicial do grupo.                                 |
| `partyActorId`    | Não          | -                    | ID do ator (Foundry ID) usado para o ícone do grupo.      |

## Detalhamento Técnico

### 1. Comportamento de Borda (`edgeBehavior`)

Valores suportados pela logic engine (`Navigator.js`):

- `"stop"` (Padrão): O movimento é bloqueado.
- `"wrap"`: Teleporta para o hexágono antipodal (oposto simétrico).
  - _Nota_: Requer simetria no grid para funcionar perfeitamente.
- `"reflect"`: "Bate e volta" na direção oposta.
- `"rotateCW"`: Rotaciona 60° sentido horário em torno do centro (0,0).
- `"rotateCCW"`: Rotaciona 60° sentido anti-horário em torno do centro (0,0).

> **Atenção**: O valor `"loop"` consta em esquemas antigos mas **não** é processado pelo motor de navegação atual (comportar-se-á como `stop` ou falhará). Prefira `wrap` ou `rotateCW`.

### 2. Regras de Navegação (`navigationRules`)

Lista de gatilhos baseados em rolagem (geralmente 2d6).

| Propriedade | Tipo   | Descrição             |
| :---------- | :----- | :-------------------- |
| `min`       | Int    | Valor mínimo do dado. |
| `max`       | Int    | Valor máximo do dado. |
| `dir`       | String | Direção do movimento. |

**Direções Suportadas:**

- `N` (Norte)
- `NE` (Nordeste)
- `SE` (Sudeste)
- `S` (Sul)
- `SW` (Sudoeste)
- `NW` (Noroeste)
- `SAME` (Ficar no mesmo hexágono)

### 3. Células (`cells`)

Cada objeto célula aceita propriedades livres, mas as seguintes são processadas pela UI:

| Propriedade       | Uso Técnico                                                                                          |
| :---------------- | :--------------------------------------------------------------------------------------------------- |
| `coord`           | **CRÍTICO**. Objeto `{q, r, s}`. O sistema usa logica Axial (`q`, `r`). `s` é calculado como `-q-r`. |
| `title` ou `name` | Título principal no painel de detalhes.                                                              |
| `description`     | Texto descritivo (HTML permitido em alguns contextos).                                               |
| `bioma`           | Exibido como "Type" no painel. Útil para categorização.                                              |
| `emoji`           | Renderizado no centro do hexágono no SVG.                                                            |
| `color`           | Cor de fundo (`#RRGGBB`).                                                                            |
| `tags`            | Lista de strings (ex: `["danger", "cold"]`). Exibido como tags no painel.                            |
| `properties`      | Objeto JSON livre (ex: `{ "difficulty": 5 }`). Exibido como lista de propriedades.                   |

> **Campos Extras**: Quaisquer outros campos não listados aqui são preservados no JSON e acessíveis via scripts, mas ignorados pela UI padrão.

### 4. Coordenadas (`coord`) e Orientação

O sistema utiliza coordenadas cúbicas padrão.
**Teste de Orientação (Grid 7-Hex):**

- Centro: `{ q: 0, r: 0, s: 0 }`
- Norte (N): `{ q: 0, r: -1, s: 1 }`
- Sul (S): `{ q: 0, r: 1, s: -1 }`
- Nordeste (NE): `{ q: 1, r: -1, s: 0 }`

---

## Exemplos

### Exemplo Mínimo (Funcional)

```json
{
  "name": "Grid Mínimo",
  "cells": [{ "coord": { "q": 0, "r": 0, "s": 0 }, "title": "Centro" }]
}
```

### Exemplo Completo (Reference)

```json
{
  "name": "Floresta Assombrada",
  "version": "1.0",
  "edgeBehavior": "wrap",
  "partyActorId": "H4s8Jsh38s",
  "activeHex": { "q": 0, "r": 0, "s": 0 },
  "navigationRules": [
    { "min": 2, "max": 3, "dir": "SW" },
    { "min": 4, "max": 5, "dir": "S" },
    { "min": 6, "max": 8, "dir": "SAME" },
    { "min": 9, "max": 10, "dir": "N" },
    { "min": 11, "max": 12, "dir": "NE" }
  ],
  "cells": [
    {
      "coord": { "q": 0, "r": 0, "s": 0 },
      "title": "Clareira Segura",
      "description": "Luz do sol penetra aqui.",
      "bioma": "Safe",
      "color": "#90EE90",
      "emoji": "🌳",
      "tags": ["seguro", "dia"],
      "properties": { "healRate": 1 }
    },
    {
      "coord": { "q": 0, "r": -1, "s": 1 },
      "title": "Norte Escuro",
      "description": "Árvores retorcidas.",
      "bioma": "Dark",
      "color": "#2F4F4F",
      "emoji": "💀"
    }
  ]
}
```
