import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * ConfirmationModal Component - Reusable modal for user confirmation actions
 * @description A flexible modal dialog for confirming user actions with customizable types and messages
 * @features Multiple modal types (warning, danger, info), customizable content, accessible design
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed/cancelled
 * @param {Function} props.onConfirm - Callback when action is confirmed
 * @param {string} [props.title='Confirm Action'] - Modal title text
 * @param {string} [props.message='Are you sure you want to proceed?'] - Modal message content
 * @param {string} [props.confirmText='Confirm'] - Text for confirm button
 * @param {string} [props.cancelText='Cancel'] - Text for cancel button
 * @param {string} [props.type='warning'] - Modal type: 'warning', 'danger', or 'info'
 * @returns {JSX.Element|null} Modal component or null if not open
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info'
}) {
  // Early return if modal is not open - improves performance
  if (!isOpen) return null;

  /**
   * Determines the appropriate icon color based on modal type
   * @returns {string} CSS class for icon color
   */
  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'text-danger';
      case 'info':
        return 'text-info';
      default:
        return 'text-warning';
    }
  };

  /**
   * Determines the appropriate button class based on modal type
   * @returns {string} CSS class for confirm button styling
   */
  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'info':
        return 'btn-primary';
      default:
        return 'btn-warning';
    }
  };

  return (
    /* 
      Modal Backdrop 
      Uses inline style for backdrop overlay since Bootstrap's native backdrop isn't used
      tabIndex="-1" allows the modal to be focusable for accessibility
    */
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="confirmationModalTitle"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      {/* Modal Dialog - Centered vertically and horizontally */}
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Modal Header with Icon and Title */}
          <div className="modal-header border-0">
            <h5
              className="modal-title d-flex align-items-center"
              id="confirmationModalTitle"
            >
              {/* Warning/Alert Icon with dynamic color based on type */}
              <FaExclamationTriangle
                className={`me-2 ${getIconColor()}`}
                aria-hidden="true"
              />
              {title}
            </h5>
          </div>

          {/* Modal Body with Message Content */}
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>

          {/* Modal Footer with Action Buttons */}
          <div className="modal-footer border-0">
            {/* Cancel/Close Button - Secondary action */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              aria-label={cancelText}
            >
              {cancelText}
            </button>

            {/* Confirm/Action Button - Primary action with dynamic styling */}
            <button
              type="button"
              className={`btn ${getConfirmButtonClass()}`}
              onClick={onConfirm}
              aria-label={confirmText}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
