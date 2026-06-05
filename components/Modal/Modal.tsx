import {
	type KeyboardEvent,
	type MouseEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react"
import styles from "./Modal.module.scss"

interface ModalProps {
	isOpen: boolean
	hasCloseBtn?: boolean
	onClose?: () => void
	children?: ReactNode
}

export const Modal = ({
	isOpen,
	hasCloseBtn = true,
	onClose,
	children,
}: ModalProps) => {
	const [isModalOpen, setModalOpen] = useState(isOpen)
	const modalRef = useRef<HTMLDialogElement | null>(null)

	const handleCloseModal = () => {
		onClose?.()
		setModalOpen(false)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
		if (event.key === "Escape") {
			handleCloseModal()
		}
	}

	useEffect(() => {
		setModalOpen(isOpen)
	}, [isOpen])

	useEffect(() => {
		const modalElement = modalRef.current

		if (modalElement) {
			if (isModalOpen) {
				modalElement.showModal()
			} else {
				modalElement.close()
			}
		}
	}, [isModalOpen])

	const handleOutsideClick = (e: MouseEvent<HTMLDialogElement>) => {
		const dialog = modalRef.current
		if (!dialog) return

		const rect = dialog.getBoundingClientRect()
		if (
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom
		) {
			handleCloseModal()
		}
	}

	return (
		<dialog
			ref={modalRef}
			onKeyDown={handleKeyDown}
			onClick={handleOutsideClick}
			className={styles.modal}
			data-modal
		>
			{hasCloseBtn && (
				<button
					type="button"
					className={styles.modal__close}
					onClick={handleCloseModal}
					data-modal-close
				/>
			)}
			{children}
		</dialog>
	)
}
