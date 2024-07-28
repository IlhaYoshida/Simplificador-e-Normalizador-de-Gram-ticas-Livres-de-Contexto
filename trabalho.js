class Gramatica {
    constructor() {
        this.producoes = {};
        this.variaveis = new Set();
    }

    adicionarProducao(variavel, producao) {
        if (!this.producoes[variavel]) {
            this.producoes[variavel] = [];
        }
        this.producoes[variavel].push(producao);
        this.variaveis.add(variavel);
    }

    removeSimbolosInuteis() {
        const alcancavel = this.getSimbolosAlcancaveis();
        const util = this.getSimbolosUteis(alcancavel);

        Object.keys(this.producoes).forEach(variavel => {
            if (!util.has(variavel)) {
                delete this.producoes[variavel];
            } else {
                this.producoes[variavel] = this.producoes[variavel].filter(prod => {
                    return prod.split('').every(char => util.has(char));
                });
            }
        });
    }

    getSimbolosAlcancaveis() {
        const alcancavel = new Set();
        const fila = ['S'];

        while (fila.length) {
            const atual = fila.shift();
            if (!alcancavel.has(atual)) {
                alcancavel.add(atual);
                if (this.producoes[atual]) {
                    this.producoes[atual].forEach(prod => {
                        prod.split('').forEach(char => {
                            if (this.variaveis.has(char) && !alcancavel.has(char)) {
                                fila.push(char);
                            }
                        });
                    });
                }
            }
        }

        return alcancavel;
    }

    getSimbolosUteis(alcancavel) {
        const util = new Set();

        Object.keys(this.producoes).forEach(variavel => {
            if (alcancavel.has(variavel)) {
                this.producoes[variavel].forEach(prod => {
                    prod.split('').forEach(char => {
                        if (alcancavel.has(char)) {
                            util.add(variavel);
                        }
                    });
                });
            }
        });

        return util;
    }

    removeProducoesVazias() {
        const removivel = this.getVariavelRemovivel();

        Object.keys(this.producoes).forEach(variavel => {
            this.producoes[variavel] = this.producoes[variavel].flatMap(prod => {
                let result = [''];
                for (const char of prod) {
                    const temp = [];
                    for (const res of result) {
                        if (char === variavel && removivel.has(variavel)) {
                            temp.push(res + '');
                        } else {
                            temp.push(res + char);
                        }
                    }
                    result = temp;
                }
                return result;
            }).filter(prod => prod.length > 0);
        });
    }

    getVariavelRemovivel() {
        const removivel = new Set();

        Object.keys(this.producoes).forEach(variavel => {
            this.producoes[variavel].forEach(prod => {
                if (prod === '') {
                    removivel.add(variavel);
                }
            });
        });

        let newRemovivel;
        do {
            newRemovivel = new Set(removivel);
            Object.keys(this.producoes).forEach(variavel => {
                this.producoes[variavel].forEach(prod => {
                    if (prod.split('').every(char => removivel.has(char))) {
                        newRemovivel.add(variavel);
                    }
                });
            });
            removivel.clear();
            removivel.add(...newRemovivel);
        } while (newRemovivel.size > removivel.size);

        return removivel;
    }


    removeProducoesUnitarias() {
        const producoesUnitarias = this.getProducoesUnitarias();

        Object.keys(producoesUnitarias).forEach(variavel => {
            producoesUnitarias[variavel].forEach(unit => {
                if (this.producoes[unit]) {
                    this.producoes[variavel] = this.producoes[variavel].concat(this.producoes[unit]);
                }
            });
        });

        Object.keys(producoesUnitarias).forEach(variavel => {
            delete this.producoes[variavel];
        });
    }

    getProducoesUnitarias() {
        const producoesUnitarias = {};
        Object.keys(this.producoes).forEach(variavel => {
            producoesUnitarias[variavel] = this.producoes[variavel].filter(prod => prod.length === 1 && this.variaveis.has(prod));
        });
        return producoesUnitarias;
    }

    fatoracaoAEsquerda() {
        Object.keys(this.producoes).forEach(variavel => {
            const grouped = this.agruparPorPrefixo(variavel);
            Object.keys(grouped).forEach(prefix => {
                if (grouped[prefix].length > 1) {
                    const novaVariavel = variavel + "'";
                    this.variaveis.add(novaVariavel);
                    this.producoes[novaVariavel] = grouped[prefix].map(prod => prod.slice(prefix.length));
                    this.producoes[variavel] = [prefix + novaVariavel];
                }
            });
        });
    }

    agruparPorPrefixo(variavel) {
        const prefixos = {};
        this.producoes[variavel].forEach(prod => {
            let prefixo = '';
            for (let i = 0; i < prod.length; i++) {
                prefixo += prod[i];
                if (!prefixos[prefixo]) {
                    prefixos[prefixo] = [];
                }
                if (i === prod.length - 1 || !this.producoes[variavel].some(p => p.startsWith(prefixo))) {
                    prefixos[prefixo].push(prod);
                }
            }
        });
        return prefixos;
    }

    removeRecursaoAEsquerda() {
        Object.keys(this.producoes).forEach(variavel => {
            const producoes = this.producoes[variavel];
            const recursiva = producoes.filter(prod => prod.startsWith(variavel));
            const naoRecursiva = producoes.filter(prod => !prod.startsWith(variavel));

            if (recursiva.length > 0) {
                const novaVariavel = variavel + "'";
                this.variaveis.add(novaVariavel);
                this.producoes[novaVariavel] = recursiva.map(prod => prod.slice(variavel.length)).concat([novaVariavel + novaVariavel]);
                this.producoes[variavel] = naoRecursiva.concat([variavel + novaVariavel]);
            }
        });
    }

    display() {
        Object.keys(this.producoes).forEach(variavel => {
            console.log(`${variavel} -> ${this.producoes[variavel].join(' | ')}`);
        });
    }
}

const gramatica = new Gramatica();
gramatica.adicionarProducao('S', 'aAa');
gramatica.adicionarProducao('S', 'bBv');
gramatica.adicionarProducao('A', 'a');
gramatica.adicionarProducao('A', 'aA');

console.log("Gramática Original:");
gramatica.display();

gramatica.removeSimbolosInuteis();
gramatica.removeProducoesVazias();
gramatica.removeProducoesUnitarias();
gramatica.fatoracaoAEsquerda();
gramatica.removeRecursaoAEsquerda();

console.log("\nGramática Normalizada:");
gramatica.display();
