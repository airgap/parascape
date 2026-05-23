// Parascape's database schema, expressed as @lyku/lockstep-core models.
// Single source of truth for the hosted D1 backend.
//
//   • `records`  — bare PostgresRecordModels → record types (json-models)
//   • `config`   — table models (records + indexes) → schema.sql (lockstep-sqlite)
//
// Mirrors the local bun:sqlite account-server: users / sessions / projects /
// assets / published. Primary keys are column-level (`primaryKey: true`); the
// table wrapper only adds indexes.
import type { PostgresRecordModel, PostgresTableModel } from "@lyku/lockstep-core";

const rec = <S extends PostgresRecordModel>(r: S) => r;

export const users = rec({
  properties: {
    id: { type: "bigserial", primaryKey: true },
    username: { type: "text", unique: true, minLength: 3 },
    password_hash: { type: "text" },
    created_at: { type: "bigint" }, // epoch ms
  },
  required: ["username", "password_hash", "created_at"],
});

export const sessions = rec({
  properties: {
    token: { type: "text", primaryKey: true },
    user_id: { type: "bigint" },
    created_at: { type: "bigint" },
  },
  required: ["user_id", "created_at"],
});

export const projects = rec({
  properties: {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "bigint" },
    name: { type: "text" },
    doc: { type: "jsonb" }, // Designer project JSON
    updated_at: { type: "bigint" },
  },
  required: ["user_id", "name", "doc", "updated_at"],
});

export const assets = rec({
  properties: {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "bigint" },
    name: { type: "text" },
    mime: { type: "text" },
    size: { type: "bigint" },
    data: { type: "bytea" }, // image bytes (BLOB)
    created_at: { type: "bigint" },
  },
  required: ["user_id", "name", "mime", "size", "data", "created_at"],
});

export const published = rec({
  properties: {
    slug: { type: "text", primaryKey: true },
    user_id: { type: "bigint" },
    doc: { type: "jsonb" }, // published page snapshot
    updated_at: { type: "bigint" },
  },
  required: ["user_id", "doc", "updated_at"],
});

// Version history (LYK-943): named, restorable project snapshots.
export const snapshots = rec({
  properties: {
    id: { type: "bigserial", primaryKey: true },
    user_id: { type: "bigint" },
    label: { type: "text" },
    doc: { type: "jsonb" }, // full Designer project blob at snapshot time
    created_at: { type: "bigint" },
  },
  required: ["user_id", "label", "doc", "created_at"],
});

// json-models can't represent `bytea`; the binary `data` column is read as raw
// bytes by the Worker, never as a JSON record field. Strip it from the record
// type while keeping it in the DB schema below.
const { data: _data, ...assetMetaProps } = assets.properties;
const assetMeta = {
  properties: assetMetaProps,
  required: assets.required.filter(r => r !== "data"),
};

// snapshot record type omits the heavy `doc` from list responses but keeps it
// for getSnapshot; json-models keeps the full record (doc is jsonb → object).

/** Bare records → json-models (record types). */
export const records = { users, sessions, projects, assets: assetMeta, published, snapshots };

/** Table models (records + indexes) → schema.sql via @lyku/lockstep-sqlite. */
const tbl = <S extends PostgresRecordModel>(m: PostgresTableModel<S>) => m;
export const config = {
  tables: {
    users: tbl({ schema: users }),
    sessions: tbl({ schema: sessions, indexes: ["user_id"] }),
    projects: tbl({ schema: projects, indexes: ["user_id"] }),
    assets: tbl({ schema: assets, indexes: ["user_id"] }),
    published: tbl({ schema: published }),
    snapshots: tbl({ schema: snapshots, indexes: ["user_id"] }),
  },
};
