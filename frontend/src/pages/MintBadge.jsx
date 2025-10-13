import { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEthereum,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaPlusCircle,
  FaSpinner,
  FaSync,
  FaTimesCircle,
  FaUser,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import AppNavbar from '../components/Layout/AppNavbar';
import Footer from '../components/Layout/Footer';
import contractData from '../contracts/POAPPlus.json';
import { useContractAddress } from '../hooks/useContractAddress';
import { IPFSService } from '../services/ipfsService';
import {
  formatAddress,
  formatTransactionHash, // ← Ajoutez ceci
  getExplorerUrl,
  getNetworkName,
  isLocalhost,
} from '../utils/blockchain';

/**
 * MintBadge Page - Mint POAP+ badges for event attendees
 * @component
 * @description Allows users to mint unique badges with metadata for event participants
 * @features Event selection, attendee validation, IPFS metadata upload, NFT minting, multi-network support
 * @returns {JSX.Element} Badge minting interface with blockchain integration
 */
export default function MintBadge() {
  // Wallet and contract interaction hooks
  const { address: connectedAddress } = useAccount();
  const client = usePublicClient();
  const { contractAddress, isContractDeployed } = useContractAddress();
  const {
    writeContract,
    isPending,
    isSuccess,
    error,
    data: hash,
  } = useWriteContract();

  // Transaction confirmation tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Form state management
  const [eventId, setEventId] = useState('');
  const [attendeeAddress, setAttendeeAddress] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch available events on component mount and network changes
  useEffect(() => {
    if (isContractDeployed) {
      fetchAvailableEvents();
    }
  }, [isContractDeployed, client.chain]);

  // Update selected event when eventId changes
  useEffect(() => {
    if (eventId && availableEvents.length > 0) {
      const event = availableEvents.find(
        (event) => event.id === Number(eventId),
      );
      setSelectedEvent(event || null);
    }
  }, [eventId, availableEvents]);

  /**
   * Fetch available active events from blockchain
   * @async
   */
  const fetchAvailableEvents = async () => {
    try {
      setIsLoadingEvents(true);
      setMintStatus('info:Loading available events...');
      console.log('🔄 Loading available events...');

      // Get total number of events from contract
      const totalEvents = await client.readContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'getTotalEvents',
      });

      console.log('📊 Total events:', totalEvents);

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

          // Validate event exists and is active
          if (
            event &&
            event.creator !== '0x0000000000000000000000000000000000000000' &&
            event.isActive
          ) {
            events.push({
              id: Number(event.eventId),
              name: event.eventName,
              date: event.eventDate,
              organizer: event.organizer,
              imageURI: event.eventImageURI,
              creator: event.creator,
              isActive: event.isActive,
            });
          }
        } catch (error) {
          console.log(`Event ${i} not found or error:`, error);
        }
      }

      setAvailableEvents(events);
      console.log('✅ Available events:', events);

      // Auto-select first event if available
      if (events.length > 0) {
        setEventId(events[0].id.toString());
        setSelectedEvent(events[0]);
        setMintStatus('');
      } else {
        setMintStatus('info:No active events found. Create an event first.');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setMintStatus('error:Failed to load events from blockchain');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  /**
   * Generate badge metadata object for IPFS storage
   * @param {Object} eventData - Event information
   * @param {Object} participantData - Participant information
   * @param {string} imageUrl - Event image URL
   * @returns {Object} Complete metadata object for NFT
   */
  const generateBadgeMetadata = (eventData, participantData, imageUrl) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const mintedAt = new Date().toISOString();

    return {
      name: `POAP+ Badge: ${eventData.eventName}`,
      description: `Proof of Attendance at ${
        eventData.eventName
      } organized by ${eventData.organizer}. This badge certifies that ${
        participantData.name
      } attended the event on ${getNetworkName(client.chain)}.`,
      image: imageUrl,
      external_url: 'https://poap-plus.com',
      attributes: [
        {
          trait_type: 'Event Name',
          value: eventData.eventName,
        },
        {
          trait_type: 'Event Date',
          value: eventData.eventDate,
        },
        {
          trait_type: 'Organizer',
          value: eventData.organizer,
        },
        {
          trait_type: 'Participant Name',
          value: participantData.name,
        },
        {
          trait_type: 'Participant Wallet',
          value: participantData.address,
        },
        {
          trait_type: 'Attendance Date',
          value: currentDate,
        },
        {
          trait_type: 'Badge Type',
          value: 'POAP+ Attendance Certificate',
        },
        {
          trait_type: 'Event ID',
          value: eventData.eventId.toString(),
        },
        {
          trait_type: 'Network',
          value: getNetworkName(client.chain),
        },
      ],
      properties: {
        event_id: eventData.eventId,
        participant_name: participantData.name,
        participant_address: participantData.address,
        minted_at: mintedAt,
        event_date: eventData.eventDate,
        network: getNetworkName(client.chain),
        chain_id: client.chain?.id,
      },
    };
  };

  /**
   * Handle complete badge minting process
   * @async
   */
  const handleMintBadge = async () => {
    // Check contract deployment
    if (!isContractDeployed) {
      setMintStatus(
        'error:POAP+ contract not deployed on this network. Please switch networks or deploy the contract.',
      );
      return;
    }

    // Form validation
    if (!eventId) {
      setMintStatus('error:Please select an event');
      return;
    }

    if (!attendeeAddress) {
      setMintStatus('error:Please enter an attendee address');
      return;
    }

    // Ethereum address validation
    if (!attendeeAddress.startsWith('0x') || attendeeAddress.length !== 42) {
      setMintStatus('error:Please enter a valid Ethereum address (0x...)');
      return;
    }

    if (!participantName.trim()) {
      setMintStatus('error:Please enter a participant name');
      return;
    }

    if (!selectedEvent) {
      setMintStatus('error:Selected event not found');
      return;
    }

    try {
      setIsUploadingMetadata(true);
      setMintStatus('info:Generating badge metadata...');

      // Check if attendee already has a badge for this event
      try {
        const hasAttended = await client.readContract({
          address: contractAddress,
          abi: contractData.abi,
          functionName: 'hasAttendedEvent',
          args: [BigInt(eventId), attendeeAddress],
        });

        if (hasAttended) {
          setMintStatus(
            'error:This address already has a badge for this event',
          );
          setIsUploadingMetadata(false);
          return;
        }
      } catch (error) {
        console.log('No existing badge found, proceeding with mint...');
      }

      // Prepare data for metadata generation
      const eventData = {
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        organizer: selectedEvent.organizer,
      };

      const participantData = {
        name: participantName.trim(),
        address: attendeeAddress,
      };

      // Generate badge metadata
      const metadata = generateBadgeMetadata(
        eventData,
        participantData,
        selectedEvent.imageURI,
      );

      console.log('📄 Generated metadata:', metadata);

      // Upload metadata to IPFS
      setMintStatus('info:Uploading metadata to IPFS...');
      const tokenURI = await IPFSService.uploadJSONToIPFS(metadata);

      console.log('✅ Metadata uploaded to IPFS:', tokenURI);

      // Execute contract call to mint badge
      setMintStatus('info:Minting badge on blockchain...');

      writeContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'mintBadge',
        args: [
          BigInt(eventId),
          attendeeAddress,
          participantName.trim(),
          tokenURI,
        ],
      });
    } catch (error) {
      console.error('Error in minting process:', error);

      // Enhanced error messaging
      let errorMessage = 'Minting process failed';
      if (error.message.includes('Pinata')) {
        errorMessage = 'Failed to upload metadata to IPFS';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled';
      } else if (error.message.includes('already has a badge')) {
        errorMessage = 'This address already has a badge for this event';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      }

      setMintStatus(`error:${errorMessage}`);
      setIsUploadingMetadata(false);
    }
  };

  /**
   * Use connected wallet address in the address field
   */
  const useMyAddress = () => {
    if (connectedAddress) {
      setAttendeeAddress(connectedAddress);
      clearMintStatus();
    } else {
      setMintStatus('info:Please connect your wallet first');
    }
  };

  // Handle successful transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setMintStatus(
        'success:Badge minted successfully! The NFT has been transferred to the attendee.',
      );
      // Reset form fields
      setAttendeeAddress('');
      setParticipantName('');
      setIsUploadingMetadata(false);

      // Refresh events list after successful mint
      setTimeout(() => {
        fetchAvailableEvents();
      }, 2000);
    }
  }, [isConfirmed]);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error);
      let errorMessage = 'Transaction failed';

      // Specific error handling for common contract errors
      if (error.message?.includes('Attendee already has a badge')) {
        errorMessage = 'This address already has a badge for this event';
      } else if (error.message?.includes('Event does not exist')) {
        errorMessage = 'Selected event does not exist';
      } else if (error.message?.includes('Event is not active')) {
        errorMessage = 'Selected event is not active';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message?.includes('Invalid attendee address')) {
        errorMessage = 'Invalid Ethereum address';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else {
        errorMessage = `Transaction failed: ${
          error.message || 'Unknown error'
        }`;
      }

      setMintStatus(`error:${errorMessage}`);
      setIsUploadingMetadata(false);
    }
  }, [error]);

  /**
   * Clear mint status messages
   */
  const clearMintStatus = () => {
    setMintStatus('');
  };

  /**
   * Get status icon based on status type
   * @returns {JSX.Element|null} Appropriate icon component
   */
  const getStatusIcon = () => {
    if (mintStatus.startsWith('success:'))
      return <FaCheckCircle className="me-2" size={20} />;
    if (mintStatus.startsWith('error:'))
      return <FaTimesCircle className="me-2" size={20} />;
    if (mintStatus.startsWith('info:'))
      return <FaInfoCircle className="me-2" size={20} />;
    return null;
  };

  /**
   * Get status message without prefix
   * @returns {string} Clean status message
   */
  const getStatusMessage = () => {
    if (mintStatus.startsWith('success:'))
      return mintStatus.replace('success:', '');
    if (mintStatus.startsWith('error:'))
      return mintStatus.replace('error:', '');
    if (mintStatus.startsWith('info:')) return mintStatus.replace('info:', '');
    return mintStatus;
  };

  /**
   * Open contract address in block explorer
   */
  const openContractExplorer = () => {
    const url = getExplorerUrl(contractAddress, 'address', client.chain);
    if (url !== '#') window.open(url, '_blank');
  };

  /**
   * Open transaction hash in block explorer
   */
  const openTransactionExplorer = () => {
    if (hash) {
      const url = getExplorerUrl(hash, 'tx', client.chain);
      if (url !== '#') window.open(url, '_blank');
    }
  };

  /**
   * Format date string for display
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

  // Combined processing state
  const isMinting = isPending || isConfirming || isUploadingMetadata;

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
                <FaPlusCircle className="me-3" size={32} />
                Mint Attendance Badge
              </h1>
              <p className="text-muted lead mb-0">
                Create and distribute POAP+ NFTs with unique metadata for event
                attendees on {getNetworkName(client.chain)}
              </p>
            </div>
          </div>

          {/* Contract Deployment Warning */}
          {!isContractDeployed && (
            <div className="alert alert-warning mb-4">
              <FaExclamationTriangle className="me-2" />
              <strong>Contract Not Deployed:</strong> POAP+ contract is not
              deployed on {getNetworkName(client.chain)}. You can still fill the
              form, but transactions will fail.
            </div>
          )}

          <div className="row">
            {/* Main Form Column */}
            <div className="col-lg-8">
              {/* Mint Form Card */}
              <div className="card card-dark mb-4">
                <div className="card-body">
                  <h5 className="card-title text-green mb-4 d-flex align-items-center">
                    <FaUser className="me-2" />
                    Badge Information
                  </h5>

                  {/* Event Selection with Refresh Button */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label form-label-dark fw-semibold mb-0">
                        Select Event *
                      </label>
                      <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                        onClick={fetchAvailableEvents}
                        disabled={
                          isMinting || isLoadingEvents || !isContractDeployed
                        }
                        title="Refresh events list"
                      >
                        <FaSync
                          className={`me-1 ${isLoadingEvents ? 'spinner' : ''}`}
                          size={12}
                        />
                        Refresh
                      </button>
                    </div>

                    {isLoadingEvents ? (
                      // Loading State
                      <div className="text-center py-3">
                        <FaSpinner className="spinner text-green mb-2" />
                        <div className="text-muted small">
                          Loading events from {getNetworkName(client.chain)}...
                        </div>
                      </div>
                    ) : availableEvents.length === 0 ? (
                      // No Events State
                      <div className="alert alert-warning">
                        <FaInfoCircle className="me-2" />
                        No active events found.
                        <Link to="/create-event" className="alert-link ms-1">
                          Create an event first
                        </Link>
                      </div>
                    ) : (
                      // Events Dropdown
                      <select
                        className="form-control form-control-dark"
                        value={eventId}
                        onChange={(e) => {
                          setEventId(e.target.value);
                          clearMintStatus();
                        }}
                        disabled={isMinting || !isContractDeployed}
                      >
                        {availableEvents.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name} - {formatDate(event.date)} (
                            {event.organizer})
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="form-text text-muted">
                      Choose the event for which you want to mint a badge
                    </div>
                  </div>

                  {/* Attendee Address with Use My Address Button */}
                  <div className="mb-4">
                    <label className="form-label form-label-dark fw-semibold">
                      Attendee Wallet Address *
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        value={attendeeAddress}
                        onChange={(e) => {
                          setAttendeeAddress(e.target.value);
                          clearMintStatus();
                        }}
                        placeholder="e.g., 0x742d35Cc6634C0532925a3b8D..."
                        disabled={isMinting || !isContractDeployed}
                      />
                      <button
                        className="btn btn-outline-primary d-flex align-items-center"
                        onClick={useMyAddress}
                        type="button"
                        disabled={
                          !connectedAddress || isMinting || !isContractDeployed
                        }
                        title="Use my connected wallet address"
                      >
                        <FaUser className="me-1" size={14} />
                        Use My Address
                      </button>
                    </div>
                    <div className="form-text text-muted">
                      Enter the Ethereum address of the event attendee. Must
                      start with 0x and be 42 characters long.
                      {attendeeAddress &&
                        (!attendeeAddress.startsWith('0x') ||
                          attendeeAddress.length !== 42) && (
                          <span className="text-danger ms-2">
                            ❌ Invalid Ethereum address format
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Participant Name Input */}
                  <div className="mb-4">
                    <label className="form-label form-label-dark fw-semibold">
                      Attendee Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-dark"
                      value={participantName}
                      onChange={(e) => {
                        setParticipantName(e.target.value);
                        clearMintStatus();
                      }}
                      placeholder="e.g., Alice Johnson"
                      disabled={isMinting || !isContractDeployed}
                      maxLength={100}
                    />
                    <div className="form-text text-muted">
                      Enter the full name of the participant as it should appear
                      on the badge
                    </div>
                  </div>

                  {/* Main Mint Button */}
                  <div className="d-grid gap-2 mb-4">
                    <button
                      className="btn btn-primary-custom py-2 d-flex align-items-center justify-content-center"
                      onClick={handleMintBadge}
                      disabled={
                        !eventId ||
                        !attendeeAddress ||
                        !participantName.trim() ||
                        isMinting ||
                        availableEvents.length === 0 ||
                        !isContractDeployed
                      }
                    >
                      {isMinting ? (
                        <>
                          <FaSpinner className="me-2 spinner" size={16} />
                          {isUploadingMetadata
                            ? 'Uploading Metadata...'
                            : isPending
                            ? 'Confirming...'
                            : 'Minting...'}
                        </>
                      ) : (
                        <>
                          <FaPlusCircle className="me-2" size={16} />
                          Mint POAP+ NFT Badge
                        </>
                      )}
                    </button>
                  </div>

                  {/* Transaction Hash Display */}
                  {hash && (
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center justify-content-between">
                        <span>
                          <strong>Transaction:</strong>{' '}
                          {formatTransactionHash(hash)}
                          {hash &&
                            hash.length === 66 &&
                            !isLocalhost(client.chain) && (
                              <button
                                className="btn btn-sm btn-outline-info ms-2"
                                onClick={openTransactionExplorer}
                              >
                                <FaExternalLinkAlt size={12} />
                              </button>
                            )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Message Display */}
                  {mintStatus && (
                    <div
                      className={`mt-3 p-3 rounded ${
                        mintStatus.startsWith('success:')
                          ? 'status-success'
                          : mintStatus.startsWith('error:')
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
                          onClick={clearMintStatus}
                        >
                          <FaTimesCircle size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information Sidebar Column */}
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

              {/* Selected Event Details Card */}
              {selectedEvent && (
                <div className="card card-dark mb-4">
                  <div className="card-body">
                    <h5 className="card-title text-green mb-3 d-flex align-items-center">
                      <FaInfoCircle className="me-2" />
                      Selected Event Details
                    </h5>

                    <div className="mb-3">
                      <strong className="text-dark">Event Name:</strong>
                      <div className="text-muted">{selectedEvent.name}</div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">Event Date:</strong>
                      <div className="text-muted">
                        {formatDate(selectedEvent.date)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">Organizer:</strong>
                      <div className="text-muted">
                        {selectedEvent.organizer}
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">Event ID:</strong>
                      <div className="text-muted">#{selectedEvent.id}</div>
                    </div>

                    <div className="mb-3">
                      <strong className="text-dark">Status:</strong>
                      <div>
                        {selectedEvent.isActive ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </div>
                    </div>

                    {/* Event Image Preview */}
                    {selectedEvent.imageURI && (
                      <div className="mb-3">
                        <strong className="text-dark">Event Image:</strong>
                        <div className="mt-2">
                          <img
                            src={selectedEvent.imageURI}
                            alt="Event"
                            className="img-fluid rounded"
                            style={{ maxHeight: '100px' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Information Card */}
              <div className="card card-dark">
                <div className="card-body">
                  <h5 className="card-title text-green mb-3">
                    About NFT Badges
                  </h5>
                  <div className="text-dark small">
                    <p className="mb-2">
                      <strong>ERC-721 NFTs:</strong> Each badge is a unique NFT
                      with metadata stored on IPFS.
                    </p>
                    <p className="mb-2">
                      <strong>IPFS Storage:</strong> Badge metadata is stored
                      decentralized on IPFS.
                    </p>
                    <p className="mb-2">
                      <strong>Shared Images:</strong> All badges for an event
                      share the same event image.
                    </p>
                    <p className="mb-2">
                      <strong>Unique Metadata:</strong> Each badge has
                      personalized metadata with participant details.
                    </p>
                    <p className="mb-2">
                      <strong>One per Event:</strong> Each address can only
                      receive one badge per event.
                    </p>
                    <p className="mb-0">
                      <strong>Immutable Proof:</strong> Once minted, attendance
                      records cannot be altered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
