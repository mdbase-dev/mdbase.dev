---
kind: mdbase.type
name: runtime_provider_registration
version: 1
description: Canonical Markdown implementation of mdbase.runtime.provider-registration.
match:
  where:
    type: runtime_provider_registration
schema:
  dialect: json-schema-2020-12
  value:
    $schema: https://json-schema.org/draft/2020-12/schema
    title: mdbase runtime provider registration evidence
    type: object
    required:
      - type
      - id
      - declaration_kind
      - declaration
      - verified_at
      - active
    properties:
      type:
        const: runtime_provider_registration
      id:
        type: string
        pattern: ^[A-Za-z][A-Za-z0-9._:-]*$
      declaration_kind:
        enum:
          - event_source
          - action_provider
      declaration:
        type: object
      verified_at:
        type: string
        format: date-time
      active:
        type: boolean
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
    $id: https://mdbase.dev/schemas/runtime/v0.2/mdbase.runtime.provider-registration/1.0.0.schema.json
implements:
  - contract: mdbase.runtime.provider-registration
    version: 1.0.0
    fields:
      type: type
      id: id
      declaration_kind: declaration_kind
      declaration: declaration
      verified_at: verified_at
      active: active
---

# Provider registration evidence

This canonical type makes `runtime_provider_registration` records discoverable through
the ordinary mdbase record-contract registry.
