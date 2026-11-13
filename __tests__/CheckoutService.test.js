import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

const CARTAO = { numero: '4111111111111111', validade: '12/30', cvv: '123' };
const ASSUNTO_APROVADO = 'Seu Pedido foi Aprovado!';

/**
 * Glossário de Test Doubles usados nesta suíte (Meszaros, xUnit Test Patterns):
 *  - Dummy: passado apenas para satisfazer o construtor; não deve ser usado.
 *  - Stub : fornece respostas pré-definidas para controlar o fluxo do SUT
 *           -> a asserção recai sobre o ESTADO/RESULTADO (State Verification).
 *  - Mock : a própria asserção recai sobre as INTERAÇÕES que ele recebeu
 *           -> Verificação de Comportamento (Behavior Verification).
 */
describe('CheckoutService', () => {
    describe('quando o pagamento falha', () => {
        let carrinho;
        let gatewayStub;

        beforeEach(() => {
            // Arrange (comum aos cenários de falha)
            carrinho = new CarrinhoBuilder().build();
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };
        });

        it('deve retornar null (verificação de estado com Stub)', async () => {
            // Arrange: Repository e EmailService são Dummies — só preenchem o construtor.
            const repositoryDummy = {};
            const emailDummy = {};
            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(pedido).toBeNull();
        });

        it('não deve salvar o pedido nem enviar e-mail (verificação de comportamento com Mocks)', async () => {
            // Arrange: aqui queremos verificar a AUSÊNCIA de interações, então usamos Mocks.
            const repositoryMock = { salvar: jest.fn() };
            const emailMock = { enviarEmail: jest.fn() };
            const checkoutService = new CheckoutService(gatewayStub, repositoryMock, emailMock);

            // Act
            await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(repositoryMock.salvar).not.toHaveBeenCalled();
            expect(emailMock.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Padrão finaliza a compra', () => {
        it('deve retornar o pedido salvo com o totalFinal sem desconto (verificação de estado com Stubs)', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPadrao())
                .comItens([new Item('Livro', 50), new Item('Caneta', 25)])
                .build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockImplementation(async (pedido) => ({ ...pedido, id: 'PED-001' })),
            };
            const emailDummy = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(pedido).toEqual(expect.objectContaining({
                id: 'PED-001',
                totalFinal: 75,
                status: 'PROCESSADO',
            }));
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        let usuarioPremium;
        let gatewayStub;
        let repositoryStub;
        let emailMock;
        let pedido;

        beforeEach(async () => {
            // Arrange
            usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Fone de Ouvido', 150), new Item('Capa', 50)]) // R$ 200,00
                .build();
            gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            repositoryStub = {
                salvar: jest.fn().mockImplementation(async (p) => ({ ...p, id: 'PED-123' })),
            };
            emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            pedido = await checkoutService.processarPedido(carrinho, CARTAO);
        });

        it('deve cobrar no gateway o valor com 10% de desconto (R$ 180,00)', () => {
            // Assert
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, CARTAO);
        });

        it('deve enviar exatamente 1 e-mail de confirmação ao cliente (verificação de comportamento com Mock)', () => {
            // Assert
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                ASSUNTO_APROVADO,
                'Pedido PED-123 no valor de R$180',
            );
        });

        it('deve retornar o pedido salvo com o totalFinal descontado', () => {
            // Assert
            expect(pedido.id).toBe('PED-123');
            expect(pedido.totalFinal).toBe(180);
        });
    });

    describe('quando o envio de e-mail falha', () => {
        let consoleErrorSpy;

        beforeEach(() => {
            // Silencia o log esperado do SUT para não poluir a saída dos testes.
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('não deve falhar o checkout e deve retornar o pedido salvo', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();
            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockImplementation(async (p) => ({ ...p, id: 'PED-999' })),
            };
            const emailStub = { enviarEmail: jest.fn().mockRejectedValue(new Error('SMTP indisponível')) };
            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailStub);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, CARTAO);

            // Assert
            expect(pedido).toEqual(expect.objectContaining({ id: 'PED-999', status: 'PROCESSADO' }));
        });
    });
});
