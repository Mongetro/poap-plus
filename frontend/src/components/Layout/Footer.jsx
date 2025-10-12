import {
  FaGithub,
  FaGlobe,
  FaLinkedin,
  FaShieldAlt,
  FaTwitter,
} from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear(); // Get the current year dynamically

  return (
    <footer className="footer-custom text-white py-4 mt-5">
      <div className="container">
        <div className="row align-items-center">
          {/* Left side: project title and description */}
          <div className="col-md-6">
            <h5 className="text-green mb-2">POAP+</h5>
            <p className="text-muted mb-0 small">
              Proof of Attendance Protocol on EVM - Digital attendance
              certification powered by blockchain technology.
            </p>
          </div>

          {/* Right side: social links and legal info */}
          <div className="col-md-6 text-md-end">
            {/* Social media icons */}
            <div className="d-flex justify-content-md-end justify-content-start gap-3 mb-2">
              {/* GitHub link */}
              <a
                href="https://github.com/Mongetro"
                className="text-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub size={18} />
              </a>
              {/* LinkedIn link */}
              <a
                href="https://www.linkedin.com/in/mongetro-goint-ph-d-227b94141/"
                className="text-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin size={18} />
              </a>

              {/* Google Site link */}
              <a
                href="https://sites.google.com/view/mongetrogoint/"
                className="text-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGlobe size={18} />
              </a>

              {/* Twitter link */}
              <a
                href="https://x.com/mongetrogoint"
                className="text-muted"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter size={18} />
              </a>
            </div>

            {/* Copyright */}
            <p className="text-muted mb-1 small">
              © {currentYear} POAP+. All rights reserved.
            </p>

            {/* Security note */}
            <p className="text-muted mb-0 small d-flex align-items-center justify-content-md-end justify-content-start">
              <FaShieldAlt className="me-1" size={12} />
              Secured by Ethereum Blockchain
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
