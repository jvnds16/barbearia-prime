# Deploy

A aplicação usa:

- Vercel para o frontend React/Vite;
- Vercel Functions para a API Express;
- MongoDB Atlas para o banco de dados.

## 1. Criar o MongoDB Atlas

Crie um cluster no MongoDB Atlas. Para ficar próximo da região padrão das Vercel Functions,
prefira a região AWS `us-east-1` (N. Virginia).

Crie um usuário de banco com senha forte e configure o acesso de rede. Como as Functions podem
usar IPs dinâmicos, o plano simples normalmente exige permitir `0.0.0.0/0`. A aplicação continua
protegida pelo usuário e pela senha presentes na string de conexão; nunca publique essa string.

Copie a string de conexão no formato:

```text
mongodb+srv://USUARIO:SENHA@cluster.mongodb.net/barbearia-prime
```

## 2. Importar o projeto na Vercel

Ao importar o repositório, configure:

- **Root Directory:** `src`
- **Framework Preset:** Vite

Os comandos de instalação, build, saída e rotas já estão definidos em `src/vercel.json`.

## 3. Variáveis de ambiente

Adicione às configurações de Production, Preview e Development:

```env
MONGODB_URI=mongodb+srv://...
MONGO_DB=barbearia-prime
ADMIN_PASSWORD=uma-senha-com-pelo-menos-12-caracteres
JWT_SECRET=um-segredo-aleatorio-com-pelo-menos-32-caracteres
VITE_API_URL=/api
VITE_SITE_URL=https://seu-projeto.vercel.app
```

`NODE_ENV` e a URL do deploy são definidos automaticamente pela Vercel. `FRONTEND_URL` é
opcional nesse ambiente; configure-a apenas quando o frontend estiver hospedado em outro domínio.

Depois de conectar um domínio próprio, atualize `VITE_SITE_URL` e, se necessário, `FRONTEND_URL`,
e faça um novo deploy.

## 4. Preparar o banco

Antes do primeiro deploy público, execute localmente com `MONGODB_URI` apontando para o Atlas:

```bash
cd src
npm run db:setup
```

Esse comando sincroniza os índices exclusivos usados para impedir agendamentos duplicados.

## 5. Verificação

Após o deploy, confira:

- `/`
- `/admin`
- `/api/health`
- login administrativo;
- criação, edição e cancelamento de agendamento;
- conflito entre dois agendamentos no mesmo horário.

O painel administrativo consulta atualizações a cada 30 segundos, pois processos e memória não são
persistentes entre Vercel Functions.
