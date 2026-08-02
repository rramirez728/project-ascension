/**
 * @typedef {'lb' | 'kg'} WeightUnit
 * @typedef {'dark' | 'light'} ThemeMode
 * @typedef {'breakfast' | 'lunch' | 'dinner' | 'snacks'} MealType
 * @typedef {1 | 2 | 3 | 4 | 5} MoodRating
 */

/**
 * @typedef {Object} UserSettings
 * @property {string} id
 * @property {number} goalWeight
 * @property {number} dailyCalories
 * @property {number} proteinGoal
 * @property {number} carbGoal
 * @property {number} fatGoal
 * @property {number} waterGoal
 * @property {number} stepsGoal
 * @property {number} sleepGoal
 * @property {WeightUnit} units
 * @property {ThemeMode} theme
 * @property {string} [usdaApiKey]
 */

/**
 * @typedef {Object} SavedFood
 * @property {string} id
 * @property {string} name
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} [fdcId]
 * @property {string} [brandOwner]
 * @property {string} [servingDescription]
 * @property {string} savedAt
 */

/**
 * @typedef {Object} WeightEntry
 * @property {string} id
 * @property {string} date
 * @property {number} weight
 * @property {string} [note]
 */

/**
 * @typedef {Object} MeasurementEntry
 * @property {string} id
 * @property {string} date
 * @property {number|null} waist
 * @property {number|null} chest
 * @property {number|null} neck
 * @property {number|null} hips
 * @property {number|null} leftArm
 * @property {number|null} rightArm
 * @property {number|null} leftThigh
 * @property {number|null} rightThigh
 * @property {number|null} bodyFat
 */

/**
 * @typedef {Object} FoodEntry
 * @property {string} id
 * @property {string} date
 * @property {MealType} mealType
 * @property {string} name
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} [fdcId]
 */

/**
 * @typedef {Object} WorkoutEntry
 * @property {string} id
 * @property {string} date
 * @property {string} exercise
 * @property {number} sets
 * @property {number} reps
 * @property {number} weight
 */

/**
 * @typedef {Object} HabitEntry
 * @property {string} id
 * @property {string} date
 * @property {number} water
 * @property {number} sleep
 * @property {number} steps
 * @property {boolean} cardio
 * @property {boolean} workoutDone
 * @property {MoodRating|null} mood
 */

/**
 * @typedef {Object} PhotoEntry
 * @property {string} id
 * @property {string} date
 * @property {Blob} blob
 * @property {string} [caption]
 */

export {};
