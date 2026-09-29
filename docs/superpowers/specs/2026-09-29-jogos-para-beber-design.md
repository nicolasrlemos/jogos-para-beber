# Jogos para Beber — Design

Data: 2026-09-29

## Objetivo

Jogo de navegador com baralho comum, que agrega vários jogos de bebida jogados em roda.
Começa com dois jogos: **Suéca Alcoólico** e **Preto ou Vermelho**. A arquitetura deve
permitir adicionar novos jogos criando uma pasta em `src/games/` e registrando-a.

## Decisões

- **Um aparelho só**, no centro da roda (hot-seat). Sem servidor, sem multiplayer em rede.
- **Stack:** Vite + TypeScript, sem framework de UI. Testes com Vitest.
- Site estático (`npm run build` → `dist/`), mobile-first, botões grandes.
- Cartas desenhadas em HTML/CSS (sem imagens externas), com animação de virar.
- Opção de **1 ou 2 baralhos** (52 ou 104 cartas).
- O app **não** faz placar nem tela de distribuição de goles: apenas informa quem bebe
  ou distribui e quantos goles.
- Estado só em memória; recarregar a página reinicia.

## Estrutura

```
jogos-para-beber/
├── index.html
├── src/
│   ├── main.ts                 # bootstrap + navegação entre telas
│   ├── core/
│   │   ├── cards.ts            # tipos Card/Suit/Rank, createDeck(nDecks), shuffle(cards, rng)
│   │   ├── deck.ts             # pilha de compra: draw(), remaining
│   │   └── players.ts          # lista de jogadores, próximo jogador (horário, com wrap)
│   ├── games/
│   │   ├── registry.ts         # jogos disponíveis: id, nome, descrição, limites, start()
│   │   ├── sueca/
│   │   │   ├── rules.ts        # tabela Rank → { título, texto }
│   │   │   ├── sueca.ts        # estado e ações puras
│   │   │   └── view.ts         # tela
│   │   └── preto-vermelho/
│   │       ├── logic.ts        # avaliação de palpites (rodadas 1–4), goles
│   │       ├── ceu-inferno.ts  # montagem da pirâmide, ordem de virada, correspondências
│   │       ├── game.ts         # máquina de estados (rodada, jogador, fase)
│   │       └── view.ts         # tela
│   ├── ui/
│   │   ├── card.ts             # componente de carta (frente/verso, flip)
│   │   └── setup.ts            # cadastro de jogadores + escolha de baralhos
│   └── styles.css
└── tests/
```

**Princípios**

- `core/` e a lógica dos jogos são puras (estado + ação → novo estado), sem DOM.
- `view.ts` apenas lê o estado e renderiza; eventos de clique chamam ações.
- Aleatoriedade injetável (`rng: () => number`, padrão `Math.random`) para testes
  determinísticos.
- Valores: Ás = 1, 2–10, Valete = 11, Dama = 12, Rei = 13.
- Cores: preto = ♠ ♣; vermelho = ♥ ♦.

## Telas

Menu (escolher jogo) → Cadastro → Jogo → Fim ("Jogar de novo" / "Menu").

### Cadastro

- Adicionar, remover e reordenar nomes. A ordem da lista é o sentido horário.
- Escolha de 1 ou 2 baralhos.
- Validação: nomes não vazios, sem nomes repetidos, número de jogadores dentro
  do limite do jogo. Mensagem de erro mostra o limite (ex.: "máx. 10 com 1 baralho — use 2 baralhos").
- O primeiro da lista começa.

## Jogo 1 — Suéca Alcoólico

### Fluxo

1. Tela mostra "Vez de: {nome}" e o monte virado com o número de cartas restantes.
2. O jogador toca no monte; a carta vira e aparecem título e texto da regra.
3. Botão "Próximo" passa para o próximo jogador (sempre horário).
4. Quando o monte acaba: tela "Fim do baralho".

O app não guarda estado de regras (banheiro, búfalo, regras criadas): apenas exibe a carta e a regra.

### Limites

Mínimo 2 jogadores; sem máximo.

### Regras (conteúdo de `rules.ts`, editável)

| Carta | Título | Texto |
|---|---|---|
| A | Escolha 1 | Escolha 1 pessoa para beber. |
| 2 | Escolha 2 | Escolha 2 pessoas para beber. |
| 3 | Escolha 3 | Escolha 3 pessoas para beber. |
| 4 | Banheiro | Guarde esta carta: use-a para ir ao banheiro sem perder a vez. |
| 5 | Eu Nunca | Comece uma rodada de "Eu Nunca". |
| 6 | Búfalo Bill | Você é o Búfalo Bill: só pode beber levantando o braço do jeito combinado. Se esquecer, bebe de novo. |
| 7 | Continência | A qualquer momento, faça continência. O último a imitar bebe 1 gole. |
| 8 | Regra Nova | Crie uma regra que vale até o fim da partida. |
| 9 | Quebra-Regra | Anule uma regra criada anteriormente. |
| 10 | Mulheres | Todas as mulheres bebem. |
| J | Homens | Todos os homens bebem. |
| Q | Dama | Quem tirou bebe. |
| K | Rei | Todos bebem juntos. |

## Jogo 2 — Preto ou Vermelho

### Limites

2 a 10 jogadores com 1 baralho; 2 a 23 com 2 baralhos
(cada jogador usa 4 cartas; a pirâmide usa 9: `4n + 9 ≤ 52 × nBaralhos`).

### Rodadas 1–4

Em cada rodada, todos os jogadores jogam uma vez, em ordem. A rodada N vale N goles.

1. Tela mostra "Rodada N · {nome da rodada} · vale N goles", "Vez de: {nome}" e as cartas já recebidas pelo jogador.
2. O jogador escolhe o palpite; os botões são desativados após o toque.
3. A carta vira. Resultado: "✅ Acertou! Distribua N goles" ou "❌ Errou! Beba N goles".
4. A carta vai para a mão do jogador. Botão "Próximo". Depois do último jogador, começa a próxima rodada.

| Rodada | Palpite | Acerta quando |
|---|---|---|
| 1 | Preto / Vermelho | a cor da carta corresponde |
| 2 | Maior / Menor | valor estritamente maior / menor que a carta da rodada 1. **Empate = erro.** |
| 3 | Dentro / Fora | sejam `a ≤ b` os valores das cartas 1 e 2. Dentro: `a < v < b`. Fora: `v < a` ou `v > b`. **`v = a` ou `v = b` = erro** nos dois palpites. Se `a = b`, "dentro" nunca acerta. |
| 4 | ♠ ♥ ♦ ♣ | o naipe corresponde |

### Rodada 5 — Céu e Inferno

1. Monta-se a pirâmide com 9 cartas viradas: Céu 1–4, Terra, Inferno 1–4. A tela mostra a mão de cada jogador.
2. Botão "Virar próxima" segue a ordem:
   Céu 1 → Inferno 1 → Céu 2 → Inferno 2 → Céu 3 → Inferno 3 → Céu 4 → Inferno 4 → Terra.
3. A cada carta virada, o app lista quem tem uma carta de **mesmo valor** (naipe não importa).
   Cada carta correspondente na mão conta uma vez (quem tem dois 7 conta 2×):
   - **Céu N:** "{nome} tem {valor} → distribua N×k goles"
   - **Inferno N:** "{nome} tem {valor} → beba N×k goles"
   - **Terra:** "{nome} tem {valor} → beba 5×k e distribua 5×k goles"
   - Ninguém: "Ninguém tem — sorte!"
   (k = quantidade de cartas desse valor na mão do jogador)
4. Depois da Terra: tela de Fim.

## Tratamento de erros

- Comprar de monte vazio lança erro na lógica (não deve ocorrer pelos limites de jogadores).
- Botões de ação desativados após o toque para evitar duplo toque.
- Sair durante a partida pede confirmação.

## Testes (Vitest)

- `cards`: 52 cartas únicas com 1 baralho, 104 com 2; `shuffle` preserva o multiconjunto.
- `deck`: `draw` reduz o monte; monte vazio lança erro.
- `players`: próximo jogador com wrap.
- `sueca`: regra para todos os 13 valores; 7 é Continência; fim quando o monte acaba.
- `preto-vermelho`: cor certa/errada; maior/menor/empate; dentro/fora incluindo valor igual e
  cartas iguais; naipe; goles = número da rodada; ordem da pirâmide; múltiplos jogadores com o
  mesmo valor; mesmo jogador com duas cartas (2×); Terra (5 + 5); transição entre rodadas e
  para a fase Céu/Inferno.

## Fora de escopo

Multiplayer em vários aparelhos, placar/distribuição de goles, sons, persistência de partida, deploy.
