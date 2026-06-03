// cPanel "Setup Node.js App" / VPS дээр ажиллуулах серверийн эхлэл файл.
// Passenger эсвэл орчин PORT-г process.env.PORT-оор дамжуулна.
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res, parse(req.url, true)))
    .listen(port, () => console.log(`> Ready on port ${port}`));
});
