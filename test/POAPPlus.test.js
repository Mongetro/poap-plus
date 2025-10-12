const { expect } = require('chai');
const { ethers } = require('hardhat');

/**
 * Test suite for POAPPlus contract with event images and IPFS metadata
 * @dev Tests all major functionalities of the POAP+ system with image support
 * @author POAP+ Team
 */
describe('POAPPlus', function () {
  // Contract instances and accounts
  let POAPPlus;
  let poapPlus;
  let owner;
  let organizer;
  let attendee1;
  let attendee2;
  let attendee3;
  let attendee4;
  let attendee5;

  // Test data constants
  const EVENT_NAME = 'Blockchain Workshop 2024';
  const EVENT_DATE = '2024-03-15';
  const EVENT_ORGANIZER = 'Web3 Academy';
  const EVENT_IMAGE_URI = 'https://ipfs.io/ipfs/QmTestEventImage';

  const PARTICIPANT_NAME_1 = 'Alice Johnson';
  const PARTICIPANT_NAME_2 = 'Bob Smith';
  const PARTICIPANT_NAME_3 = 'Charlie Brown';
  const BADGE_METADATA_URI = 'https://ipfs.io/ipfs/QmTestBadgeMetadata';

  /**
   * Deploy fresh contract before each test
   * @dev Sets up clean contract state for each test case
   */
  beforeEach(async function () {
    // Get signers (test accounts) from Hardhat
    [owner, organizer, attendee1, attendee2, attendee3, attendee4, attendee5] =
      await ethers.getSigners();

    // Deploy contract
    POAPPlus = await ethers.getContractFactory('POAPPlus');
    poapPlus = await POAPPlus.deploy();
    await poapPlus.deployed();
  });

  /**
   * Test contract deployment and initialization
   */
  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await poapPlus.owner()).to.equal(owner.address);
    });

    it('Should have correct name and symbol', async function () {
      expect(await poapPlus.name()).to.equal('POAPPlus');
      expect(await poapPlus.symbol()).to.equal('POAP+');
    });

    it('Should start with zero events and badges', async function () {
      expect(await poapPlus.getTotalEvents()).to.equal(0);
      expect(await poapPlus.getTotalBadges()).to.equal(0);
      expect(await poapPlus.getActiveEventsCount()).to.equal(0);
    });
  });

  /**
   * Test event creation functionality with image URI
   */
  describe('Event Management', function () {
    it('Should create a new event with image URI', async function () {
      // Create event with image URI
      const tx = await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );
      await tx.wait();

      // Verify event creation
      expect(await poapPlus.getTotalEvents()).to.equal(1);
      expect(await poapPlus.getActiveEventsCount()).to.equal(1);

      const event = await poapPlus.getEvent(1);
      expect(event.eventId).to.equal(1);
      expect(event.eventName).to.equal(EVENT_NAME);
      expect(event.eventDate).to.equal(EVENT_DATE);
      expect(event.organizer).to.equal(EVENT_ORGANIZER);
      expect(event.creator).to.equal(owner.address);
      expect(event.isActive).to.be.true;
      expect(event.eventImageURI).to.equal(EVENT_IMAGE_URI);
      expect(event.createdAt).to.be.gt(0);
    });

    it('Should emit EventCreated event with image URI', async function () {
      await expect(
        poapPlus.createEvent(
          EVENT_NAME,
          EVENT_DATE,
          EVENT_ORGANIZER,
          EVENT_IMAGE_URI,
        ),
      )
        .to.emit(poapPlus, 'EventCreated')
        .withArgs(1, EVENT_NAME, owner.address, EVENT_IMAGE_URI);
    });

    it('Should get event image URI', async function () {
      // Create event first
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );

      const imageURI = await poapPlus.getEventImageURI(1);
      expect(imageURI).to.equal(EVENT_IMAGE_URI);
    });

    it('Should create multiple events with correct IDs and images', async function () {
      // Create first event
      await poapPlus.createEvent(
        'Event 1',
        '2024-01-01',
        'Organizer 1',
        'ipfs://QmImage1',
      );
      expect(await poapPlus.getTotalEvents()).to.equal(1);

      // Create second event
      await poapPlus.createEvent(
        'Event 2',
        '2024-02-01',
        'Organizer 2',
        'ipfs://QmImage2',
      );
      expect(await poapPlus.getTotalEvents()).to.equal(2);

      // Verify events have correct data
      const event1 = await poapPlus.getEvent(1);
      const event2 = await poapPlus.getEvent(2);

      expect(event1.eventName).to.equal('Event 1');
      expect(event1.eventImageURI).to.equal('ipfs://QmImage1');
      expect(event1.organizer).to.equal('Organizer 1');
      expect(event2.eventName).to.equal('Event 2');
      expect(event2.eventImageURI).to.equal('ipfs://QmImage2');
      expect(event2.organizer).to.equal('Organizer 2');
    });

    it('Should not allow non-owner to create events', async function () {
      await expect(
        poapPlus
          .connect(organizer)
          .createEvent(
            EVENT_NAME,
            EVENT_DATE,
            EVENT_ORGANIZER,
            EVENT_IMAGE_URI,
          ),
      ).to.be.reverted; // Just check if reverted, don't check specific message
    });

    it('Should not allow getting image URI for non-existent event', async function () {
      await expect(poapPlus.getEventImageURI(999)).to.be.revertedWith(
        'Event does not exist',
      );
    });

    it('Should not allow getting non-existent event', async function () {
      await expect(poapPlus.getEvent(999)).to.be.revertedWith(
        'Event does not exist',
      );
    });
  });

  /**
   * Test badge minting functionality with metadata URI
   */
  describe('Badge Minting', function () {
    beforeEach(async function () {
      // Create an event first
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );
    });

    it('Should mint a badge for an attendee with metadata URI', async function () {
      // Mint badge with metadata URI
      const tx = await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );
      await tx.wait();

      // Verify badge minting
      expect(await poapPlus.getTotalBadges()).to.equal(1);
      expect(await poapPlus.hasAttendedEvent(1, attendee1.address)).to.be.true;

      const badge = await poapPlus.getBadge(1);
      expect(badge.eventId).to.equal(1);
      expect(badge.participantAddress).to.equal(attendee1.address);
      expect(badge.participantName).to.equal(PARTICIPANT_NAME_1);
      expect(badge.mintedAt).to.be.gt(0);

      // Verify token URI
      expect(await poapPlus.tokenURI(1)).to.equal(BADGE_METADATA_URI);
    });

    it('Should emit BadgeMinted event with metadata URI', async function () {
      await expect(
        poapPlus.mintBadge(
          1,
          attendee1.address,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        ),
      )
        .to.emit(poapPlus, 'BadgeMinted')
        .withArgs(
          1,
          1,
          attendee1.address,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        );
    });

    it('Should track user badges correctly', async function () {
      // Mint first badge
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );

      // Mint second badge for same user (different event)
      await poapPlus.createEvent(
        'Another Event',
        '2024-04-01',
        'Another Organizer',
        'ipfs://QmAnotherImage',
      );
      await poapPlus.mintBadge(
        2,
        attendee1.address,
        PARTICIPANT_NAME_1,
        'ipfs://QmAnotherMetadata',
      );

      // Verify user has both badges
      const badgeIds = await poapPlus.getUsersBadgeIds(attendee1.address);
      expect(badgeIds.length).to.equal(2);
      expect(badgeIds[0]).to.equal(1);
      expect(badgeIds[1]).to.equal(2);
    });

    it('Should not allow minting for non-existent event', async function () {
      await expect(
        poapPlus.mintBadge(
          999,
          attendee1.address,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        ),
      ).to.be.revertedWith('Event does not exist');
    });

    it('Should not allow duplicate badges for same event', async function () {
      // Mint first badge
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );

      // Try to mint duplicate
      await expect(
        poapPlus.mintBadge(
          1,
          attendee1.address,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        ),
      ).to.be.revertedWith('Attendee already has a badge');
    });

    it('Should not allow minting to zero address', async function () {
      await expect(
        poapPlus.mintBadge(
          1,
          ethers.constants.AddressZero,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        ),
      ).to.be.revertedWith('Invalid attendee address');
    });

    it('Should not allow non-owner to mint badges', async function () {
      await expect(
        poapPlus
          .connect(organizer)
          .mintBadge(
            1,
            attendee1.address,
            PARTICIPANT_NAME_1,
            BADGE_METADATA_URI,
          ),
      ).to.be.reverted; // Just check if reverted, don't check specific message
    });

    it('Should mint badges to different attendees for same event', async function () {
      // Mint badge for first attendee
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );

      // Mint badge for second attendee
      await poapPlus.mintBadge(
        1,
        attendee2.address,
        PARTICIPANT_NAME_2,
        'ipfs://QmMetadata2',
      );

      // Verify both have badges
      expect(await poapPlus.hasAttendedEvent(1, attendee1.address)).to.be.true;
      expect(await poapPlus.hasAttendedEvent(1, attendee2.address)).to.be.true;
      expect(await poapPlus.getTotalBadges()).to.equal(2);

      // Verify token URIs are correct
      expect(await poapPlus.tokenURI(1)).to.equal(BADGE_METADATA_URI);
      expect(await poapPlus.tokenURI(2)).to.equal('ipfs://QmMetadata2');
    });

    it('Should return correct token URI for minted badges', async function () {
      // Mint badge with specific metadata URI
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );

      // Verify token URI
      expect(await poapPlus.tokenURI(1)).to.equal(BADGE_METADATA_URI);
    });

    it('Should not allow getting token URI for non-existent token', async function () {
      await expect(poapPlus.tokenURI(999)).to.be.reverted;
    });
  });

  /**
   * Test attendance verification functionality
   */
  describe('Attendance Verification', function () {
    beforeEach(async function () {
      // Create event and mint badges
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );
    });

    it('Should correctly verify attendance', async function () {
      // Verify attendee has badge
      expect(await poapPlus.hasAttendedEvent(1, attendee1.address)).to.be.true;

      // Verify non-attendee doesn't have badge
      expect(await poapPlus.hasAttendedEvent(1, attendee2.address)).to.be.false;
    });

    it('Should return false for non-existent event', async function () {
      await expect(
        poapPlus.hasAttendedEvent(999, attendee1.address),
      ).to.be.revertedWith('Event does not exist');
    });

    it('Should return false for address that never attended', async function () {
      expect(await poapPlus.hasAttendedEvent(1, attendee2.address)).to.be.false;
    });
  });

  /**
   * Test event deactivation functionality
   */
  describe('Event Deactivation', function () {
    beforeEach(async function () {
      // Create active event
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );
    });

    it('Should deactivate an event', async function () {
      // Deactivate event
      await poapPlus.deactivateEvent(1);

      const event = await poapPlus.getEvent(1);
      expect(event.isActive).to.be.false;
      expect(await poapPlus.getActiveEventsCount()).to.equal(0);
    });

    it('Should not allow minting for inactive event', async function () {
      // Deactivate event
      await poapPlus.deactivateEvent(1);

      // Try to mint badge for inactive event
      await expect(
        poapPlus.mintBadge(
          1,
          attendee1.address,
          PARTICIPANT_NAME_1,
          BADGE_METADATA_URI,
        ),
      ).to.be.revertedWith('Event is not active');
    });

    it('Should not allow non-owner to deactivate events', async function () {
      await expect(poapPlus.connect(organizer).deactivateEvent(1)).to.be
        .reverted; // Just check if reverted, don't check specific message
    });

    it('Should count active events correctly', async function () {
      // Create multiple events
      await poapPlus.createEvent(
        'Event 2',
        '2024-02-01',
        'Org 2',
        'ipfs://QmImage2',
      );
      await poapPlus.createEvent(
        'Event 3',
        '2024-03-01',
        'Org 3',
        'ipfs://QmImage3',
      );

      expect(await poapPlus.getActiveEventsCount()).to.equal(3);

      // Deactivate one event
      await poapPlus.deactivateEvent(2);
      expect(await poapPlus.getActiveEventsCount()).to.equal(2);

      // Deactivate all events
      await poapPlus.deactivateEvent(1);
      await poapPlus.deactivateEvent(3);
      expect(await poapPlus.getActiveEventsCount()).to.equal(0);
    });

    it('Should not allow deactivating non-existent event', async function () {
      await expect(poapPlus.deactivateEvent(999)).to.be.revertedWith(
        'Event does not exist',
      );
    });
  });

  /**
   * Test edge cases and error conditions
   */
  describe('Edge Cases', function () {
    it('Should handle empty user badge list', async function () {
      const badgeIds = await poapPlus.getUsersBadgeIds(attendee1.address);
      expect(badgeIds.length).to.equal(0);
    });

    it('Should not allow getting badge for non-existent token', async function () {
      await expect(poapPlus.getBadge(999)).to.be.revertedWith(
        'Token does not exist',
      );
    });

    it('Should maintain correct counters after multiple operations', async function () {
      // Create events
      await poapPlus.createEvent(
        'Event 1',
        '2024-01-01',
        'Org 1',
        'ipfs://QmImage1',
      );
      await poapPlus.createEvent(
        'Event 2',
        '2024-02-01',
        'Org 2',
        'ipfs://QmImage2',
      );

      expect(await poapPlus.getTotalEvents()).to.equal(2);

      // Mint badges
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        'Alice',
        'ipfs://QmMetadata1',
      );
      await poapPlus.mintBadge(
        1,
        attendee2.address,
        'Bob',
        'ipfs://QmMetadata2',
      );
      await poapPlus.mintBadge(
        2,
        attendee1.address,
        'Alice',
        'ipfs://QmMetadata3',
      );

      expect(await poapPlus.getTotalBadges()).to.equal(3);
    });

    it('Should handle events with empty image URI', async function () {
      // Create event with empty image URI
      await poapPlus.createEvent('Event No Image', '2024-01-01', 'Org', '');

      const event = await poapPlus.getEvent(1);
      expect(event.eventImageURI).to.equal('');
    });

    it('Should handle badges with empty metadata URI', async function () {
      // Create event first
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );

      // Mint badge with empty metadata URI
      await poapPlus.mintBadge(1, attendee1.address, PARTICIPANT_NAME_1, '');

      expect(await poapPlus.tokenURI(1)).to.equal('');
    });

    it('Should handle very long event names and organizer names', async function () {
      const longName = 'A'.repeat(100);
      const longOrganizer = 'B'.repeat(100);

      await poapPlus.createEvent(
        longName,
        EVENT_DATE,
        longOrganizer,
        EVENT_IMAGE_URI,
      );

      const event = await poapPlus.getEvent(1);
      expect(event.eventName).to.equal(longName);
      expect(event.organizer).to.equal(longOrganizer);
    });
  });

  /**
   * Test NFT functionality (inherited from ERC721)
   */
  describe('NFT Functionality', function () {
    beforeEach(async function () {
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        PARTICIPANT_NAME_1,
        BADGE_METADATA_URI,
      );
    });

    it('Should assign NFT ownership correctly', async function () {
      expect(await poapPlus.ownerOf(1)).to.equal(attendee1.address);
    });

    it('Should track NFT balance', async function () {
      expect(await poapPlus.balanceOf(attendee1.address)).to.equal(1);
      expect(await poapPlus.balanceOf(attendee2.address)).to.equal(0);
    });

    it('Should return correct token URI', async function () {
      expect(await poapPlus.tokenURI(1)).to.equal(BADGE_METADATA_URI);
    });

    it('Should allow NFT transfer by default (ERC721 standard)', async function () {
      // POAP badges use standard ERC721 transfer functionality
      // In production, you might want to override to make them soulbound
      await poapPlus
        .connect(attendee1)
        .transferFrom(attendee1.address, attendee2.address, 1);

      expect(await poapPlus.ownerOf(1)).to.equal(attendee2.address);
      expect(await poapPlus.balanceOf(attendee1.address)).to.equal(0);
      expect(await poapPlus.balanceOf(attendee2.address)).to.equal(1);
    });
  });

  /**
   * Test comprehensive event and badge lifecycle
   */
  describe('Comprehensive Lifecycle', function () {
    it('Should handle complete event and badge lifecycle', async function () {
      // Step 1: Create event
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );

      // Verify event creation
      expect(await poapPlus.getTotalEvents()).to.equal(1);
      expect(await poapPlus.getActiveEventsCount()).to.equal(1);

      const event = await poapPlus.getEvent(1);
      expect(event.eventImageURI).to.equal(EVENT_IMAGE_URI);

      // Step 2: Mint multiple badges
      await poapPlus.mintBadge(
        1,
        attendee1.address,
        'Alice',
        'ipfs://QmAliceMetadata',
      );
      await poapPlus.mintBadge(
        1,
        attendee2.address,
        'Bob',
        'ipfs://QmBobMetadata',
      );

      // Verify badge minting
      expect(await poapPlus.getTotalBadges()).to.equal(2);
      expect(await poapPlus.hasAttendedEvent(1, attendee1.address)).to.be.true;
      expect(await poapPlus.hasAttendedEvent(1, attendee2.address)).to.be.true;

      // Step 3: Verify token URIs
      expect(await poapPlus.tokenURI(1)).to.equal('ipfs://QmAliceMetadata');
      expect(await poapPlus.tokenURI(2)).to.equal('ipfs://QmBobMetadata');

      // Step 4: Deactivate event
      await poapPlus.deactivateEvent(1);
      expect(await poapPlus.getActiveEventsCount()).to.equal(0);

      // Step 5: Verify no new badges can be minted
      await expect(
        poapPlus.mintBadge(
          1,
          organizer.address,
          'Organizer',
          'ipfs://QmOrgMetadata',
        ),
      ).to.be.revertedWith('Event is not active');

      // Step 6: Verify existing badges still work
      expect(await poapPlus.ownerOf(1)).to.equal(attendee1.address);
      expect(await poapPlus.ownerOf(2)).to.equal(attendee2.address);
      expect(await poapPlus.tokenURI(1)).to.equal('ipfs://QmAliceMetadata');
      expect(await poapPlus.tokenURI(2)).to.equal('ipfs://QmBobMetadata');
    });
  });

  /**
   * Test gas optimization and performance - COMPLETELY CORRECTED VERSION
   */
  describe('Gas Optimization', function () {
    it('Should efficiently handle multiple event creations', async function () {
      const eventsToCreate = 5;

      for (let i = 0; i < eventsToCreate; i++) {
        await poapPlus.createEvent(
          `Event ${i + 1}`,
          `2024-0${i + 1}-01`,
          `Organizer ${i + 1}`,
          `ipfs://QmImage${i + 1}`,
        );
      }

      expect(await poapPlus.getTotalEvents()).to.equal(eventsToCreate);
      expect(await poapPlus.getActiveEventsCount()).to.equal(eventsToCreate);
    });

    it('Should efficiently handle multiple badge mintings', async function () {
      // Create event first
      await poapPlus.createEvent(
        EVENT_NAME,
        EVENT_DATE,
        EVENT_ORGANIZER,
        EVENT_IMAGE_URI,
      );

      const badgesToMint = 5;

      // Use unique addresses for each badge to avoid duplicates
      const uniqueAttendees = [
        attendee1,
        attendee2,
        attendee3,
        attendee4,
        attendee5,
      ];

      for (let i = 0; i < badgesToMint; i++) {
        const attendee = uniqueAttendees[i];
        await poapPlus.mintBadge(
          1,
          attendee.address,
          `Participant ${i + 1}`,
          `ipfs://QmMetadata${i + 1}`,
        );
      }

      expect(await poapPlus.getTotalBadges()).to.equal(badgesToMint);

      // Verify that each participant has exactly 1 badge
      for (let i = 0; i < badgesToMint; i++) {
        const attendee = uniqueAttendees[i];
        const badgeIds = await poapPlus.getUsersBadgeIds(attendee.address);
        expect(badgeIds.length).to.equal(1);
      }
    });

    it('Should efficiently handle multiple badge mintings across different events', async function () {
      const badgesToMint = 6;
      const eventsToCreate = 2;

      // Create multiple events
      for (let i = 0; i < eventsToCreate; i++) {
        await poapPlus.createEvent(
          `Event ${i + 1}`,
          `2024-0${i + 1}-01`,
          `Organizer ${i + 1}`,
          `ipfs://QmImage${i + 1}`,
        );
      }

      const attendees = [
        attendee1,
        attendee2,
        attendee3,
        attendee4,
        attendee5,
        organizer,
      ];

      // Count badges per event during minting
      let expectedEvent1Badges = 0;
      let expectedEvent2Badges = 0;

      for (let i = 0; i < badgesToMint; i++) {
        const attendee = attendees[i];
        const eventId = (i % eventsToCreate) + 1;

        if (eventId === 1) expectedEvent1Badges++;
        if (eventId === 2) expectedEvent2Badges++;

        await poapPlus.mintBadge(
          eventId,
          attendee.address,
          `Participant ${i + 1}`,
          `ipfs://QmMetadata${i + 1}`,
        );
      }

      expect(await poapPlus.getTotalBadges()).to.equal(badgesToMint);

      // Verify using the hasAttendedEvent function
      let actualEvent1Badges = 0;
      let actualEvent2Badges = 0;

      for (let i = 0; i < badgesToMint; i++) {
        const attendee = attendees[i];
        if (await poapPlus.hasAttendedEvent(1, attendee.address))
          actualEvent1Badges++;
        if (await poapPlus.hasAttendedEvent(2, attendee.address))
          actualEvent2Badges++;
      }

      expect(actualEvent1Badges).to.equal(expectedEvent1Badges);
      expect(actualEvent2Badges).to.equal(expectedEvent2Badges);
      expect(actualEvent1Badges).to.equal(3); // 50% of total
      expect(actualEvent2Badges).to.equal(3); // 50% of total
    });
  });
});
