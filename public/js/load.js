/**
 * 初始化服务
 * @param {string} filenameOrUrl
 * @param {boolean} isOnline
 * @description isOnline 为true时，filenameOrUrl为url，为false时，filenameOrUrl为文件名
 */
function initService(filenameOrUrl, isOnline = false) {
  // 设置marked
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, language) {
      const validLanguage = hljs.getLanguage(language)
        ? language
        : "javascript";
      return hljs.highlightAuto(validLanguage, code).value;
    },
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: true,
    smartLists: true,
    smartypants: true,
    xhtml: false,
  });
  if (isOnline) {
    fillMarkdownContentByOnlineFile(filenameOrUrl);
  } else {
    fillMarkdownContent(filenameOrUrl);
  }
}

/**
 * 通过在线文件填充markdown内容
 * @param {string} filenameOrUrl
 * @param {boolean} isOnline
 */
function fillMarkdownContentByOnlineFile(readmeUrl) {
  // 本地文件需要拼接路径
  fetchOnlineMdFile(readmeUrl)
    .then((data) => {
      initMarkedService(data);
    })
    .catch((error) => {
      console.log(error);
    });
}

/**
 * 获取本地md文件并填充markdown内容
 * @param {string} filename
 */
function fillMarkdownContent(filename) {
  let xmlhttp = window.XMLHttpRequest
    ? new XMLHttpRequest()
    : new ActiveXObject("Microsoft.XMLHTTP");
  // 得到服务器响应后，对得到的Markdown文档进行解析
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      const markdownContent = xmlhttp.responseText;
      initMarkedService(markdownContent);
    }
  };
  // 向服务器发送请求，获取你需要的Markdown文档
  xmlhttp.open("GET", "public/md/" + filename + ".md", true);
  xmlhttp.send();
}

/**
 * @param {string} markdownContent
 * @description 对md统一处理，包括处理md作者信息，处理img标签，设置code高亮，触发图片懒加载
 */
function initMarkedService(markdownContent) {
  const pattern = /^---([\s\S]*?)---/;
  const match = markdownContent.match(pattern);
  let updatedMarkdownContent = markdownContent;
  if (match) {
    const metadataBlock = match[0];
    // 从原始字符串中移除匹配到的部分
    updatedMarkdownContent = markdownContent.replace(metadataBlock, "");
    console.log("截取到的 metadataBlock:", metadataBlock);
  }
  let htmlStr = marked.marked(updatedMarkdownContent);
  // 处理img标签
  htmlStr = solveMdStr(htmlStr);
  document.getElementById("view").innerHTML = htmlStr;
  //  设置code高亮
  hljs.highlightAll();
  // 触发图片懒加载
  initObesrver();
}
/**
 * 处理md字符串
 * @param {string} mdStr
 * @description 将md字符串中的img标签的src属性替换为data-src属性，src属性设置为空字符串
 */
function solveMdStr(mdStr) {
  // 使用正则表达式匹配 <img> 标签的内容和 src 属性
  const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  mdStr = mdStr.replace(regex, (match, src) => {
    return match.replace(
      `src="${src}"`,
      `data-has-lazy-src=false data-src="${src}" src=""`
    );
  });
  return mdStr;
}

/**
 * 初始化图片懒加载
 * @description IntersectionObserver是浏览器内置的一个API，用于监听元素是否进入视口
 */
function initObesrver() {
  let imgs = document.querySelectorAll("img");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 元素进入视口
          let hasLaySrc = entry.target.getAttribute("data-has-lazy-src");
          if (hasLaySrc === "false") {
            entry.target.src = entry.target.getAttribute("data-src");
            entry.target.removeAttribute("data-src");
            entry.target.setAttribute("data-has-lazy-src", true);
          }
        }
      });
    },
    { threshold: 1 }
  );
  if (imgs.length > 0) {
    imgs.forEach((img) => {
      observer.observe(img);
    });
  }
}

/**
 * 获取在线md文件
 * @param {string} readmeUrl
 * @description readmeUrl为在线md文件的url,github返回的为json，其他为text
 */
function fetchOnlineMdFile(readmeUrl) {
  // 对GitHub的地址进行处理
  let isGithub = readmeUrl.includes("github.com") ? true : false;
  return new Promise((resolve, reject) => {
    fetch(readmeUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return isGithub ? response.json() : response.text();
      })
      .then((data) => {
        if (isGithub) {
          // 使用 TextDecoder 解码 Base64 编码的内容，指定字符集为 UTF-8
          const decodedContent = new TextDecoder("utf-8").decode(
            base64ToArrayBuffer(data.content)
          );
          console.log(decodedContent);
          resolve(decodedContent);
        } else {
          resolve(data);
        }
      })
      .catch((error) => reject(error));
  });
}

// 将 Base64 编码的字符串转换为 ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}
