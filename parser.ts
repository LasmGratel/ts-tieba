import * as cheerio from 'cheerio';
import * as request from 'request';
import { Comment, Post, Reply, User } from './index';

const parseScript = require('shift-parser').parseScript;

export interface Parser {
    parse(dom: Cheerio, html?: string): any;
}

export class PostParser implements Parser {
    public async parse(dom: Cheerio, html: string): Promise<Post> {
        const post = new Post();
        post.id = parseInt(dom.find('link').eq(2).attr('href').substring('//tieba.baidu.com/p/'.length), 10);
        let PageData: any;
        eval('PageData = {};PageData.forum = {};' + html.substring(html.indexOf('PageData.forum'), html.indexOf('var commonPageDataUser', html.indexOf('PageData.forum') - 1)));
        post.forum.id = parseInt(PageData.forum.id);
        post.forum.name = PageData.forum.name;
        post.forum.firstClass = PageData.forum.first_class;
        post.forum.secondClass = PageData.forum.second_class;
        post.forum.memberCount = parseInt(PageData.forum.member_count);
        post.forum.memberName = PageData.forum.member_name;
        post.forum.postNum = parseInt(PageData.forum.post_num);
        post.forum.avatar = PageData.forum.avatar;
        for (let i = 0; i < dom.find('.l_post').length; i++) {
            const element = dom.find('.l_post')[i];
            if (element.attribs['data-field'] !== undefined) {
                const data = JSON.parse(element.attribs['data-field']);
                const reply = new Reply();
                if (data.content.post_no === 1) {
                    post.user = new User();
                    post.user.id = data.author.user_id;
                    post.user.name = data.author.user_name;
                    // console.log(element.('.tail-info').text());
                    // post.time = new Date(dom.filter(element).first().first());
                }
                reply.id = data.content.post_id;
                reply.index = data.content.post_no;
                reply.content = data.content.content;
                reply.user = new User();
                reply.user.id = data.author.user_id;
                reply.user.name = data.author.user_name;
                post.replies.push(reply);
            }
        }
        const href = dom.find('li.l_pager.pager_theme_5.pb_list_pager').first().children().last().attr('href');
        const pages = parseInt(href.substring(href.lastIndexOf('=') + 1), 10);
        for (let i = 2; i <= pages; i++) {
            post.replies = post.replies.concat(await this.parsePage(post.id, i));
        }
        return post;
    }

    private async parsePage(id: number, index: number): Promise<Reply[]> {
        const dom = await getPage(id, index);
        const replies = new Array<Reply>();
        for (let i = 0; i < dom.find('.l_post').length; i++) {
            const element = dom.find('.l_post')[i];
            if (element.attribs['data-field'] !== undefined) {
                const data = JSON.parse(element.attribs['data-field']);
                const reply = new Reply();
                reply.id = data.content.post_id;
                reply.index = data.content.post_no;
                reply.content = data.content.content;
                reply.user = new User();
                reply.user.id = data.author.user_id;
                reply.user.name = data.author.user_name;
                replies.push(reply);
            }
        }
        return replies;
    }
}

export class ReplyParser implements Parser {
    public parse(dom: Cheerio): Reply {
        throw new Error('Method not implemented.');
    }
}

export class CommentParser implements Parser {
    public parse(dom: Cheerio): Comment {
        throw new Error('Method not implemented');
    }
}

async function getPage(id: number, index: number): Promise<Cheerio> {
    return new Promise<Cheerio>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/p/' + id + '?pn=' + index, {},
            (error, response, body) => {
                if (response.statusCode === 200) {
                    resolve(cheerio.load(body, { xmlMode: false }).root());
                }
            },
        );
    });
}

export function getPost(id: number): Promise<Post> {
    return new Promise<Post>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/p/' + id, {},
            (error, response, body) => {
                if (response !== undefined && response.statusCode === 200) {
                    const parser = new PostParser();
                    resolve(parser.parse(cheerio.load(body, { xmlMode: false }).root(), body));
                } else {
                    reject(error);
                }
            },
        );
    });
}
