#!/bin/zsh
cd validations || exit
npm version $1
npm publish --access=public
cd ../transformer || exit
npm version $1
npm publish --access=public
cd ..
git add .
git commit -m "publish version"