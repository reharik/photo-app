import { ESLintUtils } from '@typescript-eslint/utils';
import {
  isAllowedNullishComparison,
  isEqualityOperator,
  isSmartEnumItemType,
} from '../utils/is-smart-enum-item-type.js';

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/reharik/photoapp/blob/main/docs/Monorepo.md#01-values-are-compared-by-identity-not-by-reference (${name})`,
);

const formatOperand = (sourceCode, node) => sourceCode.getText(node);

export const noSmartEnumReferenceEquality = createRule({
  name: 'no-smart-enum-reference-equality',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reference equality (===, !==, ==, !=) for smart-enum values; use .equals() instead.',
    },
    messages: {
      useEquals:
        'Compare smart-enum values with `.equals()`, not `{{operator}}`. Prefer: `{{suggestion}}`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const operandIsSmartEnum = (node) => {
      const type = parserServices.getTypeAtLocation(node);
      return isSmartEnumItemType(type, checker);
    };

    const buildSuggestion = (leftNode, rightNode) => {
      const left = formatOperand(sourceCode, leftNode);
      const right = formatOperand(sourceCode, rightNode);
      return `${left}.equals(${right})`;
    };

    return {
      BinaryExpression(node) {
        if (!isEqualityOperator(node.operator)) {
          return;
        }

        if (isAllowedNullishComparison(node)) {
          return;
        }

        const leftIsSmartEnum = operandIsSmartEnum(node.left);
        const rightIsSmartEnum = operandIsSmartEnum(node.right);

        if (!leftIsSmartEnum && !rightIsSmartEnum) {
          return;
        }

        context.report({
          node,
          messageId: 'useEquals',
          data: {
            operator: node.operator,
            suggestion: buildSuggestion(node.left, node.right),
          },
        });
      },
    };
  },
});
