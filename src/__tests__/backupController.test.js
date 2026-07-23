import { describe, expect, it } from 'vitest';
import { buildTerminateDatabaseConnectionsSql } from '../../server/controllers/backupController.js';

describe('buildTerminateDatabaseConnectionsSql', () => {
  it('escapes single quotes in database names before terminating sessions', () => {
    const sql = buildTerminateDatabaseConnectionsSql("db'name");

    expect(sql).toContain("datname = 'db''name'");
    expect(sql).toContain('pg_terminate_backend(pid)');
  });
});
