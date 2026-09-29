# Jogos para Beber

Jogos de baralho para beber em roda, num aparelho só no centro da mesa.

- **Suéca Alcoólico** — cada carta tem uma regra.
- **Preto ou Vermelho** — 4 rodadas de palpites e o Céu e Inferno.

## Rodar

    npm install
    npm run dev

## Testes e build

    npm test
    npm run build   # gera dist/ estático

## Adicionar um jogo

Crie `src/games/<id>/` com a lógica pura (testada em `tests/`) e um `view.ts`
exportando `mount(root, config, ctx)`, e registre em `src/games/registry.ts`.

Beba com responsabilidade.
