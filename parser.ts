import * as cheerio from 'cheerio';
import * as request from 'request';
import { URL } from 'url';
import { Comment, Forum, Post, Reply, User } from './index';

export interface Parser {
    parse(dom: Cheerio, html?: string): any;
}

export class PostParser implements Parser {
    public async parse(dom: Cheerio, html: string): Promise<Post> {
        const post = new Post();
        post.id = parseInt(dom.find('link').eq(2).attr('href').substring('//tieba.baidu.com/p/'.length), 10);
        post.forumId = parseInt(html.substring(html.indexOf('id:') +
            'id:'.length, html.indexOf('"', html.indexOf('id:') + 6)).replace('"', ''), 10);
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
        if (href !== undefined) {
            const pages = parseInt(href.substring(href.lastIndexOf('=') + 1), 10);
            for (let i = 2; i <= pages; i++) {
                post.replies = post.replies.concat(await this.parsePage(post.id, i));
            }
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

export class ForumParser implements Parser {
    public async parse(dom: Cheerio, html?: string): Promise<Forum> {
        const forum = new Forum();
        let PageData: any;
        PageData = {};
        PageData.forum = {};
        // tslint:disable-next-line:no-eval
        eval(html.substring(html.indexOf('PageData.forum'),
            html.indexOf('};', html.indexOf('PageData.forum'))) + '};');
        forum.id = PageData.forum.id;
        forum.name = PageData.forum.name;
        forum.firstClass = PageData.forum.first_class;
        forum.secondClass = PageData.forum.second_class;
        forum.memberCount = parseInt(dom.find('.card_menNum').text().replace(',', ''), 10);
        const avatar = dom.find('.card_head_img').attr('src');
        forum.avatar = new URL(avatar.substring(avatar.lastIndexOf('http'))
            .replace('%3A%2F%2F', '://').replace('%2F', '/'));
        const tits = dom.find('a.j_th_tit');
        for (let i = 0; i < tits.length; i++) {
            forum.postIds.push(parseInt(tits.eq(i).attr('href').substring('/p/'.length), 10));
        }
        const href = dom.find('a.last.pagination-item').attr('href');
        for (let i = 50; i <= parseInt(href.substring(href.indexOf('pn=') + 'pn='.length), 10); i += 50) {
            forum.postIds = forum.postIds.concat(await this.parsePage(forum.name, i));
        }
        return forum;
    }

    private async parsePage(name: string, index: number): Promise<number[]> {
        const dom = await getForumPage(name, index);
        const array = new Array<number>();
        const tits = dom.find('a.j_th_tit');
        for (let i = 0; i < tits.length; i++) {
            array.push(parseInt(tits.eq(i).attr('href').substring('/p/'.length), 10));
        }
        console.log('Parsed ' + index);
        return array;
    }
}

async function getForumPage(name: string, index: number): Promise<Cheerio> {
    return new Promise<Cheerio>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/f?kw=' + encodeURI(name) + '&pn=' + index, {},
            (error, response, body) => {
                if (response !== undefined && response.statusCode === 200) {
                    resolve(cheerio.load(body, { xmlMode: false }).root());
                }
            },
        );
    });
}

async function getPage(id: number, index: number): Promise<Cheerio> {
    return new Promise<Cheerio>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/p/' + id + '?pn=' + index, {},
            (error, response, body) => {
                if (response !== undefined && response.statusCode === 200) {
                    resolve(cheerio.load(body, { xmlMode: false }).root());
                }
            },
        );
    });
}

export function getForum(name: string): Promise<Forum> {
    return new Promise<Forum>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/f?kw=' + encodeURI(name), {},
            (error, response, body) => {
                if (response !== undefined && response.statusCode === 200) {
                    const parser = new ForumParser();
                    resolve(parser.parse(cheerio.load(body, { xmlMode: false }).root(), body));
                } else {
                    reject(error);
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
