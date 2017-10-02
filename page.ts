import { User } from './index';

export class Post {
    id: number;
    user: User;
    replies: Reply[] = new Array<Reply>();
    time: Date;
}

export class Reply {
    id: number;
    index: number;
    user: User;
    content: string;
    comments: Comment[];
    time: Date;
}

export class Comment {
    user: User;
    content: string;
    time: Date;
}