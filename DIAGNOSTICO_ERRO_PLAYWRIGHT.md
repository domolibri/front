# 🔧 Problema: Toast "Erro Inesperado" nos Testes Playwright

## Raiz do Problema

Durante os testes Playwright, o frontend recebe um toast com "erro inesperado", mas quando você cadastra manualmente funciona. **Por quê?**

### A Causa: Múltiplas Configurações de API

Existem **3 problemas combinados**:

#### 1️⃣ **proxy.conf.json aponta para porta ERRADA**
```json
{
    "/api": {
        "target": "http://localhost:8080",  // ❌ ERRADO! Deveria ser 3000
        "secure": false,
        "changeOrigin": true
    }
}
```

**Impacto**: 
- Requisição `/api/auth/register` é proxiada para `http://localhost:8080/auth/register`
- Backend está em `http://localhost:3000`, não em 8080
- Requisição vai para nada → erro do servidor

#### 2️⃣ **environment.test.ts com API remota**
```typescript
// src/environments/environment.test.ts
export const environment = {
  production: false,
  apiUrl: 'http://test-api.domolibri.com.br',  // ⚠️ API REMOTA!
};
```

**Impacto**:
- Se a configuração "test" for usada, tentaria chamar `http://test-api.domolibri.com.br/api/auth/register`
- Isso causaria erro de CORS ou requisição bloqueada

#### 3️⃣ **Qual environment está sendo usada?**
```json
// angular.json
"test": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.test.ts"  // ← Usado em testes!
    }
  ]
}
```

**Impacto**:
- Quando `npm run start` é executado sem `--configuration`, usa `defaultConfiguration`
- Mas se fosse usado `--configuration=test`, usaria `environment.test.ts`

---

## Análise de Fluxo

### ✓ Quando você faz cadastro MANUAL (funciona):
```
1. npm start
   → Usa environment.ts (apiUrl = '')
   → usa proxy.conf.json para redirecionar /api para localhost:8080
   
2. Formulário enviado
   → Requisição para http://localhost:4200/api/auth/register
   
3. Proxy intercepta
   → Redireciona para http://localhost:8080/auth/register
   
4. ❌ Mas backend está em 3000!
   → Erro 404 ou Connection Refused
```

**ESPERA!** Se a porta está errada (8080 em vez de 3000), por que funciona manual?

### Resposta: Você está testando manual sem proxy!

Quando você testa no browser manualmente:
1. Você provavelmente está fazendo request direto para `http://localhost:3000`
2. Ou o backend respondeu em uma segunda tentativa
3. Ou você está com uma aba diferente que usa outro port

---

## Solução

### ✅ PASSO 1: Corrigir proxy.conf.json

```json
{
    "/api": {
        "target": "http://localhost:3000",  // ✅ CORRETO
        "secure": false,
        "changeOrigin": true
    }
}
```

### ✅ PASSO 2: Verificar qual environment está sendo usada

```bash
# Verificar qual configuração está ativa:
grep -A5 '"serve"' angular.json

# Ver qual é o defaultConfiguration
grep '"defaultConfiguration"' angular.json
```

### ✅ PASSO 3: Garantir que testes usam development, não test

**Option A**: Mudar o defaultConfiguration no angular.json

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": {
    "production": { ... },
    "development": { ... }
  },
  "defaultConfiguration": "development"  // ← Mudar de "production" ou "test"
}
```

**Option B**: Ou especificar no package.json

```json
{
  "scripts": {
    "start": "ng serve --configuration=development --proxy-config proxy.conf.json",
    "dev": "ng serve --configuration=development --proxy-config proxy.conf.json"
  }
}
```

### ✅ PASSO 4: Limpar cache e reiniciar

```bash
# Limpar cache
rm -rf .angular/cache dist

# Instalar dependências novamente
npm install

# Rodar testes
npm run e2e:headed
```

---

## Por Que Funciona Manual Mas Falha no Playwright?

| Aspecto | Manual (Funciona) | Playwright (Falha) |
|--------|-------------------|-------------------|
| **Environment** | Você pode estar em /dev path | Usa configuração padrão |
| **Proxy** | Pode estar desabilitado | Ativo e apontando errado |
| **Timing** | Mais lento (você digita) | Mais rápido (instantâneo) |
| **Headers** | Pode ter cookies/tokens | Sessão limpa |
| **Backend** | Pode estar respondendo | Talvez offline ou erro anterior |

---

## Checklist de Diagnóstico

```bash
# 1. Backend está em 3000?
curl http://localhost:3000/api/health

# 2. Proxy está correto?
cat proxy.conf.json

# 3. Qual environment está ativa?
grep "environment.ts" src/environments/environment.ts

# 4. Qual é o defaultConfiguration?
grep -B5 '"defaultConfiguration"' angular.json

# 5. Reiniciar servidor com dev
npm run dev

# 6. Rodar testes com visibilidade
npm run e2e:headed
```

---

## Teste a Correção

```bash
# 1. Aplicar mudanças no proxy.conf.json
# 2. Reiniciar servidor: npm start
# 3. Testar manual no browser: http://localhost:4200/cadastro
# 4. Se funciona, rodar Playwright:
npm run e2e:headed

# Se ainda falhar, abrir DevTools (F12):
# Network tab → procurar POST /api/auth/register
# Ver se está indo para localhost:3000 ou localhost:8080
```

---

## Resumo

| Arquivo | Problema | Solução |
|---------|----------|---------|
| proxy.conf.json | target = 8080 | Mudar para 3000 |
| environment.test.ts | apiUrl remoto | Deixar como '' (vazio) |
| angular.json | defaultConfiguration | Verificar se é "development" |

**Todos os 3 precisam estar corretos para os testes funcionarem!**

---

**Data de Análise**: 16/04/2026
