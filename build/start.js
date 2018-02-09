/**
 * 准备使用include来做获取处理
 */

//引入nodejs模块
var Fs = require('fs'),
  Asciidoctor = require('asciidoctor.js')(),
  Path = require('path');

//定义变量
var menuPrefix = '/hqtz-help/build/',
  dirName = 'startDir',
  nav = [],  //菜单会生成在config.json下做异常对比处理
  rootPath = Path.join(__dirname, '..'),
  buildPath = Path.join(rootPath, 'build'),
  buildDirPath = Path.join(rootPath, 'build', dirName),
  buildDocPath = Path.join(rootPath, 'doc'),
  buildImagesPath = Path.join(rootPath, 'build', 'images'),
  imagesPath = Path.join(rootPath, 'images');

//头尾模板
var headerHtml = Fs.readFileSync(rootPath + '/build/template/startHeader.html', 'utf-8'),
  footerHtml = Fs.readFileSync(rootPath + '/build/template/startFooter.html', 'utf-8');

/**
 * 生成配置和生产html
 * @param url
 * @param tree
 */
function parseFileInclude(url, tree) {
  let fileStr = Fs.readFileSync(url, 'utf-8').toString();
  let basePath = url.match(/((.*)\/)|((.*)\\)/g);
  basePath = basePath && basePath[0];
  let result = getConfigAndContext(fileStr);
  for (let i in result.config) {
    let item = result.config[i];
    if (item && item.source) {
      item.source = Path.join(basePath, item.source);
      item.router = dirName + item.source.replace(buildDocPath, '').replace(/((\.adoc)|(\.asciidoc))/g, '.html');
      parseFileInclude(item.source, item.children);
      //tree
      tree.push(item);
    }
  }
  // all
  // tree.push(result);
}

/**
 * 解析当前文件的内容生成需要的对象
 * @param fileStr
 * @returns {{context: string, config: Array}}
 */
function getConfigAndContext(fileStr) {

  let fileStrArray = fileStr.split('\n'), result = {
    context: '',
    config: []
  };

  for (let i in fileStrArray) {
    let item = fileStrArray[i];
    if (item && ( typeof item == 'string' ) && item.indexOf('include::') > -1) {
      let json = {
        children: []
      };
      let source = item.match(/(::)[^]*((adoc)|(asciidoc))/g);
      let config = item.match(/(\[)[^]*(\])/g);
      if (source && source.length) {
        json.source = source[0].replace(/::/g, '');
      }
      if (config && config.length) {
        config = config[0];
        let configArray = config.replace(/(\[)|(\])/g, '').split(',');
        for (let a in configArray) {
          let aItem = configArray[a];
          if (aItem && (typeof aItem == 'string')) {
            let v = aItem.split(':');
            json[v[0]] = v[1];
          }
        }
      }
      result.config.push(json);
    } else if (item && ( typeof item == 'string' )) {
      result.context += item + '\n';
    }
  }

  return result;
}

/*********************************************************************************************
 *         layout
 */

function create(tree) {
  for (let i in tree) {
    let item = tree[i];
    if (item.source) {
      createHtml(item);
    }
    if (item.children && item.children.length) {
      create(item.children)
    }
  }
}

/**
 * 设置一些html的布局
 * @param data   当前json对象解析的操作项
 */
function createHtml(data) {
  let fileStr = getConfigAndContext(Fs.readFileSync(data.source, 'utf-8').toString()).context,
    context;
  fileStr = trim(fileStr);
  if (fileStr && fileStr.length != 0) {
    context = Asciidoctor.convert(fileStr);
  }

  let html = layoutTemplate(data, context);
  if (html) {
    let buildUrl = Path.join(buildPath, data.router);
    createFolder(buildUrl);
    Fs.createWriteStream(buildUrl, {
      encoding: 'utf8',
    }).write(html);
    console.log('生成:' + buildUrl)
  }
}

/**
 * 有内容和没内容的模板
 * @param data
 * @param context
 */
function layoutTemplate(data, context) {

  let head = headerHtml, c = data.router.split('\\').length - 2;
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
  html += '<div class="navDiv">';
  html += createMenuTree(nav);
  html += '</div>';
  // context 布局生成
  html += '<div class="doc-context">';
  html += '<h2>' + data.title + '</h2>';
  if (data.children && data.children.length) {
    for (let i in data.children) {
      let item = data.children[i];
      if (item.title) {
        let href = item.router ? menuPrefix + item.router : 'javascript:;';
        html += '<h3><a href="' + href + '">';
        html += (i + 1) + '. ' + item.title;
        html += '</h3></a>';
      }
    }
  }
  html += context;
  html += '</div>';
  html += '';
  html += footerHtml;

  return html;
}

/**
 * 创建菜单树
 * @returns {string}
 */
function createMenuTree(data, n) {
  let html = '';
  n = n ? n : 0;
  html += '<ul class="navDiv-ul">';
  for (let i in data) {
    let item = data[i];
    if (item.title) {
      let isChild = item.children && item.children.length;
      let href = item.router ? menuPrefix + item.router : 'javascript:;';
      //处理如果有子栏目的跳过不进入
      href = isChild ? 'javascript:;' : href;
      html += '<li class="navDiv-li" >';
      html += '<a ' + (isChild ? 'class="a-isChild"' : '' ) + ' href="' + href + '" style="padding: 8px ' + (n ? (n + 1) * 10 : 10) + 'px">' + item.title + '</a>';
      if (isChild) {
        html += '<span class="navDiv-down"><i class="yakIcon yakIcon-xia1"></i></span>';
        html += createMenuTree(item.children, n + 1);
      }
      html += '</li>';
    }
  }
  html += '</ul>';
  return html;
}

/**
 * 创建文件夹
 * @param createPath
 */
function createFolder(createPath) {
  let pathArray = createPath.replace(rootPath, '').split('\\'), curPath = rootPath;
  for (let i in pathArray) {
    let item = pathArray[i];
    if (item && typeof item == 'string' && !(item.indexOf('.html') > -1)) {
      curPath = Path.join(curPath, item);
      if (curPath.indexOf(buildDirPath) > -1) {
        if (!Fs.existsSync(curPath)) {
          Fs.mkdirSync(curPath);
        }
      }
    }
  }
}

/**
 * 去空格去回车
 * @param str
 * @returns {XML|string|void|*}
 */
function trim(str) {
  return str.replace(/(^\n*)|(\n*$)/g, "").replace(/(^\s*)|(\s*$)/g, "").replace(/(^\r*)|(\r*$)/g, "");
};

//创建打包目录
createFolder(buildDirPath);
//生成nav菜单对象
parseFileInclude(Path.join(rootPath, 'inlet.adoc'), nav);
//生成到nav配置config.json文件中
Fs.writeFileSync(Path.join(rootPath, 'build', 'config.json'), JSON.stringify(nav));
//生成html
create(nav);
