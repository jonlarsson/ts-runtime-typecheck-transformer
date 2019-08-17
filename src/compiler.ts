import * as ts from "typescript";
import { createVisitor } from "./visitor";
function compiler(configFilePath: string) {
  // tslint:disable-next-line no-any
  const host: ts.ParseConfigFileHost = ts.sys as any;
  // Fix after https://github.com/Microsoft/TypeScript/issues/18217
  host.onUnRecoverableConfigFileDiagnostic = diagnostics =>
    console.log("onUnRecoverableConfigFileDiagnostic", diagnostics);
  const parsedCmd = ts.getParsedCommandLineOfConfigFile(
    configFilePath,
    {},
    host
  );
  if (!parsedCmd) {
    throw new Error("parsedCmd is undefined");
  }
  host.onUnRecoverableConfigFileDiagnostic = diagnostics =>
    console.log("onUnRecoverableConfigFileDiagnostic", diagnostics);

  const { options, fileNames } = parsedCmd;

  const program = ts.createProgram({
    rootNames: fileNames,
    options
  });

  const typeChecker = program.getTypeChecker();

  const emitResult = program.emit(undefined, undefined, undefined, undefined, {
    before: [createVisitor(typeChecker)],
    after: [],
    afterDeclarations: []
  });

  ts.getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .forEach(diagnostic => {
      let msg = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (diagnostic.file) {
        const {
          line,
          character
        } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start || 0
        );
        msg = `${diagnostic.file.fileName} (${line + 1},${character +
          1}): ${msg}`;
      }
      console.error(msg);
    });

  const exitCode = emitResult.emitSkipped ? 1 : 0;
  if (exitCode) {
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
  }
}

compiler("/Users/jonlarsson/dev/tscompile/examples/tsconfig.json");
