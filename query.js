const pg = require('pg');
const fs = require('fs');
const getDate = require('./getDate').now;
const uuid = require('uuid').v1;

// ensure the pool is unique (allow multiple applications to use it)
const key = 'fr.wemake.query';
const symbol = Symbol.for(key);
const alreadyDefined = (Object.getOwnPropertySymbols(global).indexOf(symbol) > -1);
if (!alreadyDefined)
  global[symbol] = {};
const pool = global[symbol];

const queries = {};

const error = function(reject, err, source) {
  console.log(getDate());
  if (source)
    console.log(source);
  console.log(err);
  reject(err);
};

const cancel = function(queryUuid) {
  const query = queries[queryUuid];
  if (query) {
    query.cancel();
    delete queries[queryUuid];
  }
};

const buildQuery = function(dbConfig, sql, cancelable) {
  return new Promise(function(workResolve, workReject) {
    if (dbConfig === undefined || sql === undefined) {
      console.log('dbConfig:', dbConfig, 'query', sql);
      error(workReject, new Error('query.js: wrong number of arguments, should be: query(dbConfig, sql, cancelable)'));
    } else {
      const queryUuid = uuid();

      let databasePool = pool[dbConfig.database];
      if (!databasePool)
        databasePool = pool[dbConfig.database] = new pg.Pool(Object.assign({}, dbConfig));

      databasePool.connect((err, client, release) => {
        if (err)
          error(workReject, err, sql);
        else {
          const data = new Promise(function(dataResolve, dataReject) {
            const query = client.query(new pg.Query(sql), (err, result) => {
              release();
              delete queries[queryUuid];
              if (err) {
                if (!cancelable || err.code !== '57014') {
                  dataReject();
                  error(workReject, err, sql);
                }
                else
                  dataResolve();
              }
              else
                dataResolve(result.rows);
            });
            queries[queryUuid] = query;
          });
          workResolve({data, cancel: cancel.bind(null, queryUuid)});
        }
      });
    }
  });
};

const work = function(dbConfig, sql, cancelable=false) {
  let result = buildQuery(dbConfig, sql, cancelable);

  if (!cancelable)
    result = result.then(function({data}) {
      return data;
    });

  return result;
};

const sql = function(dbConfig, query, cancelable) {
  return work(dbConfig, query, cancelable);
};

const script = function(dbConfig, file, cancelable) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, {encoding: 'utf8'}, function(err, query) {
      if (err)
        error(reject, err, file);
      else
        if (query !== '')
          work(dbConfig, query, cancelable).then(resolve, reject);
      else
        resolve([]);
    });
  });
};

const end = function() {
  return Promise.all(Object.keys(pool).map(function(db) {
    return new Promise(function(resolve) {
      const p = pool[db];
      delete pool[db];
      p.end(resolve);
    });
  }));
};

module.exports = {sql, script, end};
