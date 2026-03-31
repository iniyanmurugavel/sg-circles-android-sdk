import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

import {
  addNativeLaunchListener,
  getStoredLaunchContext,
  popToNative,
  sendCompletedToNative,
  sendReadyToNative,
  sendStepChangedToNative,
  storeLaunchContext,
} from './bridge';
import type { CirclesRoamLaunchContext, RoamActivationHandoff } from './contracts';
import { mockLaunchContext } from './mock-launch';
import { loadBrownfieldRuntime, type BrownfieldRuntimeMode } from './runtime';

type LaunchStatus = 'error' | 'ready' | 'waiting';

type BrownfieldLaunchContextValue = {
  completeFlow: (handoff: RoamActivationHandoff) => void;
  dismissToNative: () => void;
  errorMessage: string | null;
  launchContext: CirclesRoamLaunchContext | undefined;
  notifyScreenView: (screenName: string) => void;
  runtimeMode: BrownfieldRuntimeMode | 'booting';
  status: LaunchStatus;
};

const BrownfieldLaunchContextStore =
  createContext<BrownfieldLaunchContextValue | null>(null);

function createDevelopmentLaunchContext(): CirclesRoamLaunchContext {
  const sourcePlatform = Platform.OS === 'android' ? 'android' : 'ios';

  return {
    ...mockLaunchContext,
    correlationId: `dev-${sourcePlatform}-circles-roaming`,
    sessionId: `dev-session-${sourcePlatform}`,
    sourcePlatform,
    sourceScreen: 'development-client',
  };
}

export function BrownfieldLaunchProvider({ children }: PropsWithChildren) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [launchContext, setLaunchContext] = useState<CirclesRoamLaunchContext | undefined>();
  const [runtimeMode, setRuntimeMode] = useState<BrownfieldRuntimeMode | 'booting'>(
    'booting'
  );
  const lastReadyCorrelationId = useRef<string | null>(null);
  const runtimeRef = useRef<Awaited<ReturnType<typeof loadBrownfieldRuntime>> | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadBrownfieldRuntime()
      .then((runtime) => {
        if (!isMounted) {
          return;
        }

        runtimeRef.current = runtime;
        setRuntimeMode(runtime.mode);

        const storedLaunchContext = getStoredLaunchContext(runtime);

        if (storedLaunchContext) {
          setLaunchContext(storedLaunchContext);
          return;
        }

        if (runtime.mode === 'preview') {
          storeLaunchContext(runtime, mockLaunchContext);
          setLaunchContext(mockLaunchContext);
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setRuntimeMode('preview');
        setLaunchContext(mockLaunchContext);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNativeLaunch = useEffectEvent((nextLaunchContext: CirclesRoamLaunchContext) => {
    const runtime = runtimeRef.current;

    if (runtime) {
      storeLaunchContext(runtime, nextLaunchContext);
    }

    setLaunchContext(nextLaunchContext);
    setErrorMessage(null);
  });

  const handleNativeLaunchError = useEffectEvent((message: string) => {
    setErrorMessage(message);
  });

  useEffect(() => {
    const runtime = runtimeRef.current;

    if (!runtime) {
      return;
    }

    const subscription = addNativeLaunchListener(
      runtime,
      handleNativeLaunch,
      handleNativeLaunchError
    );

    return () => {
      subscription.remove();
    };
  }, [handleNativeLaunch, handleNativeLaunchError, runtimeMode]);

  useEffect(() => {
    const runtime = runtimeRef.current;

    if (!runtime || !launchContext) {
      return;
    }

    if (lastReadyCorrelationId.current === launchContext.correlationId) {
      return;
    }

    sendReadyToNative(runtime, launchContext);
    lastReadyCorrelationId.current = launchContext.correlationId;
  }, [launchContext]);

  useEffect(() => {
    if (launchContext || runtimeMode === 'preview' || runtimeMode === 'booting') {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (__DEV__) {
        const runtime = runtimeRef.current;
        const developmentLaunchContext = createDevelopmentLaunchContext();

        if (runtime) {
          storeLaunchContext(runtime, developmentLaunchContext);
        }

        setLaunchContext(developmentLaunchContext);
        setErrorMessage(null);
        return;
      }

      setErrorMessage('Waiting for `circles.roaming.launch` from the native host app timed out.');
    }, __DEV__ ? 1200 : 4000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [launchContext, runtimeMode]);

  const status: LaunchStatus = launchContext
    ? 'ready'
    : errorMessage
      ? 'error'
      : 'waiting';

  const value: BrownfieldLaunchContextValue = {
    completeFlow(handoff) {
      const runtime = runtimeRef.current;

      if (runtime && launchContext) {
        sendCompletedToNative(runtime, launchContext, handoff);
        popToNative(runtime);
        return;
      }

      console.log('[brownfield preview] completeFlow', handoff);
    },
    dismissToNative() {
      const runtime = runtimeRef.current;

      if (!runtime) {
        return;
      }

      popToNative(runtime);
    },
    errorMessage,
    launchContext,
    notifyScreenView(screenName) {
      const runtime = runtimeRef.current;

      if (!runtime || !launchContext) {
        return;
      }

      sendStepChangedToNative(runtime, launchContext, screenName);
    },
    runtimeMode,
    status,
  };

  return (
    <BrownfieldLaunchContextStore.Provider value={value}>
      {children}
    </BrownfieldLaunchContextStore.Provider>
  );
}

export function useBrownfieldLaunch() {
  const context = useContext(BrownfieldLaunchContextStore);

  if (!context) {
    throw new Error('useBrownfieldLaunch must be used inside BrownfieldLaunchProvider.');
  }

  return context;
}
