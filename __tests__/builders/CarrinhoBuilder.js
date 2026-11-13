import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder para a entidade Carrinho.
 *
 * O Carrinho combina várias dimensões que variam entre os cenários (usuário, quantidade
 * de itens, valores). Um Object Mother exigiria um método para cada combinação
 * ("explosão de métodos"); o Builder parte de um carrinho padrão VÁLIDO e permite que
 * cada teste sobrescreva apenas o que é relevante para ele, via API fluente.
 *
 * Exemplo:
 *   new CarrinhoBuilder()
 *       .comUser(UserMother.umUsuarioPremium())
 *       .comItens([new Item('Notebook', 200)])
 *       .build();
 */
export class CarrinhoBuilder {
    constructor() {
        // Valores padrão: um carrinho válido com 1 item, pertencente a um cliente padrão.
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Item Padrão', 100)];
    }

    comUser(user) {
        this.user = user;
        return this;
    }

    comItens(itens) {
        this.itens = [...itens];
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        // Copia a lista para que o carrinho construído não compartilhe estado com o builder.
        return new Carrinho(this.user, [...this.itens]);
    }
}
