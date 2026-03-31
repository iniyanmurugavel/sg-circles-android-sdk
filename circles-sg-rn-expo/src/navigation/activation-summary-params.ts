import type { RoamActivationHandoff } from '../brownfield/contracts';

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(source: SearchParams, key: keyof RoamActivationHandoff): string {
  const value = source[key];

  if (Array.isArray(value)) {
    if (value[0]) {
      return value[0];
    }

    throw new Error(`Missing route param "${key}".`);
  }

  if (!value) {
    throw new Error(`Missing route param "${key}".`);
  }

  return value;
}

export function toActivationSummaryRouteParams(handoff: RoamActivationHandoff) {
  return {
    capturedAt: handoff.capturedAt,
    coverageSummary: handoff.coverageSummary,
    correlationId: handoff.correlationId,
    destinationName: handoff.destinationName,
    includedData: handoff.includedData,
    price: handoff.price,
    selectedPassId: handoff.selectedPassId,
    selectedPassName: handoff.selectedPassName,
  };
}

export function parseActivationSummaryRouteParams(
  params: SearchParams
): RoamActivationHandoff {
  const selectedPassId = readParam(params, 'selectedPassId');

  if (
    selectedPassId !== 'always-on-max' &&
    selectedPassId !== 'city-hopper' &&
    selectedPassId !== 'roam-like-local'
  ) {
    throw new Error('selectedPassId is not supported.');
  }

  return {
    capturedAt: readParam(params, 'capturedAt'),
    coverageSummary: readParam(params, 'coverageSummary'),
    correlationId: readParam(params, 'correlationId'),
    destinationName: readParam(params, 'destinationName'),
    includedData: readParam(params, 'includedData'),
    price: readParam(params, 'price'),
    selectedPassId,
    selectedPassName: readParam(params, 'selectedPassName'),
  };
}
