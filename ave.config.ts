import { IPackConfig } from "ave-pack";

const config: IPackConfig = {
  build: {
    projectRoot: __dirname,
    target: "node14-win-x64",
    input: "./build/src/app.js",
    output: "./bin/ave-react-app.exe",
    // debug: true,
    edit: false
  },
  resource: {
    icon: "./assets/ave.ico",
    productVersion: "0.0.1",
    productName: "Ave React Template App",
    fileVersion: "0.0.1",
    companyName: "QberSoft",
    fileDescription: "The Template App of Ave React",
    LegalCopyright: `© ${new Date().getFullYear()} Ave React Copyright.`,
  },
};

export default config;
