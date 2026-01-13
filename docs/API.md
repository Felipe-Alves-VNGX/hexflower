# Hex Flower Engine API

O módulo Hex Flower Engine expõe uma API para permitir a criação de macros avançadas e integrações.

## `game.hexFlower`

O objeto principal acessível globalmente.

### Propriedades

- `Manager`: A classe da aplicação de gerenciamento.
- `Navigator`: A classe da aplicação de navegação.
- `engine`: A classe `HexFlowerEngine` contendo a lógica central (static).
- `roll(flowerId, options)`: Método de conveniência para realizar rolagens via macro.

---

## Macros

O módulo vem com duas macros pré-configuradas (na pasta "Hex Flower Engine"):

### 1. Open Hex Navigator

Abre a interface do **Navigator**, usada para jogar.

```javascript
game.hexFlower.openNavigator();
```

### 2. Open Hex Manager

Abre a interface do **Manager**, usada para criar, editar e configurar Hex Flowers.

```javascript
game.hexFlower.openManager();
```

---

## Realizando Rolagens via Macro (API)

Você pode criar uma macro para rolar automaticamente em um Hex Flower específico, sem abrir a interface gráfica. Isso é útil para verificar clima, encontros ou eventos aleatórios rapidamente.

### `game.hexFlower.roll(flowerId, options)`

**Parâmetros:**

- `flowerId` (String, Obrigatório): O ID do Hex Flower. Você pode encontrar o ID inspecionando o objeto `game.user.getFlag("world", "hex_flower_registry")` ou, futuramente, na interface do Manager.
- `options` (Object, Opcional):
  - `forcedTotal` (Number): Força um resultado específico na soma dos dados (2d6). Útil para testes.

**Retorno (Promise):**
Retorna um objeto contendo os detalhes da rolagem:

```javascript
{
    total: 7,               // Soma dos dados
    dir: "SE",             // Direção calculada (N, NE, SE, S, SW, NW, SAME)
    newCoord: {q: 1, r: 0}, // Novas coordenadas
    targetCell: {...},      // Dados da célula de destino (título, descrição, etc)
    note: "(Blocked)"       // Nota sobre comportamento de borda (se houver)
}
```

**Efeitos Colaterais:**

- Move o marcador de "posição atual" no Hex Flower.
- **Registra automaticamente o resultado no "Hex Flower Journal".**

### Exemplo de Macro

```javascript
// Substitua pelo ID do seu Hex Flower
const flowerId = "SEU_FLOWER_ID_AQUI";

// Executa a rolagem
const result = await game.hexFlower.roll(flowerId);

if (result) {
  // Exibe uma mensagem no chat (opcional, pois a engine já pode gerar chat ou log)
  ChatMessage.create({
    content: `<h3>Rolagem Automática</h3><p>Resultado: <strong>${result.total}</strong> -> ${result.targetCell.title}</p>`,
  });
}
```
