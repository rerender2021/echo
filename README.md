<p align="center">
    <img width="275" src="./docs/images/logo.png">
</p>

<div align="center">

[![build](https://github.com/rerender2021/echo/actions/workflows/build.yml/badge.svg?branch=main&event=push)](https://github.com/rerender2021/echo/actions/workflows/build.yml) [![pack](https://github.com/rerender2021/echo/actions/workflows/pack.yml/badge.svg?branch=main&event=push)](https://github.com/rerender2021/echo/actions/workflows/pack.yml)

 </div>
 
# 简介

回声 (Echo) 是一个简单的翻译器，原理：

-   使用语音识别，获得文字用于翻译。目前支持离线情况下，英文翻译成中文。
-   GUI 部分则是使用 [Ave React](https://qber-soft.github.io/Ave-React-Docs/) 开发的。

![echo-usage](./docs/images/echo-usage.png)

演示视频见:

- v1.0.0: [回声：实时英语语音翻译](https://www.bilibili.com/video/BV11L411d7HE/)

- v1.1.0: [回声更新：支持使用GPU & 长句分解](https://www.bilibili.com/video/BV1Qa4y1M7jV/)


# 使用说明

-   软件首页：https://rerender2021.github.io/products/echo/

# 开发者向

## 本地开发

```bash
> npm install
> npm run dev
```

开发过程中需要确保本机启动了语音识别服务器和翻译服务器。

-   语音识别服务器：[ASR-API 1.1.0](https://github.com/rerender2021/ASR-API/releases/download/1.1.0/asr-server-v1.1.0.zip)
-   翻译服务器：[NLP-API 1.0.1](https://github.com/rerender2021/NLP-API/releases/download/1.0.1/NLP-API-v1.0.1.zip)

下载它们，并解压到项目下，确保项目目录结构如下：

```
- nlp-server
    - NLP-API.exe
    - ...
- asr-server-v1.1.0
    - ASR-API.exe
    - ...
- src
- ...
- package.json
```

如需使用GPU：

- GPU翻译服务器：下载链接中的2个压缩分卷并解压缩（文件太大，只能分卷压缩上传）
  - [NLP-GPU-API 1.0.0](https://github.com/rerender2021/NLP-GPU-API/releases/tag/1.0.0) 


下载后，解压到项目下，确保项目目录结构如下：

```
- nlp-gpu-server
    - NLP-GPU-API.exe
    - ...
- asr-server-v1.1.0
    - ASR-API.exe
    - ...
- src
- ...
- package.json
```

## 功能扩展

运行过程中，语音识别和翻译会请求本地接口，因此，不使用以上离线服务器，而是自己起一个服务器对接在线 API，也可正常使用。

相关接口和数据结构约定见代码：

-   语音识别: [./src/asr/asr.ts](./src/asr/asr.ts)
-   翻译: [./src/nlp/helsinki-nlp.ts](./src/nlp/helsinki-nlp.ts)

## 打包发布

-   生成 exe

```bash
> npm run release
```

# 开源协议

[MIT](./LICENSE)

# 赞赏

`:)` 如果此软件值得赞赏，可以请作者看小说，一元足足可看八章呢。

<p align="left">
    <img width="300" src="https://rerender2021.github.io/assets/donate.jpg">
</p>
