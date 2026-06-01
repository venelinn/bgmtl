import type { ReactNode } from "react"
import styles from "./Sidebar.module.scss"

interface SidebarProps {
	children?: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
	return (
		<aside data-sidebar className={styles.sidebar}>
			{children}
		</aside>
	)
}
