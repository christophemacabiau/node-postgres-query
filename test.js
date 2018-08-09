const request = require('./query').sql;
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'christophe',
  password: 'cemyzaf3',
  database: 'postgres',
  max: 2
};

const start = Date.now();

var r1 = request(dbConfig, 'select pg_sleep(1) as sleep1', true);
var r2 = request(dbConfig, 'select pg_sleep(2) as sleep2', true);
var r3 = request(dbConfig, 'select pg_sleep(3) as sleep3', true);

r1.then(({data, cancel}) => {
  cancel();
  data.then(d => console.log('r1', (Date.now()-start)/1000, d), console.log);
});
r2.then(({data, cancel}) => {
  cancel();
  data.then(d => console.log('r2', (Date.now()-start)/1000, d));
});
r3.then(({data, cancel}) => {
  cancel();
  data.then(d => console.log('r3', (Date.now()-start)/1000, d));
});
