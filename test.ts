import * as fs from 'fs';
import * as parser from './parser';
// tslint:disable-next-line:prefer-const
async function main() {
    const forum = JSON.parse(fs.readFileSync('228500.json').toString());
    for (let key in forum.postIds) {
        if (forum.postIds.hasOwnProperty(key) && !fs.existsSync('posts/' + forum.postIds[key] + '.json')) {
            console.log('Requesting ' + forum.postIds[key]);
            const post = await parser.getPost(forum.postIds[key]);
            fs.writeFileSync('posts/' + forum.postIds[key] + '.json', JSON.stringify(post));
            console.log('Requested ' + forum.postIds[key]);
        }
    }
}

function arraysEqual(a: any[], b: any[]): boolean {
    if (a === b) { return true; }
    if (a == null || b == null) { return false; }
    if (a.length !== b.length) { return false; }

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    a.sort();
    b.sort();

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

let temp;
while (!arraysEqual(temp, JSON.parse(fs.readFileSync('228500.json').toString()).postIds)) {
    main().then().catch((err) => console.error(err));
    const dir = fs.readdirSync('posts');
    temp = new Array<number>();
    for (const key in dir) {
        if (dir.hasOwnProperty(key)) {
            temp.push(parseInt(dir[key].split('.')[0], 10));
        }
    }
}
// parser.getForum('模拟城市').then((forum) => {
//     fs.writeFileSync(forum.id + '.json', JSON.stringify(forum));
// }).catch((err) => console.error(err));
