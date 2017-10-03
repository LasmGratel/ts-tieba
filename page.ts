import { User } from './index';

export class Forum {
    public id: number;
    public name: string;
    public avatar: URL;
    public firstClass: string;
    public secondClass: string;
    public memberCount: number;
    public memberName: string;
    public postNum: number;
}

export class Post {
    public id: number;
    public forum: Forum = new Forum();
    public user: User;
    public replies: Reply[] = new Array<Reply>();
    public time: Date;
}

export class Reply {
    public id: number;
    public index: number;
    public user: User;
    public content: string;
    public comments: Comment[];
    public time: Date;
}

export class Comment {
    public user: User;
    public content: string;
    public time: Date;
}
