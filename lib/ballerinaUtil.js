'use babel';

import { _ } from 'lodash';

class BallerinaUtil {

    getSimpleName(className) {
        return className.replace(/[a-z]*\./g, '');
    }

    getPackageName(className) {
        return className.replace('.' + this.getSimpleName(className), '');
    }
}

export default new BallerinaUtil();
