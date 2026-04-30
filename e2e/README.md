# Testes E2E com Playwright

Este diretório contém os testes de aceitação (End-to-End) para validar as funcionalidades do SaaS Editorial, conforme especificado no plano de testes Playwright.

## Estrutura

- `s1-01-cadastro-editora.spec.ts` - Testes para a funcionalidade S1-01: Cadastro de Editora (Onboarding)

## Funcionalidades Testadas

### S1-01: Cadastro de Editora (Onboarding)

Este conjunto de testes valida o fluxo completo de cadastro de uma nova editora, incluindo:

- ✅ Exibição correta do formulário com todos os campos necessários
- ✅ Validações obrigatórias quando o formulário está vazio
- ✅ Validação do formato de e-mail
- ✅ Validação dos requisitos mínimos de senha
- ✅ Envio com dados válidos e redirecionamento para página de sucesso
- ✅ Exibição do estado de carregamento enquanto o cadastro está sendo processado
- ✅ Limpeza de erros ao interagir com os campos
- ✅ Verificação de links para Termos de Uso e Política de Privacidade
- ✅ Aceitação de nomes longos
- ✅ Navegação de volta pela breadcrumb

## Prerequisitos

1. Node.js instalado
2. Dependências do projeto instaladas: `npm install`
3. Servidor de desenvolvimento em execução: `npm start` (em outro terminal)

## Como Executar

### Rodar todos os testes
```bash
npm run e2e
```

### Rodar com interface gráfica (recomendado para desenvolvimento)
```bash
npm run e2e:ui
```

### Rodar em modo headless com navegador visível
```bash
npm run e2e:headed
```

### Rodar com modo debug
```bash
npm run e2e:debug
```

### Rodar apenas os testes de S1-01
```bash
npm run e2e -- e2e/s1-01-cadastro-editora.spec.ts
```

### Rodar um teste específico
```bash
npm run e2e -- e2e/s1-01-cadastro-editora.spec.ts --grep "Deve registrar editora com dados válidos"
```

## Arquivos Gerados

Após executar os testes, os seguintes arquivos serão gerados:

- `playwright-report/` - Relatório HTML detalhado dos testes
- `test-results/` - Artefatos de teste (screenshots, vídeos)

Para visualizar o relatório:
```bash
npx playwright show-report
```

## Configuração

A configuração do Playwright está em `playwright.config.ts` e inclui:

- **baseURL**: `http://localhost:4200`
- **browsers testados**: Chromium, Firefox, WebKit
- **retry**: 2 tentativas em CI, 0 em desenvolvimento
- **timeout**: Padrão de 30 segundos

## Boas Práticas

1. **Antes de rodar os testes**: Certifique-se de que o backend está em execução
2. **Dados de teste**: Todos os testes usam e-mails únicos com timestamp para evitar conflitos
3. **Timeouts**: Os testes usam timeouts apropriados para esperar por redirecionamentos
4. **Elementos únicos**: Usam `id` dos campos HTML para evitar falhas por mudanças CSS

## Troubleshooting

### Erro "Connection refused"
- Verifique se o servidor em `http://localhost:4200` está em execução
- Execute: `npm start` em outro terminal

### Timeout durante o cadastro
- Verifique se o backend está respondendo corretamente
- Aumentar o timeout em caso de lentidão: `page.waitForURL(..., { timeout: 15000 })`

### Testes falhando por validação de servidor
- Verifique se as regras de validação no backend correspondem às do frontend
- Senha: deve ter mínimo 8 caracteres, maiúsculas, minúsculas, números e caracteres especiais

## Próximas Funcionalidades para Teste

- S1-02: Login e Multi-tenant
- S1-03: Verificação de E-mail
- S1-04: Proteção de Rotas
- S1-05: Branding Dinâmico
- S2-01 até S2-06: Gerenciamento de usuários, convites e roles
