# 陵水投资信息展示

静态网站，介绍陵水产业方向、政策条件与项目准备事项。概念展示，非政府官方网站，不接收招商申请。

## GitHub Pages

在仓库 Settings → Pages 中选择 Deploy from a branch，分支选择 main，目录选择 /(root)，保存即可。

页面资源使用相对路径，支持 GitHub Pages 的仓库子目录地址。无需 npm、构建步骤或服务器。

## 内容维护

- index.html：文案、政策来源和结构。
- styles.css：样式。
- script.js：标签切换、政策展开和动画。
- language-switcher.js / language-switcher.css：已打包的 JellyRadio 五语言切换组件。支持中文、英语、俄语、法语、西班牙语，并在浏览器中记住选择。
- .nojekyll：静态文件直接发布。

本仓库保存可直接部署的静态文件。JellyRadio 的 React 源码、翻译词典和构建说明保存在维护者本地项目中，修改后需重新构建并上传两个 language-switcher 文件。仅修改 index.html 的中文内容不会自动生成其他语言译文。

原模板来源：https://github.com/vikod3/cloud_storage_ai_website

字体使用 Google Fonts。背景通过本地 cloud-compute.js 渲染，无需实时连接 fragcoord.xyz；cloud-compute-poster.png 是图形渲染不可用时的静态备用画面。背景不是陵水实景。政策说明不能替代原文及主管部门认定。

背景来源：Cloud Compute，作者 @XorDev，https://fragcoord.xyz/s/c6zisyc6 。原着色器未注明开放许可证，作者保留权利；此处保留来源与署名，不将其声明为开源授权。适配包含变量初始化、WebGL 1/2、渲染分辨率限制及上下文恢复。
