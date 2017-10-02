import * as cheerio from 'cheerio';
import * as request from 'request';
request.get(
    'https://tieba.baidu.com/p/5351904467', {},
    (error, response, body) => {
        let dom = cheerio.load(body);
        console.log(dom('.d_post_content').text().trim());
    }
);