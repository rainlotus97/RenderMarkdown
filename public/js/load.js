/**
 * 初始化服务
 * @param {string} filenameOrUrl
 * @param {boolean} isOnline 
 * @description isOnline 为true时，filenameOrUrl为url，为false时，filenameOrUrl为文件名
 */
function initService(filenameOrUrl, isOnline=false) {
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
  this.fillMarkdownContentByOnlineFile(filenameOrUrl, isOnline);
}

/**
 * 通过在线文件填充markdown内容
 * @param {string} filenameOrUrl
 * @param {boolean} isOnline
 * @description 针对md作者信息单独处理，md作者信息需要放在md文件的头部，以---开头，以---结尾
 */
function fillMarkdownContentByOnlineFile(filenameOrUrl, isOnline) {
  // 本地文件需要拼接路径
  let readmeUrl = isOnline
    ? filenameOrUrl
    : "/public/md/" + filenameOrUrl + ".md";
  console.log("readmeUrl:", readmeUrl);
  fetchOnlineMdFile(readmeUrl)
    .then((data) => {
      const markdownContent = data;
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
    })
    .catch((error) => {
      console.log(error);
    });
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

function fetchOnlineMdFile(readmeUrl) {
  return new Promise((resolve, reject) => {
    fetch(readmeUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => reject(error));
  });
}
