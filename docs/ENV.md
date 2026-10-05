# Age Treino Studio Personal — Variáveis de Ambiente

Copie este arquivo para `.env` e preencha os valores antes de executar o projeto.

## Obrigatórias

```env
# Banco de dados PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/action_fitness?schema=public"

# JWT
JWT_SECRET="troque-por-uma-string-longa-e-aleatoria-minimo-32-chars"
JWT_REFRESH_SECRET="troque-por-outra-string-longa-e-aleatoria-minimo-32-chars"

# Servidor
PORT=3000
NODE_ENV=development

# Admin inicial (usado pelo seed)
ADMIN_NAME="Administrador"
ADMIN_EMAIL="admin@actionfitness.com.br"
ADMIN_PASSWORD="troque-esta-senha-apos-primeiro-login"
```

## Opcionais — SMTP (notificações por e-mail)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="Age Treino Studio Personal <seu-email@gmail.com>"
```

> Se SMTP_HOST não for configurado, notificações por e-mail serão desativadas automaticamente.
> Notificações internas no painel admin sempre funcionarão.

## Geração de secrets seguros

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Execute duas vezes para gerar JWT_SECRET e JWT_REFRESH_SECRET distintos.
