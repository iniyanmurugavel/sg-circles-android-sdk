export const CIRCLES_ROAM_LAUNCH_MESSAGE = 'circles.roaming.launch';
export const CIRCLES_ROAM_READY_MESSAGE = 'circles.roaming.ready';
export const CIRCLES_ROAM_STEP_CHANGED_MESSAGE = 'circles.roaming.stepChanged';
export const CIRCLES_ROAM_COMPLETED_MESSAGE = 'circles.roaming.completed';
export const CIRCLES_ROAM_LAUNCH_STATE_KEY = 'circles.roaming.launchContext';

export type SourcePlatform = 'android' | 'ios';
export type TravelPassId = 'always-on-max' | 'city-hopper' | 'roam-like-local';

export type CirclesRoamLaunchContext = {
  correlationId: string;
  currentPlanName: string;
  currentUsageGb: string;
  destinationName: string;
  lineNumber: string;
  recommendedPassId: TravelPassId;
  renewalDate: string;
  sessionId: string;
  sourcePlatform: SourcePlatform;
  sourceScreen: string;
  subscriberId: string;
};

export type SelectedRoamPass = {
  coverageSummary: string;
  includedData: string;
  price: string;
  selectedPassId: TravelPassId;
  selectedPassName: string;
};

export type RoamActivationHandoff = {
  capturedAt: string;
  coverageSummary: string;
  correlationId: string;
  destinationName: string;
  includedData: string;
  price: string;
  selectedPassId: TravelPassId;
  selectedPassName: string;
};

export function createActivationSummaryHandoff(
  launchContext: CirclesRoamLaunchContext,
  selectedPass: SelectedRoamPass
): RoamActivationHandoff {
  return {
    capturedAt: new Date().toISOString(),
    coverageSummary: selectedPass.coverageSummary,
    correlationId: launchContext.correlationId,
    destinationName: launchContext.destinationName,
    includedData: selectedPass.includedData,
    price: selectedPass.price,
    selectedPassId: selectedPass.selectedPassId,
    selectedPassName: selectedPass.selectedPassName,
  };
}
