import { useState } from 'react';
import {
  FaBars,
  FaCalendarPlus,
  FaClipboard,
  FaHome,
  FaPlusCircle,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import ConfirmationModal from '../UI/ConfirmationModal';

/**
 * AppNavbar Component - Main navigation component for POAP+ application
 * @description Provides responsive navigation with wallet connection management
 * @features Desktop and mobile responsive design, wallet address display, disconnect confirmation
 * @returns {JSX.Element} Navigation bar with menu items and wallet management
 */
export default function AppNavbar() {
  // Wallet connection state management
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  // Router location for active link highlighting
  const location = useLocation();

  // Component state management
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Formats Ethereum address for display (truncates to first 6 and last 4 characters)
   * @param {string} addr - Full Ethereum address
   * @returns {string} Formatted address (e.g., "0x1234...abcd")
   */
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  /**
   * Copies current wallet address to clipboard
   * @async
   */
  const copyToClipboard = () => navigator.clipboard.writeText(address);

  /**
   * Checks if given path matches current route for active styling
   * @param {string} path - Route path to check
   * @returns {boolean} True if path matches current location
   */
  const isActive = (path) => location.pathname === path;

  // Disconnect wallet handlers
  const handleDisconnectClick = () => setShowDisconnectModal(true);
  const confirmDisconnect = () => {
    disconnect();
    setShowDisconnectModal(false);
  };
  const cancelDisconnect = () => setShowDisconnectModal(false);

  /**
   * Toggles mobile menu visibility
   */
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light navbar-opaque">
        <div className="container d-flex justify-content-between align-items-center">
          {/* ===== Brand Section: Desktop shows "P+ POAP+", Mobile shows only "P+" ===== */}
          <Link
            className="navbar-brand d-flex align-items-center"
            to="/dashboard"
          >
            <div className="brand-logo me-2">P+</div>
            <span className="brand-text d-none d-md-inline">POAP+</span>
          </Link>

          {/* ===== Desktop Navigation Menu (Hidden on mobile) ===== */}
          <div className="navbar-nav flex-grow-1 justify-content-center d-none d-md-flex">
            {/* Dashboard Link */}
            <Link
              className={`nav-link me-3 ${
                isActive('/dashboard') ? 'active' : 'text-dark'
              }`}
              to="/dashboard"
            >
              <FaHome className="me-2" size={16} />
              Dashboard
            </Link>

            {/* Create Event Link */}
            <Link
              className={`nav-link me-3 ${
                isActive('/create-event') ? 'active' : 'text-dark'
              }`}
              to="/create-event"
            >
              <FaCalendarPlus className="me-2" size={16} />
              Create Event
            </Link>

            {/* Mint Badge Link */}
            <Link
              className={`nav-link me-3 ${
                isActive('/mint') ? 'active' : 'text-dark'
              }`}
              to="/mint"
            >
              <FaPlusCircle className="me-2" size={16} />
              Mint Badge
            </Link>

            {/* Verify Attendance Link */}
            <Link
              className={`nav-link ${
                isActive('/verify') ? 'active' : 'text-dark'
              }`}
              to="/verify"
            >
              <FaSearch className="me-2" size={16} />
              Verify
            </Link>
          </div>

          {/* ===== Mobile Menu Toggle Button (Visible only on mobile) ===== */}
          <button
            className="btn d-md-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          {/* ===== Connected Wallet Information Section ===== */}
          <div className="d-flex align-items-center ms-3">
            {/* Wallet Address Display */}
            <div className="text-end me-2">
              <div className="text-muted small fw-semibold d-flex align-items-center">
                <FaUserCircle className="me-1" size={12} />
                Connected account
              </div>
              <div className="d-flex align-items-center">
                <span className="text-dark small font-monospace">
                  {formatAddress(address)}
                </span>
                {/* Copy to Clipboard Button */}
                <button
                  className="btn btn-sm btn-link text-muted p-0 ms-1 d-flex align-items-center"
                  onClick={copyToClipboard}
                  title="Copy address to clipboard"
                >
                  <FaClipboard size={12} />
                </button>
              </div>
            </div>

            {/* Disconnect Wallet Button */}
            <button
              className="btn btn-outline-danger btn-sm d-flex align-items-center"
              onClick={handleDisconnectClick}
            >
              <FaSignOutAlt className="me-1" size={14} />
              Disconnect
            </button>
          </div>
        </div>

        {/* ===== Mobile Menu Dropdown (Visible when mobile menu is open) ===== */}
        {mobileMenuOpen && (
          <div className="d-md-none mt-2 px-3 pb-3 border-top">
            {/* Mobile Dashboard Link */}
            <Link
              className={`d-block nav-link mb-2 ${
                isActive('/dashboard') ? 'active' : 'text-dark'
              }`}
              to="/dashboard"
              onClick={toggleMobileMenu}
            >
              <FaHome className="me-2" /> Dashboard
            </Link>

            {/* Mobile Create Event Link */}
            <Link
              className={`d-block nav-link mb-2 ${
                isActive('/create-event') ? 'active' : 'text-dark'
              }`}
              to="/create-event"
              onClick={toggleMobileMenu}
            >
              <FaCalendarPlus className="me-2" /> Create Event
            </Link>

            {/* Mobile Mint Badge Link */}
            <Link
              className={`d-block nav-link mb-2 ${
                isActive('/mint') ? 'active' : 'text-dark'
              }`}
              to="/mint"
              onClick={toggleMobileMenu}
            >
              <FaPlusCircle className="me-2" /> Mint Badge
            </Link>

            {/* Mobile Verify Link */}
            <Link
              className={`d-block nav-link ${
                isActive('/verify') ? 'active' : 'text-dark'
              }`}
              to="/verify"
              onClick={toggleMobileMenu}
            >
              <FaSearch className="me-2" /> Verify
            </Link>
          </div>
        )}
      </nav>

      {/* ===== Disconnect Confirmation Modal ===== */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={cancelDisconnect}
        onConfirm={confirmDisconnect}
        title="Confirm Disconnection"
        message="Are you sure you want to disconnect your wallet? You will need to reconnect to access the POAP+ features."
        confirmText="Disconnect"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}
