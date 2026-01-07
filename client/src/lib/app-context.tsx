import { createContext, useContext, useState, type ReactNode } from "react";
import type { TeamId } from "@shared/schema";

export type FlowStep = "intro" | "team" | "capture" | "processing" | "result";

interface AppState {
  currentStep: FlowStep;
  selectedTeam: TeamId | null;
  capturedImage: string | null;
  transformedImage: string | null;
  isProcessing: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  setCurrentStep: (step: FlowStep) => void;
  setSelectedTeam: (team: TeamId | null) => void;
  setCapturedImage: (image: string | null) => void;
  setTransformedImage: (image: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: "intro",
  selectedTeam: null,
  capturedImage: null,
  transformedImage: null,
  isProcessing: false,
  error: null,
};

const stepOrder: FlowStep[] = ["intro", "team", "capture", "processing", "result"];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setCurrentStep = (step: FlowStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const setSelectedTeam = (team: TeamId | null) => {
    setState((prev) => ({ ...prev, selectedTeam: team }));
  };

  const setCapturedImage = (image: string | null) => {
    setState((prev) => ({ ...prev, capturedImage: image }));
  };

  const setTransformedImage = (image: string | null) => {
    setState((prev) => ({ ...prev, transformedImage: image }));
  };

  const setIsProcessing = (processing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: processing }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error: error }));
  };

  const goToNextStep = () => {
    setState((prev) => {
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      if (currentIndex < stepOrder.length - 1) {
        return { ...prev, currentStep: stepOrder[currentIndex + 1] };
      }
      return prev;
    });
  };

  const goToPreviousStep = () => {
    setState((prev) => {
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        return { ...prev, currentStep: stepOrder[currentIndex - 1] };
      }
      return prev;
    });
  };

  const reset = () => {
    setState(initialState);
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setCurrentStep,
        setSelectedTeam,
        setCapturedImage,
        setTransformedImage,
        setIsProcessing,
        setError,
        goToNextStep,
        goToPreviousStep,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
