# Age Treino - Studio Personal

Sistema completo de agendamento de horários para academias e estúdios de personal trainer.

## Principais Funcionalidades
- **Gestão de Grade:** O administrador pode configurar a grade semanal de aulas com limite de vagas por horário.
- **Agendamento de Alunos:** Os alunos cadastrados podem reservar seus lugares nos horários configurados até que a capacidade seja atingida.
- **Inscrição Manual:** Administradores podem inscrever manualmente pessoas como "visitantes/convidados", ocupando vagas na grade.
- **Cancelamento:** Alunos podem cancelar o agendamento; admins podem cancelar agendamentos a qualquer momento.
- **Notificações Internas:** Sistema notifica admins em caso de ações pontuais.

## Como Executar o Projeto Localmente

**1. Pré-requisitos:**
- Node.js (versão 18+)
- PostgreSQL rodando localmente (ou Docker)

**2. Instalação de Dependências:**
```bash
npm install
```

**3. Variáveis de Ambiente:**
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/action_fitness"
PORT=3000
JWT_SECRET="sua-chave-secreta-super-segura"
FRONTEND_URL="http://localhost:3000"
```

**4. Configuração do Banco de Dados:**
Execute a migration (não irá apagar os dados se não houver conflito; se for a primeira vez use `dev`):
```bash
npm run db:migrate
```
*(Opcional)* Popule o banco de dados com dados iniciais (conta de admin):
```bash
npm run db:seed
```
O login do admin padrão criado pelo seed é:
- Email: `admin@age.com`
- Senha: `admin`

**5. Iniciando o Servidor de Desenvolvimento:**
```bash
npm run dev
```

Abra o navegador em: [http://localhost:3000](http://localhost:3000)

## Documentação Técnica Avançada

Consulte o documento de [Arquitetura](docs/ARQUITETURA.md) para detalhes avançados sobre:
- Diagramas do Banco de Dados
- Estrutura do Sistema
- Fluxo de Autenticação e Cookies Seguros
- Controle de Concorrência em Agendamentos com Lock Pessimista
