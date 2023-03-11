import { IPackConfig } from "ave-pack";

const config: IPackConfig = {
  build: {
    projectRoot: __dirname,
    target: "node14-win-x64",
    input: "./dist/_/_/app.js",
    output: "./bin/echo.exe",
    // set DEBUG_PKG=1
    debug: false, 
    edit: false
  },
  resource: {
    icon: "./assets/echo.ico",
    productVersion: "1.0.0",
    productName: "Echo",
    fileVersion: "1.0.0",
    companyName: "QberSoft",
    fileDescription: "A simple asr translator powered by avernakis react.",
    LegalCopyright: `© ${new Date().getFullYear()} QberSoft Copyright.`,
  },
};

export default config;
