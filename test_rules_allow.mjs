import {isBad} from './js/lb/rules.js';
const ok=['spicy run!','grape juice','Sussex streak','analysis paralysis','raccoon mode','cocktail hour','crisis averted','torpedo'];
const bad=['fuck this','sh1t','n1gg','rape','big anal','sexy','spic','f u c k','kys'];
console.log('false+',ok.filter(isBad),'missed',bad.filter(x=>!isBad(x)));
