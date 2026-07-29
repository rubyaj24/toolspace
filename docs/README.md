# API documentation

The API contract is defined in [`openapi.yaml`](./openapi.yaml). The repository overview, Mermaid diagrams, setup instructions, and endpoint summary are in the root [`README.md`](../README.md).

For an existing database, use [`../supabase/upgrade-existing.sql`](../supabase/upgrade-existing.sql) rather than rerunning the initial schema.

It can be imported into Swagger UI, Swagger Editor, Postman, or Insomnia. Once the Next.js app exists, expose Swagger UI at `/api-docs` using the OpenAPI file and `swagger-ui-react`.

Protected endpoints use the Supabase Auth access token:

```http
Authorization: Bearer <supabase-access-token>
```

Route handlers should perform authentication, Zod validation, authorization, availability checks, and database writes. Browser pages should consume these API routes.

Current implemented endpoints:

| Method | Endpoint | Auth |
| --- | --- | --- |
| GET | `/api/tools` | Public API, active tools only |
| POST | `/api/tools` | Supabase user required |
| GET | `/api/tools/{toolId}` | Public API |
| POST | `/api/bookings` | Supabase user required |

The booking dashboard endpoints are included in the OpenAPI contract as the next implementation slice.
