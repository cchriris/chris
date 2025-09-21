const querystring = require('querystring');

const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;

    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(raw || '{}'));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
        return;
      }

      if (contentType.includes('application/x-www-form-urlencoded')) {
        resolve(querystring.parse(raw));
        return;
      }

      resolve(raw);
    });

    req.on('error', (error) => {
      reject(error);
    });
  });

module.exports = {
  parseBody,
};
