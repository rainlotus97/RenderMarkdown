// 用于解析Markdown文档
function fillMarkdownContent(filename, online = false) {
  var xmlhttp;
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
  if (window.XMLHttpRequest) {
    // IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
    xmlhttp = new XMLHttpRequest();
  } else {
    // IE6, IE5 浏览器执行代码
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  // 得到服务器响应后，对得到的Markdown文档进行解析
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      const markdownContent = xmlhttp.responseText;
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
  };
  // 向服务器发送请求，获取你需要的Markdown文档
  if (online) {
    xmlhttp.open("GET", filename, true);
  } else {
    xmlhttp.open("GET", "public/md/" + filename + ".md", true);
  }
  xmlhttp.send();
}

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
