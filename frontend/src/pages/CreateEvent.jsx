import { useState } from 'react';
import {
  FaArrowLeft,
  FaCalendar,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDatabase,
  FaEthereum,
  FaExclamationTriangle,
  FaImage,
  FaInfoCircle,
  FaPlusCircle,
  FaShieldAlt,
  FaSpinner,
  FaTimesCircle,
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
  getExplorerUrl,
  getNetworkName,
  isLocalhost,
} from '../utils/blockchain';

/**
 * CreateEvent Page - Create new events with shared images for badges
 * @description Allows users to create new POAP+ events with image upload to IPFS and blockchain storage
 * @features Image upload to IPFS, form validation, transaction status tracking, success confirmation, multi-network support
 * @returns {JSX.Element} Event creation form with IPFS integration
 */
export default function CreateEvent() {
  // Wallet and contract interaction hooks
  const { address } = useAccount();
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
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    organizer: '',
  });
  const [eventImage, setEventImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  /**
   * Handle form submission for event creation
   * @param {Event} e - Form submission event
   * @async
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if contract is deployed
    if (!isContractDeployed) {
      setUploadStatus(
        'error:POAP+ contract not deployed on this network. Please switch networks or deploy the contract.',
      );
      return;
    }

    // Enhanced form validation
    if (!formData.eventName.trim()) {
      setUploadStatus('error:Please enter an event name');
      return;
    }

    if (!formData.eventDate) {
      setUploadStatus('error:Please select an event date');
      return;
    }

    if (!formData.organizer.trim()) {
      setUploadStatus('error:Please enter an organizer name');
      return;
    }

    if (!eventImage) {
      setUploadStatus('error:Please upload an event image');
      return;
    }

    try {
      setUploadStatus('info:Uploading image to IPFS...');
      setIsUploadingImage(true);

      // Upload image to IPFS only upon form submission
      let imageUrl;
      if (eventImage.file) {
        console.log('🔄 Uploading image to IPFS...');
        imageUrl = await IPFSService.uploadImageToIPFS(eventImage.file);
        console.log('✅ IPFS upload successful:', imageUrl);
      } else {
        // If image already has URL (retry case)
        imageUrl = eventImage.url;
      }

      setUploadStatus('info:Creating event on blockchain...');

      // Contract call matching smart contract function signature
      writeContract({
        address: contractAddress,
        abi: contractData.abi,
        functionName: 'createEvent',
        args: [
          formData.eventName.trim(),
          formData.eventDate,
          formData.organizer.trim(),
          imageUrl, // IPFS image URL for shared event image
        ],
      });
    } catch (error) {
      console.error('Error creating event:', error);
      let errorMessage = 'Failed to create event';

      // Enhanced error messaging
      if (error.message.includes('Pinata')) {
        errorMessage = 'Failed to upload image to IPFS. Please try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      }

      setUploadStatus(`error:${errorMessage}`);
      setIsUploadingImage(false);
    }
  };

  /**
   * Handle input changes in form fields
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error status when user starts typing
    if (uploadStatus.startsWith('error:')) {
      setUploadStatus('');
    }
  };

  /**
   * Handle image file selection (without immediate upload)
   * @param {Event} e - File input change event
   */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File selected:', file.name, file.size, file.type);

    // Reset file input for potential re-selection
    e.target.value = '';

    try {
      // Validate file before processing
      const validation = IPFSService.validateImageFile(file);
      console.log('✅ File validation:', validation);

      if (!validation.isValid) {
        setUploadStatus(`error:${validation.message}`);
        return;
      }

      // Store file locally without immediate IPFS upload
      setEventImage({
        file,
        url: URL.createObjectURL(file), // Local URL for preview
        pendingUpload: true, // Mark as requiring upload
      });

      setUploadStatus('success:Image selected and ready for upload!');
    } catch (error) {
      console.error('💥 Error in handleImageSelect:', error);
      setUploadStatus('error:Invalid image file. Please try another file.');
    }
  };

  /**
   * Remove selected image and clean up memory
   */
  const removeImage = () => {
    if (eventImage && eventImage.url) {
      URL.revokeObjectURL(eventImage.url); // Free memory
    }
    setEventImage(null);
    setUploadStatus('');
  };

  /**
   * Get tomorrow's date for date input min attribute
   * @returns {string} Tomorrow's date in YYYY-MM-DD format
   */
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  /**
   * Get status icon based on status type
   * @returns {JSX.Element|null} Appropriate icon component
   */
  const getStatusIcon = () => {
    if (uploadStatus.startsWith('success:'))
      return <FaCheckCircle className="me-2" size={16} />;
    if (uploadStatus.startsWith('error:'))
      return <FaExclamationTriangle className="me-2" size={16} />;
    if (uploadStatus.startsWith('info:'))
      return <FaInfoCircle className="me-2" size={16} />;
    return null;
  };

  /**
   * Get status message without prefix
   * @returns {string} Clean status message
   */
  const getStatusMessage = () => {
    if (uploadStatus.startsWith('success:'))
      return uploadStatus.replace('success:', '');
    if (uploadStatus.startsWith('error:'))
      return uploadStatus.replace('error:', '');
    if (uploadStatus.startsWith('info:'))
      return uploadStatus.replace('info:', '');
    return uploadStatus;
  };

  /**
   * Clear status messages
   */
  const clearStatus = () => {
    setUploadStatus('');
  };

  /**
   * Reset form to initial state after successful creation
   */
  const resetForm = () => {
    setFormData({
      eventName: '',
      eventDate: '',
      organizer: '',
    });
    if (eventImage && eventImage.url) {
      URL.revokeObjectURL(eventImage.url);
    }
    setEventImage(null);
    setUploadStatus('');
  };

  /**
   * Open transaction in block explorer
   */
  const openTransactionExplorer = () => {
    const url = getExplorerUrl(hash, 'tx', client.chain);
    if (url !== '#') window.open(url, '_blank');
  };

  /**
   * Open contract in block explorer
   */
  const openContractExplorer = () => {
    const url = getExplorerUrl(contractAddress, 'address', client.chain);
    if (url !== '#') window.open(url, '_blank');
  };

  // Show success state after event creation is confirmed
  if (isConfirmed) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-dark-custom">
        <AppNavbar />
        <main className="flex-grow-1 py-4">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card card-dark text-center py-5">
                  <div className="card-body">
                    <FaCheckCircle className="text-success mb-3" size={64} />
                    <h3 className="text-success mb-3">
                      Event Created Successfully!
                    </h3>

                    {/* Network Information */}
                    <div className="alert alert-info mb-4">
                      <FaEthereum className="me-2" />
                      <strong>Network:</strong> {getNetworkName(client.chain)}
                      {isLocalhost(client.chain) && ' (Local Development)'}
                    </div>

                    {/* Event Image Preview */}
                    {eventImage && (
                      <div className="mb-4">
                        <img
                          src={
                            eventImage.pendingUpload
                              ? URL.createObjectURL(eventImage.file)
                              : eventImage.url
                          }
                          alt="Event preview"
                          className="img-fluid rounded mb-3"
                          style={{ maxHeight: '200px', maxWidth: '100%' }}
                        />
                        <div className="text-muted small">
                          <strong>Image stored on IPFS:</strong>{' '}
                          <a
                            href={eventImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-info"
                          >
                            View on IPFS
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Event Details Summary */}
                    <div className="mb-4">
                      <h5 className="text-dark mb-3">Event Details</h5>
                      <div className="row text-start">
                        <div className="col-md-6 mb-2">
                          <strong>Event Name:</strong> {formData.eventName}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Event Date:</strong>{' '}
                          {new Date(formData.eventDate).toLocaleDateString()}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Organizer:</strong> {formData.organizer}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Contract:</strong>{' '}
                          {contractAddress.slice(0, 10)}...
                          {contractAddress.slice(-8)}
                        </div>
                        {hash && (
                          <div className="col-12 mb-2">
                            <strong>Transaction:</strong> {hash.slice(0, 10)}...
                            {hash.slice(-8)}
                            {!isLocalhost(client.chain) && (
                              <button
                                className="btn btn-sm btn-outline-info ms-2"
                                onClick={openTransactionExplorer}
                              >
                                View on Explorer
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-muted mb-4">
                      Your event has been permanently stored on the{' '}
                      {getNetworkName(client.chain)} blockchain. All badges
                      minted for this event will share the same image.
                    </p>

                    {/* Action Buttons */}
                    <div className="d-grid gap-2 d-md-flex justify-content-center">
                      <button
                        onClick={resetForm}
                        className="btn btn-primary-custom me-2"
                      >
                        <FaPlusCircle className="me-2" />
                        Create Another Event
                      </button>
                      <Link to="/mint" className="btn btn-outline-success me-2">
                        Mint Badges Now
                      </Link>
                      <Link
                        to="/dashboard"
                        className="btn btn-outline-secondary"
                      >
                        Back to Dashboard
                      </Link>
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

  // Form validation and processing state
  const isFormValid =
    formData.eventName.trim() &&
    formData.eventDate &&
    formData.organizer.trim() &&
    eventImage &&
    isContractDeployed;

  const isProcessing = isPending || isConfirming || isUploadingImage;

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
                Create New Event
              </h1>
              <p className="text-muted lead mb-0">
                Set up a new event with shared image for all badges on{' '}
                {getNetworkName(client.chain)}
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
              <div className="card card-dark mb-4">
                <div className="card-header bg-transparent border-bottom">
                  <h5 className="card-title text-green mb-0 d-flex align-items-center">
                    <FaCalendar className="me-2" />
                    Event Information
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* Event Name Input */}
                    <div className="mb-4">
                      <label className="form-label form-label-dark fw-semibold">
                        Event Name *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        name="eventName"
                        value={formData.eventName}
                        onChange={handleInputChange}
                        placeholder="e.g., Blockchain Workshop 2024"
                        required
                        maxLength={100}
                        disabled={isProcessing || !isContractDeployed}
                      />
                      <div className="form-text text-muted">
                        Choose a descriptive name that attendees will recognize
                      </div>
                    </div>

                    {/* Event Date Input */}
                    <div className="mb-4">
                      <label className="form-label form-label-dark fw-semibold">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-dark"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        min={getTomorrowDate()}
                        required
                        disabled={isProcessing || !isContractDeployed}
                      />
                      <div className="form-text text-muted">
                        Select the date when the event takes place
                      </div>
                    </div>

                    {/* Organizer Name Input */}
                    <div className="mb-4">
                      <label className="form-label form-label-dark fw-semibold">
                        Organizer Name *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleInputChange}
                        placeholder="e.g., Web3 Academy, Company Name, or Your Name"
                        required
                        maxLength={100}
                        disabled={isProcessing || !isContractDeployed}
                      />
                      <div className="form-text text-muted">
                        Name of the organization or individual hosting the event
                      </div>
                    </div>

                    {/* Event Image Upload Section */}
                    <div className="mb-4">
                      <label className="form-label form-label-dark fw-semibold">
                        Event Image *
                      </label>

                      {eventImage ? (
                        // Image Preview State
                        <div className="text-center border rounded p-4 bg-light">
                          <img
                            src={
                              eventImage.pendingUpload
                                ? URL.createObjectURL(eventImage.file)
                                : eventImage.url
                            }
                            alt="Event preview"
                            className="img-fluid rounded mb-3"
                            style={{ maxHeight: '200px', maxWidth: '100%' }}
                          />
                          <div className="d-flex justify-content-center gap-2 flex-wrap">
                            <span className="badge bg-warning text-dark">
                              Ready for Upload
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={removeImage}
                              disabled={isProcessing}
                            >
                              Remove Image
                            </button>
                          </div>
                          <div className="mt-2 small text-muted">
                            <strong>Status:</strong> Image will be uploaded to
                            IPFS when you create the event
                          </div>
                        </div>
                      ) : (
                        // File Upload Prompt
                        <div className="border-dashed rounded p-5 text-center bg-light">
                          <FaCloudUploadAlt
                            className="text-muted mb-3"
                            size={48}
                          />
                          <input
                            type="file"
                            className="form-control d-none"
                            id="eventImage"
                            accept="image/*"
                            onChange={handleImageSelect}
                            disabled={isProcessing || !isContractDeployed}
                          />
                          <label
                            htmlFor="eventImage"
                            className="btn btn-outline-primary cursor-pointer"
                          >
                            <FaImage className="me-2" />
                            Choose Event Image
                          </label>
                          <div className="form-text text-muted mt-2">
                            Select an image that will represent all badges for
                            this event
                            <br />
                            <small>Max 5MB • JPEG, PNG, GIF, WebP</small>
                          </div>
                        </div>
                      )}

                      {/* Upload Status Display */}
                      {uploadStatus && (
                        <div
                          className={`mt-3 p-3 rounded ${
                            uploadStatus.startsWith('success:')
                              ? 'status-success'
                              : uploadStatus.startsWith('error:')
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
                              onClick={clearStatus}
                            >
                              <FaTimesCircle size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Transaction Status Indicators */}
                    {(isPending || isConfirming) && (
                      <div className="alert alert-info d-flex align-items-center">
                        <FaSpinner className="spinner me-2" />
                        <div>
                          <strong>
                            {isPending
                              ? 'Waiting for transaction...'
                              : 'Confirming transaction...'}
                          </strong>
                          {hash && (
                            <div className="small mt-1">
                              Transaction: {hash.slice(0, 10)}...
                              {hash.slice(-8)}
                              {!isLocalhost(client.chain) && (
                                <button
                                  className="btn btn-sm btn-outline-info ms-2"
                                  onClick={openTransactionExplorer}
                                >
                                  View
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transaction Error Display */}
                    {error && (
                      <div className="alert alert-danger d-flex align-items-center">
                        <FaExclamationTriangle className="me-2" />
                        <div>
                          <strong>Transaction Error:</strong>{' '}
                          {error.message ||
                            'Transaction failed. Please try again.'}
                        </div>
                      </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary-custom py-3 d-flex align-items-center justify-content-center"
                        disabled={!isFormValid || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <FaSpinner className="spinner me-2" size={16} />
                            {isUploadingImage
                              ? 'Uploading Image to IPFS...'
                              : isPending
                              ? 'Waiting for Transaction...'
                              : 'Confirming...'}
                          </>
                        ) : (
                          <>
                            <FaPlusCircle className="me-2" size={16} />
                            Create Event
                          </>
                        )}
                      </button>
                    </div>
                  </form>
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
                      {contractAddress.slice(0, 10)}...
                      {contractAddress.slice(-8)}
                    </div>
                  </div>
                  {!isLocalhost(client.chain) && (
                    <button
                      className="btn btn-outline-info btn-sm w-100 d-flex align-items-center justify-content-center"
                      onClick={openContractExplorer}
                    >
                      View Contract on Explorer
                    </button>
                  )}
                </div>
              </div>

              {/* About Event Creation Card */}
              <div className="card card-dark mb-4">
                <div className="card-body">
                  <h5 className="card-title text-green mb-3 d-flex align-items-center">
                    <FaInfoCircle className="me-2" />
                    About Event Creation
                  </h5>
                  <div className="text-dark small">
                    <div className="mb-3 d-flex align-items-start">
                      <FaCloudUploadAlt
                        className="text-green mt-1 me-2"
                        size={16}
                      />
                      <div>
                        <strong>Image Upload:</strong> The event image will be
                        uploaded to IPFS when you create the event.
                      </div>
                    </div>

                    <div className="mb-3 d-flex align-items-start">
                      <FaImage className="text-primary mt-1 me-2" size={16} />
                      <div>
                        <strong>Shared Image:</strong> All badges for this event
                        will use the same uploaded image.
                      </div>
                    </div>

                    <div className="mb-3 d-flex align-items-start">
                      <FaDatabase className="text-info mt-1 me-2" size={16} />
                      <div>
                        <strong>IPFS Storage:</strong> Event image is stored
                        decentralized on IPFS for permanence.
                      </div>
                    </div>

                    <div className="mb-3 d-flex align-items-start">
                      <FaEthereum className="text-purple mt-1 me-2" size={16} />
                      <div>
                        <strong>Blockchain Storage:</strong> Event details and
                        image URL are stored on {getNetworkName(client.chain)}{' '}
                        blockchain.
                      </div>
                    </div>

                    <div className="mb-3 d-flex align-items-start">
                      <FaSpinner className="text-warning mt-1 me-2" size={16} />
                      <div>
                        <strong>Gas Fees:</strong> Creating an event requires a
                        blockchain transaction with gas fees.
                      </div>
                    </div>

                    <div className="d-flex align-items-start">
                      <FaShieldAlt
                        className="text-success mt-1 me-2"
                        size={16}
                      />
                      <div>
                        <strong>Immutable:</strong> Once created, event details
                        cannot be modified.
                      </div>
                    </div>
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
