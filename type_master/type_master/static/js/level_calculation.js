const baseExp = 0; // EXP required for level 1 (starts at 0)
const growthRate = 100; // Initial EXP increment for level 2
const multiplier = 1.1; // Growth rate for each subsequent level

/**
 * Function to calculate level and required EXP
 * @param {number} exp - The current experience points
 * @returns {object} - Current level, EXP for the next level, remaining EXP, and progress percentage
 */
function calculateLevel(exp) {
    let level = 1; // Start at level 1
    let expForCurrentLevel = baseExp; // Total EXP for the start of the current level
    let expForNextLevel = growthRate; // EXP required to reach the next level

    // Loop to find the current level
    while (exp >= expForNextLevel) {
        expForCurrentLevel = expForNextLevel;
        expForNextLevel += Math.round(growthRate * Math.pow(multiplier, level - 1));
        level++;
    }

    // Calculate progress percentage for the current level
    const progress = Math.round(
        ((exp - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100
    );

    return {
        currentLevel: level,
        requiredExp: expForNextLevel - expForCurrentLevel,
        remainingExp: expForNextLevel - exp,
        progressPercentage: progress // Keep 2 decimal points
    };
}


// const userExp = 0; 
// const result = calculateLevel(userExp);