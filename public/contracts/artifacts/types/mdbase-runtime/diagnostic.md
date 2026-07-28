---
kind: mdbase.type
name: runtime_diagnostic
version: 1
description: Canonical Markdown implementation of mdbase.runtime.diagnostic.
match:
  where:
    type: runtime_diagnostic
schema:
  dialect: json-schema-2020-12
  value:
    $schema: https://json-schema.org/draft/2020-12/schema
    title: mdbase durable runtime diagnostic
    type: object
    required:
      - type
      - id
      - severity
      - code
      - message
      - created_at
    properties:
      type:
        const: runtime_diagnostic
      id:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      severity:
        enum:
          - info
          - warning
          - error
      code:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      message:
        type: string
        minLength: 1
      run_id:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      attempt_id:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      path:
        type: string
      details: {}
      created_at:
        type: string
        format: date-time
    patternProperties:
      ^x-[A-Za-z0-9._:-]+$: true
    additionalProperties: false
    $defs:
      identifier:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      semanticVersion:
        type: string
        pattern: ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$
      digest:
        type: string
        pattern: ^sha256:[0-9a-f]{64}$
      dateTime:
        type: string
        format: date-time
      contractRequirement:
        type: object
        required:
          - id
          - version
        properties:
          id:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          version:
            type: string
            minLength: 1
          digest:
            type: string
            pattern: ^sha256:[0-9a-f]{64}$
        patternProperties:
          ^x-[A-Za-z0-9._:-]+$: true
        additionalProperties: false
      exactContractReference:
        type: object
        required:
          - id
          - version
          - digest
        properties:
          id:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          version:
            type: string
            pattern: ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$
          digest:
            type: string
            pattern: ^sha256:[0-9a-f]{64}$
        patternProperties:
          ^x-[A-Za-z0-9._:-]+$: true
        additionalProperties: false
      identity:
        type: object
        required:
          - application
          - implementation
          - version
        properties:
          application:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          implementation:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          version:
            type: string
            pattern: ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$
          instance_id:
            type: string
            minLength: 1
        patternProperties:
          ^x-[A-Za-z0-9._:-]+$: true
        additionalProperties: false
      providerSelector:
        type: object
        required: []
        properties:
          application:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          implementation:
            type: string
            pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
          instance_id:
            type: string
            minLength: 1
        patternProperties:
          ^x-[A-Za-z0-9._:-]+$: true
        additionalProperties: false
        minProperties: 1
      expression:
        type: object
        required:
          - $expr
        properties:
          $expr:
            type: string
            minLength: 1
        additionalProperties: false
    $id: https://mdbase.dev/schemas/runtime/v0.2/mdbase.runtime.diagnostic/1.0.0.schema.json
implements:
  - contract: mdbase.runtime.diagnostic
    version: 1.0.0
    fields:
      type: type
      id: id
      severity: severity
      code: code
      message: message
      run_id: run_id
      attempt_id: attempt_id
      path: path
      details: details
      created_at: created_at
---

# Runtime diagnostic

This canonical type makes `runtime_diagnostic` records discoverable through
the ordinary mdbase record-contract registry.
