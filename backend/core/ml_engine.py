from __future__ import annotations

from functools import lru_cache
from random import Random
from statistics import pstdev


MODEL_NAME = 'synthetic_fitness_recommendation_ensemble_v1'
SYNTHETIC_SAMPLE_SIZE = 1500
ENSEMBLE_SIZE = 12


def _goal_bucket(goal: str | None) -> int:
    goal_text = (goal or '').lower()
    if any(keyword in goal_text for keyword in ('lose', 'cut', 'fat loss', 'shred')):
        return 0
    if any(keyword in goal_text for keyword in ('gain', 'bulk', 'build', 'muscle')):
        return 1
    return 2


def _synthetic_row(rng: Random):
    goal_bucket = rng.choice([0, 1, 2])
    completed = rng.randint(0, 24)
    streak = max(0, min(30, int(completed * 0.75) + rng.randint(-2, 4)))
    minutes = max(0, int(rng.gauss(55, 18) + completed * rng.uniform(18, 38)))
    calories = max(0, int(minutes * rng.uniform(4.5, 8.5) + rng.uniform(0, 300)))
    weight_trend = round(rng.uniform(-4.5, 4.5), 1)
    body_fat = round(rng.uniform(8, 34), 1)
    consistency = round(completed / 24.0, 3)

    readiness = 45.0
    readiness += completed * 1.55
    readiness += streak * 1.35
    readiness += minutes / 18.0
    readiness += consistency * 14.0

    if goal_bucket == 0:
        readiness += (-weight_trend * 4.5)
        readiness += max(0.0, 24.0 - body_fat) * 0.3
    elif goal_bucket == 1:
        readiness += (weight_trend * 4.5)
        readiness += max(0.0, 16.0 - body_fat) * 0.25
    else:
        readiness += 3.0 if abs(weight_trend) <= 0.5 else -abs(weight_trend) * 1.1

    readiness -= max(0, 8 - streak) * 2.0
    readiness += rng.gauss(0, 4.5)
    readiness = max(0.0, min(100.0, readiness))

    features = [completed, calories, minutes, streak, weight_trend, body_fat, goal_bucket, consistency]
    return features, readiness


def _dot(weights: list[float], row: list[float]) -> float:
    return sum(weight * value for weight, value in zip(weights, row))


def _solve_linear_system(matrix: list[list[float]], values: list[float]) -> list[float]:
    size = len(values)
    augmented = [row[:] + [values[index]] for index, row in enumerate(matrix)]

    for pivot_index in range(size):
        pivot_row = max(range(pivot_index, size), key=lambda row_index: abs(augmented[row_index][pivot_index]))
        if abs(augmented[pivot_row][pivot_index]) < 1e-9:
            augmented[pivot_row][pivot_index] = 1e-9
        if pivot_row != pivot_index:
            augmented[pivot_index], augmented[pivot_row] = augmented[pivot_row], augmented[pivot_index]

        pivot_value = augmented[pivot_index][pivot_index]
        for column_index in range(pivot_index, size + 1):
            augmented[pivot_index][column_index] /= pivot_value

        for row_index in range(size):
            if row_index == pivot_index:
                continue
            factor = augmented[row_index][pivot_index]
            if abs(factor) < 1e-12:
                continue
            for column_index in range(pivot_index, size + 1):
                augmented[row_index][column_index] -= factor * augmented[pivot_index][column_index]

    return [augmented[index][size] for index in range(size)]


def _fit_linear_model(rows: list[list[float]], targets: list[float], ridge: float = 0.5) -> list[float]:
    feature_count = len(rows[0]) + 1
    matrix = [[0.0 for _ in range(feature_count)] for _ in range(feature_count)]
    values = [0.0 for _ in range(feature_count)]

    for row, target in zip(rows, targets):
        extended_row = row + [1.0]
        for row_index in range(feature_count):
            values[row_index] += extended_row[row_index] * target
            for column_index in range(feature_count):
                matrix[row_index][column_index] += extended_row[row_index] * extended_row[column_index]

    for diagonal_index in range(feature_count):
        matrix[diagonal_index][diagonal_index] += ridge

    return _solve_linear_system(matrix, values)


class _LinearModel:
    def __init__(self, weights: list[float]):
        self.weights = weights

    def predict(self, rows: list[list[float]]) -> list[float]:
        return [_dot(self.weights, row + [1.0]) for row in rows]


class _SyntheticEnsembleModel:
    def __init__(self, estimators: list[_LinearModel]):
        self.estimators_ = estimators

    def predict(self, rows: list[list[float]]) -> list[float]:
        predictions = []
        for row in rows:
            estimator_values = [estimator.predict([row])[0] for estimator in self.estimators_]
            predictions.append(sum(estimator_values) / len(estimator_values))
        return predictions


@lru_cache(maxsize=1)
def _trained_model():
    rng = Random(42)
    features = []
    targets = []

    for _ in range(SYNTHETIC_SAMPLE_SIZE):
        row_features, target = _synthetic_row(rng)
        features.append(row_features)
        targets.append(target)

    estimators = []
    for estimator_index in range(ENSEMBLE_SIZE):
        bootstrap_features = []
        bootstrap_targets = []
        local_rng = Random(100 + estimator_index)
        for _ in range(SYNTHETIC_SAMPLE_SIZE // 4):
            sample_index = local_rng.randrange(len(features))
            bootstrap_features.append(features[sample_index])
            bootstrap_targets.append(targets[sample_index])
        weights = _fit_linear_model(bootstrap_features, bootstrap_targets)
        estimators.append(_LinearModel(weights))

    return _SyntheticEnsembleModel(estimators)


def _feature_vector(snapshot: dict) -> list[list[float]]:
    completed = float(snapshot.get('completed') or 0)
    calories = float(snapshot.get('calories') or 0)
    minutes = float(snapshot.get('minutes') or 0)
    streak = float(snapshot.get('streak') or 0)
    weight_trend = float(snapshot.get('weight_trend') or 0)
    body_fat = float(snapshot.get('body_fat') if snapshot.get('body_fat') is not None else 20.0)
    goal_bucket = float(_goal_bucket(snapshot.get('goal')))
    consistency = completed / max(1.0, completed + 6.0)
    return [[completed, calories, minutes, streak, weight_trend, body_fat, goal_bucket, consistency]]


def _signal_labels(snapshot: dict, score: float) -> list[str]:
    labels = []
    completed = int(snapshot.get('completed') or 0)
    streak = int(snapshot.get('streak') or 0)
    weight_trend = snapshot.get('weight_trend')
    goal_bucket = _goal_bucket(snapshot.get('goal'))

    if completed >= 4:
        labels.append('Consistency is high enough for progression.')
    elif completed == 0:
        labels.append('The model is using synthetic priors because there is little training history yet.')

    if streak >= 5:
        labels.append('Your streak is supporting adaptation.')
    elif streak < 3:
        labels.append('Recovery risk is elevated, so the model is conservative.')

    if weight_trend is not None:
        if goal_bucket == 0 and weight_trend <= 0:
            labels.append('Weight trend is aligned with fat-loss intent.')
        elif goal_bucket == 1 and weight_trend >= 0:
            labels.append('Weight trend is aligned with muscle-gain intent.')
        elif abs(float(weight_trend)) > 0.5:
            labels.append('Trend signal is noisy, so the model is softening the recommendation.')

    if score >= 75:
        labels.append('Readiness is high enough for progressive overload.')
    elif score <= 45:
        labels.append('The model is prioritizing recovery and workload control.')

    return labels[:4]


def _recommendation_for_score(score: float, snapshot: dict) -> tuple[str, str]:
    goal_text = str(snapshot.get('goal') or '').lower()
    if score >= 75:
        if 'gain' in goal_text or 'build' in goal_text:
            return (
                'push_progression',
                'Synthetic ML signal is strong. Increase the main lift load by 2.5-5kg and keep protein intake high.',
            )
        if 'lose' in goal_text or 'cut' in goal_text:
            return (
                'accelerate_fat_loss',
                'Synthetic ML signal is strong. Keep volume high, add one conditioning block, and preserve the current calorie deficit.',
            )
        return (
            'push_progression',
            'Synthetic ML signal is strong. Add a small progression to the next session and keep the current cadence.',
        )

    if score >= 55:
        return (
            'maintain_course',
            'Synthetic ML signal suggests you should keep the current split, maintain volume, and add one high-quality set.',
        )

    if score >= 40:
        return (
            'stabilize_load',
            'Synthetic ML signal is mixed. Hold volume steady for one more week and prioritize sleep, hydration, and form.',
        )

    return (
        'deload_recovery',
        'Synthetic ML signal is weak. Reduce weekly volume by 10-15% and focus on recovery before pushing harder.',
    )


def get_ml_analysis(snapshot: dict) -> dict:
    model = _trained_model()
    features = _feature_vector(snapshot)
    predicted_score = float(model.predict(features)[0])
    tree_predictions = [float(tree.predict(features)[0]) for tree in model.estimators_]
    spread = pstdev(tree_predictions) if len(tree_predictions) > 1 else 0.0
    confidence = max(0.55, min(0.97, 1.0 - (spread / 22.0)))
    focus, recommendation = _recommendation_for_score(predicted_score, snapshot)

    return {
        'model_name': MODEL_NAME,
        'model_score': round(max(0.0, min(100.0, predicted_score)), 1),
        'model_confidence': round(confidence, 2),
        'training_samples': SYNTHETIC_SAMPLE_SIZE,
        'recommended_focus': focus,
        'suggested_solution': recommendation,
        'supporting_signals': _signal_labels(snapshot, predicted_score),
    }