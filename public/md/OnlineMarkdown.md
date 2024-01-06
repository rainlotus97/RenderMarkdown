# markdown渲染

## 一、涉及功能

- 图片懒加载——原生API方法监听可视窗口内容的加载
- 读取本地md文档（读取在线md需要自行解决跨域问题）——涉及marked解析
- code代码高亮——highlight处理样式

## 二、样式展示

### 2.1 表格

| 名称 | 必选 | 描述 |
| ---- | ---- | ---- |
| name | M    | 名称 |
| age  | O    | 年龄 |
| sex  | M    | 性别 |

### 2.2 代码块

```javascript
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
            console.log(entry.target);
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
```