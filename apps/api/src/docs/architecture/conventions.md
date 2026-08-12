# Data Shape Conventions

We use distinct naming to represent different layers of data:

- `*Row`
  - Raw database/query results (flat, joined, aliased)
  - Lives near repository/query code

- `*Projection`
  - Read-model objects returned by read services
  - Shaped for specific use cases / GraphQL nodes

- `*Record`
  - Persistence shape used for aggregate rehydration
  - Maps closely to database schema

- `*Payload` / `*CollectionPayload`
  - GraphQL-generated wrapper/container types
  - Not custom; use codegen types directly

- `*Command`
  - Input to write services (application layer)
  - Represents an intent to change state
  - Independent of GraphQL types

- `*Result`
  - Output from write services (application layer)
  - Represents the outcome of executing a command
  - Typically wrapped in `OperationResult<T>`

## Rules

- Do NOT use `*Parent`, `*DTO`, or `*Data`
- Do NOT reuse projections across unrelated use cases
- GraphQL mappers should point to `*Projection` types when needed
- Read services return projections, not rows
- Write services accept `*Command` and return `OperationResult<*Result>`
- Do NOT use GraphQL-generated types (`*Input`, `*Payload`) inside write services
