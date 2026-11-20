# PetCloud API

Backend em Python 3.12+ com FastAPI, Pydantic v2, PostgreSQL (psycopg 3), JWT e S3.

## Executar localmente

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build -d
```

Documentação interativa: http://localhost:8000/docs  
Liveness: `GET /health`  
Readiness (PostgreSQL): `GET /health/ready`

Execução sem Docker (com PostgreSQL já iniciado):

```powershell
cd api
python -m venv .venv
.venv\\Scripts\\activate
python -m pip install -e .
Copy-Item .env.example .env
uvicorn petcloud.main:app --reload
```

## Organização do código

```text
petcloud/
  main.py                 # criação do FastAPI, CORS, middleware e routers
  config.py               # configurações por variáveis de ambiente
  dependencies.py         # JWT, usuário autenticado e autorização por papel
  schemas/                # modelos Pydantic espelhando app/src/types/index.ts
  routers/                # endpoints HTTP (auth, pets, adoptions, organization, logs)
  services/               # regras de negócio e acesso ao PostgreSQL/S3
  schema.sql              # estrutura inicial do banco
```

Os schemas representam `User`, `Organization`, `Pet`, `PetPhoto`, `PetDetails`, `AdoptionRequest`, `AdoptionRequestDetails`, entradas, decisões, paginação, filtros, autenticação e upload. Mantenha os tipos Python sincronizados com `app/src/types/index.ts`.

## Rotas

- `POST /auth/register` — cria conta de adotante.
- `POST /auth/login` — autentica e emite JWT.
- `GET /auth/me` — retorna o usuário autenticado.
- `GET /pets`, `GET /pets/{pet_id}` — catálogo e detalhes públicos.
- `POST /pets`, `PATCH /pets/{pet_id}`, `GET /organizations/me/pets` — gestão de pets por membro da ONG.
- `POST /pets/{pet_id}/photos/upload-url`, `POST /pets/{pet_id}/photos` — fluxo de upload S3.
- `POST /adoption-requests`, `GET /adoption-requests/me` — ações do adotante.
- `GET /organizations/me/adoption-requests`, `PATCH /adoption-requests/{request_id}` — fila e decisão da ONG.
- `POST /logs` — recebe erros do navegador e grava JSON no stdout.

## Autenticação e permissões

Envie `Authorization: Bearer <JWT>` nas rotas protegidas. Senhas são armazenadas com Argon2id via `pwdlib`; nunca são retornadas pela API. O cadastro público cria somente `adopter`. Rotas de ONG exigem `organization_member` e restringem os dados à organização associada ao usuário.

## Regras de adoção

- Apenas adotantes podem criar e listar suas solicitações.
- Só é possível solicitar um pet com status `available`.
- O banco impede mais de uma solicitação `pending` do mesmo adotante para o mesmo pet; conflito retorna HTTP 409.
- Só membros da ONG proprietária podem listar/revisar solicitações.
- Solicitação inexistente ou fora da ONG retorna 404; solicitação não pendente retorna 409.
- Ao aprovar, o pet muda para `pending`; se já não estiver `available`, a aprovação retorna 409.
- Erros HTTP usam `{ "detail": ... }`.

## Logs

Cada requisição gera uma linha JSON no stdout com `method`, `route`, `status` e `duration_ms`. O `POST /logs` aceita `level`, `message`, `source`, `stack`, `url`, `timestamp` e `context`; o payload é gravado como JSON. Em produção, encaminhe stdout/stderr para CloudWatch Logs.

## Variáveis de ambiente

| Variável | Finalidade |
|---|---|
| `DATABASE_URL` | conexão PostgreSQL/RDS |
| `CORS_ORIGINS` | origens permitidas pelo CORS em formato JSON |
| `JWT_SECRET` | segredo de assinatura JWT; use segredo aleatório forte |
| `JWT_EXP_MINUTES` | validade do token em minutos |
| `S3_BUCKET` | bucket para fotos dos pets |
| `AWS_REGION` | região do bucket S3 |

## AWS: caminho recomendado

1. Criar VPC com sub-redes privadas para RDS e API; expor somente o Application Load Balancer.
2. Publicar a API em ECS Fargate (ou EC2), usando imagem Docker e HTTPS via ALB/ACM.
3. Usar Amazon RDS for PostgreSQL em sub-redes privadas, backups automáticos e credenciais no Secrets Manager.
4. Criar bucket S3 privado, bloquear acesso público e habilitar criptografia; configurar CORS do bucket para `PUT` apenas da origem do frontend.
5. Dar à task role do ECS permissões mínimas `s3:PutObject`, `s3:GetObject`, `s3:HeadObject` e `s3:DeleteObject` no prefixo de fotos.
6. Definir `JWT_SECRET` no Secrets Manager, `S3_BUCKET`, `AWS_REGION`, `DATABASE_URL` e `CORS_ORIGINS` como configuração/segredos da task.
7. Enviar logs stdout/stderr ao CloudWatch Logs e configurar alarmes para 5xx, latência e falhas de saúde.
8. Hospedar o frontend em S3 + CloudFront (ou Amplify), restringindo CORS ao domínio publicado.

Não use credenciais AWS estáticas na aplicação hospedada: prefira IAM Task Role. O schema é aplicado no startup para ambiente de desenvolvimento; em produção, adote migrations versionadas e execução controlada no pipeline de deploy.

## Contas de ONG

O cadastro público não cria organizações. Um administrador deve provisionar a organização e seu primeiro usuário `organization_member` pelo script:

```bash
python -m scripts.create_organization
```

Execute no ambiente da API após a criação das tabelas.
