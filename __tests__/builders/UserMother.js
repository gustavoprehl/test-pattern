import { User } from '../../src/domain/User.js';

/**
 * Object Mother para a entidade User.
 *
 * Usuários são entidades simples e com poucas variações relevantes para os testes
 * (basicamente o "tipo" do cliente). Por isso, um catálogo de instâncias fixas e
 * nomeadas é suficiente: o nome do método já comunica a intenção do cenário.
 *
 * Cada chamada retorna uma NOVA instância, evitando estado compartilhado entre testes
 * (o que causaria o Test Smell "Interacting Tests").
 */
export class UserMother {
    static umUsuarioPadrao() {
        return new User(1, 'Cliente Padrão', 'padrao@email.com', 'PADRAO');
    }

    static umUsuarioPremium() {
        return new User(2, 'Cliente Premium', 'premium@email.com', 'PREMIUM');
    }
}
