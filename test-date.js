const { z } = require('zod');
const schema = z.string().datetime();
try {
  console.log(schema.parse(new Date().toISOString()));
  console.log("Success with toISOString");
} catch (e) {
  console.log(e.errors);
}
