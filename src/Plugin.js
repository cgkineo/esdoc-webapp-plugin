const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class Plugin {

  onStart(ev) {
    this._option = ev.data.option || {};
    this._option.scripts = [
      "./esdoc/jquery-3.3.1.min.js",
      "./esdoc/jquery.scrollTo.min.js",
      "./esdoc/webapp.js"
    ];
    this._option.styles = [
      "./esdoc/layout.css"
    ];
  }

  onHandleContent(ev) {
    if (path.extname(ev.data.fileName) !== '.html') return;
    const $ = cheerio.load(ev.data.content);
    for (const style of this._option.styles) {
      const src = `./webapp/css/${path.basename(style)}`;
      $('head').append(`<link rel="stylesheet" href="${src}"/>`);
    }
    for (const script of this._option.scripts) {
      const src = `./webapp/script/${path.basename(script)}`;
      $('head').append(`<script src="${src}"></script>`);
    }
    ev.data.content = $.html();
  }

  onPublish(ev) {
    for (const style of this._option.styles) {
      const outPath = `webapp/css/${path.basename(style)}`;
      const content = fs.readFileSync(path.join(__dirname, style)).toString();
      ev.data.writeFile(outPath, content);
    }
    for (const script of this._option.scripts) {
      const outPath = `webapp/script/${path.basename(script)}`;
      const content = fs.readFileSync(path.join(__dirname, script)).toString();
      ev.data.writeFile(outPath, content);
    }
  }

}

module.exports = new Plugin();
