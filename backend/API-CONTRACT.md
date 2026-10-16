# Demo API contract

All responses describe invented demonstration data. Only `a`, `b` and `c` are supported area IDs. An H3 lookup or address service is not implemented; accepting arbitrary H3 cells would falsely imply coverage.

`GET /v1/areas` returns supported demo IDs and illustrative marker coordinates.

`GET /v1/quiz` returns the versioned balanced questions. `POST /v1/quiz` accepts exactly seven answers, each one of the associated question's alternatives, and returns base-one weights plus one for each choice.

`POST /v1/report` accepts `area_id` and all seven numeric weights, each 1–9. It returns `areaId`, `areaName`, `demo`, `methodVersion`, `asOf`, nullable `score`, missing-data `lo`/`hi`, `used`, `total`, available weight `coverage`, `ledger`, `summary` and `checklist`. A missing score is JSON null, never a numeric zero placeholder.

`POST /v1/compare` accepts `first`, `second`, and weights; identical or unsupported areas are rejected. The result contains two reports and a missing-data `bounds_overlap` flag. Overlap is not statistical significance.

Malformed inputs produce HTTP 422. No credentials, raw portal errors or internal stack traces are returned as normal application data. The initial service is read-only and has no accounts or database. It is intended for local development, not unprotected public deployment.
