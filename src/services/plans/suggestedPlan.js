const SLOTS = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
};

const NAMES = {
  2: '2-day full body',
  3: '3-day full body',
  4: '4-day upper/lower',
  5: '5-day split',
  6: '6-day push pull legs',
};

function lift(exerciseName, muscleGroup, sets, targetReps) {
  return { exerciseName, muscleGroup, sets, targetReps };
}

const TEMPLATES = {
  2: [
    {
      focus: 'Full Body A',
      exercises: [
        lift('Squat', 'legs', 4, '5-8'),
        lift('Bench Press', 'chest', 4, '6-10'),
        lift('Barbell Row', 'back', 3, '8-12'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Full Body B',
      exercises: [
        lift('Romanian Deadlift', 'legs', 3, '8-10'),
        lift('Overhead Press', 'shoulders', 4, '6-10'),
        lift('Lat Pulldown', 'back', 4, '8-12'),
        lift('Tricep Pushdown', 'triceps', 3, '10-12'),
      ],
    },
  ],
  3: [
    {
      focus: 'Full Body A',
      exercises: [
        lift('Squat', 'legs', 4, '5-8'),
        lift('Bench Press', 'chest', 4, '6-10'),
        lift('Barbell Row', 'back', 3, '8-12'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Full Body B',
      exercises: [
        lift('Romanian Deadlift', 'legs', 3, '8-10'),
        lift('Overhead Press', 'shoulders', 4, '6-10'),
        lift('Lat Pulldown', 'back', 4, '8-12'),
        lift('Tricep Pushdown', 'triceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Full Body C',
      exercises: [
        lift('Leg Press', 'legs', 4, '8-12'),
        lift('Incline Dumbbell Press', 'chest', 3, '8-12'),
        lift('Cable Row', 'back', 3, '8-12'),
        lift('Hanging Leg Raise', 'abs', 3, '8-15'),
      ],
    },
  ],
  4: [
    {
      focus: 'Upper A',
      exercises: [
        lift('Bench Press', 'chest', 4, '6-10'),
        lift('Barbell Row', 'back', 4, '8-12'),
        lift('Overhead Press', 'shoulders', 3, '6-10'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Lower A',
      exercises: [
        lift('Squat', 'legs', 4, '5-8'),
        lift('Romanian Deadlift', 'legs', 3, '8-10'),
        lift('Leg Curl', 'legs', 3, '10-12'),
        lift('Calf Raise', 'legs', 3, '10-12'),
      ],
    },
    {
      focus: 'Upper B',
      exercises: [
        lift('Incline Dumbbell Press', 'chest', 3, '8-12'),
        lift('Lat Pulldown', 'back', 4, '8-12'),
        lift('Lateral Raise', 'shoulders', 3, '10-12'),
        lift('Tricep Pushdown', 'triceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Lower B',
      exercises: [
        lift('Leg Press', 'legs', 4, '8-12'),
        lift('Walking Lunge', 'legs', 3, '8-12'),
        lift('Leg Extension', 'legs', 3, '10-12'),
        lift('Hanging Leg Raise', 'abs', 3, '8-15'),
      ],
    },
  ],
  5: [
    {
      focus: 'Chest & Triceps',
      exercises: [
        lift('Bench Press', 'chest', 4, '6-10'),
        lift('Tricep Pushdown', 'triceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Back & Biceps',
      exercises: [
        lift('Lat Pulldown', 'back', 4, '8-12'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Legs',
      exercises: [
        lift('Squat', 'legs', 4, '5-8'),
        lift('Romanian Deadlift', 'legs', 3, '8-10'),
      ],
    },
    {
      focus: 'Shoulders & Abs',
      exercises: [
        lift('Overhead Press', 'shoulders', 4, '6-10'),
        lift('Hanging Leg Raise', 'abs', 3, '8-15'),
      ],
    },
    {
      focus: 'Upper Body',
      exercises: [
        lift('Cable Row', 'back', 3, '8-12'),
        lift('Incline Dumbbell Press', 'chest', 3, '8-12'),
      ],
    },
  ],
  6: [
    {
      focus: 'Push',
      exercises: [
        lift('Bench Press', 'chest', 4, '6-10'),
        lift('Overhead Press', 'shoulders', 3, '6-10'),
        lift('Lateral Raise', 'shoulders', 3, '10-12'),
        lift('Tricep Pushdown', 'triceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Pull',
      exercises: [
        lift('Lat Pulldown', 'back', 4, '8-12'),
        lift('Cable Row', 'back', 3, '8-12'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
        lift('Hammer Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Legs',
      exercises: [
        lift('Squat', 'legs', 4, '5-8'),
        lift('Romanian Deadlift', 'legs', 3, '8-10'),
        lift('Leg Curl', 'legs', 3, '10-12'),
        lift('Calf Raise', 'legs', 3, '10-12'),
      ],
    },
    {
      focus: 'Push',
      exercises: [
        lift('Incline Dumbbell Press', 'chest', 3, '8-12'),
        lift('Overhead Press', 'shoulders', 3, '6-10'),
        lift('Lateral Raise', 'shoulders', 3, '10-12'),
        lift('Skull Crusher', 'triceps', 3, '8-12'),
      ],
    },
    {
      focus: 'Pull',
      exercises: [
        lift('Barbell Row', 'back', 4, '8-12'),
        lift('Lat Pulldown', 'back', 3, '8-12'),
        lift('Hammer Curl', 'biceps', 3, '10-12'),
        lift('Bicep Curl', 'biceps', 3, '10-12'),
      ],
    },
    {
      focus: 'Legs',
      exercises: [
        lift('Leg Press', 'legs', 4, '8-12'),
        lift('Walking Lunge', 'legs', 3, '8-12'),
        lift('Leg Extension', 'legs', 3, '10-12'),
        lift('Calf Raise', 'legs', 3, '10-12'),
      ],
    },
  ],
};

/** A 7-day plan with training days placed on weekdays and the rest marked Rest. */
export function buildSuggestedPlan(trainingDays) {
  const count = SLOTS[trainingDays] ? Number(trainingDays) : 3;
  const sessions = TEMPLATES[count];
  const byWeekday = new Map(SLOTS[count].map((weekday, index) => [weekday, sessions[index]]));
  const days = Array.from({ length: 7 }, (_, weekday) => {
    const session = byWeekday.get(weekday);
    if (!session) return { weekday, focus: 'Rest', status: 'planned', exercises: [] };
    return { weekday, focus: session.focus, status: 'planned', exercises: session.exercises };
  });
  return { name: NAMES[count], days };
}
