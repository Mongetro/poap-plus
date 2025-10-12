// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POAPPlus
 * @dev Enhanced POAP (Proof of Attendance Protocol) system with shared event images and unique badge metadata
 * @notice All badges for an event share the same event image but have unique metadata stored on IPFS
 * @dev Inherits from ERC721 for NFT functionality and Ownable for access control
 * @author POAP+ Team
 */
contract POAPPlus is ERC721, Ownable {
    // Simple counters without external dependency for gas optimization
    uint256 private _tokenIdCounter = 0;
    uint256 private _eventIdCounter = 0;

    /**
     * @dev Event structure containing all event information including shared image
     * @notice All badges minted for this event will share the same eventImageURI
     */
    struct Event {
        uint256 eventId; // Unique identifier for the event
        string eventName; // Name of the event
        string eventDate; // Date when the event occurred
        string organizer; // Organizer's name or organization
        address creator; // Ethereum address of the event creator
        uint256 createdAt; // Block timestamp when event was created
        bool isActive; // Status indicating if event can accept new badges
        string eventImageURI; // Shared image URL for all badges of this event (stored on IPFS)
    }

    /**
     * @dev Badge structure containing essential on-chain participant data
     * @notice Contains minimal on-chain data to reduce storage costs
     */
    struct Badge {
        uint256 eventId; // Reference to the event this badge belongs to
        address participantAddress; // Ethereum address of the badge recipient
        string participantName; // Participant's name for personalization
        uint256 mintedAt; // Block timestamp when badge was minted
    }

    // Storage mappings for efficient data access
    mapping(uint256 => Event) public events; // eventId => Event data
    mapping(uint256 => Badge) public badges; // tokenId => Badge data
    mapping(uint256 => mapping(address => bool)) public hasAttended; // eventId => attendee => attendance status
    mapping(address => uint256[]) private _userBadges; // user address => array of tokenIds they own
    mapping(uint256 => string) private _tokenURIs; // tokenId => unique metadata URI on IPFS

    // Event declarations for off-chain tracking
    event EventCreated(
        uint256 indexed eventId,
        string eventName,
        address creator,
        string eventImageURI
    );

    event BadgeMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address attendee,
        string participantName,
        string tokenURI
    );

    // Modifiers for access control and state validation
    modifier eventExists(uint256 _eventId) {
        require(events[_eventId].creator != address(0), "Event does not exist");
        _;
    }

    modifier eventIsActive(uint256 _eventId) {
        require(events[_eventId].isActive, "Event is not active");
        _;
    }

    /**
     * @dev Initialize contract with ERC721 name and symbol
     * @notice Sets the contract owner to the deployer address
     */
    constructor() ERC721("POAPPlus", "POAP+") Ownable(msg.sender) {}

    /**
     * @dev Create a new event with shared image for all badges
     * @param _eventName Name of the event (e.g., "ETHGlobal Paris 2024")
     * @param _eventDate Date of the event in string format (e.g., "2024-03-15")
     * @param _organizer Organizer name or organization
     * @param _eventImageURI IPFS URI of the event image (shared by all badges for this event)
     * @notice Only contract owner can create events
     * @notice Emits EventCreated event for off-chain tracking
     */
    function createEvent(
        string memory _eventName,
        string memory _eventDate,
        string memory _organizer,
        string memory _eventImageURI
    ) public onlyOwner {
        _eventIdCounter++;
        uint256 newEventId = _eventIdCounter;

        events[newEventId] = Event({
            eventId: newEventId,
            eventName: _eventName,
            eventDate: _eventDate,
            organizer: _organizer,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true,
            eventImageURI: _eventImageURI
        });

        emit EventCreated(newEventId, _eventName, msg.sender, _eventImageURI);
    }

    /**
     * @dev Mint a new badge with unique metadata pointing to shared event image
     * @param _eventId The event ID to mint badge for
     * @param _attendee Participant's wallet address to receive the badge
     * @param _participantName Participant's name for personalization and display
     * @param _tokenURI Unique metadata URI on IPFS for this specific badge
     * @notice Only contract owner can mint badges
     * @notice Each address can only receive one badge per event
     * @notice Emits BadgeMinted event for off-chain tracking
     * @notice Uses _safeMint for ERC721Receiver compatibility
     */
    function mintBadge(
        uint256 _eventId,
        address _attendee,
        string memory _participantName,
        string memory _tokenURI
    ) public onlyOwner eventExists(_eventId) eventIsActive(_eventId) {
        require(
            !hasAttended[_eventId][_attendee],
            "Attendee already has a badge"
        );
        require(_attendee != address(0), "Invalid attendee address");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        // Mint the ERC721 token to the attendee
        _safeMint(_attendee, newTokenId);

        // Store the token URI pointing to unique metadata on IPFS
        _tokenURIs[newTokenId] = _tokenURI;

        // Store essential on-chain data for the badge
        badges[newTokenId] = Badge({
            eventId: _eventId,
            participantAddress: _attendee,
            participantName: _participantName,
            mintedAt: block.timestamp
        });

        // Update attendance tracking and user badge list
        hasAttended[_eventId][_attendee] = true;
        _userBadges[_attendee].push(newTokenId);

        emit BadgeMinted(
            newTokenId,
            _eventId,
            _attendee,
            _participantName,
            _tokenURI
        );
    }

    /**
     * @dev Get the shared event image URI for a specific event
     * @param _eventId The event ID to get image URI for
     * @return The shared image URI for all badges of this event
     * @notice This URI points to the event image stored on IPFS
     */
    function getEventImageURI(
        uint256 _eventId
    ) public view eventExists(_eventId) returns (string memory) {
        return events[_eventId].eventImageURI;
    }

    /**
     * @dev Override ERC721 tokenURI to return unique metadata URI for each badge
     * @param tokenId The token ID to get metadata for
     * @return The metadata URI on IPFS for this specific badge
     * @notice Each badge has unique metadata while sharing the event image
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Check if an address has attended a specific event
     * @param _eventId The event ID to check attendance for
     * @param _attendee The address to check attendance status for
     * @return Boolean indicating if the address has a badge for this event
     */
    function hasAttendedEvent(
        uint256 _eventId,
        address _attendee
    ) public view eventExists(_eventId) returns (bool) {
        return hasAttended[_eventId][_attendee];
    }

    /**
     * @dev Get complete badge information for a specific token
     * @param _tokenId The token ID to get badge info for
     * @return Badge structure containing all badge information
     */
    function getBadge(uint256 _tokenId) public view returns (Badge memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return badges[_tokenId];
    }

    /**
     * @dev Get complete event information
     * @param _eventId The event ID to get info for
     * @return Event structure containing all event information
     */
    function getEvent(uint256 _eventId) public view returns (Event memory) {
        require(events[_eventId].creator != address(0), "Event does not exist");
        return events[_eventId];
    }

    /**
     * @dev Get all badge IDs owned by a specific user
     * @param _user The user address to get badges for
     * @return Array of token IDs owned by the user
     */
    function getUsersBadgeIds(
        address _user
    ) public view returns (uint256[] memory) {
        return _userBadges[_user];
    }

    /**
     * @dev Get total number of events created
     * @return Total number of events created since contract deployment
     */
    function getTotalEvents() public view returns (uint256) {
        return _eventIdCounter;
    }

    /**
     * @dev Get total number of badges minted
     * @return Total number of badges minted since contract deployment
     */
    function getTotalBadges() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Get count of currently active events
     * @return Number of events that are currently active and can accept new badges
     * @notice This function iterates through all events, consider gas costs for large numbers
     */
    function getActiveEventsCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= _eventIdCounter; i++) {
            if (events[i].isActive) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Deactivate an event to prevent new badge minting
     * @param _eventId The event ID to deactivate
     * @notice Only contract owner can deactivate events
     * @notice Existing badges remain valid and transferable
     */
    function deactivateEvent(
        uint256 _eventId
    ) public onlyOwner eventExists(_eventId) {
        events[_eventId].isActive = false;
    }
}
