# 🚀 Quick Fix: Erro "Inesperado" no Playwright

## O Problema
Toast "erro inesperado" aparecia nos testes Playwright, mas cadastro funcionava manual.

## As Causas (2)

### 1. Proxy errado
```json
// proxy.conf.json - ANTES
{
    "/api": {
        "target": "http://localhost:8080"  ❌ Deveria ser 3000!
    }
}
```

**Impacto**: Requisições POST `/api/auth/register` iam para localhost:8080 (vazio) em vez de localhost:3000 (backend)

### 2. Environment remoto
```typescript
// environment.test.ts - ANTES
export const environment = {
  production: false,
  apiUrl: 'http://test-api.domolibri.com.br'  ❌ API remota!
};
```

**Impacto**: Se configuração "test" era usada, tentava chamar servidor externo

## As Soluções (2)

✅ **Corrigir proxy.conf.json**: 8080 → 3000
```json
{
    "/api": {
        "target": "http://localhost:3000"
    }
}
```

✅ **Corrigir environment.test.ts**: API remota → local
```typescript
export const environment = {
  production: false,
  apiUrl: ''
};
```

## Por que funcionava manual?
- Você provavelmente estava usando `ng serve --configuration=development` em vez da configuração default
- Ou proxy estava desabilitado em sua aba
- Playwright sempre usa configurações padrão + proxy

## Verificar a Correção
```bash
# Parar servidor
Ctrl+C

# Limpar cache
rm -rf .angular/cache

# Reiniciar
npm start

# Rodar testes
npm run e2e:headed

# Abrir DevTools F12 → Network
# POST /api/auth/register deve ter Status 200
```

## Resultado Esperado
- ✅ Teste de cadastro passa
- ✅ Sem toast de erro
- ✅ 30/30 testes passando
- ✅ Redirecionamento funciona

---

**Status**: ✅ Resolvido
**Arquivos**: proxy.conf.json, environment.test.ts
