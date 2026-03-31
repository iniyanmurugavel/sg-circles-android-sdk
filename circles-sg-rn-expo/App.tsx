import { startTransition, useEffect, useState } from 'react';

import {
  createActivationSummaryHandoff,
  type RoamActivationHandoff,
  type TravelPassId,
} from './src/brownfield/contracts';
import {
  BrownfieldLaunchProvider,
  useBrownfieldLaunch,
} from './src/brownfield/provider';
import {
  getTravelPass,
  toSelectedRoamPass,
} from './src/telco/passes';
import { ActivationSummaryScreen } from './src/screens/ActivationSummaryScreen';
import { LaunchStateScreen } from './src/screens/LaunchStateScreen';
import { TravelPassesScreen } from './src/screens/TravelPassesScreen';

type AppStep =
  | {
      selectedPassId: TravelPassId;
      type: 'travel-passes';
    }
  | {
      handoff: RoamActivationHandoff;
      type: 'activation-summary';
    };

function AppShell() {
  const {
    completeFlow,
    dismissToNative,
    errorMessage,
    launchContext,
    notifyScreenView,
    runtimeMode,
    status,
  } = useBrownfieldLaunch();
  const [step, setStep] = useState<AppStep>({
    selectedPassId: 'roam-like-local',
    type: 'travel-passes',
  });

  useEffect(() => {
    if (!launchContext) {
      return;
    }

    setStep({
      selectedPassId: launchContext.recommendedPassId,
      type: 'travel-passes',
    });
  }, [launchContext?.correlationId, launchContext?.recommendedPassId]);

  if (status !== 'ready' || !launchContext) {
    return (
      <LaunchStateScreen
        errorMessage={errorMessage}
        onDismiss={dismissToNative}
        runtimeMode={runtimeMode}
        status={status}
      />
    );
  }

  if (step.type === 'activation-summary') {
    return (
      <ActivationSummaryScreen
        handoff={step.handoff}
        launchContext={launchContext}
        notifyScreenView={notifyScreenView}
        onActivate={() => completeFlow(step.handoff)}
        onBack={() => {
          startTransition(() => {
            setStep({
              selectedPassId: step.handoff.selectedPassId,
              type: 'travel-passes',
            });
          });
        }}
      />
    );
  }

  return (
    <TravelPassesScreen
      launchContext={launchContext}
      notifyScreenView={notifyScreenView}
      onContinue={(selectedPassId) => {
        const selectedPass = getTravelPass(selectedPassId);
        const handoff = createActivationSummaryHandoff(
          launchContext,
          toSelectedRoamPass(selectedPass)
        );

        startTransition(() => {
          setStep({
            handoff,
            type: 'activation-summary',
          });
        });
      }}
      onDismiss={dismissToNative}
      onSelectPass={(selectedPassId) => {
        setStep({
          selectedPassId,
          type: 'travel-passes',
        });
      }}
      selectedPassId={step.selectedPassId}
    />
  );
}

export default function App() {
  return (
    <BrownfieldLaunchProvider>
      <AppShell />
    </BrownfieldLaunchProvider>
  );
}
