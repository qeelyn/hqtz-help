/**
 * Created by menkey on 2017/12/27.
 */
//引入nodejs模块
var Fs = require('fs'),
  Asciidoctor = require('asciidoctor.js')(),
  Path = require('path');

//定义变量
var useDirName = false,   //使用文件夹名字作为菜单名   否则用文件里面的parent:xxx作为菜单名
  rootPath = __dirname,
  docPath = Path.join(rootPath, '..', 'doc'),
  dirPath = Path.join(rootPath, 'dir'),
  dirImagesPath = Path.join(rootPath, 'images'),
  docImagesPath = Path.join(rootPath, '..', 'images'),
  tree = [],
  headerHtml = Fs.readFileSync(rootPath + '/template/header.html', 'utf-8'),
  footerHtml = Fs.readFileSync(rootPath + '/template/footer.html', 'utf-8');

/**
 * 解析目录得到要生成的脚本
 * @param url
 * @param curTree
 */
function parsing(url, curTree) {
  let dir = Fs.readdirSync(url), length = dir.length;
  //路径处理
  for (let i = 0; i < length; i++) {
    let item = dir[i],
      curUrl = Path.join(url, item),
      json = {};
    //判断是文件夹还是文件
    if (Fs.lstatSync(curUrl).isDirectory()) {
      //文件夹先生成文件夹
      let newUrl = Path.join(dirPath, curUrl.replace(docPath, ''));
      if (!Fs.existsSync(newUrl)) {
        Fs.mkdirSync(newUrl);
      }
      if (useDirName) {
        json = {
          title: item,
          children: []
        };
        if (curTree instanceof Array) {
          curTree.push(json);
          parsing(curUrl, curTree[curTree.length - 1])
        } else {
          curTree.children.push(json);
          parsing(curUrl, curTree.children[curTree.children.length - 1])
        }
      } else {
        parsing(curUrl, curTree)
      }
    } else {
      //文件处理成json格式后面用于生成文件
      let file = Fs.readFileSync(curUrl, 'utf-8');
      if (useDirName) {
        json = getFileJson(url, item, file);
        if (json) {
          if (curTree instanceof Array) {
            curTree.push(json);
          } else {
            curTree.children.push(json);
          }
        }
      } else {
        getFileJson(url, item, file, curTree)
      }

    }
  }
}

/**
 * 得到文件json
 * @param url
 * @param fileName
 * @param file
 * @param curTree
 * source 来源地址， router 是生成地址  anchor是文件里面的锚  title是文件的标题  parent父标题
 * @returns {{source: string, router: string, anchor: Array, title: string, parent: string}}
 */
function getFileJson(url, fileName, file, curTree) {
  let str = file.toString(),
    strSplit = str.split('\n'),
    //文件第一行特殊定义
    strOne = strSplit[0].replace(/[\[|\]]/g, "").replace(/\r*/g, "").split(','),
    routerUrl = Path.join(dirPath, url.replace(docPath, '')),
    json = {
      source: Path.join(url, fileName),
      router: Path.join(routerUrl, fileName.split('.')[0] + '.html'),
      anchor: []
    };

  for (let i in strOne) {
    let item = strOne[i];
    if (typeof item == 'string') {
      let v = item.split(':')
      json[v[0]] = v[1];
    }
  }

  if (json.hide || (json.hide == 1)) {
    return null;
  }

  for (let i in strSplit) {
    let item = strSplit[i];
    if (typeof item == 'string') {
      if (item.indexOf('=') == 0 || item.indexOf('==') == 0 || item.indexOf('===') == 0) {
        //锚的处理
        let itemStr = item.replace(/=+/g, "");
        json.anchor.push('_' + itemStr.replace(/(^\s*)|(\s*$)/g, ""));
      }
    }
  }

  if (useDirName) {
    return json;
  } else {
    formatTree(json, curTree)
  }
}

/**
 * useDirName取消使用格式化数据
 * @param json
 * @param curTree
 */
function formatTree(json, curTree) {
  let isTrue = true;
  for (let i in curTree) {
    let item = curTree[i];
    if (item.title == json.parent) {
      isTrue = false;
      item.children.push(json);
      break;
    }
  }
  if (isTrue) {
    curTree.push({
      title: json.parent,
      children: [json]
    })
  }
}

/**
 * 创建html文件
 * @param data
 */
function buildHtmlFile(data) {
  for (let i in data) {
    let item = data[i];
    if (!item) {
      return;
    }
    if (item.children && item.children.length > 0) {
      buildHtmlFile(item.children);
    } else {
      if (item.source) {
        createHtml(item);
      }
    }
  }
}

/**
 * 设置一些html的布局
 * @param data   当前json对象解析的操作项
 */
function createHtml(data) {
  let context = Asciidoctor.convert(Fs.readFileSync(data.source, 'utf-8'));
  if (context) {
    let head = headerHtml, c = data.router.replace(dirPath, '').split('\\').length - 2;
    if (c > 0) {
      let layuiStr = '../layui/', styleStr = '../styles/';
      for (let i = 0; i < c; i++) {
        layuiStr = '../' + layuiStr;
        styleStr = '../' + styleStr;
      }
      head = headerHtml.toString().replace(/..\/layui\//g, layuiStr).replace(/..\/styles\//g, styleStr)
    }

    let html = head;
    // 菜单生成
    html += createMenuTree();
    // context 布局生成
    html += '<div class="doc-context">';
    html += '<h2>' + data.title + '</h2>';
    html += context;
    html += '</div>';
    html += '';
    html += footerHtml;
    Fs.createWriteStream(data.router, {
      encoding: 'utf8',
    }).write(html);
    console.log('生成:' + data.router)
  }
}

/**
 * 创建菜单树
 * @returns {string}
 */
function createMenuTree() {
  let html = '';
  html += '<ul class="layui-nav layui-nav-tree layui-nav-side">';
  for (let i in tree) {
    let item = tree[i];
    if (item.title) {
      let href = item.router ? item.router.replace(rootPath, '') : 'javascript:;';
      html += '<li class="layui-nav-item layui-nav-itemed">';
      html += '<a href="' + href + '">' + item.title + '</a>';
      if (item.children && item.children.length) {
        html += '<dl class="layui-nav-child">';
        for (let c in item.children) {
          let child = item.children[c];
          if (child.title) {
            let hf = child.router ? child.router.replace(rootPath, '') : 'javascript:;';
            html += '<dd><a href="' + hf + '">' + child.title + '</a></dd>';
          }
        }
        html += '</dl>';
      }
      html += '</li>';
    }
  }
  html += '</ul>';
  return html;
}

/**
 * 图片拷贝
 * @param path           图片来源路径
 * @param targetPath     图片存放路径
 */
function copyImages(path, targetPath) {
  let dirs = Fs.readdirSync(path), lenth = dirs.length;
  for (let i = 0; i < lenth; i++) {
    let item = dirs[i];
    let oldPath = Path.join(path, item);
    let newPath = Path.join(targetPath, item);
    //判断文件夹或者是文件
    if (Fs.lstatSync(oldPath).isDirectory()) {
      if (!Fs.existsSync(newPath)) {
        Fs.mkdirSync(newPath);
      }
      copyImages(oldPath, newPath);
    } else {
      Fs.copyFileSync(oldPath, newPath);
    }
  }
}

//预备处理
parsing(docPath, tree);
//复制图片
copyImages(docImagesPath, dirImagesPath);
//生成html
buildHtmlFile(tree);

