/**
 * Created by menkey on 2017/12/27.
 */
const Fs = require('fs')
const Path = require('path')
const Asciidoctor = require('asciidoctor.js')()

let html = Asciidoctor.convert(Fs.readFileSync(Path.join(__dirname, '..', 'doc', '01_ims.adoc'), 'utf-8'));

console.log(html);

// let Menu = require('./config.json'),
//   rootPath = __dirname,
// rootDirPath = rootPath + '/dir/',
// headerHtml = Fs.readFileSync(rootPath + '/template/header.html', 'utf-8'),
// footerHtml = Fs.readFileSync(rootPath + '/template/footer.html', 'utf-8');
//
// /**
//  * 创建文件
//  * @param data
//  */
// function buildHtmlFile(data) {
//   for (let i in data) {
//     let item = data[i];
//     if (!item) {
//       return;
//     }
//     if (item.children && item.children.length > 0) {
//       buildHtmlFile(item.children);
//     } else {
//       if (item.source) {
//         let html = Asciidoctor.convert(Fs.readFileSync(rootPath + '/' + item.source, 'utf-8'));
//         if (html) {
//           let htmlPath = rootDirPath + item.router + '.html';
//           Fs.createWriteStream(htmlPath, {
//             encoding: 'utf8',
//           }).write(createHtml(html, item));
//           console.log('生成:' + htmlPath)
//         }
//       }
//     }
//   }
//
// }
//
// /**
//  * 设置一些html的布局
//  * @param context   文档
//  * @param curData   当前json对象解析的操作项
//  * @returns {*}
//  */
// function createHtml(context, curData) {
//   let html = headerHtml;
//   // 菜单生成
//   html += createMenuTree();
//   // context 布局生成
//   html += '<div class="doc-context">';
//   html += '<h2>' + curData.title + '</h2>';
//   html += context;
//   html += '</div>';
//   html += '';
//   html += footerHtml;
//   return html;
// }
//
// /**
//  * 创建菜单树
//  * @returns {string}
//  */
// function createMenuTree() {
//   let html = '';
//   html += '<ul class="layui-nav layui-nav-tree layui-nav-side">';
//   for (let i in Menu) {
//     let item = Menu[i];
//     if (item.title) {
//       html += '<li class="layui-nav-item layui-nav-itemed">';
//       html += '<a href="' + (item.router ? (item.router + '.html') : ('javascript:;')) + '">' + item.title + '</a>';
//       if (item.children && item.children.length) {
//         html += '<dl class="layui-nav-child">';
//         for (let c in item.children) {
//           let child = item.children[c];
//           if (child.title) {
//             html += '<dd><a href="' + child.router + '.html">' + child.title + '</a></dd>';
//           }
//         }
//         html += '</dl>';
//       }
//       html += '</li>';
//     }
//   }
//   html += '</ul>';
//   return html;
// }
//
// /**
//  * 图片拷贝
//  * @param path           图片来源路径
//  * @param targetPath     图片存放路径
//  */
// function copyImages(path, targetPath) {
//   let dirs = Fs.readdirSync(path), lenth = dirs.length;
//   for (let i = 0; i < lenth; i++) {
//     let item = dirs[i];
//     let oldPath = path + '/' + item;
//     let newPath = targetPath + '/' + item;
//     //判断文件夹或者是文件
//     if (Fs.lstatSync(oldPath).isDirectory()) {
//       if (!Fs.existsSync(newPath)) {
//         Fs.mkdirSync(newPath);
//       }
//       copyImages(oldPath, newPath);
//     } else {
//       Fs.copyFileSync(oldPath, newPath);
//     }
//   }
// }
//
// copyImages(rootPath + '/../images', rootPath + '/images');
// buildHtmlFile(Menu);
