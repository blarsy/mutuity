const fs = require("fs");
const ts = require("typescript");
const path = require("path");

const dirs = ["mobile-app/src/screens", "mobile-app/src/components", "mobile-app/src/navigation"];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith(".tsx") && !fullPath.endsWith(".stories.tsx") && !fullPath.endsWith(".test.tsx")) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = dirs.flatMap(getFiles);
const results = [];

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function isTranslatedCall(node) {
    let curr = node.parent;
    while (curr) {
      if (ts.isCallExpression(curr)) {
        const fn = curr.expression.getText(sourceFile);
        if (fn === "t" || fn.endsWith(".t")) {
          // If this node is the 1st argument (the key), it's already translated!
          if (curr.arguments[0] === node) return true;
          // If it's a fallback or defaultValue in second arg, we still might note it or it's fine.
        }
      }
      curr = curr.parent;
    }
    return false;
  }

  function visit(node) {
    // 1. Check JSX Text
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile).trim();
      if (text.length > 0 && !/^[\d\s\.,:\/\|\-\+%\(\)\*•#@_&><=!~`\^\?]+$/.test(text)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        results.push({
          file: filePath,
          line: line + 1,
          type: "JSX Text",
          text
        });
      }
    }

    // 2. Check JSX Attributes with string literals
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const attrName = node.name.getText(sourceFile);
      const text = node.initializer.text.trim();
      // Only care about user-facing props
      if (["title", "label", "placeholder", "helperText", "headerTitle", "tabBarLabel", "headerBackTitle", "accessibilityLabel", "confirmLabel", "cancelLabel", "emptyText", "emptyActionLabel", "primaryActionLabel", "secondaryActionLabel", "dialogTitle", "dialogMessage", "message", "error"].includes(attrName)) {
        if (!text.startsWith("us1.") && !text.startsWith("us2.") && !text.startsWith("us3.") && !text.startsWith("us4.") && !text.startsWith("common.")) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.initializer.getStart());
          results.push({
            file: filePath,
            line: line + 1,
            type: `Prop (${attrName})`,
            text
          });
        }
      }
    }

    // 3. Check raw string literals passed to Alert, Toast, or error/status state
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isTranslatedCall(node)) {
        const text = node.text ? node.text.trim() : "";
        let curr = node.parent;
        // Check if inside Alert.alert(...) or Error("...")
        if (ts.isCallExpression(curr) && curr.arguments.includes(node)) {
          const fnName = curr.expression.getText(sourceFile);
          if (fnName.includes("Alert.alert") || fnName.includes("showSnackbar") || fnName === "setError" || fnName === "setStatusText" || fnName === "setMessage") {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            results.push({
              file: filePath,
              line: line + 1,
              type: `Call (${fnName})`,
              text
            });
          }
        }
        // Check ternary or variable assigned to user display text
        if (ts.isConditionalExpression(curr)) {
          if (["Resource author unavailable", "Need author unavailable"].includes(text)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            results.push({
              file: filePath,
              line: line + 1,
              type: "Fallback text",
              text
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
});

console.log(JSON.stringify(results, null, 2));
