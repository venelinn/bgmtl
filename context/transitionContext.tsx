import gsap from "gsap"
import React, {
	createContext,
	type ReactNode,
	useContext,
	useState,
} from "react"

// --- Define context value type ---
type TransitionContextType = {
	timeline: GSAPTimeline
	setTimeline: (timeline: GSAPTimeline) => void
	resetTimeline: () => void
}

// --- Create context with default values ---
const TransitionContext = createContext<TransitionContextType>({
	timeline: gsap.timeline({ paused: true }),
	setTimeline: () => {},
	resetTimeline: () => {},
})

// --- Provider props type ---
type TransitionContextProviderProps = {
	children: ReactNode
}

// --- Provider component ---
export function TransitionContextProvider({
	children,
}: TransitionContextProviderProps) {
	const [timeline, setTimeline] = useState<GSAPTimeline>(
		gsap.timeline({ paused: true }),
	)

	const resetTimeline = () => {
		timeline.pause().clear()
	}

	return (
		<TransitionContext.Provider
			value={{ timeline, setTimeline, resetTimeline }}
		>
			{children}
		</TransitionContext.Provider>
	)
}

// --- Custom hook ---
export default function useTransitionContext(): TransitionContextType {
	return useContext(TransitionContext)
}
