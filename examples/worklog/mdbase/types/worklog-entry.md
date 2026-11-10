---
kind: mdbase.type
name: worklog-entry
version: 1
description: One entry in a work log.
schema:
  dialect: json-schema-2020-12
  value:
    $schema: https://json-schema.org/draft/2020-12/schema
    type: object
    additionalProperties: true
    required: [date, summary]
    properties:
      date: { type: string, format: date }
      summary: { type: string, minLength: 1 }
      minutes: { type: integer, minimum: 0 }
---

# Worklog entry

What was done on one day, and optionally how long it took.
