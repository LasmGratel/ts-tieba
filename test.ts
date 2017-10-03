import * as fs from 'fs';
import * as parser from './parser';
// tslint:disable-next-line:no-console
parser.getPost(3740030293).then((post) => {
    fs.writeFileSync(post.id + '.json', JSON.stringify(post));
}).catch((err) => console.error(err));
