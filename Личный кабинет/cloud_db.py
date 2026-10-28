_SHARED_CLIENTS: dict[str, httpx.Client] = {}

def _get_shared_client(kind: str) -> httpx.Client:
    client = _SHARED_CLIENTS.get(kind)
    if client is None or client.is_closed:
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=60.0)
        client = httpx.Client(timeout=30.0, limits=limits)
        _SHARED_CLIENTS[kind] = client
    return client

"""Small sqlite-compatible adapter for Turso's documented SQL-over-HTTP API.

Only server-side environment variables contain credentials. Connections keep
their own transaction baton; uncertain writes are never automatically retried.
"""
from __future__ import annotations

import asyncio
import base64
import os
import sqlite3
from urllib.parse import urlparse

import httpx


def configured(kind: str) -> bool:
    url = os.environ.get(f"TURSO_{kind}_URL", "").strip()
    token = os.environ.get(f"TURSO_{kind}_TOKEN", "").strip()
    if bool(url) != bool(token):
        raise RuntimeError(f"Both TURSO_{kind}_URL and TURSO_{kind}_TOKEN are required")
    return bool(url)


class Row:
    def __init__(self, columns, values):
        self._columns = columns
        self._values = values

    def keys(self):
        return list(self._columns)

    def __getitem__(self, key):
        return self._values[self._columns.index(key)] if isinstance(key, str) else self._values[key]

    def __iter__(self):
        return iter(self._values)

    def __len__(self):
        return len(self._values)


def _decode(value):
    kind = value["type"]
    if kind == "null":
        return None
    if kind == "integer":
        return int(value["value"])
    if kind == "float":
        return float(value["value"])
    if kind == "blob":
        return base64.b64decode(value["base64"])
    return value["value"]


def _encode(value):
    if value is None:
        return {"type": "null"}
    if isinstance(value, (bool, int)):
        return {"type": "integer", "value": str(int(value))}
    if isinstance(value, float):
        return {"type": "float", "value": value}
    if isinstance(value, bytes):
        return {"type": "blob", "base64": base64.b64encode(value).decode("ascii")}
    return {"type": "text", "value": str(value)}


class Cursor:
    def __init__(self, result):
        columns = [col["name"] for col in result.get("cols", [])]
        self._rows = [Row(columns, [_decode(v) for v in row]) for row in result.get("rows", [])]
        self.rowcount = result.get("affected_row_count", 0)
        last_id = result.get("last_insert_rowid")
        self.lastrowid = int(last_id) if last_id is not None else None
        self._index = 0

    def fetchone(self):
        if self._index >= len(self._rows):
            return None
        row = self._rows[self._index]
        self._index += 1
        return row

    def fetchall(self):
        rows = self._rows[self._index:]
        self._index = len(self._rows)
        return rows

    def __iter__(self):
        return iter(self.fetchall())


class Connection:
    row_factory = None

    def __init__(self, kind: str, *, client=None):
        if not configured(kind):
            raise RuntimeError(f"Turso {kind} is not configured")
        url = os.environ[f"TURSO_{kind}_URL"].strip()
        host = urlparse(url).hostname or ""
        if not host.endswith(".turso.io") or urlparse(url).scheme not in {"https", "libsql", "turso"}:
            raise ValueError("Expected a secure Turso database URL")
        self._origin = f"https://{host}"
        self._endpoint = self._origin + "/v2/pipeline"
        self._is_shared_client = client is None
        self._client = client or _get_shared_client(kind)
        self._token = os.environ[f"TURSO_{kind}_TOKEN"]
        self._baton = None
        self._transaction = False
        self._closed = False

    def _request(self, requests):
        payload = {"requests": requests}
        if self._baton:
            payload["baton"] = self._baton
        try:
            response = self._client.post(self._endpoint, json=payload,
                                         headers={"Authorization": f"Bearer {self._token}"})
            response.raise_for_status()
            body = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            # Never expose request URLs, headers, SQL arguments or credentials.
            raise sqlite3.OperationalError("Cloud database request failed; no automatic write retry") from None
        self._baton = body.get("baton")
        base_url = body.get("base_url")
        if base_url:
            parsed = urlparse(base_url)
            if parsed.scheme != "https" or not (parsed.hostname or "").endswith(".turso.io"):
                raise sqlite3.OperationalError("Invalid cloud database redirect")
            self._endpoint = base_url.rstrip("/") + "/v2/pipeline"
        results = []
        for item in body.get("results", []):
            if item.get("type") == "error":
                code = item.get("error", {}).get("code", "DATABASE_ERROR")
                error = sqlite3.IntegrityError if "CONSTRAINT" in code else sqlite3.OperationalError
                raise error(f"Cloud database statement failed ({code})")
            results.append(item.get("response", {}).get("result", {}))
        return results

    def _execute(self, sql, args=()):
        result = self._request([{"type": "execute", "stmt": {"sql": sql, "args": [_encode(v) for v in args]}}])
        return Cursor(result[0])

    def execute(self, sql, args=()):
        if self._closed:
            raise sqlite3.ProgrammingError("Connection is closed")
        operation = sql.lstrip().split(None, 1)[0].upper() if sql.strip() else ""
        if operation == "PRAGMA" and any(p in sql.lower() for p in ("journal_mode", "busy_timeout", "synchronous")):
            return Cursor({})
        if operation in {"INSERT", "UPDATE", "DELETE", "REPLACE"} and not self._transaction:
            self._execute("BEGIN IMMEDIATE")
            self._transaction = True
        cursor = self._execute(sql, args)
        if operation == "BEGIN":
            self._transaction = True
        elif operation in {"COMMIT", "ROLLBACK", "END"}:
            self._transaction = False
        return cursor

    def executescript(self, script):
        self.commit()
        statement = ""
        for char in script:
            statement += char
            if char == ";" and sqlite3.complete_statement(statement):
                self.execute(statement)
                statement = ""
        if statement.strip():
            self.execute(statement)

    def executemany(self, sql, rows):
        rows = list(rows)
        if not rows:
            return Cursor({})
        if not self._transaction:
            self._execute("BEGIN IMMEDIATE")
            self._transaction = True
        total = 0
        for start in range(0, len(rows), 50):
            results = self._request([{"type":"execute", "stmt":{"sql":sql,"args":[_encode(v) for v in args]}}
                                     for args in rows[start:start+50]])
            total += sum(r.get("affected_row_count", 0) for r in results)
        return Cursor({"affected_row_count":total})

    def commit(self):
        if self._transaction:
            self._execute("COMMIT")
            self._transaction = False

    def rollback(self):
        if self._transaction:
            self._execute("ROLLBACK")
            self._transaction = False

    def close(self):
        if self._closed:
            return
        try:
            if self._baton:
                self._request([{"type": "close"}])
        finally:
            if not self._is_shared_client:
                self._client.close()
            self._closed = True


class AsyncCursor:
    def __init__(self, cursor):
        self._cursor = cursor
        self.rowcount = cursor.rowcount
        self.lastrowid = cursor.lastrowid

    async def fetchone(self):
        return self._cursor.fetchone()

    async def fetchall(self):
        return self._cursor.fetchall()


class AsyncConnection:
    def __init__(self, kind):
        self._connection = Connection(kind)

    async def execute(self, sql, args=()):
        return AsyncCursor(await asyncio.to_thread(self._connection.execute, sql, args))

    async def executemany(self, sql, rows):
        cursor = await asyncio.to_thread(self._connection.executemany, sql, rows)
        return AsyncCursor(cursor) if cursor else None

    async def commit(self):
        await asyncio.to_thread(self._connection.commit)

    async def rollback(self):
        await asyncio.to_thread(self._connection.rollback)

    async def close(self):
        await asyncio.to_thread(self._connection.close)
