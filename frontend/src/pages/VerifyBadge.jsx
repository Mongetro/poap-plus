import { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaCalendar,
  FaCheckCircle,
  FaEthereum,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaEye,
  FaFileAlt,
  FaIdCard,
  FaImage,
  FaInfoCircle,
  FaSearch,
  FaSpinner,
  FaTimesCircle,
  FaUser,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAccount, usePublicClient } from 'wagmi';
import AppNavbar from '../components/Layout/AppNavbar';
import Footer from '../components/Layout/Footer';
import contractData from '../contracts/POAPPlus.json';
import { useContractAddress } from '../hooks/useContractAddress';
import {
  formatAddress,
  getExplorerUrl,
  getNetworkName,
  isLocalhost,
} from '../utils/blockchain';

/**
 * VerifyBadge Page - Verify POAP+ badge ownership and attendance
 * @component
 * @description Allows users to verify badge ownership and check attendance status for events
 * @features Address validation, event selection, badge metadata viewing, blockchain verification, multi-network support
 * @returns {JSX.Element} Complete verification interface with results display
 */
export default function VerifyBadge() {
  // Wallet and verification state
  const { address: connectedAddress } = useAccount();
  const client = usePublicClient();
  const { contractAddress, isContractDeployed } = useContractAddress();
  const [verifyAddress, setVerifyAddress] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Events and badges data
  const [availableEvents, setAvailableEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [userBadges, setUserBadges] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);

  // Modal and details state
  const [selectedBadgeDetails, setSelectedBadgeDetails] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeMetadata, setBadgeMetadata] = useState({});

  // Load available events on component mount and network changes
  useEffect(() => {
    if (isContractDeployed) {
      fetchAvailableEvents();
    }
  }, [isContractDeployed, client.chain]);

  // Load user badges when address changes
  useEffect(() => {
    if (verifyAddress && isValidAddress(verifyAddress) && isContractDeployed) {
      fetchUserBadges(verifyAddress);
    } else {
      setUserBadges([]);
      setBadgeMetadata({});
    }
  }, [verifyAddress, isContractDeployed]);

  /**
   * Validates Ethereum address format
   * @param {string} address - Address to validate
   * @returns {boolean} True if address is valid
   */
  const isValidAddress = (address) => {
    return address.startsWith('0x') && address.length === 42;
  };

  /**
   * Fetches all available events from blockchain contract
   * @async
   */
  const fetchAvailableEvents = async () => {
    try {
      setIsLoadingEvents(true);

      // Get total events count from contract
      const totalEvents = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getTotalEvents',
      });

      // Fetch details for each event
      const events = [];
      for (let i = 1; i <= Number(totalEvents); i++) {
        try {
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
              imageURI: event.eventImageURI,
            });
          }
        } catch (error) {
          console.log(`Event ${i} not found:`, error);
        }
      }

      setAvailableEvents(events);

      // Auto-select first event if available
      if (events.length > 0) {
        setSelectedEventId(events[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setVerifyStatus('error:Failed to load events from blockchain');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  /**
   * Fetches all badges owned by a specific address
   * @param {string} address - Ethereum address to fetch badges for
   * @async
   */
  const fetchUserBadges = async (address) => {
    if (!address || !isValidAddress(address) || !isContractDeployed) return;

    try {
      setIsLoadingBadges(true);
      setBadgeMetadata({});

      // Get badge IDs for the address
      const badgeIds = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getUsersBadgeIds',
        args: [address],
      });

      console.log('📜 Badge IDs for address:', badgeIds);

      const badges = [];
      const metadataPromises = [];

      // Fetch detailed information for each badge
      for (const tokenId of badgeIds) {
        try {
          const badge = await client.readContract({
            address: contractAddress,
            abi: contractData.abi,
            functionName: 'getBadge',
            args: [tokenId],
          });

          const event = await client.readContract({
            address: contractAddress,
            abi: contractData.abi,
            functionName: 'getEvent',
            args: [badge.eventId],
          });

          const tokenURI = await client.readContract({
            address: contractAddress,
            abi: contractData.abi,
            functionName: 'tokenURI',
            args: [tokenId],
          });

          // Compile badge data
          const badgeData = {
            tokenId: Number(tokenId),
            eventId: Number(badge.eventId),
            participantName: badge.participantName,
            participantAddress: badge.participantAddress,
            mintedAt: new Date(Number(badge.mintedAt) * 1000),
            eventName: event.eventName,
            eventDate: event.eventDate,
            organizer: event.organizer,
            eventImageURI: event.eventImageURI,
            tokenURI: tokenURI,
          };

          badges.push(badgeData);

          // Load IPFS metadata for each badge
          metadataPromises.push(fetchBadgeMetadata(tokenURI, Number(tokenId)));
        } catch (error) {
          console.error(`Error fetching badge ${tokenId}:`, error);
        }
      }

      setUserBadges(badges);

      // Wait for all metadata to load
      await Promise.all(metadataPromises);

      console.log('✅ User badges with metadata:', badges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
      setUserBadges([]);
      setBadgeMetadata({});
    } finally {
      setIsLoadingBadges(false);
    }
  };

  /**
   * Fetches badge metadata from IPFS
   * @param {string} tokenURI - IPFS URI for badge metadata
   * @param {number} tokenId - Token ID for state tracking
   * @async
   */
  const fetchBadgeMetadata = async (tokenURI, tokenId) => {
    try {
      console.log(`🔄 Fetching metadata from: ${tokenURI}`);
      const response = await fetch(tokenURI);
      if (response.ok) {
        const metadata = await response.json();
        console.log(`✅ Metadata for token ${tokenId}:`, metadata);
        setBadgeMetadata((prev) => ({
          ...prev,
          [tokenId]: metadata,
        }));
        return metadata;
      } else {
        console.error(`❌ Failed to fetch metadata for token ${tokenId}`);
      }
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
    }
  };

  /**
   * Opens badge metadata in new tab
   * @param {Object} badge - Badge object containing tokenURI
   */
  const openBadgeMetadata = (badge) => {
    if (badge.tokenURI) {
      window.open(badge.tokenURI, '_blank');
    } else {
      setVerifyStatus('error:No metadata URI available for this badge');
    }
  };

  /**
   * Opens NFT transactions for address on block explorer
   */
  const openNFTTransactions = () => {
    if (
      verifyAddress &&
      isValidAddress(verifyAddress) &&
      !isLocalhost(client.chain)
    ) {
      const url = getExplorerUrl(verifyAddress, 'address', client.chain);
      if (url !== '#') {
        // For NFT transactions, we can add the token filter
        const nftUrl = `${url}#tokentxns`;
        window.open(nftUrl, '_blank');
      }
    }
  };

  /**
   * Opens specific token on block explorer (ERC-721 token view)
   * @param {Object} badge - Badge object containing tokenId
   */
  const openTokenOnExplorer = (badge) => {
    if (isLocalhost(client.chain)) return;

    // For ERC-721 tokens, the URL format is:
    // Etherscan: https://etherscan.io/token/CONTRACT_ADDRESS?a=TOKEN_ID
    // Other explorers might have similar formats
    const baseUrl = getExplorerUrl(contractAddress, 'token', client.chain);
    if (baseUrl !== '#') {
      // Remove any existing query parameters and add the token ID
      const cleanUrl = baseUrl.split('?')[0];
      const tokenUrl = `${cleanUrl}?a=${badge.tokenId}`;
      window.open(tokenUrl, '_blank');
    }
  };

  /**
   * Opens transaction hash in block explorer (for minting transaction)
   * This requires storing transaction hashes, which we don't currently have
   * For now, we'll use the token view as fallback
   */
  const openTransactionExplorer = (transactionHash) => {
    if (transactionHash && !isLocalhost(client.chain)) {
      const url = getExplorerUrl(transactionHash, 'tx', client.chain);
      if (url !== '#') window.open(url, '_blank');
    }
  };

  /**
   * Verifies attendance for specific event and address
   * @async
   */
  const verifyAttendance = async () => {
    if (!verifyAddress) {
      setVerifyStatus('error:Please enter an address to check');
      return;
    }

    if (!isValidAddress(verifyAddress)) {
      setVerifyStatus('error:Please enter a valid Ethereum address (0x...)');
      return;
    }

    if (!selectedEventId) {
      setVerifyStatus('error:Please select an event');
      return;
    }

    if (!isContractDeployed) {
      setVerifyStatus('error:POAP+ contract not deployed on this network');
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyStatus('info:Checking attendance status...');

      // Check attendance on blockchain
      const hasAttended = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'hasAttendedEvent',
        args: [BigInt(selectedEventId), verifyAddress],
      });

      const selectedEvent = availableEvents.find(
        (event) => event.id === Number(selectedEventId),
      );

      // Find matching badge if exists
      const userBadge = userBadges.find(
        (badge) =>
          badge.eventId === Number(selectedEventId) &&
          badge.participantAddress.toLowerCase() ===
            verifyAddress.toLowerCase(),
      );

      // Set verification results
      setVerificationResult({
        hasAttended,
        event: selectedEvent,
        badge: userBadge,
        address: verifyAddress,
        isSpecificEvent: true,
      });

      setVerifyStatus(
        hasAttended
          ? 'success:Attendance verified! This address has a badge for this event.'
          : 'error:No attendance record found for this event.',
      );
    } catch (error) {
      console.error('Error verifying attendance:', error);
      setVerifyStatus('error:Error checking attendance status');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Checks all events for an address
   * @async
   */
  const checkAllEvents = async () => {
    if (!verifyAddress) {
      setVerifyStatus('error:Please enter an address to check');
      return;
    }

    if (!isValidAddress(verifyAddress)) {
      setVerifyStatus('error:Please enter a valid Ethereum address (0x...)');
      return;
    }

    if (!isContractDeployed) {
      setVerifyStatus('error:POAP+ contract not deployed on this network');
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyStatus('info:Checking all events...');

      const results = [];

      // Check attendance for each available event
      for (const event of availableEvents) {
        try {
          const hasAttended = await client.readContract({
            address: contractAddress,
            abi: contractData.abi,
            functionName: 'hasAttendedEvent',
            args: [BigInt(event.id), verifyAddress],
          });

          if (hasAttended) {
            results.push(event);
          }
        } catch (error) {
          console.error(`Error checking event ${event.id}:`, error);
        }
      }

      setVerificationResult({
        hasAttended: results.length > 0,
        eventsAttended: results,
        address: verifyAddress,
        isAllEventsCheck: true,
      });

      setVerifyStatus(
        results.length > 0
          ? `success:Address has attended ${results.length} event(s)`
          : 'error:No attendance records found for any event',
      );
    } catch (error) {
      console.error('Error checking all events:', error);
      setVerifyStatus('error:Error checking events');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Shows badge details in modal
   * @param {Object} badge - Badge object to display
   */
  const showBadgeDetails = (badge) => {
    const event = availableEvents.find((e) => e.id === badge.eventId);
    const metadata = badgeMetadata[badge.tokenId];

    setSelectedBadgeDetails({
      ...badge,
      event: event,
      metadata: metadata,
    });
    setShowBadgeModal(true);
  };

  /**
   * Closes badge details modal
   */
  const closeBadgeDetails = () => {
    setShowBadgeModal(false);
    setSelectedBadgeDetails(null);
  };

  /**
   * Uses connected wallet address for verification
   */
  const useMyAddress = () => {
    if (connectedAddress) {
      setVerifyAddress(connectedAddress);
      clearVerification();
    } else {
      setVerifyStatus('info:Please connect your wallet first');
    }
  };

  /**
   * Clears verification results and status
   */
  const clearVerification = () => {
    setVerificationResult(null);
    setVerifyStatus('');
  };

  /**
   * Opens contract in block explorer
   */
  const openContractExplorer = () => {
    const url = getExplorerUrl(contractAddress, 'address', client.chain);
    if (url !== '#') window.open(url, '_blank');
  };

  // Status display helpers
  const getStatusIcon = () => {
    if (verifyStatus.startsWith('success:'))
      return <FaCheckCircle className="me-2" size={20} />;
    if (verifyStatus.startsWith('error:'))
      return <FaTimesCircle className="me-2" size={20} />;
    if (verifyStatus.startsWith('info:'))
      return <FaInfoCircle className="me-2" size={20} />;
    return null;
  };

  const getStatusMessage = () => {
    if (verifyStatus.startsWith('success:'))
      return verifyStatus.replace('success:', '');
    if (verifyStatus.startsWith('error:'))
      return verifyStatus.replace('error:', '');
    if (verifyStatus.startsWith('info:'))
      return verifyStatus.replace('info:', '');
    return verifyStatus;
  };

  // Utility functions
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Validation for button states
  const isAddressValid = verifyAddress && isValidAddress(verifyAddress);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark-custom">
      <AppNavbar />

      <main className="flex-grow-1 py-4">
        <div className="container">
          {/* Header with Back Button */}
          <div className="row align-items-center mb-4">
            <div className="col">
              <Link
                to="/dashboard"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              >
                <FaArrowLeft className="me-2" size={14} />
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Page Header */}
          <div className="row align-items-center mb-5">
            <div className="col">
              <h1 className="text-green fw-bold mb-2 d-flex align-items-center">
                <FaSearch className="me-3" size={32} />
                Verify Attendance
              </h1>
              <p className="text-muted lead mb-0">
                Check POAP+ badge ownership and verify event attendance on{' '}
                {getNetworkName(client.chain)}
              </p>
            </div>
          </div>

          {/* Contract Deployment Warning */}
          {!isContractDeployed && (
            <div className="alert alert-warning mb-4">
              <FaExclamationTriangle className="me-2" />
              <strong>Contract Not Deployed:</strong> POAP+ contract is not
              deployed on {getNetworkName(client.chain)}. Verification features
              will not work.
            </div>
          )}

          <div className="row">
            {/* Main Verification Section */}
            <div className="col-lg-8">
              {/* Verification Card */}
              <div className="card card-dark mb-4">
                <div className="card-body">
                  <h5 className="card-title text-green mb-4 d-flex align-items-center">
                    <FaIdCard className="me-2" />
                    Verify Badge Ownership
                  </h5>

                  {/* Address Input with Use My Address button */}
                  <div className="mb-4">
                    <label className="form-label form-label-dark fw-semibold">
                      Wallet Address to Verify
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        value={verifyAddress}
                        onChange={(e) => {
                          setVerifyAddress(e.target.value);
                          clearVerification();
                        }}
                        placeholder="0x742d35Cc6634C0532925a3b8D..."
                        disabled={isVerifying || !isContractDeployed}
                      />
                      <button
                        className="btn btn-outline-primary d-flex align-items-center"
                        onClick={useMyAddress}
                        type="button"
                        disabled={
                          !connectedAddress ||
                          isVerifying ||
                          !isContractDeployed
                        }
                        title="Use my connected wallet address"
                      >
                        <FaUser className="me-1" size={14} />
                        My Address
                      </button>
                    </div>
                    <div className="form-text text-muted">
                      Enter any Ethereum address to check POAP+ badge ownership
                      {verifyAddress && !isValidAddress(verifyAddress) && (
                        <span className="text-danger ms-2">
                          ❌ Invalid Ethereum address format
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Event Selection Dropdown */}
                  <div className="mb-4">
                    <label className="form-label form-label-dark fw-semibold">
                      Select Event (Optional)
                    </label>
                    {isLoadingEvents ? (
                      <div className="text-center py-3">
                        <FaSpinner className="spinner text-green mb-2" />
                        <div className="text-muted small">
                          Loading events from {getNetworkName(client.chain)}...
                        </div>
                      </div>
                    ) : availableEvents.length === 0 ? (
                      <div className="alert alert-warning">
                        <FaInfoCircle className="me-2" />
                        No events found on {getNetworkName(client.chain)}.
                      </div>
                    ) : (
                      <select
                        className="form-control form-control-dark"
                        value={selectedEventId}
                        onChange={(e) => {
                          setSelectedEventId(e.target.value);
                          clearVerification();
                        }}
                        disabled={isVerifying || !isContractDeployed}
                      >
                        <option value="">All Events</option>
                        {availableEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name} - {formatDate(event.date)}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="form-text text-muted">
                      Select a specific event to check, or leave empty to check
                      all events
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-start mb-4">
                    <button
                      className="btn btn-primary-custom px-4 py-2 d-flex align-items-center"
                      onClick={verifyAttendance}
                      disabled={
                        !isAddressValid ||
                        isVerifying ||
                        !selectedEventId ||
                        !isContractDeployed
                      }
                    >
                      {isVerifying ? (
                        <>
                          <FaSpinner className="me-2 spinner" size={16} />
                          Checking...
                        </>
                      ) : (
                        <>
                          <FaSearch className="me-2" size={16} />
                          Verify Specific Event Badge
                        </>
                      )}
                    </button>

                    <button
                      className="btn btn-outline-primary px-4 py-2 d-flex align-items-center"
                      onClick={checkAllEvents}
                      disabled={
                        !isAddressValid || isVerifying || !isContractDeployed
                      }
                    >
                      <FaSearch className="me-2" size={16} />
                      Check All Event Badges
                    </button>
                  </div>

                  {/* Status Display */}
                  {verifyStatus && (
                    <div
                      className={`mt-3 p-3 rounded ${
                        verifyStatus.startsWith('success:')
                          ? 'status-success'
                          : verifyStatus.startsWith('error:')
                          ? 'status-error'
                          : 'status-info'
                      }`}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          {getStatusIcon()}
                          <span className="fw-semibold">
                            {getStatusMessage()}
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-link text-decoration-none p-0"
                          onClick={clearVerification}
                        >
                          <FaTimesCircle size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Results Display */}
              {verificationResult && (
                <div className="card card-dark">
                  <div className="card-body">
                    <h5 className="card-title text-green mb-3 d-flex align-items-center">
                      <FaCheckCircle className="me-2" />
                      Verification Results
                    </h5>

                    {/* Address Info */}
                    <div className="mb-3 p-3 bg-light rounded">
                      <strong>Verified Address:</strong>
                      <div className="font-monospace small text-muted">
                        {verificationResult.address}
                      </div>
                    </div>

                    {/* Specific Event Result Display */}
                    {verificationResult.isSpecificEvent &&
                      verificationResult.event && (
                        <div className="mb-4">
                          <h6 className="text-dark mb-3">
                            Event Verification Result
                          </h6>
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <strong>Event:</strong>{' '}
                              {verificationResult.event.name}
                            </div>
                            <div className="col-md-6">
                              <strong>Date:</strong>{' '}
                              {formatDate(verificationResult.event.date)}
                            </div>
                            <div className="col-md-6">
                              <strong>Organizer:</strong>{' '}
                              {verificationResult.event.organizer}
                            </div>
                            <div className="col-md-6">
                              <strong>Status:</strong>
                              <span
                                className={`badge ms-2 ${
                                  verificationResult.hasAttended
                                    ? 'bg-success'
                                    : 'bg-danger'
                                }`}
                              >
                                {verificationResult.hasAttended
                                  ? 'ATTENDED'
                                  : 'NOT ATTENDED'}
                              </span>
                            </div>
                          </div>

                          {/* Badge Details when attendance is verified */}
                          {verificationResult.badge && (
                            <div className="mt-3 p-3 bg-success bg-opacity-10 rounded">
                              <h6 className="text-success mb-3">
                                🎉 Badge Found - Attendance Verified!
                              </h6>
                              <div className="row">
                                <div className="col-md-4 text-center">
                                  {badgeMetadata[
                                    verificationResult.badge.tokenId
                                  ]?.image ? (
                                    <img
                                      src={
                                        badgeMetadata[
                                          verificationResult.badge.tokenId
                                        ].image
                                      }
                                      alt="Badge"
                                      className="img-fluid rounded mb-2"
                                      style={{ maxHeight: '150px' }}
                                    />
                                  ) : verificationResult.event.imageURI ? (
                                    <img
                                      src={verificationResult.event.imageURI}
                                      alt="Event"
                                      className="img-fluid rounded mb-2"
                                      style={{ maxHeight: '150px' }}
                                    />
                                  ) : (
                                    <div className="text-muted">
                                      <FaImage size={48} className="mb-2" />
                                      <div>Event Image</div>
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-8">
                                  <div className="row small">
                                    <div className="col-6">
                                      <strong>Participant:</strong>
                                    </div>
                                    <div className="col-6">
                                      {verificationResult.badge.participantName}
                                    </div>

                                    <div className="col-6">
                                      <strong>Token ID:</strong>
                                    </div>
                                    <div className="col-6">
                                      #{verificationResult.badge.tokenId}
                                    </div>

                                    <div className="col-6">
                                      <strong>Minted:</strong>
                                    </div>
                                    <div className="col-6">
                                      {formatDateTime(
                                        verificationResult.badge.mintedAt,
                                      )}
                                    </div>

                                    <div className="col-6">
                                      <strong>Event ID:</strong>
                                    </div>
                                    <div className="col-6">
                                      #{verificationResult.event.id}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <button
                                      className="btn btn-sm btn-outline-info me-2"
                                      onClick={() =>
                                        showBadgeDetails(
                                          verificationResult.badge,
                                        )
                                      }
                                    >
                                      <FaEye className="me-1" size={12} />
                                      See Details
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-primary me-2"
                                      onClick={() =>
                                        openBadgeMetadata(
                                          verificationResult.badge,
                                        )
                                      }
                                      title="View badge metadata on IPFS"
                                    >
                                      <FaFileAlt className="me-1" size={12} />
                                      View Metadata
                                    </button>
                                    {!isLocalhost(client.chain) && (
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() =>
                                          openTokenOnExplorer(
                                            verificationResult.badge,
                                          )
                                        }
                                        title="View token on block explorer"
                                      >
                                        <FaExternalLinkAlt
                                          className="me-1"
                                          size={12}
                                        />
                                        View on Explorer
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* All Events Result Display */}
                    {verificationResult.isAllEventsCheck && (
                      <div>
                        <h6 className="text-dark mb-3">All Events Summary</h6>
                        {verificationResult.eventsAttended &&
                        verificationResult.eventsAttended.length > 0 ? (
                          <div>
                            <p className="text-success mb-3">
                              <strong>
                                This address has attended{' '}
                                {verificationResult.eventsAttended.length}{' '}
                                event(s):
                              </strong>
                            </p>
                            <div className="row">
                              {verificationResult.eventsAttended.map(
                                (event) => (
                                  <div key={event.id} className="col-md-6 mb-3">
                                    <div className="card card-dark h-100">
                                      <div className="card-body">
                                        <h6 className="card-title text-dark">
                                          {event.name}
                                        </h6>
                                        <p className="text-muted small mb-2">
                                          <FaCalendar
                                            className="me-1"
                                            size={12}
                                          />
                                          {formatDate(event.date)}
                                        </p>
                                        <p className="text-muted small mb-2">
                                          <strong>Organizer:</strong>{' '}
                                          {event.organizer}
                                        </p>
                                        <p className="text-muted small">
                                          <strong>Event ID:</strong> #{event.id}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-danger">
                            <strong>
                              No attendance records found for any event.
                            </strong>
                          </p>
                        )}
                      </div>
                    )}

                    {/* User Badges List */}
                    {userBadges.length > 0 &&
                      verificationResult.isAllEventsCheck && (
                        <div className="mt-4">
                          <h6 className="text-dark mb-3">
                            All Badges Owned by this Address
                          </h6>
                          <div className="row">
                            {userBadges.map((badge) => (
                              <div
                                key={badge.tokenId}
                                className="col-lg-6 mb-3"
                              >
                                <div className="card card-dark h-100">
                                  <div className="card-body">
                                    <div className="text-center mb-3">
                                      {badgeMetadata[badge.tokenId]?.image ? (
                                        <img
                                          src={
                                            badgeMetadata[badge.tokenId].image
                                          }
                                          alt="Badge"
                                          className="img-fluid rounded"
                                          style={{ maxHeight: '120px' }}
                                        />
                                      ) : badge.eventImageURI ? (
                                        <img
                                          src={badge.eventImageURI}
                                          alt="Event"
                                          className="img-fluid rounded"
                                          style={{ maxHeight: '120px' }}
                                        />
                                      ) : (
                                        <div className="text-muted">
                                          <FaImage size={32} className="mb-2" />
                                          <div className="small">
                                            Event Image
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title text-dark mb-0">
                                        {badge.eventName}
                                      </h6>
                                      <span className="badge bg-success">
                                        #{badge.tokenId}
                                      </span>
                                    </div>

                                    <p className="text-muted small mb-2">
                                      <FaCalendar className="me-1" size={12} />
                                      {formatDate(badge.eventDate)}
                                    </p>

                                    <p className="text-muted small mb-2">
                                      <strong>Participant:</strong>{' '}
                                      {badge.participantName}
                                    </p>

                                    <p className="text-muted small mb-3">
                                      <strong>Minted:</strong>{' '}
                                      {formatDateTime(badge.mintedAt)}
                                    </p>

                                    <div className="d-grid gap-2">
                                      <button
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                                        onClick={() => showBadgeDetails(badge)}
                                      >
                                        <FaEye className="me-1" size={12} />
                                        See Badge Details
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-info d-flex align-items-center justify-content-center"
                                        onClick={() => openBadgeMetadata(badge)}
                                        title="View badge metadata on IPFS"
                                      >
                                        <FaFileAlt className="me-1" size={12} />
                                        View Metadata
                                      </button>
                                      {!isLocalhost(client.chain) && (
                                        <button
                                          className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                                          onClick={() =>
                                            openTokenOnExplorer(badge)
                                          }
                                          title="View token on block explorer"
                                        >
                                          <FaExternalLinkAlt
                                            className="me-1"
                                            size={12}
                                          />
                                          View on Explorer
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Information */}
            <div className="col-lg-4">
              {/* Network Information Card */}
              <div className="card card-dark mb-4">
                <div className="card-body">
                  <h5 className="card-title text-green mb-3 d-flex align-items-center">
                    <FaEthereum className="me-2" />
                    Network Information
                  </h5>
                  <div className="mb-3">
                    <strong className="text-dark">Network:</strong>
                    <div className="text-muted">
                      {getNetworkName(client.chain)}
                    </div>
                  </div>
                  <div className="mb-3">
                    <strong className="text-dark">Contract Status:</strong>
                    <div>
                      {isContractDeployed ? (
                        <span className="badge bg-success">Deployed</span>
                      ) : (
                        <span className="badge bg-warning">Not Deployed</span>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <strong className="text-dark">Contract Address:</strong>
                    <div className="font-monospace small text-muted">
                      {formatAddress(contractAddress)}
                    </div>
                  </div>
                  {!isLocalhost(client.chain) && (
                    <button
                      className="btn btn-outline-info btn-sm w-100 d-flex align-items-center justify-content-center"
                      onClick={openContractExplorer}
                    >
                      <FaExternalLinkAlt className="me-2" size={12} />
                      View Contract on Explorer
                    </button>
                  )}
                </div>
              </div>

              {/* Information Card */}
              <div className="card card-dark">
                <div className="card-body">
                  <h5 className="card-title text-green mb-3">
                    About Verification
                  </h5>
                  <div className="text-dark small">
                    <p className="mb-2">
                      <strong>Blockchain Verification:</strong> All checks are
                      performed directly on the blockchain for maximum security.
                    </p>
                    <p className="mb-2">
                      <strong>IPFS Metadata:</strong> Badge metadata containing
                      image, description, and attributes is stored on IPFS.
                    </p>
                    <p className="mb-2">
                      <strong>Immutable Records:</strong> Once minted,
                      attendance records cannot be altered or deleted.
                    </p>
                    <p className="mb-2">
                      <strong>Multi-Network:</strong> Verification works across
                      all networks where POAP+ is deployed.
                    </p>
                    <p className="mb-0">
                      <strong>Transparent:</strong> All badge ownership and
                      event data is publicly verifiable on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Badge Details Modal */}
      {showBadgeModal && selectedBadgeDetails && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-green d-flex align-items-center">
                  <FaIdCard className="me-2" />
                  Badge Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeBadgeDetails}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-5 text-center">
                    {selectedBadgeDetails.metadata?.image ? (
                      <img
                        src={selectedBadgeDetails.metadata.image}
                        alt="Badge"
                        className="img-fluid rounded mb-3"
                        style={{ maxHeight: '200px' }}
                      />
                    ) : selectedBadgeDetails.event?.imageURI ? (
                      <img
                        src={selectedBadgeDetails.event.imageURI}
                        alt="Event"
                        className="img-fluid rounded mb-3"
                        style={{ maxHeight: '200px' }}
                      />
                    ) : (
                      <div className="text-muted py-4">
                        <FaImage size={64} className="mb-2" />
                        <div>Event Image</div>
                      </div>
                    )}
                    <div className="badge bg-success fs-6">
                      Token #{selectedBadgeDetails.tokenId}
                    </div>
                  </div>
                  <div className="col-md-7">
                    <h5 className="text-dark mb-3">
                      {selectedBadgeDetails.eventName}
                    </h5>

                    <div className="mb-3">
                      <strong className="text-dark">
                        Participant Information:
                      </strong>
                      <div className="mt-1">
                        <div>
                          <strong>Name:</strong>{' '}
                          {selectedBadgeDetails.participantName}
                        </div>
                        <div className="font-monospace small text-muted">
                          <strong>Wallet:</strong>{' '}
                          {formatAddress(
                            selectedBadgeDetails.participantAddress,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">Event Information:</strong>
                      <div className="mt-1">
                        <div>
                          <strong>Date:</strong>{' '}
                          {formatDate(selectedBadgeDetails.eventDate)}
                        </div>
                        <div>
                          <strong>Organizer:</strong>{' '}
                          {selectedBadgeDetails.organizer}
                        </div>
                        <div>
                          <strong>Event ID:</strong> #
                          {selectedBadgeDetails.eventId}
                        </div>
                        <div>
                          <strong>Network:</strong>{' '}
                          {getNetworkName(client.chain)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">
                        Minting Information:
                      </strong>
                      <div className="mt-1">
                        <div>
                          <strong>Minted At:</strong>{' '}
                          {formatDateTime(selectedBadgeDetails.mintedAt)}
                        </div>
                        <div>
                          <strong>Token ID:</strong> #
                          {selectedBadgeDetails.tokenId}
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-success mt-3">
                      <FaCheckCircle className="me-2" />
                      <strong>Verified:</strong> This badge is a valid proof of
                      attendance on {getNetworkName(client.chain)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBadgeDetails}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    closeBadgeDetails();
                    openBadgeMetadata(selectedBadgeDetails);
                  }}
                >
                  <FaFileAlt className="me-1" />
                  View Full Metadata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
