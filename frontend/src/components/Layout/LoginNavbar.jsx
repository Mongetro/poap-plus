import { Wallet2 } from 'react-bootstrap-icons';
import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

/**
 * LoginNavbar Component - Navigation bar for unauthenticated users
 * @description Provides brand identity and wallet connection functionality for landing/login pages
 * @features Brand navigation, wallet connection button, smooth scroll to top
 * @returns {JSX.Element} Navigation bar with connection capabilities
 */
export default function LoginNavbar() {
  // Wagmi hook for wallet connection
  const { connect } = useConnect();

  /**
   * Handles wallet connection using the injected connector (MetaMask, etc.)
   * @async
   * @throws {Error} Logs connection errors to console
   */
  const handleConnect = async () => {
    try {
      // Attempt to connect using the injected wallet provider
      await connect({ connector: injected() });
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  /**
   * Smoothly scrolls the page to the top when brand is clicked
   * @description Provides better UX when user wants to return to top of landing page
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-opaque">
      <div className="container">
        {/* ===== Brand Section with Clickable Logo ===== */}
        <div
          className="navbar-brand d-flex align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={scrollToTop}
          role="button" // Accessibility: indicates this is clickable
          tabIndex={0} // Accessibility: makes it focusable
          onKeyDown={(e) => {
            // Accessibility: allows activation with Enter key
            if (e.key === 'Enter') scrollToTop();
          }}
        >
          {/* Brand Logo Icon */}
          <div className="brand-logo me-2">P+</div>
          {/* Brand Text */}
          POAP+
        </div>

        {/* ===== Wallet Connection Section ===== */}
        <div className="d-flex align-items-center">
          {/* Platform Description Text (Hidden on small screens) */}
          <span className="text-muted me-3 d-none d-sm-block">
            Proof of Attendance on EVM
          </span>

          {/* Wallet Connection Button */}
          <button
            className="btn btn-metamask d-flex align-items-center"
            onClick={handleConnect}
            aria-label="Connect wallet to access POAP+ features"
          >
            <Wallet2 className="me-2" size={16} />
            Connect Wallet
          </button>
        </div>
      </div>
    </nav>
  );
}
