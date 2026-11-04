# Atividade 04 — estado da implementação

## Verificação

- Compilação estrita de templates e TypeScript: `ngc` com `strictTemplates` concluída sem erros.
- `ng build` e `ng test`: **não executados** neste ambiente (Node e binários nativos do Angular CLI indisponíveis aqui). Execute `npm install` e `npm run build` localmente antes de entregar.
- Backend ASP.NET Core: **não compilado** (sem SDK .NET). Ver `../backend-patch/LEIA-ME.md`.

## Funcionalidades

1. **Clientes:** CRUD com `PessoaEndereco`, validações (CPF, e-mail, telefone, CEP, datas e obrigatórios) e mensagens por campo.
2. **Funcionários:** vínculo de pessoa cadastrada a `funcionario` via `/api/Funcionario` (GET, POST, PUT, DELETE). A tela não cria pessoa nova; sugere cargos já usados.
3. **Categorias:** CRUD via `Categorium`. Exclusão bloqueada se houver itens.
4. **Produtos e serviços:** uma tela compartilhada (`gestao-itens`), com rota de dados `tipo` (`P` ou `S`). Produtos usam `ProdutoItem`; serviços usam `/api/Servico`. Filtros, ativação e exclusão (exclusão recusada se já houver uso em pedido).
5. **Catálogos:** `catalogo-produtos` e `catalogo-servicos` com busca, filtro por categoria, ordenação e adição ao carrinho. Base comum em `shared/catalogo-base.ts`.
6. **Carrinho:** `CarrinhoService` (signals, persistido em `localStorage`), com controle de estoque e quantidade.
7. **Pedidos:** `POST /api/Pedido` cria o atendimento pendente, grava preços do banco e dá baixa no estoque em transação. Finalizam o pedido tanto o cliente logado (no carrinho, escolhendo o funcionário) quanto o atendente (no Portal, escolhendo cliente e funcionário). `PUT /api/Pedido/{id}/status` conclui (`F`) ou cancela (`C`, com devolução). Tela administrativa em `pedidos`.
8. **Atendimentos:** cliente e funcionário em listas, vários itens por registro, validação e checagem de estoque.
9. **Estoque:** saldo por produto, entrada via `/api/Estoque/entrada` e histórico (`/api/Estoque/movimentacoes`) com entradas e baixas automáticas.
10. **Painel:** indicadores carregados de forma independente (uma falha não bloqueia os demais cartões).
11. **Integração:** serviços em `services/` concentram as chamadas HTTP; tratamento de erro em `shared/erro-api.ts` lê a mensagem do backend (`mensagem` ou `ProblemDetails`).

## Pendências e riscos

- Compilar o backend e ajustar `DbSet`, nomes de propriedade e namespaces conforme o projeto real.
- Executar `ng build` e `ng test` no ambiente local.
- `Categorium` recebe o ID do cliente (`max + 1`); pode colidir em uso simultâneo.
- O checkout do cliente usa o mesmo `POST /api/Pedido` do atendente; o pedido exige a escolha de um funcionário no carrinho.
- Autenticação do portal é demonstrativa.
