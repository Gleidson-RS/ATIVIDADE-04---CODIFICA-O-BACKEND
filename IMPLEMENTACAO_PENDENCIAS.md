# Atividade 04 — estado da implementação frontend

## Implementado no frontend

1. **Clientes:** cadastro, listagem, consulta e edição permanecem conectados à API `PessoaEndereco`, com validações de CPF, e-mail, telefone, CEP, data e campos obrigatórios.
2. **Catálogo de serviços:** leitura pela API `Categorium`, usando `items[]`; exibe somente itens ativos do tipo `S` e permite busca e filtro por categoria.
3. **Catálogo de produtos:** leitura pela API `Categorium`, usando `items[]`; exibe somente itens ativos do tipo `P` e permite busca e filtro por categoria.
4. **Funcionários:** tela de cadastro, pesquisa, edição e exclusão com validações, incluindo cargo e data de admissão. Por limitação da API documentada, os registros permanecem no `localStorage` do navegador; o ID gerado nessa tela é local e não corresponde a `funcionario.idpessoa` no MySQL.
5. **Atendimentos:** listagem e inclusão pela API `Atendimento`, relacionando cliente, item e ID de funcionário. O ID do funcionário é informado manualmente porque não existe rota de funcionário no Swagger recebido; os IDs locais da tela de funcionários não devem ser usados nesse campo.
6. **Estoque:** produtos e saldo inicial são consultados pela API `Categorium` quando o relacionamento `produto.estoque` vier preenchido. O formulário e histórico de entradas ficam no `localStorage`, pois não há endpoints de estoque/entrada documentados.
7. **Validações e mensagens:** validações de formulário e mensagens de carregamento/sucesso/erro incluídas nas telas.
8. **Integração:** URLs da API centralizadas em `src/environments/environment.ts`. Clientes, catálogo e atendimentos usam endpoints documentados no Swagger.
9. **Navegação e visual:** rotas, menu e portal administrativo preservados e conectados às telas implementadas.

## Limitações verificadas no Swagger fornecido

O Swagger documenta as rotas `/api/PessoaEndereco`, `/api/Categorium`, `/api/ProdutoItem` e `/api/Atendimento` (além de `WeatherForecast`). Não documenta endpoints para consultar/cadastrar funcionário, consultar estoque ou registrar entrada de produto.

Por isso, sem alterar o ASP.NET Core, não é possível fazer CRUD real de funcionário nem gravar entradas/quantidades no MySQL. O frontend deixa isso explícito nas telas. O ID digitado em atendimento precisa corresponder a um registro existente na tabela `funcionario`, caso contrário a chave estrangeira pode fazer a API rejeitar a operação.

O catálogo usa `GET /api/Categorium` porque o schema `Categorium` inclui `items[]` e o schema `Item` inclui `iditem`, `tipoItem`, `ativoProdutoServico` e a navegação `produto/estoque`. O schema do `ProdutoDTO` de `/api/ProdutoItem` não documenta `iditem`, então não é suficiente, sozinho, para criar um vínculo de atendimento com o item correto.

## Dados dos scripts SQL recebidos

- O script de inserção de categoria/item cria três categorias e 20 itens com `tipo_item = 'P'`.
- Nesse script não há serviços com `tipo_item = 'S'`; por isso, o catálogo de serviços pode aparecer vazio até que existam serviços cadastrados no banco.
- O dump cria as tabelas `funcionario`, `estoque` e `entradaproduto`, mas não traz registros de exemplo para elas.

## Como executar

1. Abra a pasta `frontend` no VS Code.
2. Use Node.js compatível com Angular CLI 22.2.4: Node `22.22.3+` da linha 22 ou `24.15.0+` da linha 24.
3. No terminal da pasta `frontend`, execute `npm install` e depois `npm start`.
4. Confirme que a API está em execução no endereço configurado em `src/environments/environment.ts` (`https://localhost:7077/api`). Se a porta mudar, altere somente esse arquivo.
5. Abra `http://localhost:4200/`.

A autenticação do portal continua demonstrativa/local. Não deve ser tratada como controle de acesso seguro para produção.

## Validação técnica desta entrega

Os arquivos TypeScript alterados foram submetidos a verificação estática. Não foi possível concluir `ng build` neste ambiente de preparação: a versão de Node disponível era `22.16.0` (abaixo da versão mínima exigida pelo Angular 22.2.4) e a instalação das dependências foi interrompida por falha de resolução de rede do registro npm. Faça a compilação final no ambiente local com uma versão de Node compatível e `npm install` concluído.
