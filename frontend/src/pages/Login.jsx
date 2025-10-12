import {
  FaChartBar,
  FaLightbulb,
  FaPlusCircle,
  FaSearch,
} from 'react-icons/fa';
import { useAccount } from 'wagmi';
import Footer from '../components/Layout/Footer';
import LoginNavbar from '../components/Layout/LoginNavbar';

export default function Login() {
  // Get wallet connection status from wagmi hook
  const { isConnected } = useAccount();

  // If the user is already connected, don't render the login page
  if (isConnected) {
    return null;
  }

  return (
    // Main wrapper with dark background and full viewport height
    <div className="d-flex flex-column min-vh-100 bg-dark-custom">
      {/* Top navigation bar for login page */}
      <LoginNavbar />

      {/* Main content section centered vertically */}
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 text-center">
              {/* Hero Section: Logo, Title, and Description */}
              <div className="hero-logo mb-4">P+</div>

              <h1 className="display-3 fw-bold gradient-text mb-3">POAP+</h1>

              <p className="lead text-muted mb-5">
                Digital Attendance Certification on Blockchain
                <br />
                Create, distribute and verify unique participation badges
              </p>

              {/* Step-by-step guide for new users */}
              <div className="card card-dark mb-5">
                <div className="card-body p-4">
                  <h3 className="card-title text-green mb-4 d-flex align-items-center justify-content-center">
                    <FaLightbulb className="me-2" size={20} />
                    Getting Started
                  </h3>

                  {/* Connection steps */}
                  <div className="row g-4">
                    {/* Step 1 */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center">
                        <div
                          className="bg-green text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          1
                        </div>
                        <span className="text-dark">
                          Click "Connect Wallet"
                        </span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center">
                        <div
                          className="bg-green text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          2
                        </div>
                        <span className="text-dark">
                          Authorize with Wallet (MetaMask)
                        </span>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="col-md-4">
                      <div className="d-flex align-items-center justify-content-center">
                        <div
                          className="bg-green text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          3
                        </div>
                        <span className="text-dark">Access your dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section: Create / Manage / Verify */}
              <div className="row g-4">
                {/* Create feature */}
                <div className="col-md-4">
                  <div className="card feature-card h-100">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <FaPlusCircle size={48} className="text-green" />
                      </div>
                      <h5 className="card-title mb-3 text-dark">Create</h5>
                      <p className="card-text text-muted">
                        Events and unique digital badges for your events with
                        customizable metadata
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manage feature */}
                <div className="col-md-4">
                  <div className="card feature-card h-100">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <FaChartBar size={48} className="text-green" />
                      </div>
                      <h5 className="card-title mb-3 text-dark">Manage</h5>
                      <p className="card-text text-muted">
                        Real-time attendance tracking and participant management
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verify feature */}
                <div className="col-md-4">
                  <div className="card feature-card h-100">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <FaSearch size={48} className="text-green" />
                      </div>
                      <h5 className="card-title mb-3 text-dark">Verify</h5>
                      <p className="card-text text-muted">
                        Immutable proof of attendance verification on the
                        blockchain
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
