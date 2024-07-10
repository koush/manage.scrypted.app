cd $(dirname $0)
cd ..
rm -rf public/vs
cp -R node_modules/monaco-editor/min/vs public/vs
