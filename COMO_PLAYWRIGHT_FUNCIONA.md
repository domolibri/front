# 🎭 Como o Playwright Funciona com o Servidor

## Resposta Direta

**Sim!** O Playwright **executa o frontend por si só** - ele NÃO depende de você rodar `npm start` em outro terminal.

## Configuração Atual

```typescript
// playwright.config.ts
webServer: {
    command: 'npm run start',           // ← INICIA o servidor automaticamente
    url: 'http://localhost:4200',       // ← Aguarda isso estar pronto
    reuseExistingServer: false,         // ← NOVO: força novo servidor sempre
    timeout: 120000,                    // ← NOVO: 2 minutos para iniciar
}
```

### O que isso significa:

1. **Antes de rodar testes**: Playwright verifica se `http://localhost:4200` está respondendo
2. **Se não estiver**: Executa `npm run start` automaticamente
3. **Aguarda**: Máximo 2 minutos para o servidor ficar pronto
4. **Depois**: Roda os testes
5. **Após testes**: Mata o processo do servidor

---

## O Que Mudei

### ANTES (Problemático):
```typescript
reuseExistingServer: !process.env['CI']  // true em dev, false em CI
```

**Problema**: Se você tivesse um `npm start` rodando de forma instável, o Playwright reutilizava essa instância quebrada.

### DEPOIS (Correto):
```typescript
reuseExistingServer: false  // SEMPRE força novo servidor
timeout: 120000             // Aguarda 2 minutos para iniciar
```

**Benefício**: 
- ✅ Sempre um servidor fresco
- ✅ Garante que todas as configurações estão corretas
- ✅ Sem interferência de instâncias anteriores

---

## Três Formas de Rodar os Testes

### ✅ Forma 1: Deixar Playwright gerenciar (RECOMENDADO)
```bash
npm run e2e
# Playwright automaticamente:
# 1. Inicia npm start
# 2. Aguarda localhost:4200
# 3. Roda testes
# 4. Mata servidor
```

**Vantagem**: Ambiente limpo, sem estado anterior

### ⚠️ Forma 2: Você roda servidor, Playwright reutiliza
```bash
# Terminal 1:
npm start

# Terminal 2:
npm run e2e -- --use-existing-server
```

**Desvantagem**: Pode herdar problemas do servidor anterior

### ❌ Forma 3: Manual (NÃO recomendado)
```bash
# Você mesmo roda tudo manualmente
npm start
npm run e2e:headed
```

**Desvantagem**: Tedioso, propenso a erros

---

## O Problema Que Você Pode Estar Tendo

Se o Playwright está rodando `npm start` internamente, mas ainda recebe "erro inesperado", o problema pode ser:

### 1. Servidor não inicia corretamente
```bash
# Verificar se npm start funciona:
npm start

# Deixar rodar por 5 minutos
# Depois acessar http://localhost:4200
# Se não funciona, o problema está aqui
```

### 2. Proxy não está sendo carregado
O script `npm start` usa `--proxy-config proxy.conf.json`, mas pode estar falhando:

```bash
# Verificar se proxy está correto:
cat proxy.conf.json

# Deve ter:
# {
#     "/api": {
#         "target": "http://localhost:3000"
#     }
# }
```

### 3. Backend não está rodando
```bash
# Verificar se backend está em execução:
curl http://localhost:3000/api/health

# Deve responder algo como:
# {"status":"ok"}
```

### 4. Cache do Angular corrompido
```bash
# Limpar cache:
rm -rf .angular/cache

# Reinstalar:
npm install

# Tentar novamente:
npm run e2e
```

---

## Teste a Configuração Corrigida

```bash
# 1. Parar qualquer npm start anterior
#    (Ctrl+C em outros terminais)

# 2. Limpar cache
rm -rf .angular/cache

# 3. Rodar testes (Playwright gerencia o servidor)
npm run e2e

# 4. Verificar logs:
#    • Deve aparecer: "starting test server"
#    • Deve aparecer: "listening on http://localhost:4200"
#    • Depois: testes executam
```

## Checklist de Debug

Se ainda tiver problemas, verificar nessa ordem:

- [ ] Backend rodando? `curl http://localhost:3000/api/health`
- [ ] Proxy correto? `cat proxy.conf.json` (deve ter 3000, não 8080)
- [ ] Environment correto? `cat src/environments/environment.test.ts` (deve ter apiUrl: '')
- [ ] npm start funciona manualmente? `npm start` → abrir http://localhost:4200
- [ ] Cache limpo? `rm -rf .angular/cache`
- [ ] `reuseExistingServer: false`? (verificar playwright.config.ts)

---

## Resumo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Gerencia servidor?** | Sim, mas reutiliza | Sim, sempre novo |
| **Timeout** | Padrão (30s) | 120s (2 min) |
| **Depende de npm start manual?** | NÃO | NÃO |
| **Limpo a cada execução?** | Não | Sim |

**Resultado**: Ambiente totalmente isolado, sem herança de estado anterior

---

**Data**: 16/04/2026
