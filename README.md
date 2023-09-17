# Before developing in VS Code
- Make sure not to delete /.vscode and /apps/frontend/.vscode folders
- Install Vue Language Features (Volar) and Typescript Vue Plugin (Volar) extensions
- Disable @builtin TypeScript and JavaScript Language Features extension for the workspace
- Install ESLint extension
# How to build and run in production
- Pull the repo
- Make sure you have the correct .env file 
- npm ci
- npm run build
- Take these necessary files to deploy (maybe zip them for transfer)
- - .env
- - dist folder
- - package.json
- - package-lock.json
- - tsconfig.json
- - tsconfig-paths-bootstrap.js
- npm ci
- npm start

Alternative dev script (slower for some reason):

<small>`tsc-watch -p tsconfig.json --onSuccess \"npm start\" --onFirstSuccess \"npm --prefix ./frontend run dev\"`</small>

# TO DO
- Integrate Infisicial for managing environment variables