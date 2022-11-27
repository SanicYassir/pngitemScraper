const puppeteer = require("puppeteer");
const imageDownloader = require("node-image-downloader");

const fs = require("fs");

let args = {
  thread: process.argv[2],
  page: !process.argv[3] ? "" : process.argv[3],
};

if (!args.thread) {
  console.log("node sanic.js [thread] [page]");
  console.log("OR");
  console.log("node sanic.js [thread] [fromPage]-[toPage]");
  process.exit(1);
}

const scraper = (thread, numPage, folderName) => {

  const url = `https://www.pngitem.com/so/${thread}/${numPage === 1 ? "" : numPage + "/"}`;
  console.log({ url });
  let srcs;

  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    srcs = await page.evaluate(() => {
      data = Array.from(document.querySelectorAll("img.lazy")).map((a) => {
        const regex1 = /[/]png./i;
        const regex2 = /[/]s[/]/i;
        let r = a.dataset.original.replace(regex1, "/www.");
        r = r.replace(regex2, "/b/");
        return r;
      });

      return data;
    });
    console.log(srcs);

    await browser.close();

    if (!fs.existsSync(`./images/threads/${thread}`)) {
      fs.mkdirSync(`./images/threads/${thread}`);
    }

    if (!fs.existsSync(`./images/threads/${thread}/${folderName}`)){
      fs.mkdirSync(`./images/threads/${thread}/${folderName}`);
    }

    let options = {
      imgs: srcs.map((src) => ({ uri: src })),
      dest: `./images/threads/${thread}/${folderName}`,
    };

    console.log("Images count : " + options.imgs.length);
    console.log(options);

    imageDownloader(options)
      .then((info) => {
        console.log("all done", info);
      })
      .catch((error) => {
        console.log("something goes bad!");
        console.log(error);
      });
  })();
};

const createDir = () => {
  if (!fs.existsSync(`./images`)) {
    fs.mkdirSync(`./images/`);
  }

  if (!fs.existsSync("./images/threads")) {
    fs.mkdirSync("./images/threads");
  }
};

function main() {
  createDir();
  const page = args.page

  if(page.includes('-')){
    const [fromPage, toPage] = page.split("-")
    for (let i = fromPage; i <= toPage; i++) {
      scraper(args.thread, i, page);
    }
  }else{
    scraper(args.thread, page, page);
  }
}

main()