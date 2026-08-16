const { Client } = require('pg');
const client = new Client('postgresql://postgres:postgres@localhost:54322/postgres');
client.connect()
  .then(() => client.query("SELECT pg_get_functiondef(p.oid) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'reset_student_exam';"))
  .then(res => {
    console.log(res.rows);
    client.end();
  })
  .catch(e => {
    console.error(e);
    client.end();
  });
