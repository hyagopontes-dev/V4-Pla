# Pharma SaaS — Plataforma de Gestão de Clientes

Dashboard para agências gerenciarem entregas orgânicas e métricas de tráfego pago dos clientes.

---

## 🚀 Deploy em 5 passos (sem programar)

### 1. Criar conta no Supabase (banco de dados gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta grátis
2. Clique em **New Project** e dê um nome (ex: `pharma-saas`)
3. Anote a senha do banco (você vai precisar depois)
4. Aguarde o projeto ser criado (~2 minutos)

### 2. Configurar o banco de dados

1. No menu lateral do Supabase, clique em **SQL Editor**
2. Clique em **New Query**
3. Copie TODO o conteúdo do arquivo `supabase-schema.sql`
4. Cole no editor e clique em **Run**
5. Deve aparecer "Success" em verde

### 3. Pegar as credenciais do Supabase

1. No menu lateral, clique em **Settings** → **API**
2. Copie o **Project URL** (começa com `https://`)
3. Copie o **anon public** key (chave longa)

### 4. Subir no Vercel (hospedagem gratuita)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta com GitHub
2. Clique em **New Project** → **Import Git Repository**
   - Ou arraste a pasta do projeto
3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL = [cole o Project URL aqui]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [cole o anon key aqui]
   ```
4. Clique em **Deploy** e aguarde ~3 minutos

### 5. Criar o primeiro usuário admin

1. No Supabase, vá em **Authentication** → **Users** → **Add User**
2. Coloque seu email e uma senha forte
3. Após criar, vá em **Table Editor** → tabela `profiles`
4. Encontre o usuário criado e mude o campo `role` para `admin`
5. Pronto! Acesse o site e faça login

---

## 👥 Como usar

### Admin (você da agência)
- Acesse `/admin` após login
- **Novo cliente**: clique em "Novo cliente", preencha nome e peças contratadas
- **Gerenciar cliente**: clique em "Gerenciar →" na lista
  - **Dados**: edite nome, slug e peças/mês
  - **Entregas**: adicione mês a mês com link do documento
  - **Métricas**: adicione meta e realizado por plataforma (Meta/Google)
  - **Usuários**: crie logins para o cliente visualizar o dashboard

### Cliente (acesso de visualização)
- Acessa `/dashboard` após login
- Vê apenas os dados do próprio cliente
- Pode navegar entre meses
- Pode acessar o link do documento de cada mês

---

## 🏗 Estrutura do projeto

```
pharma-saas/
├── app/
│   ├── login/          → Página de login
│   ├── admin/          → Painel administrativo
│   │   └── clients/    → Gestão de clientes
│   └── dashboard/      → Visão do cliente
├── components/
│   ├── admin/          → Componentes do admin
│   └── client/         → Componentes do cliente
├── lib/
│   └── supabase.ts     → Conexão com banco
├── types/              → Tipos TypeScript
└── supabase-schema.sql → SQL para criar as tabelas
```

---

## 🔧 Rodar localmente (opcional)

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
# Acesse http://localhost:3000
```

---

## 📱 Funcionalidades

- ✅ Login seguro com email/senha
- ✅ Admin vê e gerencia todos os clientes
- ✅ Cliente vê apenas seu próprio dashboard
- ✅ Entregas orgânicas por mês com link do documento
- ✅ Histórico visual de entregas
- ✅ Indicador de meta batida / acima da meta
- ✅ Métricas de tráfego (Meta Ads e Google Ads)
- ✅ Comparativo meta vs realizado com status automático
- ✅ Múltiplos usuários por cliente
- ✅ Responsivo (funciona no celular)
- ✅ Dark mode automático

---

## 💰 Custo

| Serviço | Plano grátis inclui |
|---------|---------------------|
| Supabase | 500MB banco, 50.000 usuários |
| Vercel | Projetos ilimitados, 100GB banda |
| **Total** | **R$ 0/mês para começar** |
