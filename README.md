# Atividade 04 — Frontend Angular

Aplicação Angular do projeto da Atividade 04. Esta versão mantém o fluxo de clientes, conecta os catálogos e atendimentos às rotas documentadas no Swagger e identifica as telas que ainda dependem de endpoints ausentes no backend.

## Executar

Requisitos: Node.js 22.22.3+ (linha 22) ou 24.15.0+ (linha 24).

```bash
npm install
npm start
```

A aplicação abre em `http://localhost:4200/`.

## API

A URL base fica em `src/environments/environment.ts`. Atualmente está configurada como `https://localhost:7077/api`.

## Documentação importante

- `IMPLEMENTACAO_PENDENCIAS.md`: funcionalidades, integrações, limitações confirmadas e instruções.
- `../documentacao/swagger-v1.json`: contrato Swagger recebido para esta entrega.
- `../documentacao/sql/`: scripts SQL enviados como referência.
