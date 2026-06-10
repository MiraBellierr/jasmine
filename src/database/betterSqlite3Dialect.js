const BetterSqlite3 = require("better-sqlite3");

const OPEN_READONLY = 1;
const OPEN_READWRITE = 2;
const OPEN_CREATE = 4;

function normalizeValue(value) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
}

function normalizeParameters(parameters) {
  if (!parameters) {
    return [];
  }

  if (Array.isArray(parameters)) {
    return parameters.map(normalizeValue);
  }

  return Object.fromEntries(
    Object.entries(parameters).map(([key, value]) => [
      key.replace(/^[$:@]/, ""),
      normalizeValue(value),
    ]),
  );
}

function execute(statement, method, parameters) {
  const normalizedParameters = normalizeParameters(parameters);

  if (Array.isArray(normalizedParameters)) {
    return normalizedParameters.length > 0
      ? statement[method](normalizedParameters)
      : statement[method]();
  }

  return Object.keys(normalizedParameters).length > 0
    ? statement[method](normalizedParameters)
    : statement[method]();
}

class Database {
  constructor(filename, mode, callback) {
    if (typeof mode === "function") {
      callback = mode;
      mode = OPEN_READWRITE | OPEN_CREATE;
    }

    this.filename = filename;

    try {
      this.database = new BetterSqlite3(filename, {
        readonly: (mode & OPEN_READWRITE) === 0,
        fileMustExist: (mode & OPEN_CREATE) === 0 && filename !== ":memory:",
      });

      process.nextTick(() => callback?.(null));
    } catch (error) {
      process.nextTick(() => callback?.(error));
    }
  }

  serialize(callback) {
    callback();
  }

  run(sql, parameters, callback) {
    if (typeof parameters === "function") {
      callback = parameters;
      parameters = [];
    }

    try {
      const result = execute(this.database.prepare(sql), "run", parameters);
      callback?.call(
        {
          changes: result.changes,
          lastID: Number(result.lastInsertRowid),
        },
        null,
      );
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }

    return this;
  }

  all(sql, parameters, callback) {
    if (typeof parameters === "function") {
      callback = parameters;
      parameters = [];
    }

    try {
      const statement = this.database.prepare(sql);

      if (!statement.reader) {
        const result = execute(statement, "run", parameters);
        callback?.call(
          {
            changes: result.changes,
            lastID: Number(result.lastInsertRowid),
          },
          null,
          [],
        );
        return this;
      }

      callback?.call({}, null, execute(statement, "all", parameters));
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }

    return this;
  }

  close(callback) {
    try {
      this.database?.close();
      callback?.(null);
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  }
}

module.exports = {
  Database,
  OPEN_CREATE,
  OPEN_READONLY,
  OPEN_READWRITE,
};
