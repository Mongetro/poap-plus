import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaCalendar,
  FaCalendarPlus,
  FaChartLine,
  FaExclamationTriangle,
  FaSpinner,
  FaUser,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import AppNavbar from '../components/Layout/AppNavbar';
import Footer from '../components/Layout/Footer';
import contractData from '../contracts/POAPPlus.json';
import { useContractAddress } from '../hooks/useContractAddress';
import { getExplorerUrl, getNetworkName } from '../utils/blockchain';

/**
 * Dashboard Component - Main dashboard for POAP+ event and badge management
 * @description Displays overview statistics, recent events, and quick actions with multi-network support
 * @features Real-time blockchain data, statistics cards, recent events list, quick navigation, network awareness
 * @returns {JSX.Element} Dashboard with overview and management tools
 */
export default function Dashboard() {
  const { address } = useAccount();
  const client = usePublicClient();
  const { contractAddress, isContractDeployed } = useContractAddress();

  // Dashboard state management
  const [dashboardData, setDashboardData] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBadges: 0,
    userBadges: 0,
    recentEvents: [],
    isLoading: true,
    error: null,
  });

  // Fetch dashboard data when wallet address or network changes
  useEffect(() => {
    if (address && isContractDeployed) {
      fetchDashboardData();
    }
  }, [address, isContractDeployed, client.chain]);

  /**
   * Fetches all dashboard data from blockchain contract
   * @async
   */
  const fetchDashboardData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch main statistics from contract
      const totalEvents = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getTotalEvents',
      });

      const activeEvents = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getActiveEventsCount',
      });

      const totalBadges = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getTotalBadges',
      });

      // Fetch user-specific badge count
      let userBadges = 0;
      try {
        const userBadgeIds = await client.readContract({
          address: contractAddress,
          abi: contractData.abi,
          functionName: 'getUsersBadgeIds',
          args: [address],
        });
        userBadges = userBadgeIds.length;
      } catch (error) {
        console.log('User has no badges yet');
        userBadges = 0;
      }

      // Fetch recent events for display
      const recentEvents = await getRecentEvents(
        Math.min(Number(totalEvents), 3),
      );

      // Update dashboard state with fetched data
      setDashboardData({
        totalEvents: Number(totalEvents),
        activeEvents: Number(activeEvents),
        totalBadges: Number(totalBadges),
        userBadges,
        recentEvents,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData((prev) => ({
        ...prev,
        isLoading: false,
        error: `Failed to load dashboard data from ${getNetworkName(
          client.chain,
        )}. Please check your connection.`,
      }));
    }
  };

  /**
   * Fetches details for recent events
   * @param {number} count - Number of recent events to fetch
   * @returns {Promise<Array>} Array of event objects
   */
  const getRecentEvents = async (count) => {
    if (count === 0) return [];

    const events = [];
    try {
      // Fetch events sequentially by ID
      for (let i = 1; i <= count; i++) {
        const event = await client.readContract({
          address: contractAddress,
          abi: contractData.abi,
          functionName: 'getEvent',
          args: [i],
        });

        // Verify event exists (creator is not zero address)
        if (
          event &&
          event.creator !== '0x0000000000000000000000000000000000000000'
        ) {
          events.push({
            id: Number(event.eventId),
            name: event.eventName,
            date: event.eventDate,
            organizer: event.organizer,
            isActive: event.isActive,
            creator: event.creator,
            imageURI: event.eventImageURI,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
    return events;
  };

  /**
   * Formats date string to localized format
   * @param {string} dateString - Date string from contract
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Opens contract address in block explorer
   */
  const openContractExplorer = () => {
    const url = getExplorerUrl(contractAddress, 'address', client.chain);
    if (url !== '#') window.open(url, '_blank');
  };

  // Loading state display
  if (dashboardData.isLoading) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-dark-custom">
        <AppNavbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
          <div className="text-center">
            <FaSpinner className="spinner text-green mb-3" size={32} />
            <h3 className="text-green">Loading Dashboard...</h3>
            <p className="text-muted">
              Fetching data from {getNetworkName(client.chain)}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state display
  if (dashboardData.error) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-dark-custom">
        <AppNavbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
          <div className="text-center">
            <FaExclamationTriangle className="text-danger mb-3" size={48} />
            <h3 className="text-danger">Error Loading Dashboard</h3>
            <p className="text-muted mb-3">{dashboardData.error}</p>
            <button
              className="btn btn-primary-custom"
              onClick={fetchDashboardData}
            >
              <FaSpinner className="me-2" />
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if contract is deployed
  if (!isContractDeployed) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-dark-custom">
        <AppNavbar />
        <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
          <div className="text-center">
            <FaExclamationTriangle className="text-warning mb-3" size={48} />
            <h3 className="text-warning">Contract Not Deployed</h3>
            <p className="text-muted mb-3">
              POAP+ contract is not deployed on {getNetworkName(client.chain)}.
              Please deploy the contract first or switch to a supported network.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-primary-custom"
                onClick={fetchDashboardData}
              >
                Check Again
              </button>
              <Link to="/create-event" className="btn btn-outline-secondary">
                Try Anyway
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark-custom">
      <AppNavbar />

      <main className="flex-grow-1 py-4">
        <div className="container">
          {/* Dashboard Header */}
          <div className="row justify-content-center mb-5">
            <div className="col-12 col-md-8 col-lg-6 text-center">
              <h1 className="text-green fw-bold mb-3">
                Welcome to your POAP+ management dashboard
              </h1>
              <p className="text-muted">
                Manage events, mint badges, and verify attendance on{' '}
                {getNetworkName(client.chain)}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="card card-dark p-4 shadow-sm border-0 mb-5">
            <h4 className="text-green mb-4 text-center">Quick Start</h4>
            <div className="row g-3 justify-content-center">
              <div className="col-md-6 col-lg-4">
                <Link
                  to="/create-event"
                  className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-between"
                >
                  Create Event <FaArrowRight />
                </Link>
              </div>
              <div className="col-md-6 col-lg-4">
                <Link
                  to="/mint"
                  className="btn btn-outline-success w-100 d-flex align-items-center justify-content-between"
                >
                  Mint Badges <FaArrowRight />
                </Link>
              </div>
              <div className="col-md-6 col-lg-4">
                <Link
                  to="/verify"
                  className="btn btn-outline-info w-100 d-flex align-items-center justify-content-between"
                >
                  Verify Badge <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>

          {/* Statistics Overview Cards */}
          <div className="row g-4 mb-5">
            {/* Total Events Card */}
            <div className="col-md-3">
              <div className="card card-dark h-100 stats-card">
                <div className="card-body text-center p-4">
                  <FaCalendar className="text-green mb-3" size={32} />
                  <h4 className="text-dark mb-2">Total Events</h4>
                  <p className="h2 text-green mb-0">
                    {dashboardData.totalEvents}
                  </p>
                  <small className="text-muted">All events created</small>
                </div>
              </div>
            </div>

            {/* Active Events Card */}
            <div className="col-md-3">
              <div className="card card-dark h-100 stats-card">
                <div className="card-body text-center p-4">
                  <FaCalendar className="text-primary mb-3" size={32} />
                  <h4 className="text-dark mb-2">Active Events</h4>
                  <p className="h2 text-primary mb-0">
                    {dashboardData.activeEvents}
                  </p>
                  <small className="text-muted">Currently active</small>
                </div>
              </div>
            </div>

            {/* Total Badges Card */}
            <div className="col-md-3">
              <div className="card card-dark h-100 stats-card">
                <div className="card-body text-center p-4">
                  <FaUsers className="text-orange mb-3" size={32} />
                  <h4 className="text-dark mb-2">Total Badges</h4>
                  <p className="h2 text-orange mb-0">
                    {dashboardData.totalBadges}
                  </p>
                  <small className="text-muted">All badges minted</small>
                </div>
              </div>
            </div>

            {/* User Badges Card */}
            <div className="col-md-3">
              <div className="card card-dark h-100 stats-card">
                <div className="card-body text-center p-4">
                  <FaUser className="text-info mb-3" size={32} />
                  <h4 className="text-dark mb-2">Your Badges</h4>
                  <p className="h2 text-info mb-0">
                    {dashboardData.userBadges}
                  </p>
                  <small className="text-muted">In your collection</small>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events Section */}
          {dashboardData.recentEvents.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card card-dark">
                  <div className="card-header bg-transparent border-bottom">
                    <h5 className="card-title text-green mb-0 d-flex align-items-center justify-content-center">
                      <FaCalendar className="me-2" />
                      Recent Events
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3 justify-content-center">
                      {dashboardData.recentEvents.map((event) => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                          <div className="card card-dark h-100 event-card">
                            <div className="card-body text-center">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="card-title text-dark mb-0 text-truncate">
                                  {event.name}
                                </h6>
                                <span
                                  className={`badge ${
                                    event.isActive
                                      ? 'bg-success'
                                      : 'bg-secondary'
                                  }`}
                                >
                                  {event.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-muted small mb-2">
                                <strong>Date:</strong> {formatDate(event.date)}
                              </p>
                              <p className="text-muted small mb-2">
                                <strong>Organizer:</strong> {event.organizer}
                              </p>
                              <p className="text-muted small mb-0">
                                <strong>Event ID:</strong> #{event.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Refresh Button */}
          <div className="row">
            <div className="col-12 text-center">
              <button
                className="btn btn-outline-secondary"
                onClick={fetchDashboardData}
                disabled={dashboardData.isLoading}
              >
                {dashboardData.isLoading ? (
                  <>
                    <FaSpinner className="spinner me-2" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <FaChartLine className="me-2" />
                    Refresh Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Empty State - No Events Created */}
          {dashboardData.totalEvents === 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card card-dark text-center py-5">
                  <div className="card-body">
                    <FaCalendar className="text-muted mb-3" size={48} />
                    <h4 className="text-dark mb-2">No Events Yet</h4>
                    <p className="text-muted mb-3">
                      Get started by creating your first event to mint POAP+
                      badges for attendees.
                    </p>
                    <Link to="/create-event" className="btn btn-primary-custom">
                      <FaCalendarPlus className="me-2" />
                      Create Your First Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
