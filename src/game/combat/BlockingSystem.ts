export interface BlockEvaluationParams {
  blockHeld: boolean;
  onGround: boolean;
  isAttacking: boolean;
  isInHitstun: boolean;
  isDefeated: boolean;
}

export interface BlockEvaluationDecision {
  isBlocking: boolean;
  canStartAttack: boolean;
}

/**
 * Evaluates defensive guard status cleanly while preventing simultaneous
 * blocking and attacking or blocking mid-air / while defeated.
 */
export function evaluateBlockState(
  params: BlockEvaluationParams,
): BlockEvaluationDecision {
  const {blockHeld, onGround, isAttacking, isInHitstun, isDefeated} = params;

  if (isDefeated || isInHitstun || isAttacking || !onGround) {
    return {
      isBlocking: false,
      canStartAttack: !isDefeated && !isInHitstun && !isAttacking && onGround,
    };
  }

  const isBlocking = blockHeld;
  return {
    isBlocking,
    canStartAttack: !isBlocking,
  };
}
