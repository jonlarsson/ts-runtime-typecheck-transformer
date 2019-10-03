import { register } from "ts-node";
import { createVisitor } from "./visitor";

const registerWithTransform = () => {
  register({
    transformers: program => {
      const typeChecker = program.getTypeChecker();
      return {
        before: [createVisitor(typeChecker)]
      };
    }
  });
};

registerWithTransform();
