

## Plano: Criar tabelas de Admin e Afiliado no Supabase

### Contexto
O projeto usa dados mock para admins e afiliados. A tabela de jogadores já existe no Supabase. Precisamos criar tabelas para **admins** e **afiliados**, além de configurar o cliente Supabase no projeto.

### Tabelas a criar

**1. `admins`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK, default gen_random_uuid()) | Identificador |
| user_id | uuid (FK → auth.users) | Vínculo com auth |
| name | text | Nome |
| email | text | E-mail |
| status | text (default 'active') | active / frozen |
| created_at | timestamptz (default now()) | Data de criação |

**2. `affiliates`**
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK, default gen_random_uuid()) | Identificador |
| user_id | uuid (FK → auth.users, nullable) | Vínculo com auth |
| name | text | Nome |
| email | text | E-mail |
| phone | text | Telefone |
| total_registrations | integer (default 0) | Total cadastros |
| total_deposits | integer (default 0) | Total depósitos |
| deposit_value | numeric (default 0) | Valor depósitos |
| balance | numeric (default 0) | Saldo |
| commission | numeric (default 0) | % comissão |
| status | text (default 'active') | active / inactive / frozen |
| trend | numeric (default 0) | Tendência % |
| created_at | timestamptz (default now()) | Data de criação |

### Segurança (RLS)
- Habilitar RLS em ambas as tabelas
- Política de leitura para usuários autenticados
- Política de escrita apenas para admins (usando `user_roles` pattern)

### Passos de implementação

1. **Criar migration** com as duas tabelas + RLS policies
2. **Configurar cliente Supabase** (`src/lib/supabase.ts`) com a URL e anon key fornecidas
3. **Gerar tipos TypeScript** para as tabelas
4. **Não mexer** na tabela de jogadores existente

### Detalhes técnicos
- URL do Supabase: `https://ytzexfjlrstqvsbcnvdj.supabase.co`
- A anon key é pública, pode ficar no código
- As migrations serão executadas via ferramenta de migração do projeto

