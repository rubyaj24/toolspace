# API documentation

The API contract is defined in [`openapi.yaml`](./openapi.yaml).

It can be imported into Swagger UI, Swagger Editor, Postman, or Insomnia. Once the Next.js app exists, expose Swagger UI at `/api-docs` using the OpenAPI file and `swagger-ui-react`.

Protected endpoints use the Supabase Auth access token:

```http
Authorization: Bearer <supabase-access-token>
```

Route handlers should perform authentication, Zod validation, authorization, availability checks, and database writes. Browser pages should consume these API routes.
