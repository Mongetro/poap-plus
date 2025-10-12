/**
 * IPFS Service for uploading images and metadata to decentralized storage
 * Supports Pinata for enhanced IPFS functionality
 * @author POAP+ Team
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * IPFS service for uploading event images and badge metadata
 * Handles file validation, IPFS uploads, and error management
 */
export class IPFSService {
  /**
   * Upload image file to IPFS via Pinata
   * @param {File} imageFile - The image file to upload
   * @returns {Promise<string>} IPFS URL of the uploaded image
   * @throws {Error} If upload fails with descriptive message
   */
  static async uploadImageToIPFS(imageFile) {
    try {
      console.log('🔄 Starting image upload to IPFS...');
      console.log('📁 File details:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      });

      // Validate Pinata configuration
      if (!PINATA_JWT || PINATA_JWT === 'your_pinata_jwt_here') {
        throw new Error(
          'Pinata JWT not configured. Please check your .env file',
        );
      }

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('file', imageFile);

      const metadata = JSON.stringify({
        name: `POAP-Event-Image-${Date.now()}`,
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      console.log('📤 Making request to Pinata...');

      // Execute Pinata API call
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PINATA_JWT}`,
          },
          body: formData,
        },
      );

      console.log('📥 Response status:', response.status);

      // Handle API response errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Pinata API error:', errorText);

        let errorMessage = `Image upload failed: ${response.status} ${response.statusText}`;

        // Specific error handling for common status codes
        if (response.status === 401) {
          errorMessage =
            'Pinata authentication failed. Please check your JWT token.';
        } else if (response.status === 403) {
          errorMessage =
            'Pinata access forbidden. Please check your API permissions.';
        } else if (response.status >= 500) {
          errorMessage = 'Pinata server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      // Process successful response
      const data = await response.json();
      console.log('✅ IPFS upload successful:', data);

      const ipfsUrl = `https://ipfs.io/ipfs/${data.IpfsHash}`;
      console.log('🔗 IPFS URL:', ipfsUrl);

      return ipfsUrl;
    } catch (error) {
      console.error('💥 Error uploading image to IPFS:', error);

      // Enhance error messages for common issues
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'Network error. Please check your internet connection.',
        );
      } else if (error.message.includes('JWT')) {
        throw new Error(
          'Pinata configuration error. Please check your API keys in .env file.',
        );
      }

      throw error;
    }
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   * @param {Object} metadata - The metadata object to upload
   * @returns {Promise<string>} IPFS URL of the uploaded metadata
   * @throws {Error} If upload fails
   */
  static async uploadJSONToIPFS(metadata) {
    try {
      console.log('🔄 Uploading JSON metadata to IPFS...');

      // Validate configuration
      if (!PINATA_JWT || PINATA_JWT === 'your_pinata_jwt_here') {
        throw new Error('Pinata JWT not configured');
      }

      // Upload JSON data to Pinata
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${PINATA_JWT}`,
          },
          body: JSON.stringify({
            pinataMetadata: {
              name: `POAP-Badge-${Date.now()}`,
            },
            pinataContent: metadata,
          }),
        },
      );

      // Handle response errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinata JSON upload error:', errorText);
        throw new Error(
          `IPFS upload failed: ${response.status} ${response.statusText}`,
        );
      }

      // Return IPFS URL
      const data = await response.json();
      console.log('✅ JSON metadata uploaded:', data);
      return `https://ipfs.io/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  /**
   * Validate image file before upload
   * @param {File} file - The file to validate
   * @returns {Object} Validation result with isValid and message properties
   */
  static validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB maximum file size
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    // Basic file existence check
    if (!file) {
      return { isValid: false, message: 'No file selected' };
    }

    // File size validation
    if (file.size > maxSize) {
      return { isValid: false, message: 'Image size must be less than 5MB' };
    }

    // File type validation
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: 'Please upload a valid image file (JPEG, PNG, GIF, WebP)',
      };
    }

    return { isValid: true, message: 'File is valid' };
  }
}
