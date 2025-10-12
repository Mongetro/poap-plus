import { useEffect, useState } from 'react';
import { FaChevronUp } from 'react-icons/fa'; // Optional: you can replace this with your own icon
import '../../styles/back-to-top.css'; // Import the CSS file

/**
 * BackToTop component
 *
 * Displays a floating "Back to Top" button that appears after the user
 * scrolls down a certain distance. When clicked, it smoothly scrolls
 * the page back to the top.
 *
 * Props:
 * - showAt (number): scroll distance (in pixels) after which the button becomes visible.
 */
export default function BackToTop({ showAt = 300 }) {
  // Track visibility state of the button
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    /**
     * onScroll - Checks how far the user has scrolled and toggles
     * the button visibility accordingly.
     */
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > showAt);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener (passive for better performance)
    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial visibility check on component mount
    setVisible(window.scrollY > showAt);

    // Clean up listener when component unmounts
    return () => window.removeEventListener('scroll', onScroll);
  }, [showAt]);

  /**
   * scrollToTop - Smoothly scrolls the user back to the top of the page.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`back-to-top ${visible ? 'show' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      {/* Icon inside the button (can be replaced with text or custom SVG) */}
      <FaChevronUp aria-hidden="true" />
    </button>
  );
}
