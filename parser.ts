import { Post, Reply, Comment, User } from './index';
import * as cheerio from 'cheerio';
import * as request from 'request';

export interface Parser {
    parse(dom: Cheerio): any;
}

export class PostParser implements Parser {
    parse(dom: Cheerio): Post {
        let post = new Post();
        dom.find('.l_post').each((index, element) => {
            if (element.attribs['data-field'] !== undefined) {
                let data = JSON.parse(element.attribs['data-field']);
                let reply = new Reply();
                if (data.content.post_index === 0) {
                    post.user = new User();
                    post.user.id = data.author.user_id;
                    post.user.name = data.author.user_name;
                    // console.log(element.('.tail-info').text());
                    // post.time = new Date(dom.filter(element).first().first());
                }
                reply.id = data.content.post_id;
                reply.index = data.content.post_index;
                reply.content = data.content.content;
                reply.user = new User();
                reply.user.id = data.author.user_id;
                reply.user.name = data.author.user_name;
                post.replies.push(reply);
            }
        });
        return post;
    }
}

export class ReplyParser implements Parser {
    parse(dom: Cheerio): Reply {
        throw new Error("Method not implemented.");
    }
}

export class CommentParser implements Parser {
    parse(dom: Cheerio): Comment {
        throw new Error("Method not implemented");
    }
}

export function getPost(id: number): Promise<Post> {
    return new Promise<Post>((resolve, reject) => {
        request.get(
            'https://tieba.baidu.com/p/' + id, {},
            (error, response, body) => {
                if (response.statusCode === 200) {
                    let parser = new PostParser();
                    resolve(parser.parse(cheerio.load(body).root()));
                }
            }
        );
    });
}

getPost(3740030293).then(post => console.log(post)).catch(err => console.error(err));