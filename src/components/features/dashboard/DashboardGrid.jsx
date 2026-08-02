import { motion } from 'framer-motion';
import { Card, CardTitle, StatValue } from '../../ui/Card.jsx';
import { ProgressRing } from '../../ui/ProgressRing.jsx';
import { Badge } from '../../ui/Badge.jsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/** Single dashboard stat card. */
export function StatCard({ title, value, subtitle, badge, ring }) {
  return (
    <motion.div variants={item}>
      <Card hover>
        <CardTitle>{title}</CardTitle>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <StatValue>{value}</StatValue>
            {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
            {badge && <div className="mt-2"><Badge variant={badge.variant}>{badge.text}</Badge></div>}
          </div>
          {ring && (
            <ProgressRing
              value={ring.value}
              max={ring.max}
              label={ring.label}
              sublabel={ring.sublabel}
              color={ring.color}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/** Dashboard grid of stat cards. */
export function DashboardGrid({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface border border-border p-6 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  const weeklyVariant = stats.weeklyChangeRaw != null
    ? stats.weeklyChangeRaw <= 0 ? 'success' : 'warning'
    : 'default';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
    >
      <StatCard title="Current Weight" value={stats.currentWeight} subtitle="Latest entry" />
      <StatCard
        title="Weekly Change"
        value={stats.weeklyChange}
        badge={{ text: stats.weeklyChangeRaw != null ? (stats.weeklyChangeRaw <= 0 ? 'On track' : 'Gaining') : 'No data', variant: weeklyVariant }}
      />
      <StatCard title="Goal Weight" value={stats.goalWeight} subtitle={`Est. ${stats.goalDate}`} />
      <StatCard
        title="Calories Remaining"
        value={stats.caloriesRemaining}
        subtitle={`${stats.caloriesConsumed} / ${stats.dailyCalories} consumed`}
        ring={{
          value: stats.caloriesConsumed,
          max: stats.dailyCalories,
          label: `${Math.round((stats.caloriesConsumed / stats.dailyCalories) * 100)}%`,
          color: 'var(--color-accent)',
        }}
      />
      <StatCard
        title="Protein Remaining"
        value={`${stats.proteinRemaining}g`}
        subtitle={`${stats.proteinConsumed}g / ${stats.proteinGoal}g consumed`}
        ring={{
          value: stats.proteinConsumed,
          max: stats.proteinGoal,
          label: `${Math.round((stats.proteinConsumed / stats.proteinGoal) * 100)}%`,
          color: 'var(--color-success)',
        }}
      />
      <StatCard
        title="Daily Steps"
        value={stats.steps.toLocaleString()}
        subtitle={`Goal: ${stats.stepsGoal.toLocaleString()}`}
      />
      <StatCard
        title="Workout Status"
        value={stats.workoutDone ? 'Complete' : 'Pending'}
        subtitle={stats.workoutCount > 0 ? `${stats.workoutCount} exercises logged` : 'No exercises yet'}
        badge={{ text: stats.workoutDone ? 'Done' : 'Not done', variant: stats.workoutDone ? 'success' : 'default' }}
      />
      <StatCard
        title="Water Intake"
        value={`${stats.water} / ${stats.waterGoal}`}
        subtitle="glasses today"
      />
      <StatCard
        title="Sleep"
        value={`${stats.sleep}h`}
        subtitle={`Goal: ${stats.sleepGoal}h`}
      />
    </motion.div>
  );
}
