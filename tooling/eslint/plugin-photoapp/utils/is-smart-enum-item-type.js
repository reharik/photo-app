import ts from 'typescript';

const NULLISH_OPERATORS = new Set(['==', '!=']);

/**
 * True when `type` is a smart-enum member (has literal `__smart_enum_brand: true`).
 */
export const isSmartEnumItemType = (type, checker) => {
  if (!type || type.flags & ts.TypeFlags.Any) {
    return false;
  }

  const candidates = type.isUnion() ? type.types : [type];

  const trueType = checker.getTrueType();

  return candidates.some((candidate) => {
    const brandType = checker.getTypeOfPropertyOfType(candidate, '__smart_enum_brand');
    return brandType === trueType;
  });
};

export const isEqualityOperator = (operator) =>
  operator === '===' ||
  operator === '!==' ||
  operator === '==' ||
  operator === '!=';

/**
 * Allows `status != null` / `status == null` (and `undefined` literal) per monorepo null checks.
 */
export const isAllowedNullishComparison = (node) => {
  if (!NULLISH_OPERATORS.has(node.operator)) {
    return false;
  }

  return isNullishExpression(node.left) || isNullishExpression(node.right);
};

const isNullishExpression = (node) => {
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }

  if (node.type === 'Identifier' && node.name === 'undefined') {
    return true;
  }

  return false;
};
