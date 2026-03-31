import {
  CIRCLES_ROAM_COMPLETED_MESSAGE,
  CIRCLES_ROAM_LAUNCH_MESSAGE,
  CIRCLES_ROAM_LAUNCH_STATE_KEY,
  CIRCLES_ROAM_READY_MESSAGE,
  CIRCLES_ROAM_STEP_CHANGED_MESSAGE,
  type CirclesRoamLaunchContext,
  type RoamActivationHandoff,
  type TravelPassId,
} from './contracts';
import type { BrownfieldRuntime } from './runtime';

type BrownfieldMessage = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringField(
  source: Record<string, unknown>,
  field: keyof CirclesRoamLaunchContext
): string {
  const value = source[field];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing or invalid field "${field}".`);
  }

  return value;
}

function readTravelPassIdField(
  source: Record<string, unknown>,
  field: 'recommendedPassId'
): TravelPassId {
  const value = readStringField(source, field);

  if (
    value !== 'always-on-max' &&
    value !== 'city-hopper' &&
    value !== 'roam-like-local'
  ) {
    throw new Error(`"${field}" is not supported.`);
  }

  return value;
}

function parseCirclesRoamLaunchContext(value: unknown): CirclesRoamLaunchContext {
  if (!isRecord(value)) {
    throw new Error('Launch payload must be an object.');
  }

  const sourcePlatform = readStringField(
    value,
    'sourcePlatform'
  ) as CirclesRoamLaunchContext['sourcePlatform'];

  if (sourcePlatform !== 'ios' && sourcePlatform !== 'android') {
    throw new Error('sourcePlatform must be either "ios" or "android".');
  }

  return {
    correlationId: readStringField(value, 'correlationId'),
    currentPlanName: readStringField(value, 'currentPlanName'),
    currentUsageGb: readStringField(value, 'currentUsageGb'),
    destinationName: readStringField(value, 'destinationName'),
    lineNumber: readStringField(value, 'lineNumber'),
    recommendedPassId: readTravelPassIdField(value, 'recommendedPassId'),
    renewalDate: readStringField(value, 'renewalDate'),
    sessionId: readStringField(value, 'sessionId'),
    sourcePlatform,
    sourceScreen: readStringField(value, 'sourceScreen'),
    subscriberId: readStringField(value, 'subscriberId'),
  };
}

export function addNativeLaunchListener(
  runtime: BrownfieldRuntime,
  onLaunch: (launchContext: CirclesRoamLaunchContext) => void,
  onError?: (message: string) => void
) {
  return runtime.addMessageListener((event) => {
    if (!isRecord(event) || event.type !== CIRCLES_ROAM_LAUNCH_MESSAGE) {
      return;
    }

    try {
      onLaunch(parseCirclesRoamLaunchContext(event.data));
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : 'Invalid `circles.roaming.launch` payload.'
      );
    }
  });
}

export function getStoredLaunchContext(runtime: BrownfieldRuntime) {
  const value = runtime.getSharedStateValue<unknown>(CIRCLES_ROAM_LAUNCH_STATE_KEY);

  if (value === undefined) {
    return undefined;
  }

  return parseCirclesRoamLaunchContext(value);
}

export function storeLaunchContext(
  runtime: BrownfieldRuntime,
  launchContext: CirclesRoamLaunchContext
) {
  runtime.setSharedStateValue(CIRCLES_ROAM_LAUNCH_STATE_KEY, launchContext);
}

export function sendReadyToNative(
  runtime: BrownfieldRuntime,
  launchContext: CirclesRoamLaunchContext
) {
  const message: BrownfieldMessage = {
    type: CIRCLES_ROAM_READY_MESSAGE,
    data: {
      correlationId: launchContext.correlationId,
      destinationName: launchContext.destinationName,
      lineNumber: launchContext.lineNumber,
      sessionId: launchContext.sessionId,
    },
  };

  runtime.sendMessage(message);
}

export function sendStepChangedToNative(
  runtime: BrownfieldRuntime,
  launchContext: CirclesRoamLaunchContext,
  screenName: string
) {
  const message: BrownfieldMessage = {
    type: CIRCLES_ROAM_STEP_CHANGED_MESSAGE,
    data: {
      correlationId: launchContext.correlationId,
      destinationName: launchContext.destinationName,
      screenName,
    },
  };

  runtime.sendMessage(message);
}

export function sendCompletedToNative(
  runtime: BrownfieldRuntime,
  launchContext: CirclesRoamLaunchContext,
  handoff: RoamActivationHandoff
) {
  const message: BrownfieldMessage = {
    type: CIRCLES_ROAM_COMPLETED_MESSAGE,
    data: {
      capturedAt: handoff.capturedAt,
      correlationId: launchContext.correlationId,
      destinationName: handoff.destinationName,
      includedData: handoff.includedData,
      lineNumber: launchContext.lineNumber,
      price: handoff.price,
      selectedPassId: handoff.selectedPassId,
      selectedPassName: handoff.selectedPassName,
      sessionId: launchContext.sessionId,
    },
  };

  runtime.sendMessage(message);
}

export function popToNative(runtime: BrownfieldRuntime) {
  runtime.popToNative(true);
}
