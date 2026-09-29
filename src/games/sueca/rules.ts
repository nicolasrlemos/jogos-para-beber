import type { Rank } from "../../core/cards";

export interface SuecaRule {
    readonly title: string;
    readonly text: string;
}

export const SUECA_RULES: Record<Rank, SuecaRule> = {
    1: { title: "Escolha 1", text: "Escolha 1 pessoa para beber." },
    2: { title: "Escolha 2", text: "Escolha 2 pessoas para beber." },
    3: { title: "Escolha 3", text: "Escolha 3 pessoas para beber." },
    4: {
        title: "Banheiro",
        text: "Guarde esta carta: use-a para ir ao banheiro sem perder a vez.",
    },
    5: { title: "Eu Nunca", text: 'Comece uma rodada de "Eu Nunca".' },
    6: {
        title: "Búfalo Bill",
        text: 'Quem rir falando "Buffalo Bill" bebe 1 gole.',
    },
    7: {
        title: "Continência",
        text: "A qualquer momento, faça continência. O último a imitar bebe 1 gole.",
    },
    8: {
        title: "Regra Nova",
        text: "Crie uma regra que vale até o fim da partida.",
    },
    9: { title: "Quebra-Regra", text: "Anule uma regra criada anteriormente." },
    10: { title: "Azar", text: "Quem tirou bebe." },
    11: { title: "Mulheres", text: "Todas as mulheres bebem." },
    12: { title: "Homens", text: "Todos os homens bebem." },
    13: { title: "Rei", text: "Todos bebem juntos." },
};
