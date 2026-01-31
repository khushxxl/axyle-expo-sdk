/**
 * React hook for user flow tracking
 * Generic flow tracking that can be used for onboarding, checkout, tutorials, etc.
 */

import { useEffect, useRef } from "react";
import { track } from "../core";

export interface FlowTrackingOptions {
  /** Flow identifier (e.g., 'onboarding', 'checkout', 'tutorial') */
  flowId: string;
  /** Flow type/category (e.g., 'onboarding', 'checkout', 'tutorial', 'feature-discovery') */
  flowType?: string;
  /** Current step/screen in the flow */
  step: number;
  /** Total number of steps in the flow */
  totalSteps: number;
  /** Step/screen name */
  stepName: string;
  /** Additional properties to track */
  properties?: Record<string, any>;
}

/**
 * Hook to track user flow progress and drop-offs
 * Works for any multi-step flow: onboarding, checkout, tutorials, etc.
 *
 * @example
 * ```tsx
 * // Onboarding example
 * function OnboardingStep1() {
 *   useFlowTracking({
 *     flowId: 'welcome-onboarding',
 *     flowType: 'onboarding',
 *     step: 1,
 *     totalSteps: 5,
 *     stepName: 'Welcome'
 *   });
 *   return <View>...</View>;
 * }
 *
 * // Checkout example
 * function CheckoutStep2() {
 *   useFlowTracking({
 *     flowId: 'checkout-process',
 *     flowType: 'checkout',
 *     step: 2,
 *     totalSteps: 4,
 *     stepName: 'Shipping Info'
 *   });
 *   return <View>...</View>;
 * }
 * ```
 */
export function useFlowTracking(options: FlowTrackingOptions): void {
  const {
    flowId,
    flowType,
    step,
    totalSteps,
    stepName,
    properties = {},
  } = options;

  const hasTracked = useRef(false);
  const stepStartTime = useRef<number | null>(null);
  const flowStartTime = useRef<number | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    stepStartTime.current = startTime;

    // Track flow start on first step
    if (step === 1 && !hasTracked.current) {
      flowStartTime.current = startTime;
      track("Flow Started", {
        flow_id: flowId,
        flow_type: flowType || "custom",
        flow_start_time: startTime,
        total_steps: totalSteps,
        ...properties,
      });
    }

    // Track step view
    if (!hasTracked.current) {
      track("Flow Step Viewed", {
        flow_id: flowId,
        flow_type: flowType || "custom",
        step: step,
        step_name: stepName,
        total_steps: totalSteps,
        step_start_time: startTime,
        progress_percentage: Math.round((step / totalSteps) * 100),
        ...properties,
      });
      hasTracked.current = true;
    }

    // Track step completion and potential drop-off when component unmounts
    return () => {
      if (stepStartTime.current !== null) {
        const endTime = Date.now();
        const stepDuration = endTime - stepStartTime.current;

        // Track step completion
        track("Flow Step Completed", {
          flow_id: flowId,
          flow_type: flowType || "custom",
          step: step,
          step_name: stepName,
          step_duration_ms: stepDuration,
          step_duration_seconds: Math.round(stepDuration / 1000),
          progress_percentage: Math.round((step / totalSteps) * 100),
          ...properties,
        });

        // If not the last step, this could be a drop-off
        if (step < totalSteps) {
          track("Flow Step Exited", {
            flow_id: flowId,
            flow_type: flowType || "custom",
            step: step,
            step_name: stepName,
            next_step: step + 1,
            is_drop_off: true,
            step_duration_ms: stepDuration,
            ...properties,
          });
        }
      }
    };
  }, [flowId, flowType, step, totalSteps, stepName, properties]);
}

/**
 * Helper function to track flow completion
 * Call this when user completes the entire flow
 *
 * @example
 * ```tsx
 * trackFlowCompleted('welcome-onboarding', 5, { flowType: 'onboarding' });
 * ```
 */
export function trackFlowCompleted(
  flowId: string,
  totalSteps: number,
  properties?: Record<string, any>
): void {
  track("Flow Completed", {
    flow_id: flowId,
    flow_type: properties?.flowType || "custom",
    total_steps: totalSteps,
    completed_at: Date.now(),
    ...properties,
  });
}

/**
 * Helper function to track flow abandonment
 * Call this when user explicitly exits a flow
 *
 * @example
 * ```tsx
 * trackFlowAbandoned('checkout-process', 2, 4, {
 *   flowType: 'checkout',
 *   stepName: 'Shipping Info'
 * });
 * ```
 */
export function trackFlowAbandoned(
  flowId: string,
  currentStep: number,
  totalSteps: number,
  properties?: Record<string, any>
): void {
  track("Flow Abandoned", {
    flow_id: flowId,
    flow_type: properties?.flowType || "custom",
    abandoned_at_step: currentStep,
    abandoned_step_name: properties?.stepName || `Step ${currentStep}`,
    total_steps: totalSteps,
    progress_percentage: Math.round((currentStep / totalSteps) * 100),
    abandoned_at: Date.now(),
    ...properties,
  });
}

// Legacy exports for backward compatibility (deprecated)
/**
 * @deprecated Use useFlowTracking instead
 */
export const useOnboardingTracking = useFlowTracking;

/**
 * @deprecated Use trackFlowCompleted instead
 */
export const trackOnboardingCompleted = (
  flowId: string,
  totalSteps: number,
  properties?: Record<string, any>
) =>
  trackFlowCompleted(flowId, totalSteps, {
    ...properties,
    flowType: "onboarding",
  });

/**
 * @deprecated Use trackFlowAbandoned instead
 */
export const trackOnboardingAbandoned = (
  flowId: string,
  currentStep: number,
  totalSteps: number,
  properties?: Record<string, any>
) =>
  trackFlowAbandoned(flowId, currentStep, totalSteps, {
    ...properties,
    flowType: "onboarding",
  });
