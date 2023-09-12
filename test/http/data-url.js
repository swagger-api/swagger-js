import path from 'node:path';
import fs from 'node:fs';

const data = fs.readFileSync(path.join(__dirname, '../data/petstore.json')).toString('base64');
const dataURL = `data:application/json;base64,${data}`;

test('should support data URLs', async () => {
  const response = await fetch(dataURL);
  const jsonBody = await response.json();

  expect(jsonBody).toHaveProperty('swagger', '2.0');
});
