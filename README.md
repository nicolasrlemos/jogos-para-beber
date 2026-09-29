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

## Deploy

Cada push na `main` roda testes, build e publica no GitHub Pages
(`.github/workflows/deploy.yml`): https://nicolasrlemos.github.io/jogos-para-beber/

## Adicionar um jogo

Crie `src/games/<id>/` com a lógica pura (testada em `tests/`) e um `view.ts`
que exporte a função de montagem (ex.: `mountSueca(root, config, ctx)`). Depois
adicione uma entrada `GameDef` em `src/games/registry.ts` com `id`, `name`,
`description`, `limits(deckCount)` e `mount(root, config, ctx)`.

O `vite.config.ts` usa `base: './'`, então o `dist/` funciona a partir de
qualquer subpasta.

Beba com responsabilidade.
